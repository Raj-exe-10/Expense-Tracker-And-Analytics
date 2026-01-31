import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Tabs,
  Tab,
  Fab,
  Alert,
  Snackbar,
  Paper,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add, FilterList, Refresh } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchExpenses } from '../store/slices/expenseSlice';
import { fetchGroups } from '../store/slices/groupSlice';
import ExpenseList from '../components/expenses/ExpenseList';
import ExpenseForm from '../components/expenses/ExpenseForm';
import RecurringExpensesList from '../components/expenses/RecurringExpensesList';

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
      id={`expenses-tabpanel-${index}`}
      aria-labelledby={`expenses-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const Expenses: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { currentFilter, setCurrentFilter } = useAppContext();
  const { expenses: storeExpenses, loading, totalExpenses } = useAppSelector((state) => state.expenses);
  const { groups: storeGroups } = useAppSelector((state) => state.groups);
  const [tabValue, setTabValue] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const groupsList = storeGroups || [];

  // Fetch expenses and groups on component mount
  useEffect(() => {
    dispatch(fetchExpenses({}));
    dispatch(fetchGroups());
  }, [dispatch]);

  // Check for filter from navigation
  useEffect(() => {
    if (currentFilter.type === 'group' && currentFilter.value) {
      setTabValue(2);
    } else if (location.state?.fromDashboard) {
      setTabValue(0);
    }
  }, [currentFilter, location.state]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue !== 2) {
      setCurrentFilter({ type: '', value: '' });
    }
  };

  const handleAddExpense = () => {
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
  };

  const handleExpenseAdded = async (expense: any) => {
    setShowAddForm(false);
    setSuccessMessage('Expense added successfully!');
    dispatch(fetchExpenses({}));
  };

  const handleRefresh = () => {
    dispatch(fetchExpenses({}));
  };

  // Filter expenses based on tab
  const getFilteredExpenses = () => {
    if (!storeExpenses || storeExpenses.length === 0) {
      return undefined;
    }
    
    let filtered = [...storeExpenses];
    
    if (tabValue === 1) {
      // Personal expenses (no group)
      filtered = filtered.filter(e => !e.group);
    } else if (tabValue === 2) {
      // Group expenses
      filtered = filtered.filter(e => e.group);
      
      if (currentFilter.type === 'group' && currentFilter.value) {
        filtered = filtered.filter(e => e.group?.id === currentFilter.value);
      }
    }
    
    return filtered.length > 0 ? filtered : undefined;
  };

  // Get expense counts for tabs
  const getExpenseCount = (type: 'all' | 'personal' | 'group') => {
    if (!storeExpenses) return 0;
    switch (type) {
      case 'all':
        return storeExpenses.length;
      case 'personal':
        return storeExpenses.filter(e => !e.group).length;
      case 'group':
        return storeExpenses.filter(e => e.group).length;
      default:
        return 0;
    }
  };

  if (showAddForm) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="600">Add New Expense</Typography>
            <Typography variant="body2" color="text.secondary">
              Record a new expense and optionally split it with your group
            </Typography>
          </Box>
          <Button variant="outlined" onClick={handleCloseForm} size="large">
            Cancel
          </Button>
        </Box>
        <ExpenseForm 
          onClose={handleCloseForm} 
          onSuccess={handleExpenseAdded}
          groups={groupsList}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success" variant="filled">
          {successMessage}
        </Alert>
      </Snackbar>
      
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="600" gutterBottom>
            Expenses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage all your expenses in one place
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddExpense}
            size="large"
            sx={{ px: 3 }}
          >
            Add Expense
          </Button>
        </Box>
      </Box>

      {/* Stats Summary */}
      {storeExpenses && storeExpenses.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }} variant="outlined">
          <Box display="flex" gap={4} flexWrap="wrap">
            <Box>
              <Typography variant="caption" color="text.secondary">Total Expenses</Typography>
              <Typography variant="h5" fontWeight="600">{totalExpenses || storeExpenses.length}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Personal</Typography>
              <Typography variant="h5" fontWeight="600">{getExpenseCount('personal')}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Group</Typography>
              <Typography variant="h5" fontWeight="600">{getExpenseCount('group')}</Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="expense tabs"
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.95rem',
            },
          }}
        >
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                All Expenses
                <Chip label={getExpenseCount('all')} size="small" variant="outlined" />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Personal
                <Chip label={getExpenseCount('personal')} size="small" variant="outlined" />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Group Expenses
                <Chip label={getExpenseCount('group')} size="small" variant="outlined" />
              </Box>
            } 
          />
          <Tab label="Recurring" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <ExpenseList expenses={getFilteredExpenses()} />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <ExpenseList expenses={getFilteredExpenses()} />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <ExpenseList 
          expenses={getFilteredExpenses()} 
          currentGroupFilter={currentFilter.type === 'group' ? currentFilter.value : null}
        />
      </TabPanel>
      <TabPanel value={tabValue} index={3}>
        <RecurringExpensesList />
      </TabPanel>

      {/* Empty State for no expenses */}
      {(!storeExpenses || storeExpenses.length === 0) && !loading && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No expenses yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Start tracking your expenses by adding your first one
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddExpense}
            size="large"
          >
            Add Your First Expense
          </Button>
        </Paper>
      )}

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', md: 'none' },
        }}
        onClick={handleAddExpense}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default Expenses;
