import React, { useState } from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ExpenseForm from '../../components/expenses/ExpenseForm';

const AddExpensePage: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'manual' | 'scan'>('manual');

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Add Expense</Typography>
      <ToggleButtonGroup value={mode} exclusive onChange={(_, v) => v && setMode(v)} sx={{ mb: 2 }}>
        <ToggleButton value="manual">Manual</ToggleButton>
        <ToggleButton value="scan" disabled title="Coming soon">Scan Receipt</ToggleButton>
      </ToggleButtonGroup>
      {mode === 'manual' ? (
        <ExpenseForm onSuccess={() => navigate('/app/expenses')} />
      ) : (
        <Typography color="text.secondary">Receipt scanning coming soon.</Typography>
      )}
      <Button sx={{ mt: 2 }} onClick={() => navigate(-1)}>Close</Button>
    </Box>
  );
};

export default AddExpensePage;
