import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Avatar,
  CircularProgress,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, paymentRequestsAPI } from '../../services/api';
import { LcCard } from '../../components/lc';
import { formatAmount } from '../../utils/formatting';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([dashboardAPI.getHome(), paymentRequestsAPI.pendingForMe()])
      .then(([homeResult, prResult]) => {
        if (homeResult.status === 'fulfilled') {
          setData(homeResult.value);
        }
        if (prResult.status === 'fulfilled') {
          const pr = prResult.value;
          setPending(Array.isArray(pr) ? pr : pr.results || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;
  if (!data) return <Typography>Unable to load home</Typography>;

  const hide = data.hide_balances;
  const currency = data.budget_summary?.currency === 'INR' ? '₹' : '$';

  const balanceCard = (
    <LcCard sx={{ p: 2, mb: { xs: 2, lg: 0 }, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Net Balance
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {data.people_owe_you_count} people owe you
        </Typography>
      </Box>
      <Typography variant="h4" color="success.main" fontWeight={700}>
        {hide ? '•••' : `${currency}${formatAmount(data.net_balance)}`}
      </Typography>
      <List dense>
        {(data.people_balances || []).slice(0, 5).map((p: any) => (
          <ListItem key={p.user_id}>
            <Avatar sx={{ width: 32, height: 32, mr: 1 }}>{p.name?.[0]}</Avatar>
            <ListItemText primary={p.name} secondary={p.direction === 'owes_you' ? 'Owes you' : 'You owe'} />
            <Typography color={p.direction === 'owes_you' ? 'success.main' : 'error.main'}>
              {hide ? '•••' : formatAmount(p.amount)}
            </Typography>
          </ListItem>
        ))}
      </List>
    </LcCard>
  );

  const safeToSpendCard = (
    <LcCard sx={{ p: 2, mb: { xs: 2, lg: 0 }, height: '100%' }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Safe-to-Spend
      </Typography>
      <Typography variant="h4" fontWeight={700}>
        {hide ? '•••' : `${currency}${formatAmount(data.safe_to_spend)}`}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        of {formatAmount(data.budget_summary?.total)} budget
      </Typography>
      {(data.upcoming_fixed_costs || []).length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {data.upcoming_fixed_costs.map((fc: any) => (
            <Box key={fc.id} sx={{ px: 1.5, py: 0.5, bgcolor: 'action.hover', borderRadius: 2, fontSize: 12 }}>
              {fc.name} · {formatAmount(fc.amount)} · {fc.days_until}d
            </Box>
          ))}
        </Box>
      )}
      <Button fullWidth variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/app/budget')}>
        View budget
      </Button>
    </LcCard>
  );

  const recentCard = (
    <LcCard sx={{ p: 2, height: '100%' }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Recent
      </Typography>
      <List dense>
        {(data.recent_activity || []).map((e: any) => (
          <ListItemButton key={e.id} onClick={() => navigate(`/app/expenses/${e.id}`)}>
            <ListItemText primary={e.title} secondary={e.category || e.expense_date} />
            <Typography color="error.main">-{formatAmount(e.amount)}</Typography>
          </ListItemButton>
        ))}
      </List>
      <Button fullWidth variant="outlined" sx={{ mt: 1 }} onClick={() => navigate('/app/expenses')}>
        View all activity
      </Button>
    </LcCard>
  );

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Good morning, {data.greeting_name}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {data.month_label} · {hide ? '•••' : `${currency}${formatAmount(data.month_spent)}`} spent
      </Typography>

      {pending.map((pr: any) => (
        <LcCard key={pr.id} sx={{ mb: 2, p: 2 }}>
          <Typography variant="subtitle2">
            {pr.requester_name} says they sent {formatAmount(pr.amount)} — confirm?
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={() => paymentRequestsAPI.dispute(pr.id).then(() => window.location.reload())}
            >
              Dispute
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => paymentRequestsAPI.approve(pr.id).then(() => window.location.reload())}
            >
              Approve
            </Button>
          </Box>
        </LcCard>
      ))}

      <Grid container spacing={2}>
        <Grid item xs={12} lg={6}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} lg={12}>
              {balanceCard}
            </Grid>
            <Grid item xs={12} md={6} lg={12}>
              {safeToSpendCard}
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} lg={6}>
          {recentCard}
        </Grid>
      </Grid>
    </Box>
  );
};

export default HomePage;
