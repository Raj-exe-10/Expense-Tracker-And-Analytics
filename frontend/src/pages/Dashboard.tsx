import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { settlementsAPI } from '../services/api';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  LinearProgress,
  useTheme,
  Skeleton,
  Tooltip,
  Alert,
  Snackbar,
  Fade,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Receipt,
  Group,
  Add,
  AttachMoney,
  Schedule,
  ArrowForward,
  Refresh,
  Payment,
  GroupAdd,
  Visibility,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchAnalyticsSummary } from '../store/slices/analyticsSlice';
import { fetchExpenses } from '../store/slices/expenseSlice';
import { fetchGroups } from '../store/slices/groupSlice';
import { formatDistanceToNow } from 'date-fns';
import { formatAmount } from '../utils/formatting';

// Helper function to format dates without timezone issues
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  gradientColor?: string;
  isCurrency?: boolean;
  isPositive?: boolean;
  onClick?: () => void;
  loading?: boolean;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change = 0, 
  icon, 
  color,
  gradientColor,
  isCurrency = true, 
  isPositive = true,
  onClick,
  loading = false,
  subtitle,
}) => {
  const theme = useTheme();
  
  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={40} />
          <Skeleton variant="text" width="50%" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        background: gradientColor || 'background.paper',
        '&:hover': onClick ? {
          boxShadow: 6,
          transform: 'translateY(-4px)',
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography 
              color={gradientColor ? 'rgba(255,255,255,0.85)' : 'text.secondary'} 
              gutterBottom 
              variant="body2"
              fontWeight={500}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              component="h2" 
              fontWeight="bold"
              color={gradientColor ? 'white' : 'text.primary'}
              sx={{ mb: 0.5 }}
            >
              {isCurrency && typeof value === 'number' ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}
            </Typography>
            {subtitle && (
              <Typography 
                variant="caption" 
                color={gradientColor ? 'rgba(255,255,255,0.7)' : 'text.secondary'}
              >
                {subtitle}
              </Typography>
            )}
            <Box display="flex" alignItems="center" mt={1}>
              {isPositive ? (
                <TrendingUp sx={{ color: gradientColor ? 'rgba(255,255,255,0.9)' : 'success.main', mr: 0.5 }} fontSize="small" />
              ) : (
                <TrendingDown sx={{ color: gradientColor ? 'rgba(255,255,255,0.9)' : 'error.main', mr: 0.5 }} fontSize="small" />
              )}
              <Typography 
                variant="body2" 
                sx={{ color: gradientColor ? 'rgba(255,255,255,0.85)' : (isPositive ? 'success.main' : 'error.main') }}
              >
                {Math.abs(change).toFixed(1)}% vs last month
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              backgroundColor: gradientColor ? 'rgba(255,255,255,0.2)' : color,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, onClick, color }) => (
  <Box
    onClick={onClick}
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      p: 2,
      borderRadius: 2,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: 'action.hover',
        transform: 'scale(1.05)',
      },
    }}
  >
    <Avatar sx={{ bgcolor: color, mb: 1, width: 48, height: 48 }}>
      {icon}
    </Avatar>
    <Typography variant="caption" fontWeight={500} textAlign="center">
      {label}
    </Typography>
  </Box>
);

export const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { summary, loading: analyticsLoading } = useSelector((state: RootState) => state.analytics);
  const { expenses, loading: expensesLoading } = useSelector((state: RootState) => state.expenses);
  const { groups, loading: groupsLoading } = useSelector((state: RootState) => state.groups);

  const [pendingSettlements, setPendingSettlements] = useState({ youOwe: 0, owedToYou: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Fetch data on mount
  const loadDashboardData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    
    try {
      // Calculate date range for current month using LOCAL dates
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Use local date formatting to avoid timezone issues
      const startDateStr = formatLocalDate(startOfMonth);
      const endDateStr = formatLocalDate(endOfMonth);
      
      // Fetch all data in parallel
      await Promise.all([
        dispatch(fetchAnalyticsSummary({
          startDate: startDateStr,
          endDate: endDateStr,
        })),
        dispatch(fetchExpenses({ limit: 10 })),
        dispatch(fetchGroups()),
      ]);
      
      // Fetch pending settlements
      try {
        const balancesData = await settlementsAPI.getUserBalances();
        setPendingSettlements({
          youOwe: Number(balancesData.total_owed) || 0,
          owedToYou: Number(balancesData.total_owed_to_you) || 0,
        });
      } catch (err) {
        console.error('Failed to load settlements:', err);
        setPendingSettlements({ youOwe: 0, owedToYou: 0 });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load some dashboard data',
        severity: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Calculate stats from real data
  // If analytics doesn't have data, calculate from fetched expenses
  const calculateTotalExpenses = () => {
    if (summary?.total_expenses) return summary.total_expenses;
    if (expenses.length > 0) {
      return expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    }
    return 0;
  };

  const stats = {
    totalExpenses: calculateTotalExpenses(),
    monthlyBudget: 3000, // TODO: Get from user settings
    groupCount: groups.length,
    youOwe: pendingSettlements.youOwe,
    owedToYou: pendingSettlements.owedToYou,
    totalPending: pendingSettlements.youOwe + pendingSettlements.owedToYou,
    expenseCount: summary?.expense_count || expenses.length,
    changePercentage: summary?.change_percentage || 0,
  };

  // Get recent expenses from store
  const recentExpenses = expenses.slice(0, 5).map(expense => ({
    id: expense.id,
    description: expense.title || expense.description,
    amount: Number(expense.amount) || 0,
    category: expense.category?.name || 'Other',
    categoryColor: expense.category?.color || theme.palette.primary.main,
    date: expense.date || expense.expense_date || '',
    paidBy: expense.paid_by?.first_name || expense.created_by?.first_name || 'You',
    group: expense.group?.name,
    isGroupExpense: !!expense.group,
  }));

  // Recent activities from expenses
  const recentActivities = expenses.slice(0, 5).map((expense) => ({
    id: expense.id,
    type: expense.group ? 'group_expense' : 'expense' as const,
    message: `added "${expense.title || expense.description}"`,
    amount: Number(expense.amount) || 0,
    date: expense.created_at ? formatDistanceToNow(new Date(expense.created_at), { addSuffix: true }) : 'Recently',
    user: expense.paid_by?.first_name || expense.created_by?.first_name || 'You',
    groupName: expense.group?.name,
  }));

  const budgetUsed = stats.monthlyBudget > 0 ? (stats.totalExpenses / stats.monthlyBudget) * 100 : 0;
  const budgetColor = budgetUsed > 90 ? 'error' : budgetUsed > 75 ? 'warning' : 'success';

  // Handlers
  const handleAddExpense = () => navigate('/expenses', { state: { openAddForm: true } });
  const handleViewAllExpenses = () => navigate('/expenses');
  const handleViewAnalytics = () => navigate('/analytics');
  const handleViewGroups = () => navigate('/groups');
  const handleViewSettlements = () => navigate('/settlements');
  const handleRefresh = () => loadDashboardData(true);

  const handleStatCardClick = (type: string) => {
    switch(type) {
      case 'expenses': navigate('/expenses'); break;
      case 'groups': navigate('/groups'); break;
      case 'settlements': navigate('/settlements'); break;
      case 'budget': navigate('/analytics'); break;
    }
  };

  const isLoading = loading || analyticsLoading || expensesLoading || groupsLoading;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
            Welcome back, {user?.first_name || 'User'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's your expense summary for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <CircularProgress size={24} /> : <Refresh />}
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddExpense}
            size="large"
            sx={{ 
              px: 3,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            }}
          >
            Add Expense
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={2}>
          <StatCard
            title="Total Expenses"
            value={stats.totalExpenses}
            change={Math.abs(stats.changePercentage)}
            icon={<Receipt sx={{ color: 'white' }} />}
            color={theme.palette.primary.main}
            gradientColor={`linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`}
            isCurrency={true}
            isPositive={stats.changePercentage <= 0}
            onClick={() => handleStatCardClick('expenses')}
            loading={isLoading}
            subtitle={`${stats.expenseCount} transactions`}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <StatCard
            title="Active Groups"
            value={stats.groupCount}
            change={25}
            icon={<Group sx={{ color: 'white' }} />}
            color={theme.palette.success.main}
            gradientColor={`linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`}
            isCurrency={false}
            onClick={() => handleStatCardClick('groups')}
            loading={isLoading}
            subtitle="Expense sharing groups"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <StatCard
            title="You Owe"
            value={stats.youOwe}
            change={stats.youOwe > 0 ? -5 : 0}
            icon={<TrendingDown sx={{ color: 'white' }} />}
            color={theme.palette.warning.main}
            gradientColor={`linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`}
            isCurrency={true}
            isPositive={false}
            onClick={() => handleStatCardClick('settlements')}
            loading={isLoading}
            subtitle="Amount to pay"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <StatCard
            title="You'll Receive"
            value={stats.owedToYou}
            change={stats.owedToYou > 0 ? 10 : 0}
            icon={<TrendingUp sx={{ color: 'white' }} />}
            color={theme.palette.success.main}
            gradientColor={`linear-gradient(135deg, #43a047 0%, #2e7d32 100%)`}
            isCurrency={true}
            isPositive={true}
            onClick={() => handleStatCardClick('settlements')}
            loading={isLoading}
            subtitle="Owed to you"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <StatCard
            title="Net Balance"
            value={Math.abs(stats.owedToYou - stats.youOwe)}
            change={0}
            icon={<AccountBalance sx={{ color: 'white' }} />}
            color={stats.owedToYou >= stats.youOwe ? theme.palette.success.main : theme.palette.error.main}
            gradientColor={stats.owedToYou >= stats.youOwe 
              ? `linear-gradient(135deg, #66bb6a 0%, #43a047 100%)`
              : `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`
            }
            isCurrency={true}
            isPositive={stats.owedToYou >= stats.youOwe}
            onClick={() => handleStatCardClick('settlements')}
            loading={isLoading}
            subtitle={stats.owedToYou >= stats.youOwe ? "You're ahead" : "You're behind"}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <StatCard
            title="Budget Used"
            value={`${budgetUsed.toFixed(1)}%`}
            change={5}
            icon={<AttachMoney sx={{ color: 'white' }} />}
            color={theme.palette.info.main}
            gradientColor={`linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`}
            isCurrency={false}
            onClick={() => handleStatCardClick('budget')}
            loading={isLoading}
            subtitle={`$${stats.totalExpenses.toFixed(0)} of $${stats.monthlyBudget}`}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Quick Actions
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <QuickAction
                icon={<Add />}
                label="Add Expense"
                onClick={handleAddExpense}
                color={theme.palette.primary.main}
              />
            </Grid>
            <Grid item>
              <QuickAction
                icon={<GroupAdd />}
                label="Create Group"
                onClick={() => navigate('/groups', { state: { openCreate: true } })}
                color={theme.palette.success.main}
              />
            </Grid>
            <Grid item>
              <QuickAction
                icon={<Payment />}
                label="Settle Up"
                onClick={handleViewSettlements}
                color={theme.palette.warning.main}
              />
            </Grid>
            <Grid item>
              <QuickAction
                icon={<Visibility />}
                label="View Analytics"
                onClick={handleViewAnalytics}
                color={theme.palette.info.main}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Budget Progress & Recent Expenses */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h2" fontWeight={600}>
                  Monthly Budget Progress
                </Typography>
                <Button size="small" onClick={handleViewAnalytics} endIcon={<ArrowForward />}>
                  View Details
                </Button>
              </Box>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    ${stats.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })} of ${stats.monthlyBudget.toLocaleString()}
                  </Typography>
                  <Chip 
                    label={`${budgetUsed.toFixed(1)}%`} 
                    size="small" 
                    color={budgetColor}
                    variant="outlined"
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(budgetUsed, 100)}
                  color={budgetColor}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              {budgetUsed > 75 && budgetUsed < 100 && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  You've used {budgetUsed.toFixed(0)}% of your budget. Consider reviewing your expenses.
                </Alert>
              )}
              {budgetUsed >= 100 && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  You've exceeded your budget by ${(stats.totalExpenses - stats.monthlyBudget).toFixed(2)}!
                </Alert>
              )}
              {budgetUsed < 75 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  You have ${(stats.monthlyBudget - stats.totalExpenses).toFixed(2)} left to spend this month
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Recent Expenses */}
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h2" fontWeight={600}>
                  Recent Expenses
                </Typography>
                <Button size="small" onClick={handleViewAllExpenses} endIcon={<ArrowForward />}>
                  View All
                </Button>
              </Box>
              
              {isLoading ? (
                <Box>
                  {[1, 2, 3].map((i) => (
                    <Box key={i} display="flex" alignItems="center" py={2}>
                      <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                      <Box flex={1}>
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text" width="40%" />
                      </Box>
                      <Skeleton variant="text" width={80} />
                    </Box>
                  ))}
                </Box>
              ) : recentExpenses.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Receipt sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary" gutterBottom>
                    No expenses yet
                  </Typography>
                  <Button variant="outlined" startIcon={<Add />} onClick={handleAddExpense} sx={{ mt: 1 }}>
                    Add Your First Expense
                  </Button>
                </Box>
              ) : (
                <List disablePadding>
                  {recentExpenses.map((expense, index) => (
                    <Fade in key={expense.id}>
                      <ListItem
                        divider={index < recentExpenses.length - 1}
                        sx={{ 
                          px: 0, 
                          py: 1.5,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                          borderRadius: 1,
                        }}
                        onClick={() => navigate(`/expenses`)}
                      >
                        <ListItemAvatar>
                          <Avatar 
                            sx={{ 
                              bgcolor: expense.categoryColor || theme.palette.primary.main,
                              width: 44,
                              height: 44,
                            }}
                          >
                            <Receipt />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1" fontWeight={500}>
                                {expense.description}
                              </Typography>
                              {expense.isGroupExpense && (
                                <Chip 
                                  label={expense.group} 
                                  size="small" 
                                  variant="outlined"
                                  color="primary"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {expense.category} • Paid by {expense.paidBy} • {new Date(expense.date).toLocaleDateString()}
                            </Typography>
                          }
                        />
                        <Typography variant="h6" fontWeight={600} color="primary">
                          ${formatAmount(expense.amount)}
                        </Typography>
                      </ListItem>
                    </Fade>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom fontWeight={600}>
                Recent Activities
              </Typography>
              
              {isLoading ? (
                <Box>
                  {[1, 2, 3].map((i) => (
                    <Box key={i} display="flex" alignItems="center" py={2}>
                      <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                      <Box flex={1}>
                        <Skeleton variant="text" width="80%" />
                        <Skeleton variant="text" width="50%" />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : recentActivities.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Schedule sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">
                    No recent activity
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {recentActivities.map((activity, index) => (
                    <ListItem
                      key={activity.id}
                      divider={index < recentActivities.length - 1}
                      sx={{ px: 0, py: 1.5 }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: activity.type === 'group_expense' 
                              ? theme.palette.success.light 
                              : theme.palette.primary.light,
                            width: 40,
                            height: 40,
                          }}
                        >
                          {activity.user.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box>
                            <Typography variant="body2" component="span">
                              <strong>{activity.user}</strong> {activity.message}
                            </Typography>
                            {activity.amount > 0 && (
                              <Chip
                                label={`$${formatAmount(activity.amount)}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                            <Schedule sx={{ fontSize: 14, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.secondary">
                              {activity.date}
                            </Typography>
                            {activity.groupName && (
                              <>
                                <Typography variant="caption" color="text.disabled">•</Typography>
                                <Group sx={{ fontSize: 14, color: 'text.disabled' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {activity.groupName}
                                </Typography>
                              </>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              
              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ mt: 2 }} 
                onClick={handleViewAllExpenses}
                endIcon={<ArrowForward />}
              >
                View All Activities
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
