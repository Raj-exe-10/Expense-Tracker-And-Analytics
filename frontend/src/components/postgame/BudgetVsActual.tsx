import React from 'react';
import { Box, Typography, Paper, LinearProgress } from '@mui/material';

interface Row {
  name: string;
  budget: number;
  spent: number;
  percent_used: number;
  over_budget: boolean;
}

export const BudgetVsActual: React.FC<{ rows: Row[]; currency: string }> = ({ rows, currency }) => {
  const sym = currency === 'INR' ? '₹' : '$';
  if (!rows.length) return null;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Budget vs Actual
      </Typography>
      {rows.map((row) => (
        <Box key={row.name} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">{row.name}</Typography>
            <Typography variant="body2" color={row.over_budget ? 'error.main' : 'text.secondary'}>
              {sym}
              {row.spent.toLocaleString()} / {sym}
              {row.budget.toLocaleString()}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, row.percent_used)}
            color={row.over_budget ? 'error' : 'primary'}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      ))}
    </Paper>
  );
};
