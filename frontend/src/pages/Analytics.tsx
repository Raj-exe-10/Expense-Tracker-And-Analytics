import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  ButtonGroup,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tooltip,
  Snackbar,
  Alert,
  Skeleton,
  Divider,
  LinearProgress,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Download,
  Category,
  AttachMoney,
  Assessment,
  BarChart as BarChartIcon,
  Refresh,
  Receipt,
  CalendarToday,
  Lightbulb,
  Savings,
  ShowChart,
  DonutLarge,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { format, subDays, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchAnalyticsSummary, fetchCategoryBreakdown, fetchMonthlyTrends, exportReport } from '../store/slices/analyticsSlice';
import { fetchExpenses } from '../store/slices/expenseSlice';
import { fetchGroups } from '../store/slices/groupSlice';

const COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#FFC107', '#E91E63', '#3F51B5', '#009688'];

const Analytics: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { summary, categoryBreakdown, monthlyTrends, loading: analyticsLoading } = useAppSelector((state) => state.analytics);
  const { expenses, loading: expensesLoading } = useAppSelector((state) => state.expenses);
  const { groups } = useAppSelector((state) => state.groups);
  
  const [dateRange, setDateRange] = useState('30');
  const [groupFilter, setGroupFilter] = useState('all');
  const [viewType, setViewType] = useState<'overview' | 'detailed' | 'comparison'>('overview');
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    loadAnalyticsData();
    dispatch(fetchGroups());
  }, [dateRange, groupFilter]);
  
  const loadAnalyticsData = async () => {
    setRefreshing(true);
    const endDate = new Date();
    const startDate = subDays(endDate, parseInt(dateRange));
    
    const params = {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      groupId: groupFilter !== 'all' ? groupFilter : undefined,
    };
    
    await Promise.all([
      dispatch(fetchAnalyticsSummary(params)),
      dispatch(fetchCategoryBreakdown(params)),
      dispatch(fetchMonthlyTrends(params)),
      dispatch(fetchExpenses({ limit: 100 })),
    ]);
    setRefreshing(false);
  };
  
  const handleExport = async (exportFormat: 'csv' | 'pdf') => {
    setExportError(null);
    const result = await dispatch(exportReport({
      format: exportFormat,
      startDate: format(subDays(new Date(), parseInt(dateRange)), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      groupId: groupFilter !== 'all' ? groupFilter : undefined,
    }));
    
    if (exportReport.fulfilled.match(result)) {
      setExportSuccess(`${exportFormat.toUpperCase()} export downloaded successfully!`);
      setTimeout(() => setExportSuccess(null), 3000);
    } else if (exportReport.rejected.match(result)) {
      setExportError(result.payload as string || 'Failed to export report');
      setTimeout(() => setExportError(null), 5000);
    }
  };

  // Process real data for charts
  const expenseTrendData = useMemo(() => {
    if (monthlyTrends.length > 0) {
      return monthlyTrends.map(trend => ({
        date: trend.month || trend.date || trend.expense_date || '',
        amount: Number(trend.total_amount || trend.amount || 0),
        count: Number(trend.expense_count || trend.count || 0),
      }));
    }
    
    // Fallback: generate from expenses data
    if (expenses.length > 0) {
      const dailyTotals: { [key: string]: number } = {};
      expenses.forEach(exp => {
        const date = exp.expense_date || exp.date || '';
        if (date) {
          const formattedDate = format(parseISO(date), 'MMM dd');
          dailyTotals[formattedDate] = (dailyTotals[formattedDate] || 0) + Number(exp.amount || 0);
        }
      });
      return Object.entries(dailyTotals).map(([date, amount]) => ({
        date,
        amount,
        count: 1,
      })).slice(-14); // Last 14 days
    }
    
    return [];
  }, [monthlyTrends, expenses]);
  
  const categoryData = useMemo(() => {
    if (categoryBreakdown.length > 0) {
      return categoryBreakdown.map(cat => ({
        name: cat.category_name || cat.category?.name || 'Other',
        value: Number(cat.amount || cat.total_amount || cat.value || 0),
        percentage: Number(cat.percentage || 0),
        color: cat.color || COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
    }
    
    // Fallback: calculate from expenses
    if (expenses.length > 0) {
      const categoryTotals: { [key: string]: number } = {};
      expenses.forEach(exp => {
        const catName = exp.category?.name || 'Other';
        categoryTotals[catName] = (categoryTotals[catName] || 0) + Number(exp.amount || 0);
      });
      const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
      return Object.entries(categoryTotals).map(([name, value], index) => ({
        name,
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
        color: COLORS[index % COLORS.length],
      }));
    }
    
    return [];
  }, [categoryBreakdown, expenses]);

  // Get top expenses from actual data
  const topExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
      .slice(0, 5)
      .map(exp => ({
        id: exp.id,
        description: exp.title || exp.description || 'Expense',
        amount: Number(exp.amount || 0),
        date: exp.expense_date || exp.date || '',
        category: exp.category?.name || 'Other',
      }));
  }, [expenses]);

  // Calculate spending by category for radar chart
  const spendingPatternData = useMemo(() => {
    const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other'];
    const currentPeriod: { [key: string]: number } = {};
    
    categories.forEach(cat => {
      currentPeriod[cat] = 0;
    });
    
    expenses.forEach(exp => {
      const catName = exp.category?.name || 'Other';
      const matchedCat = categories.find(c => catName.toLowerCase().includes(c.toLowerCase())) || 'Other';
      currentPeriod[matchedCat] += Number(exp.amount || 0);
    });
    
    const maxValue = Math.max(...Object.values(currentPeriod), 100);
    
    return categories.map(cat => ({
      subject: cat,
      current: currentPeriod[cat],
      fullMark: maxValue,
    }));
  }, [expenses]);

  // Calculate daily average spending
  const dailyAverage = useMemo(() => {
    const days = parseInt(dateRange);
    return summary?.total_expenses ? (summary.total_expenses / days) : 0;
  }, [summary, dateRange]);

  // Calculate projected monthly spending
  const projectedMonthly = useMemo(() => {
    return dailyAverage * 30;
  }, [dailyAverage]);

  // Generate dynamic savings insights based on actual spending
  const savingsInsights = useMemo(() => {
    const insights: Array<{ title: string; savings: number; impact: 'high' | 'medium' | 'low' }> = [];
    
    categoryData.forEach(cat => {
      if (cat.value > 100) {
        if (cat.name.toLowerCase().includes('food') || cat.name.toLowerCase().includes('dining')) {
          insights.push({
            title: `Reduce ${cat.name} spending by 15%`,
            savings: Math.round(cat.value * 0.15),
            impact: cat.value > 500 ? 'high' : 'medium',
          });
        }
        if (cat.name.toLowerCase().includes('entertainment') || cat.name.toLowerCase().includes('subscription')) {
          insights.push({
            title: `Review ${cat.name} subscriptions`,
            savings: Math.round(cat.value * 0.2),
            impact: 'low',
          });
        }
        if (cat.name.toLowerCase().includes('transport')) {
          insights.push({
            title: `Consider carpooling for ${cat.name}`,
            savings: Math.round(cat.value * 0.25),
            impact: 'medium',
          });
        }
        if (cat.name.toLowerCase().includes('shopping')) {
          insights.push({
            title: `Make a ${cat.name} list before buying`,
            savings: Math.round(cat.value * 0.2),
            impact: 'medium',
          });
        }
      }
    });
    
    // Add generic insight if no specific ones
    if (insights.length === 0 && summary?.total_expenses && summary.total_expenses > 0) {
      insights.push({
        title: 'Track all expenses consistently',
        savings: Math.round(summary.total_expenses * 0.1),
        impact: 'medium',
      });
    }
    
    return insights.slice(0, 4);
  }, [categoryData, summary]);

  const totalPotentialSavings = savingsInsights.reduce((sum, insight) => sum + insight.savings, 0);

  const loading = analyticsLoading || expensesLoading || refreshing;
  
  const StatCard = ({ title, value, change, icon, color, subtitle }: any) => (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2" fontWeight={500}>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={100} height={40} />
            ) : (
              <Typography variant="h4" component="div" fontWeight={600}>
                {value}
              </Typography>
            )}
            {change !== undefined && (
              <Box display="flex" alignItems="center" mt={1}>
                {change >= 0 ? (
                  <TrendingUp sx={{ color: 'error.main', fontSize: 18, mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ color: 'success.main', fontSize: 18, mr: 0.5 }} />
                )}
                <Typography
                  variant="body2"
                  color={change >= 0 ? 'error.main' : 'success.main'}
                >
                  {Math.abs(change).toFixed(0)}% vs last period
                </Typography>
              </Box>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5, boxShadow: 3 }}>
          <Typography variant="body2" fontWeight={600}>{label}</Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={index}
              variant="body2"
              style={{ color: entry.color }}
            >
              {entry.name}: ${Number(entry.value).toFixed(2)}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const EmptyState = ({ message }: { message: string }) => (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      py={6}
      sx={{ color: 'text.secondary' }}
    >
      <DonutLarge sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
      <Typography variant="body1">{message}</Typography>
      <Typography variant="body2" color="text.disabled">
        Add some expenses to see analytics
      </Typography>
    </Box>
  );
  
  return (
    <Box>
      {/* Success/Error Messages */}
      <Snackbar
        open={!!exportSuccess}
        autoHideDuration={3000}
        onClose={() => setExportSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setExportSuccess(null)} severity="success" variant="filled">
          {exportSuccess}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!exportError}
        autoHideDuration={5000}
        onClose={() => setExportError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setExportError(null)} severity="error" variant="filled">
          {exportError}
        </Alert>
      </Snackbar>
      
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your spending patterns and gain financial insights
          </Typography>
        </Box>
        <Tooltip title="Refresh data">
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={18} /> : <Refresh />}
            onClick={loadAnalyticsData}
            disabled={refreshing}
          >
            Refresh
          </Button>
        </Tooltip>
      </Box>
      
      {/* Controls */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box display="flex" gap={2} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={dateRange}
                label="Time Period"
                onChange={(e) => setDateRange(e.target.value)}
              >
                <MenuItem value="7">Last 7 days</MenuItem>
                <MenuItem value="30">Last 30 days</MenuItem>
                <MenuItem value="90">Last 3 months</MenuItem>
                <MenuItem value="180">Last 6 months</MenuItem>
                <MenuItem value="365">Last year</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Filter by Group</InputLabel>
              <Select
                value={groupFilter}
                label="Filter by Group"
                onChange={(e) => setGroupFilter(e.target.value)}
              >
                <MenuItem value="all">All Groups</MenuItem>
                {groups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <ButtonGroup size="small" sx={{ height: 40 }}>
              <Button
                variant={viewType === 'overview' ? 'contained' : 'outlined'}
                onClick={() => setViewType('overview')}
                startIcon={<ShowChart />}
              >
                Overview
              </Button>
              <Button
                variant={viewType === 'detailed' ? 'contained' : 'outlined'}
                onClick={() => setViewType('detailed')}
                startIcon={<BarChartIcon />}
              >
                Detailed
              </Button>
              <Button
                variant={viewType === 'comparison' ? 'contained' : 'outlined'}
                onClick={() => setViewType('comparison')}
                startIcon={<Assessment />}
              >
                Insights
              </Button>
            </ButtonGroup>
          </Box>
          
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleExport('csv')}
              size="small"
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => handleExport('pdf')}
              size="small"
            >
              Export PDF
            </Button>
          </Box>
        </Box>
      </Card>
      
      {/* Stats Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Expenses"
            value={`$${(summary?.total_expenses || 0).toFixed(2)}`}
            change={summary?.change_percentage ? Math.round(summary.change_percentage) : undefined}
            icon={<AttachMoney />}
            color={theme.palette.primary.main}
            subtitle={`${dateRange} day period`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Daily Average"
            value={`$${dailyAverage.toFixed(2)}`}
            icon={<CalendarToday />}
            color={theme.palette.success.main}
            subtitle={`Projected: $${projectedMonthly.toFixed(0)}/month`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Top Category"
            value={categoryData[0]?.name || 'N/A'}
            icon={<Category />}
            color={theme.palette.warning.main}
            subtitle={categoryData[0] ? `$${categoryData[0].value.toFixed(2)} (${categoryData[0].percentage}%)` : ''}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Transactions"
            value={summary?.expense_count?.toString() || expenses.length.toString()}
            icon={<Receipt />}
            color={theme.palette.info.main}
            subtitle="Total count"
          />
        </Grid>
      </Grid>
      
      {/* Charts - Overview */}
      {viewType === 'overview' && (
        <Grid container spacing={3}>
          {/* Expense Trend */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Expense Trend
                </Typography>
                {expenseTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={expenseTrendData}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        name="Amount"
                        stroke={theme.palette.primary.main}
                        fillOpacity={1}
                        fill="url(#colorAmount)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No expense data for this period" />
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Category Breakdown */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Category Breakdown
                </Typography>
                {categoryData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                      {categoryData.map((cat, index) => (
                        <Box key={cat.name} display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                          <Box display="flex" alignItems="center">
                            <Box 
                              sx={{ 
                                width: 12, 
                                height: 12, 
                                borderRadius: '50%', 
                                bgcolor: COLORS[index % COLORS.length],
                                mr: 1 
                              }} 
                            />
                            <Typography variant="body2">{cat.name}</Typography>
                          </Box>
                          <Typography variant="body2" fontWeight={600}>
                            ${cat.value.toFixed(2)} ({cat.percentage}%)
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                ) : (
                  <EmptyState message="No category data" />
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Top Expenses */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Top Expenses
                </Typography>
                {topExpenses.length > 0 ? (
                  <List disablePadding>
                    {topExpenses.map((expense, index) => (
                      <ListItem 
                        key={expense.id} 
                        divider={index < topExpenses.length - 1}
                        sx={{ px: 0 }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: COLORS[index % COLORS.length] }}>
                            {expense.category[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight={500}>
                              {expense.description}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {expense.category} • {expense.date ? format(parseISO(expense.date), 'MMM dd, yyyy') : 'N/A'}
                            </Typography>
                          }
                        />
                        <Typography variant="h6" color="primary" fontWeight={600}>
                          ${expense.amount.toFixed(2)}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <EmptyState message="No expenses recorded" />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Stats */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Quick Insights
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                      <Typography variant="body2">Highest Day</Typography>
                      <Typography variant="h5" fontWeight={600}>
                        ${Math.max(...expenseTrendData.map(d => d.amount), 0).toFixed(0)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                      <Typography variant="body2">Lowest Day</Typography>
                      <Typography variant="h5" fontWeight={600}>
                        ${expenseTrendData.length > 0 
                          ? Math.min(...expenseTrendData.filter(d => d.amount > 0).map(d => d.amount)).toFixed(0)
                          : '0'
                        }
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                      <Typography variant="body2">Categories Used</Typography>
                      <Typography variant="h5" fontWeight={600}>
                        {categoryData.length}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                      <Typography variant="body2">Avg per Transaction</Typography>
                      <Typography variant="h5" fontWeight={600}>
                        ${((summary?.total_expenses || 0) / Math.max(expenses.length, 1)).toFixed(0)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Charts - Detailed View */}
      {viewType === 'detailed' && (
        <Grid container spacing={3}>
          {/* Spending Pattern Radar */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Spending by Category
                </Typography>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={spendingPatternData}>
                      <PolarGrid stroke={theme.palette.divider} />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis tick={{ fontSize: 10 }} />
                      <Radar 
                        name="Current Period" 
                        dataKey="current" 
                        stroke={theme.palette.primary.main} 
                        fill={theme.palette.primary.main} 
                        fillOpacity={0.5} 
                      />
                      <Legend />
                      <RechartsTooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No spending pattern data" />
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Horizontal Bar Chart by Category */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Category Comparison
                </Typography>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={categoryData}
                      layout="vertical"
                      margin={{ left: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={75} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Amount" radius={[0, 4, 4, 0]}>
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No category comparison data" />
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Category Percentages */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Spending Distribution
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {categoryData.map((cat, index) => (
                    <Box key={cat.name} mb={2}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" fontWeight={500}>
                          {cat.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ${cat.value.toFixed(2)} ({cat.percentage}%)
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={cat.percentage} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: COLORS[index % COLORS.length],
                            borderRadius: 4,
                          }
                        }} 
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Insights View */}
      {viewType === 'comparison' && (
        <Grid container spacing={3}>
          {/* Trend Line */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Expense Trend Over Time
                </Typography>
                {expenseTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={expenseTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        name="Expenses"
                        stroke={theme.palette.primary.main} 
                        strokeWidth={3}
                        dot={{ fill: theme.palette.primary.main, strokeWidth: 2 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No trend data available" />
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Category Performance */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Category sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight={600}>
                    Category Analysis
                  </Typography>
                </Box>
                {categoryData.length > 0 ? (
                  <List disablePadding>
                    {categoryData.map((category, index) => (
                      <ListItem key={category.name} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: COLORS[index % COLORS.length], width: 40, height: 40 }}>
                            {category.name[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight={500}>
                              {category.name}
                            </Typography>
                          }
                          secondary={`$${category.value.toFixed(2)}`}
                        />
                        <Chip 
                          label={`${category.percentage}%`} 
                          size="small"
                          sx={{ 
                            bgcolor: COLORS[index % COLORS.length],
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <EmptyState message="No category data" />
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Savings Potential */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Lightbulb sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="h6" fontWeight={600}>
                    Savings Opportunities
                  </Typography>
                </Box>
                {savingsInsights.length > 0 ? (
                  <>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Based on your spending patterns:
                    </Typography>
                    <List disablePadding>
                      {savingsInsights.map((insight, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'success.light' }}>
                              <Savings sx={{ color: 'success.main' }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={insight.title}
                            secondary={`Potential savings: $${insight.savings}/month`}
                          />
                          <Chip 
                            label={insight.impact === 'high' ? 'High Impact' : insight.impact === 'medium' ? 'Medium' : 'Easy Win'}
                            size="small"
                            color={insight.impact === 'high' ? 'error' : insight.impact === 'medium' ? 'warning' : 'success'}
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Divider sx={{ my: 2 }} />
                    <Paper sx={{ p: 2, bgcolor: 'success.main', color: 'white', borderRadius: 2 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="body1" fontWeight={500}>
                          Total Potential Savings
                        </Typography>
                        <Typography variant="h5" fontWeight={700}>
                          ${totalPotentialSavings}/month
                        </Typography>
                      </Box>
                    </Paper>
                  </>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Savings sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">
                      Add more expenses to get personalized savings tips
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Analytics;
