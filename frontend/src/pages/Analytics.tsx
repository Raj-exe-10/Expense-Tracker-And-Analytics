import React, { useState, useEffect } from 'react';
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
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Download,
  DateRange,
  Category,
  AttachMoney,
  Group,
  Assessment,
  PieChart as PieChartIcon,
  ShowChart,
  BarChart as BarChartIcon,
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
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchAnalyticsSummary, fetchCategoryBreakdown, fetchMonthlyTrends, exportReport } from '../store/slices/analyticsSlice';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

const Analytics: React.FC = () => {
  const dispatch = useAppDispatch();
  const { summary, categoryBreakdown, monthlyTrends, loading } = useAppSelector((state) => state.analytics);
  const { groups } = useAppSelector((state) => state.groups);
  
  const [dateRange, setDateRange] = useState('30');
  const [groupFilter, setGroupFilter] = useState('all');
  const [viewType, setViewType] = useState<'overview' | 'detailed' | 'comparison'>('overview');
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  
  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, groupFilter]);
  
  const loadAnalyticsData = () => {
    const endDate = new Date();
    const startDate = subDays(endDate, parseInt(dateRange));
    
    const params = {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      groupId: groupFilter !== 'all' ? groupFilter : undefined,
    };
    
    dispatch(fetchAnalyticsSummary(params));
    dispatch(fetchCategoryBreakdown(params));
    dispatch(fetchMonthlyTrends(params));
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
  
  // Use real data from Redux store, fallback to empty arrays if not loaded
  const expenseTrendData = monthlyTrends.length > 0 
    ? monthlyTrends.map(trend => ({
        date: trend.month || trend.date || '',
        amount: trend.total_amount || trend.amount || 0,
        count: trend.expense_count || trend.count || 0,
      }))
    : [];
  
  const categoryData = categoryBreakdown.length > 0
    ? categoryBreakdown.map(cat => ({
        name: cat.category_name || cat.category?.name || 'Other',
        value: cat.amount || cat.total_amount || 0,
        percentage: cat.percentage || 0,
      }))
    : [];
  
  const monthlyComparisonData = [
    { month: 'Jan', thisYear: 4500, lastYear: 3800 },
    { month: 'Feb', thisYear: 4200, lastYear: 3900 },
    { month: 'Mar', thisYear: 4800, lastYear: 4100 },
    { month: 'Apr', thisYear: 4300, lastYear: 4000 },
    { month: 'May', thisYear: 5100, lastYear: 4200 },
    { month: 'Jun', thisYear: 4900, lastYear: 4500 },
  ];
  
  const spendingPatternData = [
    { subject: 'Food', A: 120, B: 110, fullMark: 150 },
    { subject: 'Transport', A: 98, B: 130, fullMark: 150 },
    { subject: 'Entertainment', A: 86, B: 130, fullMark: 150 },
    { subject: 'Shopping', A: 99, B: 100, fullMark: 150 },
    { subject: 'Bills', A: 85, B: 90, fullMark: 150 },
    { subject: 'Healthcare', A: 65, B: 85, fullMark: 150 },
  ];
  
  const topExpenses = [
    { id: 1, description: 'Grocery Shopping', amount: 245.50, date: '2024-01-15', category: 'Food' },
    { id: 2, description: 'Monthly Rent', amount: 1200.00, date: '2024-01-01', category: 'Bills' },
    { id: 3, description: 'Team Dinner', amount: 185.75, date: '2024-01-12', category: 'Food' },
    { id: 4, description: 'Uber Rides', amount: 156.30, date: '2024-01-14', category: 'Transport' },
    { id: 5, description: 'Netflix Subscription', amount: 15.99, date: '2024-01-05', category: 'Entertainment' },
  ];
  
  const StatCard = ({ title, value, change, icon, color }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {change !== undefined && (
              <Box display="flex" alignItems="center" mt={1}>
                {change >= 0 ? (
                  <TrendingUp sx={{ color: 'error.main', fontSize: 20, mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ color: 'success.main', fontSize: 20, mr: 0.5 }} />
                )}
                <Typography
                  variant="body2"
                  color={change >= 0 ? 'error.main' : 'success.main'}
                >
                  {Math.abs(change)}% vs last period
                </Typography>
              </Box>
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
        <Paper sx={{ p: 1 }}>
          <Typography variant="body2">{label}</Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={index}
              variant="body2"
              style={{ color: entry.color }}
            >
              {entry.name}: ${entry.value.toFixed(2)}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };
  
  return (
    <Box>
      {/* Success/Error Messages */}
      <Snackbar
        open={!!exportSuccess}
        autoHideDuration={3000}
        onClose={() => setExportSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setExportSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {exportSuccess}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!exportError}
        autoHideDuration={5000}
        onClose={() => setExportError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setExportError(null)} severity="error" sx={{ width: '100%' }}>
          {exportError}
        </Alert>
      </Snackbar>
      
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your spending patterns and financial insights
        </Typography>
      </Box>
      
      {/* Controls */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={dateRange}
              label="Period"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="7">Last 7 days</MenuItem>
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 3 months</MenuItem>
              <MenuItem value="180">Last 6 months</MenuItem>
              <MenuItem value="365">Last year</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Group</InputLabel>
            <Select
              value={groupFilter}
              label="Group"
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
          
          <ButtonGroup size="small">
            <Button
              variant={viewType === 'overview' ? 'contained' : 'outlined'}
              onClick={() => setViewType('overview')}
            >
              Overview
            </Button>
            <Button
              variant={viewType === 'detailed' ? 'contained' : 'outlined'}
              onClick={() => setViewType('detailed')}
            >
              Detailed
            </Button>
            <Button
              variant={viewType === 'comparison' ? 'contained' : 'outlined'}
              onClick={() => setViewType('comparison')}
            >
              Comparison
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
            variant="outlined"
            startIcon={<Download />}
            onClick={() => handleExport('pdf')}
            size="small"
          >
            Export PDF
          </Button>
        </Box>
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Expenses"
            value={`$${summary?.total_expenses?.toFixed(2) || '0.00'}`}
            change={summary?.change_percentage ? Math.round(summary.change_percentage) : 0}
            icon={<AttachMoney />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Expense"
            value={`$${summary?.average_expense?.toFixed(2) || '0.00'}`}
            change={summary?.change_percentage ? Math.round(summary.change_percentage) : 0}
            icon={<Assessment />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Most Spent Category"
            value={summary?.most_expensive_category || categoryBreakdown[0]?.category_name || 'N/A'}
            icon={<Category />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Expense Count"
            value={summary?.expense_count?.toString() || '0'}
            change={summary?.change_percentage ? Math.round(summary.change_percentage) : 0}
            icon={<BarChartIcon />}
            color="info.main"
          />
        </Grid>
      </Grid>
      
      {/* Charts */}
      {viewType === 'overview' && (
        <Grid container spacing={3}>
          {/* Expense Trend */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Expense Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={expenseTrendData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Category Breakdown */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Category Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Monthly Comparison */}
          <Grid item xs={12} lg={7}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Comparison
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="thisYear" fill="#8884d8" name="This Year" />
                    <Bar dataKey="lastYear" fill="#82ca9d" name="Last Year" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Top Expenses */}
          <Grid item xs={12} lg={5}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Expenses
                </Typography>
                <List>
                  {topExpenses.map((expense, index) => (
                    <ListItem key={expense.id} divider={index < topExpenses.length - 1}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: COLORS[index % COLORS.length] }}>
                          {expense.category[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={expense.description}
                        secondary={`${expense.category} • ${expense.date}`}
                      />
                      <Typography variant="h6" color="primary">
                        ${expense.amount.toFixed(2)}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {viewType === 'detailed' && (
        <Grid container spacing={3}>
          {/* Spending Pattern Radar */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Spending Pattern Analysis
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={spendingPatternData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis />
                    <Radar name="Current Month" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Radar name="Last Month" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Daily Average by Category */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Daily Average by Category
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={categoryData}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#8884d8">
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Budget vs Actual */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Budget vs Actual Spending
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="thisYear" stroke="#8884d8" name="Actual" strokeWidth={2} />
                    <Line type="monotone" dataKey="lastYear" stroke="#82ca9d" name="Budget" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {viewType === 'comparison' && (
        <Grid container spacing={3}>
          {/* Year over Year */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Year over Year Comparison
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="thisYear" stroke="#8884d8" name="2024" strokeWidth={2} />
                    <Line type="monotone" dataKey="lastYear" stroke="#82ca9d" name="2023" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Category Comparison */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Category Growth/Decline
                </Typography>
                <List>
                  {categoryData.map((category, index) => {
                    // Use percentage change from summary if available, otherwise show 0
                    const change = summary?.change_percentage ? Math.round(summary.change_percentage) : 0;
                    return (
                      <ListItem key={category.name}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: COLORS[index % COLORS.length] }}>
                            {category.name[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={category.name}
                          secondary={`$${category.value.toFixed(2)}`}
                        />
                        <Box display="flex" alignItems="center">
                          {change >= 0 ? (
                            <TrendingUp sx={{ color: 'error.main', mr: 1 }} />
                          ) : (
                            <TrendingDown sx={{ color: 'success.main', mr: 1 }} />
                          )}
                          <Typography
                            variant="body2"
                            color={change >= 0 ? 'error.main' : 'success.main'}
                          >
                            {Math.abs(change).toFixed(1)}%
                          </Typography>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Savings Potential */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Savings Potential
                </Typography>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Based on your spending patterns, here's where you could save:
                  </Typography>
                </Box>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Reduce dining out by 20%"
                      secondary="Potential savings: $280/month"
                    />
                    <Chip label="High Impact" color="error" size="small" />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Switch to public transport 3 days/week"
                      secondary="Potential savings: $120/month"
                    />
                    <Chip label="Medium Impact" color="warning" size="small" />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Cancel unused subscriptions"
                      secondary="Potential savings: $45/month"
                    />
                    <Chip label="Easy Win" color="success" size="small" />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Shop with a list to avoid impulse buys"
                      secondary="Potential savings: $150/month"
                    />
                    <Chip label="Medium Impact" color="warning" size="small" />
                  </ListItem>
                </List>
                <Box mt={2} p={2} bgcolor="primary.main" color="white" borderRadius={1}>
                  <Typography variant="h6">
                    Total Potential Savings: $595/month
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Analytics;
