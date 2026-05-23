import React from 'react';
import { Typography, Box } from '@mui/material';
import RecurringExpensesList from '../../components/expenses/RecurringExpensesList';

const RecurringPage: React.FC = () => (
  <Box>
    <Typography variant="h5" fontWeight={700} gutterBottom>Recurring Expenses</Typography>
    <RecurringExpensesList />
  </Box>
);

export default RecurringPage;
