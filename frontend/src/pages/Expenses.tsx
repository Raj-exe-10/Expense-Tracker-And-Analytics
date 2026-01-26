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
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchExpenses, createExpense } from '../store/slices/expenseSlice';
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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Expenses: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { groups, currentFilter, setCurrentFilter, addExpense } = useAppContext();
  const { expenses: storeExpenses } = useAppSelector((state) => state.expenses);
  const { groups: storeGroups } = useAppSelector((state) => state.groups);
  const [tabValue, setTabValue] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Use groups from Redux store if available, otherwise from context
  const groupsList = storeGroups.length > 0 ? storeGroups : groups;

  // Fetch expenses on component mount
  useEffect(() => {
    dispatch(fetchExpenses({}));
  }, [dispatch]);

  // Check for filter from navigation (e.g., from groups page)
  useEffect(() => {
    if (currentFilter.type === 'group' && currentFilter.value) {
      // Set tab to group expenses
      setTabValue(2);
    } else if (location.state?.fromDashboard) {
      // Coming from dashboard, show all expenses
      setTabValue(0);
    }
  }, [currentFilter, location.state]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Clear filter when changing tabs
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
    try {
      // The expense is already created by the form, just refresh the list
      setShowAddForm(false);
      setSuccessMessage('Expense added successfully!');
      // Refresh expenses list
      dispatch(fetchExpenses({}));
    } catch (error) {
      console.error('Error handling expense addition:', error);
    }
  };

  // Filter expenses based on tab - ExpenseList will use Redux store expenses
  const getFilteredExpenses = () => {
    if (!storeExpenses || storeExpenses.length === 0) {
      return undefined; // Return undefined so ExpenseList uses storeExpenses directly
    }
    
    let filtered = [...storeExpenses];
    
    if (tabValue === 1) {
      // Personal expenses (no group)
      filtered = filtered.filter(e => !e.group);
    } else if (tabValue === 2) {
      // Group expenses
      filtered = filtered.filter(e => e.group);
      
      // Apply specific group filter if coming from groups page
      if (currentFilter.type === 'group' && currentFilter.value) {
        filtered = filtered.filter(e => e.group?.id === currentFilter.value);
      }
    }
    
    return filtered.length > 0 ? filtered : undefined;
  };

  if (showAddForm) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Add New Expense</Typography>
          <Button variant="outlined" onClick={handleCloseForm}>
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
        <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Expenses</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddExpense}
          size="large"
        >
          Add Expense
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="expense tabs">
          <Tab label="All Expenses" />
          <Tab label="Personal" />
          <Tab label="Group Expenses" />
          <Tab label="Recurring" />
        </Tabs>
      </Box>

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

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
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
