import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Snackbar,
  Badge,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Collapse,
  Skeleton,
  AvatarGroup,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Payment,
  Check,
  TrendingUp,
  TrendingDown,
  History,
  SwapHoriz,
  NotificationsActive,
  AccountBalance,
  Close,
  ExpandMore,
  ExpandLess,
  FilterList,
  Refresh,
  CheckCircle,
  Cancel,
  Schedule,
  AttachMoney,
  Group,
  Person,
  Receipt,
  ArrowForward,
  ArrowBack,
  Send,
  MoreVert,
} from '@mui/icons-material';
import { useAppSelector } from '../hooks/redux';
import { settlementsAPI } from '../services/api';
import { format, formatDistanceToNow } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settlements-tabpanel-${index}`}
      aria-labelledby={`settlements-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface Balance {
  user_id: string;
  user_name: string;
  amount: number;
  currency: string;
  you_owe: boolean;
  owes_you: boolean;
}

interface Settlement {
  id: string;
  payer: { id: string; first_name: string; last_name: string; email: string };
  payee: { id: string; first_name: string; last_name: string; email: string };
  amount: number;
  currency: { code: string; symbol: string };
  group?: { id: string; name: string };
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'disputed' | 'processing';
  payment_service?: string;
  created_at: string;
  completed_at?: string;
  notes?: string;
}

interface ExpenseSettlement {
  id: string;
  type: 'expense_share';
  expense_id: string;
  expense_title: string;
  expense_date: string;
  amount: number;
  currency: string;
  currency_symbol: string;
  status: 'pending' | 'completed';
  is_settled: boolean;
  settled_at?: string;
  group_id?: string;
  group_name?: string;
  is_payer: boolean;
  payer: { id: number; name: string; email: string };
  payee: { id: number; name: string; email: string };
  other_user: { id: number; name: string; email: string };
  created_at: string;
}

interface Transaction {
  id: string;
  expense_id?: string;
  expense_title: string;
  expense_date?: string;
  group_id?: string;
  group_name?: string;
  category?: string;
  amount: number;
  currency: string;
  is_settled: boolean;
  settled_at?: string;
  type: 'you_owe' | 'owed_to_you';
  other_user: {
    id: string;
    name: string;
    email: string;
  };
}

interface SimplifiedTransaction {
  from_user_id: string;
  from_user_name: string;
  to_user_id: string;
  to_user_name: string;
  amount: number;
  currency: string;
}

const Settlements: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [settleDialog, setSettleDialog] = useState(false);
  const [reminderDialog, setReminderDialog] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<Balance | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [selectedExpenseSettlement, setSelectedExpenseSettlement] = useState<ExpenseSettlement | null>(null);
  const [filter, setFilter] = useState('all');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'settled' | 'unsettled'>('all');
  
  // Data states
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [expenseSettlements, setExpenseSettlements] = useState<ExpenseSettlement[]>([]);
  const [settlementCounts, setSettlementCounts] = useState({ total: 0, pending: 0, completed: 0 });
  const [balances, setBalances] = useState<Balance[]>([]);
  const [simplifiedTransactions, setSimplifiedTransactions] = useState<SimplifiedTransaction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settlementHistory, setSettlementHistory] = useState<any[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedOptimized, setExpandedOptimized] = useState(true);
  
  // Form states
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Summary stats
  const [totalOwed, setTotalOwed] = useState(0);
  const [totalOwedToYou, setTotalOwedToYou] = useState(0);
  
  const { user } = useAppSelector((state) => state.auth);
  const { groups } = useAppSelector((state) => state.groups);

  // Load data on mount and tab change
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (tabValue === 2) {
      loadTransactionHistory();
    }
  }, [tabValue, historyFilter]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadExpenseSettlements(), loadBalances()]);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadExpenseSettlements = async () => {
    try {
      const params: any = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      
      const data = await settlementsAPI.getExpenseSettlements(params);
      setExpenseSettlements(data.settlements || []);
      setSettlementCounts(data.counts || { total: 0, pending: 0, completed: 0 });
    } catch (err: any) {
      console.error('Failed to load expense settlements:', err);
    }
  };

  const loadSettlements = async () => {
    try {
      const params: any = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      
      const data = await settlementsAPI.getSettlements(params);
      const settlementsList = Array.isArray(data) ? data : data.results || [];
      setSettlements(settlementsList);
    } catch (err: any) {
      console.error('Failed to load settlements:', err);
    }
  };

  const loadBalances = async () => {
    try {
      const data = await settlementsAPI.getUserBalances();
      const balancesList = data.balances || [];
      const transactions = data.simplified_transactions || [];
      
      setBalances(balancesList);
      setSimplifiedTransactions(transactions);
      setTotalOwed(data.total_owed || 0);
      setTotalOwedToYou(data.total_owed_to_you || 0);
    } catch (err: any) {
      console.error('Failed to load balances:', err);
    }
  };

  const loadTransactionHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await settlementsAPI.getTransactionHistory({ 
        status: historyFilter === 'all' ? undefined : historyFilter,
        limit: 100 
      });
      setTransactions(data.transactions || []);
      setSettlementHistory(data.settlements || []);
    } catch (err: any) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenSettle = (balance: Balance) => {
    setSelectedBalance(balance);
    setPaymentMethod('cash');
    setPaymentNote('');
    setSettleDialog(true);
  };

  const handleOpenSettlementSettle = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
    setPaymentMethod(settlement.payment_service || 'cash');
    setPaymentNote('');
    setSettleDialog(true);
  };

  const handleOpenExpenseSettlementSettle = (expenseSettlement: ExpenseSettlement) => {
    setSelectedExpenseSettlement(expenseSettlement);
    setPaymentMethod('cash');
    setPaymentNote('');
    setSettleDialog(true);
  };

  const handleCloseDialog = () => {
    setSettleDialog(false);
    setSelectedBalance(null);
    setSelectedSettlement(null);
    setSelectedExpenseSettlement(null);
  };

  const handleOpenReminder = (balance: Balance) => {
    setSelectedBalance(balance);
    setReminderMessage('');
    setReminderDialog(true);
  };

  const handleCloseReminder = () => {
    setReminderDialog(false);
    setSelectedBalance(null);
  };

  const handleQuickSettle = async () => {
    if (!selectedBalance) return;
    
    try {
      await settlementsAPI.quickSettle({
        payee_id: selectedBalance.user_id,
        amount: selectedBalance.amount,
        payment_method: paymentMethod,
        note: paymentNote,
        complete_immediately: true,
      });
      
      setSuccess('Settlement completed successfully!');
      handleCloseDialog();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to settle');
    }
  };

  const handleConfirmSettlement = async () => {
    if (!selectedSettlement) return;
    
    try {
      await settlementsAPI.confirmSettlement(selectedSettlement.id);
      setSuccess('Settlement confirmed!');
      handleCloseDialog();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to confirm settlement');
    }
  };

  const handleCompleteSettlement = async () => {
    if (!selectedSettlement) return;
    
    try {
      await settlementsAPI.completeSettlement(selectedSettlement.id);
      setSuccess('Settlement marked as completed!');
      handleCloseDialog();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to complete settlement');
    }
  };

  const handleSettleExpenseShare = async () => {
    if (!selectedExpenseSettlement) return;
    
    try {
      await settlementsAPI.settleExpenseShare(selectedExpenseSettlement.id, {
        payment_method: paymentMethod,
        note: paymentNote,
      });
      setSuccess('Expense marked as settled!');
      handleCloseDialog();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to settle expense');
    }
  };

  const handleSendReminder = async () => {
    if (!selectedBalance) return;
    
    try {
      await settlementsAPI.sendReminder({
        to_user_id: selectedBalance.user_id,
        amount: selectedBalance.amount,
        message: reminderMessage,
      });
      
      setSuccess('Reminder sent successfully!');
      handleCloseReminder();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to send reminder');
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
      case 'processing':
        return 'warning';
      case 'failed':
      case 'cancelled':
      case 'disputed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string): React.ReactElement | undefined => {
    switch (status) {
      case 'completed':
        return <CheckCircle fontSize="small" />;
      case 'pending':
      case 'processing':
        return <Schedule fontSize="small" />;
      case 'failed':
      case 'cancelled':
      case 'disputed':
        return <Cancel fontSize="small" />;
      default:
        return undefined;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const pendingExpenseSettlements = expenseSettlements.filter(s => s.status === 'pending');
  const completedExpenseSettlements = expenseSettlements.filter(s => s.status === 'completed');
  const pendingSettlements = settlements.filter(s => s.status === 'pending');
  const completedSettlements = settlements.filter(s => s.status === 'completed');
  const netBalance = totalOwedToYou - totalOwed;

  // Stat Card Component
  const StatCard = ({ title, value, subtitle, icon, color, trend, isCurrency = true }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
    isCurrency?: boolean;
  }) => (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ color, fontWeight: 600 }}>
              {typeof value === 'number' ? (isCurrency ? formatAmount(value) : value) : value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}15`,
              color: color,
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
        </Box>
        {trend && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            {trend === 'up' && <TrendingUp fontSize="small" color="success" />}
            {trend === 'down' && <TrendingDown fontSize="small" color="error" />}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Error/Success Alerts */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Settlements
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your balances and settle expenses with friends
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="You Owe"
            value={totalOwed}
            subtitle={`${balances.filter(b => b.you_owe).length} people`}
            icon={<TrendingDown />}
            color="#f44336"
            trend="down"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Owed to You"
            value={totalOwedToYou}
            subtitle={`${balances.filter(b => b.owes_you).length} people`}
            icon={<TrendingUp />}
            color="#4caf50"
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Net Balance"
            value={netBalance}
            subtitle={netBalance >= 0 ? 'You are owed' : 'You owe overall'}
            icon={<AccountBalance />}
            color={netBalance >= 0 ? '#4caf50' : '#f44336'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={settlementCounts.pending}
            subtitle={`${settlementCounts.completed} completed`}
            icon={<Schedule />}
            color="#ff9800"
            isCurrency={false}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="settlements tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <AccountBalance fontSize="small" />
                Balances
                {balances.length > 0 && (
                  <Chip label={balances.length} size="small" color="primary" />
                )}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <SwapHoriz fontSize="small" />
                Settlements
                {settlementCounts.pending > 0 && (
                  <Chip label={settlementCounts.pending} size="small" color="warning" />
                )}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <History fontSize="small" />
                History
              </Box>
            } 
          />
        </Tabs>
      </Paper>

      {/* Balances Tab */}
      <TabPanel value={tabValue} index={0}>
        {/* Optimized Settlement Plan */}
        {simplifiedTransactions.length > 0 && (
          <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                onClick={() => setExpandedOptimized(!expandedOptimized)}
                sx={{ cursor: 'pointer' }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <SwapHoriz />
                  <Typography variant="h6">
                    Optimized Settlement Plan
                  </Typography>
                  <Chip
                    label={`${simplifiedTransactions.length} transactions`}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
                <IconButton size="small" sx={{ color: 'white' }}>
                  {expandedOptimized ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
              
              <Collapse in={expandedOptimized}>
                <Typography variant="body2" sx={{ mt: 1, mb: 2, opacity: 0.9 }}>
                  Our algorithm minimizes the number of payments needed to settle all balances.
                </Typography>
                <List dense sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                  {simplifiedTransactions.map((txn, idx) => (
                    <ListItem key={idx} divider={idx < simplifiedTransactions.length - 1}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36 }}>
                          {getInitials(txn.from_user_name)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2">{txn.from_user_name}</Typography>
                            <ArrowForward fontSize="small" />
                            <Typography variant="body2">{txn.to_user_name}</Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            {formatAmount(txn.amount)}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </CardContent>
          </Card>
        )}

        {/* Balance Cards */}
        <Grid container spacing={2}>
          {/* People You Owe */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <TrendingDown color="error" />
                  <Typography variant="h6">You Owe</Typography>
                  <Chip 
                    label={formatAmount(totalOwed)} 
                    color="error" 
                    size="small" 
                  />
                </Box>
                
                {balances.filter(b => b.you_owe).length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography color="text.secondary">
                      You're all settled up!
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {balances.filter(b => b.you_owe).map((balance, index) => (
                      <React.Fragment key={balance.user_id}>
                        <ListItem
                          sx={{
                            bgcolor: 'background.default',
                            borderRadius: 1,
                            mb: 1,
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'error.light' }}>
                              {getInitials(balance.user_name)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={balance.user_name}
                            secondary={
                              <Typography variant="body2" color="error">
                                You owe {formatAmount(balance.amount)}
                              </Typography>
                            }
                          />
                          <Box display="flex" gap={1}>
                            <Button
                              variant="contained"
                              size="small"
                              color="primary"
                              startIcon={<Payment />}
                              onClick={() => handleOpenSettle(balance)}
                            >
                              Settle
                            </Button>
                          </Box>
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* People Who Owe You */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <TrendingUp color="success" />
                  <Typography variant="h6">Owed to You</Typography>
                  <Chip 
                    label={formatAmount(totalOwedToYou)} 
                    color="success" 
                    size="small" 
                  />
                </Box>
                
                {balances.filter(b => b.owes_you).length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <AccountBalance sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">
                      No one owes you money
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {balances.filter(b => b.owes_you).map((balance, index) => (
                      <React.Fragment key={balance.user_id}>
                        <ListItem
                          sx={{
                            bgcolor: 'background.default',
                            borderRadius: 1,
                            mb: 1,
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'success.light' }}>
                              {getInitials(balance.user_name)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={balance.user_name}
                            secondary={
                              <Typography variant="body2" color="success.main">
                                Owes you {formatAmount(balance.amount)}
                              </Typography>
                            }
                          />
                          <Box display="flex" gap={1}>
                            <Tooltip title="Send Reminder">
                              <IconButton
                                color="warning"
                                onClick={() => handleOpenReminder(balance)}
                              >
                                <NotificationsActive />
                              </IconButton>
                            </Tooltip>
                            <Button
                              variant="outlined"
                              size="small"
                              color="success"
                              startIcon={<Check />}
                              onClick={() => handleOpenSettle(balance)}
                            >
                              Record Payment
                            </Button>
                          </Box>
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Settlements Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Expense Settlements
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({settlementCounts.pending} pending, {settlementCounts.completed} completed)
            </Typography>
          </Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter Status</InputLabel>
            <Select
              value={filter}
              label="Filter Status"
              onChange={(e) => {
                setFilter(e.target.value);
                loadExpenseSettlements();
              }}
            >
              <MenuItem value="all">All ({settlementCounts.total})</MenuItem>
              <MenuItem value="pending">Pending ({settlementCounts.pending})</MenuItem>
              <MenuItem value="completed">Completed ({settlementCounts.completed})</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {expenseSettlements.length === 0 ? (
          <Card>
            <CardContent>
              <Box textAlign="center" py={4}>
                <SwapHoriz sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No settlements found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Expense settlements will appear here when you share expenses with others
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {expenseSettlements.map((expSettlement) => {
              const isOwed = expSettlement.is_payer; // Current user paid, so they are owed money
              
              return (
                <Grid item xs={12} key={expSettlement.id}>
                  <Card
                    sx={{
                      borderLeft: 4,
                      borderColor: expSettlement.status === 'completed' 
                        ? 'success.main' 
                        : isOwed ? 'success.main' : 'warning.main',
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar
                            sx={{
                              bgcolor: isOwed ? 'success.light' : 'error.light',
                              width: 48,
                              height: 48,
                            }}
                          >
                            {isOwed ? <ArrowBack /> : <ArrowForward />}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {isOwed ? (
                                <>{expSettlement.other_user.name} owes you</>
                              ) : (
                                <>You owe {expSettlement.other_user.name}</>
                              )}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                              <Chip
                                icon={<Receipt />}
                                label={expSettlement.expense_title}
                                size="small"
                                variant="outlined"
                              />
                              {expSettlement.group_name && (
                                <Chip
                                  icon={<Group />}
                                  label={expSettlement.group_name}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                              )}
                              <Typography variant="caption" color="text.secondary">
                                {expSettlement.expense_date
                                  ? format(new Date(expSettlement.expense_date), 'MMM d, yyyy')
                                  : ''}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography 
                            variant="h5" 
                            fontWeight="bold"
                            color={isOwed ? 'success.main' : 'error.main'}
                          >
                            {isOwed ? '+' : '-'}{formatAmount(expSettlement.amount)}
                          </Typography>
                          <Chip
                            icon={getStatusIcon(expSettlement.status)}
                            label={expSettlement.status.charAt(0).toUpperCase() + expSettlement.status.slice(1)}
                            color={getStatusColor(expSettlement.status)}
                            size="small"
                          />
                          
                          {expSettlement.status === 'pending' && (
                            <Box display="flex" gap={1}>
                              <Button
                                variant="contained"
                                size="small"
                                color={isOwed ? 'success' : 'primary'}
                                startIcon={<Check />}
                                onClick={() => handleOpenExpenseSettlementSettle(expSettlement)}
                              >
                                {isOwed ? 'Mark Received' : 'Mark Paid'}
                              </Button>
                              {isOwed && (
                                <Tooltip title="Send Reminder">
                                  <IconButton
                                    color="warning"
                                    size="small"
                                    onClick={() => {
                                      setSelectedBalance({
                                        user_id: String(expSettlement.other_user.id),
                                        user_name: expSettlement.other_user.name,
                                        amount: expSettlement.amount,
                                        currency: 'USD',
                                        you_owe: false,
                                        owes_you: true,
                                      });
                                      setReminderDialog(true);
                                    }}
                                  >
                                    <NotificationsActive />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          )}
                          
                          {expSettlement.status === 'completed' && expSettlement.settled_at && (
                            <Typography variant="caption" color="text.secondary">
                              Settled {format(new Date(expSettlement.settled_at), 'MMM d, yyyy')}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </TabPanel>

      {/* History Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Transaction History</Typography>
          <ToggleButtonGroup
            value={historyFilter}
            exclusive
            onChange={(_, value) => value && setHistoryFilter(value)}
            size="small"
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="unsettled">Unsettled</ToggleButton>
            <ToggleButton value="settled">Settled</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {loadingHistory ? (
          <Box>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rectangular" height={72} sx={{ mb: 1, borderRadius: 1 }} />
            ))}
          </Box>
        ) : (
          <>
            {/* Expense Shares / Transactions */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Expense Transactions
                </Typography>
                
                {transactions.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Receipt sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">
                      No transactions found
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Expense</TableCell>
                          <TableCell>With</TableCell>
                          <TableCell>Group</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell align="center">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transactions
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((txn) => (
                            <TableRow key={txn.id} hover>
                              <TableCell>
                                <Typography variant="body2">
                                  {txn.expense_date
                                    ? format(new Date(txn.expense_date), 'MMM d, yyyy')
                                    : '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {txn.expense_title}
                                </Typography>
                                {txn.category && (
                                  <Typography variant="caption" color="text.secondary">
                                    {txn.category}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                    {getInitials(txn.other_user.name)}
                                  </Avatar>
                                  <Typography variant="body2">
                                    {txn.other_user.name}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                {txn.group_name ? (
                                  <Chip
                                    label={txn.group_name}
                                    size="small"
                                    variant="outlined"
                                  />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    Personal
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  fontWeight="medium"
                                  color={txn.type === 'you_owe' ? 'error' : 'success.main'}
                                >
                                  {txn.type === 'you_owe' ? '-' : '+'}
                                  {formatAmount(txn.amount)}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  icon={txn.is_settled ? <CheckCircle /> : <Schedule />}
                                  label={txn.is_settled ? 'Settled' : 'Pending'}
                                  color={txn.is_settled ? 'success' : 'warning'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                    <TablePagination
                      component="div"
                      count={transactions.length}
                      page={page}
                      onPageChange={(_, newPage) => setPage(newPage)}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                      }}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                    />
                  </TableContainer>
                )}
              </CardContent>
            </Card>

            {/* Settlement History */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Settlement History
                </Typography>
                
                {settlementHistory.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <History sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">
                      No settlement history
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {settlementHistory.map((settlement, index) => (
                      <React.Fragment key={settlement.id}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor:
                                  settlement.status === 'completed'
                                    ? 'success.light'
                                    : settlement.status === 'pending'
                                    ? 'warning.light'
                                    : 'error.light',
                              }}
                            >
                              {settlement.status === 'completed' ? (
                                <Check />
                              ) : settlement.status === 'pending' ? (
                                <Schedule />
                              ) : (
                                <Cancel />
                              )}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                <Typography variant="body1">
                                  {settlement.is_payer ? 'You received from' : 'You paid'}{' '}
                                  <strong>{settlement.other_user?.name}</strong>
                                </Typography>
                                <Typography 
                                  variant="body1" 
                                  fontWeight="bold"
                                  color={settlement.is_payer ? 'success.main' : 'error.main'}
                                >
                                  {settlement.is_payer ? '+' : '-'}{formatAmount(settlement.amount)}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                {settlement.expense_title && (
                                  <Chip
                                    icon={<Receipt />}
                                    label={settlement.expense_title}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                  />
                                )}
                                {settlement.group_name && (
                                  <Chip
                                    icon={<Group />}
                                    label={settlement.group_name}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                                <Typography variant="caption" color="text.secondary">
                                  {settlement.completed_at
                                    ? format(new Date(settlement.completed_at), 'MMM d, yyyy')
                                    : settlement.created_at
                                    ? format(new Date(settlement.created_at), 'MMM d, yyyy')
                                    : ''}
                                </Typography>
                              </Box>
                            }
                          />
                          <Chip
                            label={settlement.status}
                            color={getStatusColor(settlement.status)}
                            size="small"
                          />
                        </ListItem>
                        {index < settlementHistory.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </TabPanel>

      {/* Settle Dialog */}
      <Dialog open={settleDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Payment color="primary" />
            {selectedExpenseSettlement 
              ? (selectedExpenseSettlement.is_payer ? 'Confirm Payment Received' : 'Mark as Paid')
              : selectedBalance?.you_owe || selectedSettlement
              ? 'Settle Payment'
              : 'Record Payment Received'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* Amount Display */}
            <Card sx={{ mb: 3, bgcolor: selectedExpenseSettlement?.is_payer ? 'success.light' : 'primary.light', color: 'primary.contrastText' }}>
              <CardContent>
                <Box textAlign="center">
                  <Typography variant="h3" fontWeight="bold">
                    {formatAmount(selectedExpenseSettlement?.amount || selectedBalance?.amount || selectedSettlement?.amount || 0)}
                  </Typography>
                  <Typography variant="body1">
                    {selectedExpenseSettlement ? (
                      selectedExpenseSettlement.is_payer 
                        ? `From ${selectedExpenseSettlement.other_user.name}`
                        : `To ${selectedExpenseSettlement.other_user.name}`
                    ) : selectedBalance?.you_owe || selectedSettlement
                      ? `Pay to ${selectedBalance?.user_name || (selectedSettlement?.payee?.first_name + ' ' + selectedSettlement?.payee?.last_name)}`
                      : `Receive from ${selectedBalance?.user_name}`}
                  </Typography>
                  {selectedExpenseSettlement && (
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                      For: {selectedExpenseSettlement.expense_title}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentMethod}
                label="Payment Method"
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="venmo">Venmo</MenuItem>
                <MenuItem value="paypal">PayPal</MenuItem>
                <MenuItem value="bank">Bank Transfer</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            {/* Note */}
            <TextField
              fullWidth
              label="Add Note (Optional)"
              multiline
              rows={2}
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="Add a note about this payment..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          {selectedExpenseSettlement ? (
            <Button
              variant="contained"
              color={selectedExpenseSettlement.is_payer ? 'success' : 'primary'}
              onClick={handleSettleExpenseShare}
              startIcon={<Check />}
            >
              {selectedExpenseSettlement.is_payer ? 'Confirm Received' : 'Mark as Paid'}
            </Button>
          ) : selectedSettlement ? (
            <Button
              variant="contained"
              onClick={
                String(selectedSettlement.payer?.id) === String(user?.id)
                  ? handleCompleteSettlement
                  : handleConfirmSettlement
              }
              startIcon={<Check />}
            >
              {String(selectedSettlement.payer?.id) === String(user?.id)
                ? 'Mark as Paid'
                : 'Confirm Receipt'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleQuickSettle}
              startIcon={<Payment />}
            >
              {selectedBalance?.you_owe ? 'Settle Now' : 'Record Payment'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Reminder Dialog */}
      <Dialog open={reminderDialog} onClose={handleCloseReminder} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <NotificationsActive color="warning" />
            Send Payment Reminder
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Sending a reminder to <strong>{selectedBalance?.user_name}</strong> for{' '}
              <strong>{formatAmount(selectedBalance?.amount || 0)}</strong>
            </Alert>

            <TextField
              fullWidth
              label="Custom Message (Optional)"
              multiline
              rows={3}
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
              placeholder="Add a friendly message..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReminder}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleSendReminder}
            startIcon={<Send />}
          >
            Send Reminder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settlements;
