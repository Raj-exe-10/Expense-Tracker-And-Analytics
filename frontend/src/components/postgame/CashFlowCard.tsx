import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';

interface CashFlowCardProps {
  cashFlow: {
    income: number;
    nodes: { id: string; label: string; value: number }[];
    links: { source: string; target: string; value: number }[];
    category_cards?: { name: string; amount: number }[];
  };
  currency: string;
}

export const CashFlowCard: React.FC<CashFlowCardProps> = ({ cashFlow, currency }) => {
  const sym = currency === 'INR' ? '₹' : '$';
  const categories = cashFlow.category_cards || cashFlow.links.map((l) => ({
    name: l.target,
    amount: l.value,
  }));

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, mb: 2, width: '100%' }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Where your money went
      </Typography>
      <Grid container spacing={2} alignItems="stretch">
        <Grid item xs={12} sm={5} md={4} lg={3}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'action.hover',
              minHeight: { xs: 96, md: 140 },
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Total In
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {sym}
              {cashFlow.income.toLocaleString()}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={7} md={8} lg={9}>
          {categories.length === 0 ? (
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                borderStyle: 'dashed',
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No category breakdown for this period. Add expenses to see where money went.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={1.5}>
              {categories.slice(0, 8).map((c) => (
                <Grid item xs={6} sm={4} md={3} key={c.name}>
                  <Box
                    sx={{
                      p: 1.5,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      height: '100%',
                      minHeight: 72,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" noWrap title={c.name}>
                      {c.name}
                    </Typography>
                    <Typography fontWeight={600}>
                      {sym}
                      {c.amount >= 1000 ? `${(c.amount / 1000).toFixed(0)}k` : c.amount.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};
