import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Receipt,
  Group,
  Add,
  AttachMoney,
  DateRange,
  Person,
  MoreVert,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  isCurrency?: boolean;
  isPositive?: boolean;
  onClick?: () => void;
}
const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change = 0, 
  icon, 
  color,
  isCurrency = true, 
  isPositive = true,
  onClick 
}) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          boxShadow: 3,
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease'
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="h2" fontWeight="bold">
              {isCurrency && typeof value === 'number' ? `$${value.toLocaleString()}` : value}
            </Typography>
            <Box display="flex" alignItems="center" mt={1}>
              {isPositive ? (
                <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} fontSize="small" />
              ) : (
                <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} fontSize="small" />
              )}
              <Typography 
                variant="body2" 
                sx={{ color: isPositive ? 'success.main' : 'error.main' }}
              >
                {Math.abs(change)}% vs last month
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: 2,
              p: 1,
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

interface RecentExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  paidBy: string;
  group?: string;
}

interface RecentActivity {
  id: string;
  type: 'expense' | 'settlement' | 'group';
  message: string;
  amount?: number;
  date: string;
  user: string;
  avatar?: string;
}

export const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  // Mock data - In real app, this would come from Redux store
  const [stats] = useState({
    totalExpenses: 2450.75,
    monthlyBudget: 3000,
    groupCount: 5,
    pendingSettlements: 125.50,
  });

  const [recentExpenses] = useState<RecentExpense[]>([
    {
      id: '1',
      description: 'Dinner at Italian Restaurant',
      amount: 85.50,
      category: 'Food & Dining',
      date: '2024-01-15',
      paidBy: 'You',
      group: 'Friends'
    },
    {
      id: '2',
      description: 'Uber ride to airport',
      amount: 32.00,
      category: 'Transportation',
      date: '2024-01-14',
      paidBy: 'John',
    },
    {
      id: '3',
      description: 'Grocery shopping',
      amount: 125.75,
      category: 'Groceries',
      date: '2024-01-13',
      paidBy: 'You',
      group: 'Roommates'
    },
  ]);

  const [recentActivities] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'expense',
      message: 'added a new expense for Dinner',
      amount: 85.50,
      date: '2 hours ago',
      user: 'You',
    },
    {
      id: '2',
      type: 'settlement',
      message: 'settled up with John',
      amount: 45.00,
      date: '1 day ago',
      user: 'You',
    },
    {
      id: '3',
      type: 'group',
      message: 'joined Weekend Trip group',
      date: '2 days ago',
      user: 'Sarah',
      avatar: '/avatars/sarah.jpg'
    },
  ]);

  const budgetUsed = (stats.totalExpenses / stats.monthlyBudget) * 100;
  const budgetColor = budgetUsed > 90 ? 'error' : budgetUsed > 75 ? 'warning' : 'success';

  const handleAddExpense = () => {
    navigate('/expenses');
  };

  const handleViewAllExpenses = () => {
    navigate('/expenses');
  };

  const handleViewAnalytics = () => {
    navigate('/analytics');
  };

  const handleViewAllActivities = () => {
    navigate('/expenses');
  };

  const handleStatCardClick = (type: string) => {
    switch(type) {
      case 'expenses':
        navigate('/expenses', { state: { fromDashboard: true } });
        break;
      case 'groups':
        navigate('/groups');
        break;
      case 'settlements':
        navigate('/settlements');
        break;
      case 'budget':
        navigate('/analytics');
        break;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {user?.first_name}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's your expense summary for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddExpense}
          size="large"
        >
          Add Expense
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Expenses"
            value={stats.totalExpenses}
            change={12}
            icon={<Receipt sx={{ color: 'white' }} />}
            color={theme.palette.primary.main}
            isCurrency={true}
            isPositive={false}
            onClick={() => handleStatCardClick('expenses')}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Active Groups"
            value={stats.groupCount}
            change={25}
            icon={<Group sx={{ color: 'white' }} />}
            color={theme.palette.success.main}
            isCurrency={false}
            onClick={() => handleStatCardClick('groups')}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Pending Settlements"
            value={stats.pendingSettlements}
            change={-8}
            icon={<AccountBalance sx={{ color: 'white' }} />}
            color={theme.palette.warning.main}
            isCurrency={true}
            isPositive={false}
            onClick={() => handleStatCardClick('settlements')}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Monthly Budget"
            value={`${budgetUsed.toFixed(1)}%`}
            change={5}
            icon={<AttachMoney sx={{ color: 'white' }} />}
            color={theme.palette.info.main}
            onClick={() => handleStatCardClick('budget')}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Budget Progress */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h2">
                  Monthly Budget Progress
                </Typography>
                <Button size="small" onClick={handleViewAnalytics}>
                  View Details
                </Button>
              </Box>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    ${stats.totalExpenses.toLocaleString()} of ${stats.monthlyBudget.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color={`${budgetColor}.main`}>
                    {budgetUsed.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(budgetUsed, 100)}
                  color={budgetColor}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {budgetUsed < 100 
                  ? `You have $${(stats.monthlyBudget - stats.totalExpenses).toFixed(2)} left to spend this month`
                  : `You've exceeded your budget by $${(stats.totalExpenses - stats.monthlyBudget).toFixed(2)}`
                }
              </Typography>
            </CardContent>
          </Card>

          {/* Recent Expenses */}
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h2">
                  Recent Expenses
                </Typography>
                <Button size="small" onClick={handleViewAllExpenses}>
                  View All
                </Button>
              </Box>
              <List disablePadding>
                {recentExpenses.map((expense, index) => (
                  <ListItem
                    key={expense.id}
                    divider={index < recentExpenses.length - 1}
                    sx={{ px: 0 }}
                    secondaryAction={
                      <IconButton edge="end">
                        <MoreVert />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        <Receipt />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={expense.description}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {expense.category} • Paid by {expense.paidBy}
                            {expense.group && ` • ${expense.group}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(expense.date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box textAlign="right">
                      <Typography variant="h6" component="span">
                        ${expense.amount.toFixed(2)}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Recent Activities
              </Typography>
              <List disablePadding>
                {recentActivities.map((activity, index) => (
                  <ListItem
                    key={activity.id}
                    divider={index < recentActivities.length - 1}
                    sx={{ px: 0 }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        src={activity.avatar}
                        sx={{ bgcolor: theme.palette.secondary.main }}
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
                          {activity.amount && (
                            <Chip
                              label={`$${activity.amount.toFixed(2)}`}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={activity.date}
                    />
                  </ListItem>
                ))}
              </List>
              <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
                View All Activities
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
