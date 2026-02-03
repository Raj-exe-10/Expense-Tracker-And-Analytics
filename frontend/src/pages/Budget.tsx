import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Refresh,
  Savings,
  AttachMoney,
  Edit,
  Delete,
  Category,
} from '@mui/icons-material';
import { budgetAPI, coreAPI } from '../services/api';
import { formatAmount } from '../utils/formatting';

interface WalletAllocation {
  id: string;
  wallet: string;
  wallet_name: string;
  wallet_type: string;
  amount: string;
  rollover_from_previous: string;
  accumulated_balance: string;
  spent: string;
  remaining: string;
  adjustments_total: string;
}

interface MonthlyBudget {
  id: string;
  year: number;
  month: number;
  total_amount: string;
  currency: string | number;
  currency_detail?: { id?: string | number; code: string; symbol: string };
  allocated_amount: string;
  unassigned_amount: string;
  wallet_allocations: WalletAllocation[];
}

interface Wallet {
  id: string;
  name: string;
  wallet_type: string;
  rollover_enabled: boolean;
  color: string;
}

export default function Budget() {
  const theme = useTheme();
  const [budget, setBudget] = useState<MonthlyBudget | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const [totalDialog, setTotalDialog] = useState(false);
  const [totalAmount, setTotalAmount] = useState('');
  const [walletDialog, setWalletDialog] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState<'regular' | 'sinking_fund'>('regular');
  const [newWalletRollover, setNewWalletRollover] = useState(false);
  const [allocationDialog, setAllocationDialog] = useState(false);
  const [allocationWalletId, setAllocationWalletId] = useState('');
  const [allocationAmount, setAllocationAmount] = useState('');
  const [whammyDialog, setWhammyDialog] = useState(false);
  const [whammyWalletId, setWhammyWalletId] = useState('');
  const [whammyAmount, setWhammyAmount] = useState('');
  const [whammyNote, setWhammyNote] = useState('');
  const [currencies, setCurrencies] = useState<{ id: string; code: string; symbol: string }[]>([]);
  const [deleteConfirmWalletId, setDeleteConfirmWalletId] = useState<string | null>(null);
  const [categoriesDialogWalletId, setCategoriesDialogWalletId] = useState<string | null>(null);
  const [walletCategories, setWalletCategories] = useState<{ id: number; category: number; category_name: string }[]>([]);
  const [walletUserCategories, setWalletUserCategories] = useState<{ id: string; name: string; color?: string }[]>([]);
  const [allSystemCategories, setAllSystemCategories] = useState<{ id: number; name: string }[]>([]);
  const [addCategorySelect, setAddCategorySelect] = useState('');
  const [newUserCategoryName, setNewUserCategoryName] = useState('');
  const [categoriesDialogLoading, setCategoriesDialogLoading] = useState(false);

  const fetchBudget = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [budgetData, walletsData] = await Promise.all([
        budgetAPI.getCurrentBudget(),
        budgetAPI.getWallets(),
      ]);
      setBudget(Array.isArray(budgetData) ? null : budgetData);
      setWallets(Array.isArray(walletsData) ? walletsData : (walletsData?.results ?? []));
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load budget');
      setBudget(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudget();
    coreAPI.getCurrencies().then((data: any) => {
      setCurrencies(Array.isArray(data) ? data : data.results || []);
    }).catch(() => {});
  }, [fetchBudget]);

  // Refetch when an expense is added/updated (so budget reflects new spending)
  useEffect(() => {
    const onExpenseSaved = () => fetchBudget();
    window.addEventListener('expenseSaved', onExpenseSaved);
    return () => window.removeEventListener('expenseSaved', onExpenseSaved);
  }, [fetchBudget]);

  // Refetch when user returns to this tab so budget is up to date
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchBudget();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [fetchBudget]);

  const handleSetTotal = async () => {
    if (!budget || !totalAmount) return;
    try {
      const currencyId = budget.currency ?? budget.currency_detail?.id ?? currencies[0]?.id;
      await budgetAPI.updateMonthlyBudget(budget.id, {
        total_amount: parseFloat(totalAmount) || 0,
        currency: currencyId,
      });
      setSnackbar({ open: true, message: 'Total budget updated' });
      setTotalDialog(false);
      setTotalAmount('');
      fetchBudget();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Update failed' });
    }
  };

  const handleCreateWallet = async () => {
    const name = newWalletName.trim();
    if (!name) return;
    const nameLower = name.toLowerCase();
    if (wallets.some((w) => w.name.toLowerCase() === nameLower)) {
      setSnackbar({ open: true, message: 'A wallet with this name already exists.' });
      return;
    }
    try {
      await budgetAPI.createWallet({
        name,
        wallet_type: newWalletType,
        rollover_enabled: newWalletRollover,
      });
      setSnackbar({ open: true, message: 'Wallet created' });
      setWalletDialog(false);
      setNewWalletName('');
      setNewWalletType('regular');
      setNewWalletRollover(false);
      fetchBudget();
    } catch (err: any) {
      const msg = err.response?.data?.name?.[0] || err.response?.data?.detail || err.message || 'Create failed';
      setSnackbar({ open: true, message: typeof msg === 'string' ? msg : 'A wallet with this name already exists.' });
    }
  };

  const handleDeleteWallet = async () => {
    if (!deleteConfirmWalletId) return;
    try {
      await budgetAPI.deleteWallet(deleteConfirmWalletId);
      setSnackbar({ open: true, message: 'Wallet deleted' });
      setDeleteConfirmWalletId(null);
      fetchBudget();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Delete failed' });
    }
  };

  const openCategoriesDialog = async (walletId: string) => {
    setCategoriesDialogWalletId(walletId);
    setAddCategorySelect('');
    setNewUserCategoryName('');
    setCategoriesDialogLoading(true);
    try {
      const [allData, walletData, assignments] = await Promise.all([
        budgetAPI.getBudgetCategories(),
        budgetAPI.getBudgetCategories(walletId),
        budgetAPI.getWalletCategories({ wallet: walletId }),
      ]);
      setAllSystemCategories(allData.system_categories || []);
      setWalletUserCategories(walletData.user_categories || []);
      setWalletCategories(Array.isArray(assignments) ? assignments : assignments?.results || []);
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to load categories' });
    } finally {
      setCategoriesDialogLoading(false);
    }
  };

  const handleAssignCategoryToWallet = async () => {
    if (!categoriesDialogWalletId || !addCategorySelect) return;
    try {
      await budgetAPI.assignCategoryToWallet({
        wallet: categoriesDialogWalletId,
        category: addCategorySelect,
      });
      setSnackbar({ open: true, message: 'Category added to wallet' });
      setAddCategorySelect('');
      openCategoriesDialog(categoriesDialogWalletId);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.category?.[0] || err.response?.data?.detail || 'Failed' });
    }
  };

  const handleRemoveWalletCategory = async (walletCategoryId: number) => {
    if (!categoriesDialogWalletId) return;
    try {
      await budgetAPI.removeWalletCategory(String(walletCategoryId));
      setSnackbar({ open: true, message: 'Category removed' });
      openCategoriesDialog(categoriesDialogWalletId);
    } catch (err: any) {
      setSnackbar({ open: true, message: 'Failed to remove' });
    }
  };

  const handleCreateUserCategory = async () => {
    const name = newUserCategoryName.trim();
    if (!categoriesDialogWalletId || !name) return;
    try {
      await budgetAPI.createUserCategory({ wallet: categoriesDialogWalletId, name });
      setSnackbar({ open: true, message: 'Category created' });
      setNewUserCategoryName('');
      openCategoriesDialog(categoriesDialogWalletId);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Failed' });
    }
  };

  const handleDeleteUserCategory = async (userCategoryId: string) => {
    if (!categoriesDialogWalletId) return;
    try {
      await budgetAPI.deleteUserCategory(userCategoryId);
      setSnackbar({ open: true, message: 'Category removed' });
      openCategoriesDialog(categoriesDialogWalletId);
    } catch (err: any) {
      setSnackbar({ open: true, message: 'Failed to remove' });
    }
  };

  const handleCreateAllocation = async () => {
    if (!budget || !allocationWalletId || !allocationAmount) return;
    const amt = parseFloat(allocationAmount);
    if (amt <= 0) return;
    const allocated = parseFloat(budget.allocated_amount || '0');
    const total = parseFloat(budget.total_amount || '0');
    if (allocated + amt > total) {
      setSnackbar({ open: true, message: 'Total allocations cannot exceed monthly budget' });
      return;
    }
    try {
      await budgetAPI.createAllocation({
        monthly_budget: budget.id,
        wallet: allocationWalletId,
        amount: amt,
      });
      setSnackbar({ open: true, message: 'Allocation added' });
      setAllocationDialog(false);
      setAllocationWalletId('');
      setAllocationAmount('');
      fetchBudget();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Create failed' });
    }
  };

  const handleAddWhammy = async () => {
    if (!budget || !whammyWalletId || !whammyAmount) return;
    const amt = parseFloat(whammyAmount);
    if (amt === 0) return;
    try {
      await budgetAPI.createAdjustment({
        monthly_budget: budget.id,
        wallet: whammyWalletId,
        amount: amt,
        note: whammyNote || (amt > 0 ? 'One-time boost' : 'One-time deduction'),
      });
      setSnackbar({ open: true, message: amt > 0 ? 'Boost added' : 'Adjustment applied' });
      setWhammyDialog(false);
      setWhammyWalletId('');
      setWhammyAmount('');
      setWhammyNote('');
      fetchBudget();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Failed' });
    }
  };

  const handleApplyRollover = async () => {
    if (!budget) return;
    try {
      await budgetAPI.applyRollover(budget.id);
      setSnackbar({ open: true, message: 'Rollover applied to next month' });
      fetchBudget();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Rollover failed' });
    }
  };

  const symbol = budget?.currency_detail?.symbol || '$';
  const unassigned = parseFloat(budget?.unassigned_amount || '0');
  const monthName = budget
    ? new Date(budget.year, budget.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
    : '';

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">
          Budget & Envelopes
        </Typography>
        <Box>
          <Button startIcon={<Refresh />} onClick={fetchBudget} sx={{ mr: 1 }}>
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!budget && !error && (
        <Alert severity="info">
          No budget set for this month. Set your total monthly budget to get started.
        </Alert>
      )}

      {budget && (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total monthly budget
                  </Typography>
                  <Typography variant="h4">
                    {symbol}{formatAmount(budget.total_amount)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {monthName}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => {
                      setTotalAmount(budget.total_amount);
                      setTotalDialog(true);
                    }}
                    sx={{ mt: 1 }}
                  >
                    Set total
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderLeft: 4, borderColor: unassigned > 0 ? 'warning.main' : 'success.main' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Unassigned
                  </Typography>
                  <Typography variant="h4">
                    {symbol}{formatAmount(budget.unassigned_amount)}
                  </Typography>
                  {unassigned > 0 && (
                    <Typography variant="caption" color="warning.main">
                      Allocate this to wallets below
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Allocated to wallets
                  </Typography>
                  <Typography variant="h4">
                    {symbol}{formatAmount(budget.allocated_amount)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box mt={3} display="flex" gap={1} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setWalletDialog(true)}
            >
              Add wallet
            </Button>
            <Button
              variant="outlined"
              startIcon={<AttachMoney />}
              onClick={() => setAllocationDialog(true)}
              disabled={wallets.length === 0}
            >
              Allocate to wallet
            </Button>
            <Button
              variant="outlined"
              startIcon={<AttachMoney />}
              onClick={() => setWhammyDialog(true)}
              disabled={wallets.length === 0}
            >
              One-time boost / adjustment
            </Button>
            <Button
              variant="outlined"
              startIcon={<Savings />}
              onClick={handleApplyRollover}
            >
              Apply rollover to next month
            </Button>
          </Box>

          {wallets.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Your wallets
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Wallets you’ve created. Allocate money from your budget above to see spending and remaining here.
              </Typography>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                {wallets.map((w) => {
                  const hasAllocation = budget.wallet_allocations?.some((a) => a.wallet === w.id);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={w.id}>
                      <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: 1,
                              bgcolor: w.color || 'primary.main',
                            }}
                          />
                          <Typography fontWeight="medium">{w.name}</Typography>
                          {w.wallet_type === 'sinking_fund' && (
                            <Chip size="small" label="Sinking fund" color="info" sx={{ height: 20 }} />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Tooltip title="Manage categories">
                            <IconButton size="small" onClick={() => openCategoriesDialog(w.id)} color="primary">
                              <Category />
                            </IconButton>
                          </Tooltip>
                          {!hasAllocation && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setAllocationWalletId(w.id);
                                setAllocationDialog(true);
                              }}
                            >
                              Allocate
                            </Button>
                          )}
                          <Tooltip title="Delete wallet">
                            <IconButton size="small" onClick={() => setDeleteConfirmWalletId(w.id)} color="error">
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </>
          )}

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
            Wallets & remaining
          </Typography>
          {(!budget.wallet_allocations || budget.wallet_allocations.length === 0) && (
            <Card>
              <CardContent>
                <Typography color="textSecondary">
                  {wallets.length === 0
                    ? 'Create wallets with "Add wallet", then allocate amounts from your total budget.'
                    : 'No amounts allocated yet. Use "Allocate to wallet" or click "Allocate" on a wallet above to assign part of your budget.'}
                </Typography>
              </CardContent>
            </Card>
          )}
          {budget.wallet_allocations && budget.wallet_allocations.length > 0 && (
            <Grid container spacing={2}>
              {budget.wallet_allocations.map((alloc) => {
                const limit =
                  alloc.wallet_type === 'sinking_fund'
                    ? parseFloat(alloc.accumulated_balance) + parseFloat(alloc.adjustments_total || '0')
                    : parseFloat(alloc.amount) + parseFloat(alloc.rollover_from_previous || '0') + parseFloat(alloc.adjustments_total || '0');
                const spent = parseFloat(alloc.spent || '0');
                const remaining = parseFloat(alloc.remaining || '0');
                const pct = limit > 0 ? (spent / limit) * 100 : 0;
                const isOver = remaining < 0;
                return (
                  <Grid item xs={12} sm={6} md={4} key={alloc.id}>
                    <Card sx={{ borderLeft: 4, borderColor: alloc.wallet_type === 'sinking_fund' ? 'info.main' : (alloc as any).color || 'primary.main' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography fontWeight="bold">{alloc.wallet_name}</Typography>
                          {alloc.wallet_type === 'sinking_fund' && (
                            <Chip size="small" label="Sinking fund" color="info" />
                          )}
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          Limit: {symbol}{formatAmount(limit)} · Spent: {symbol}{formatAmount(alloc.spent)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(pct, 100)}
                          color={isOver ? 'error' : pct >= 90 ? 'warning' : 'primary'}
                          sx={{ mt: 1, mb: 0.5, height: 8, borderRadius: 1 }}
                        />
                        <Typography variant="h6" color={isOver ? 'error.main' : 'text.primary'}>
                          Remaining: {symbol}{formatAmount(alloc.remaining)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </>
      )}

      <Dialog open={totalDialog} onClose={() => setTotalDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Set total monthly budget</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Total amount"
            type="number"
            fullWidth
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTotalDialog(false)}>Cancel</Button>
          <Button onClick={handleSetTotal} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={walletDialog} onClose={() => setWalletDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create wallet</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Wallet name"
            fullWidth
            value={newWalletName}
            onChange={(e) => setNewWalletName(e.target.value)}
            placeholder="e.g. Essentials, Lifestyle"
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Type</InputLabel>
            <Select
              value={newWalletType}
              label="Type"
              onChange={(e) => setNewWalletType(e.target.value as 'regular' | 'sinking_fund')}
            >
              <MenuItem value="regular">Regular (resets monthly)</MenuItem>
              <MenuItem value="sinking_fund">Sinking fund (accumulates)</MenuItem>
            </Select>
          </FormControl>
          {newWalletType === 'regular' && (
            <FormControl fullWidth margin="dense">
              <Typography variant="body2">
                <input
                  type="checkbox"
                  checked={newWalletRollover}
                  onChange={(e) => setNewWalletRollover(e.target.checked)}
                />
                {' '}Allow rollover (unused amount goes to next month)
              </Typography>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWalletDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateWallet} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={allocationDialog} onClose={() => setAllocationDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Allocate to wallet</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Wallet</InputLabel>
            <Select
              value={allocationWalletId}
              label="Wallet"
              onChange={(e) => setAllocationWalletId(e.target.value)}
            >
              {wallets.map((w) => (
                <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            value={allocationAmount}
            onChange={(e) => setAllocationAmount(e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
          />
          {budget && (
            <Typography variant="caption" color="textSecondary">
              Unassigned: {symbol}{formatAmount(budget.unassigned_amount)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAllocationDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateAllocation} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={whammyDialog} onClose={() => setWhammyDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>One-time boost or adjustment</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Wallet</InputLabel>
            <Select
              value={whammyWalletId}
              label="Wallet"
              onChange={(e) => setWhammyWalletId(e.target.value)}
            >
              {wallets.map((w) => (
                <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Amount (positive = boost, negative = deduct)"
            type="number"
            fullWidth
            value={whammyAmount}
            onChange={(e) => setWhammyAmount(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Note (optional)"
            fullWidth
            value={whammyNote}
            onChange={(e) => setWhammyNote(e.target.value)}
            placeholder="e.g. December party"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWhammyDialog(false)}>Cancel</Button>
          <Button onClick={handleAddWhammy} variant="contained">Apply</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteConfirmWalletId} onClose={() => setDeleteConfirmWalletId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete wallet?</DialogTitle>
        <DialogContent>
          <Typography>
            This will remove the wallet and its category assignments. Allocations for this wallet will also be removed. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmWalletId(null)}>Cancel</Button>
          <Button onClick={handleDeleteWallet} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!categoriesDialogWalletId}
        onClose={() => setCategoriesDialogWalletId(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Categories for {wallets.find((w) => w.id === categoriesDialogWalletId)?.name || 'wallet'}
        </DialogTitle>
        <DialogContent>
          {categoriesDialogLoading ? (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>
                System categories in this wallet
              </Typography>
              {walletCategories.length === 0 ? (
                <Typography variant="body2" color="textSecondary">None yet. Add one below.</Typography>
              ) : (
                <List dense>
                  {walletCategories.map((wc) => (
                    <ListItem
                      key={wc.id}
                      secondaryAction={
                        <IconButton size="small" onClick={() => handleRemoveWalletCategory(wc.id)} color="error">
                          <Delete />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={wc.category_name} />
                    </ListItem>
                  ))}
                </List>
              )}
              <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Add category</InputLabel>
                  <Select
                    value={addCategorySelect}
                    label="Add category"
                    onChange={(e) => setAddCategorySelect(e.target.value)}
                  >
                    {allSystemCategories
                      .filter((c) => !walletCategories.some((wc) => String(wc.category) === String(c.id)))
                      .map((c) => (
                        <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <Button size="small" variant="outlined" onClick={handleAssignCategoryToWallet} disabled={!addCategorySelect}>
                  Add
                </Button>
              </Box>

              <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 3 }}>
                Your custom categories
              </Typography>
              {walletUserCategories.length === 0 ? (
                <Typography variant="body2" color="textSecondary">None yet. Create one below.</Typography>
              ) : (
                <List dense>
                  {walletUserCategories.map((uc) => (
                    <ListItem
                      key={uc.id}
                      secondaryAction={
                        <IconButton size="small" onClick={() => handleDeleteUserCategory(uc.id)} color="error">
                          <Delete />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={uc.name} />
                    </ListItem>
                  ))}
                </List>
              )}
              <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  label="New category name"
                  value={newUserCategoryName}
                  onChange={(e) => setNewUserCategoryName(e.target.value)}
                  placeholder="e.g. Netflix, Gym"
                  sx={{ minWidth: 200 }}
                />
                <Button size="small" variant="outlined" onClick={handleCreateUserCategory} disabled={!newUserCategoryName.trim()}>
                  Create
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoriesDialogWalletId(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {snackbar.open && (
        <Typography
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'background.paper',
            px: 2,
            py: 1,
            borderRadius: 1,
            boxShadow: 2,
          }}
        >
          {snackbar.message}
        </Typography>
      )}
    </Box>
  );
}
