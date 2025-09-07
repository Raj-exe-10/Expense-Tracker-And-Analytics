import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Tabs,
  Tab,
  Fab,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAppDispatch } from '../hooks/redux';
import { fetchExpenses, createExpense } from '../store/slices/expenseSlice';
import ExpenseList from '../components/expenses/ExpenseList';
import ExpenseForm from '../components/expenses/ExpenseForm';

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
  const { expenses, groups, currentFilter, setCurrentFilter, addExpense } = useAppContext();
  const [tabValue, setTabValue] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);

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
    // Dispatch to Redux store to create expense
    await dispatch(createExpense(expense));
    // Also update local context if needed
    addExpense(expense);
    setShowAddForm(false);
    // Refresh expenses list
    dispatch(fetchExpenses({}));
  };

  // Filter expenses based on tab and current filter
  const getFilteredExpenses = () => {
    let filtered = [...expenses];
    
    if (tabValue === 1) {
      // Personal expenses (no group)
      filtered = filtered.filter(e => !e.group_id);
    } else if (tabValue === 2) {
      // Group expenses
      filtered = filtered.filter(e => e.group_id);
      
      // Apply specific group filter if coming from groups page
      if (currentFilter.type === 'group' && currentFilter.value) {
        filtered = filtered.filter(e => e.group_id === currentFilter.value);
      }
    }
    
    return filtered;
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
          groups={groups}
        />
      </Box>
    );
  }

  return (
    <Box>
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
        <Box>
          <Typography variant="h6" color="text.secondary" textAlign="center" py={4}>
            Recurring expenses feature coming soon
          </Typography>
        </Box>
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
