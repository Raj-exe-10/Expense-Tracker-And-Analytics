import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Button,
  CircularProgress,
  Grid,
  Link,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchPostGameAnalytics } from '../../store/slices/postGameAnalyticsSlice';
import { CashFlowCard } from '../../components/postgame/CashFlowCard';
import { IntensityHeatmap } from '../../components/postgame/IntensityHeatmap';
import { BudgetVsActual } from '../../components/postgame/BudgetVsActual';
import { SmartInsightsList } from '../../components/postgame/SmartInsightsList';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const PostGameAnalyticsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data, loading, error, invalidateVersion } = useAppSelector((s) => s.postGame);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [scope, setScope] = useState<'personal' | 'group' | 'combined'>('personal');

  const periodKey = useMemo(() => `${year}-${month}-${scope}`, [year, month, scope]);

  useEffect(() => {
    dispatch(fetchPostGameAnalytics({ year, month, scope }));
  }, [dispatch, periodKey, invalidateVersion]);

  const meta = data?.meta;
  const hasGroups = meta?.has_groups !== false;

  const handleRefresh = () => {
    dispatch(fetchPostGameAnalytics({ year, month, scope }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Post-game review: what went right and what to fix
          </Typography>
        </Box>
        <Button startIcon={<Refresh />} onClick={handleRefresh} disabled={loading}>
          Refresh
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Period</InputLabel>
          <Select
            label="Period"
            value={`${year}-${month}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-').map(Number);
              setYear(y);
              setMonth(m);
            }}
          >
            {Array.from({ length: 12 }, (_, i) => {
              const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
              return (
                <MenuItem key={`${d.getFullYear()}-${d.getMonth() + 1}`} value={`${d.getFullYear()}-${d.getMonth() + 1}`}>
                  {MONTHS[d.getMonth()]} {d.getFullYear()}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        <ToggleButtonGroup
          size="small"
          value={scope}
          exclusive
          onChange={(_, v) => v && setScope(v)}
        >
          <ToggleButton value="personal">Personal</ToggleButton>
          <ToggleButton value="group" disabled={!hasGroups}>
            Group
          </ToggleButton>
          <ToggleButton value="combined" disabled={!hasGroups}>
            Combined
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {meta?.income_missing && (
        <Alert severity="warning" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" onClick={() => navigate('/app/settings')}>
            Settings
          </Button>
        }>
          Set your monthly income in Settings for accurate cash-flow totals.
        </Alert>
      )}

      {meta?.ml_is_estimate && (
        <Alert severity="info" sx={{ mb: 2 }}>
          ML insights are estimates while we collect more of your spending history.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && !data ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : data ? (
        <Grid container spacing={2}>
          <Grid item xs={12} lg={8}>
            {data.cash_flow && (
              <CashFlowCard cashFlow={data.cash_flow} currency={meta?.currency || 'USD'} />
            )}
            {data.intensity && <IntensityHeatmap intensity={data.intensity} />}
            {data.budget_vs_actual?.length > 0 && (
              <BudgetVsActual rows={data.budget_vs_actual} currency={meta?.currency || 'USD'} />
            )}
          </Grid>
          <Grid item xs={12} lg={4}>
            <SmartInsightsList insights={data.insights || []} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              <Link component={RouterLink} to="/app/analytics">
                Open classic analytics charts
              </Link>
            </Typography>
          </Grid>
        </Grid>
      ) : null}
    </Box>
  );
};

export default PostGameAnalyticsPage;
