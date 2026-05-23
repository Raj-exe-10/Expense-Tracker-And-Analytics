import React from 'react';
import { Box, Typography, Paper, Grid, useMediaQuery, useTheme } from '@mui/material';

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
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const sym = currency === 'INR' ? '₹' : '$';
  const categories = cashFlow.category_cards || cashFlow.links.map((l) => ({
    name: l.target,
    amount: l.value,
  }));

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Where your money went
      </Typography>
      <Grid container spacing={2} alignItems="stretch">
        <Grid item xs={12} md={5}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'action.hover',
              minHeight: isDesktop ? 200 : 100,
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
            {!isDesktop && categories.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                Rotate device or use desktop for full diagram view
              </Typography>
            )}
          </Box>
        </Grid>
        <Grid item xs={12} md={7}>
          <Grid container spacing={1}>
            {categories.slice(0, 6).map((c) => (
              <Grid item xs={6} sm={4} key={c.name}>
                <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" noWrap>
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
        </Grid>
      </Grid>
    </Paper>
  );
};
