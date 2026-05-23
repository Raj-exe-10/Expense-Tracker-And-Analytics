import React, { useEffect, useState } from 'react';
import { Box, Typography, LinearProgress, Button, CircularProgress } from '@mui/material';
import { settlementReportsAPI } from '../../services/api';
import { LcCard } from '../../components/lc';
import { formatAmount } from '../../utils/formatting';

const SettlementReportsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settlementReportsAPI.get().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Settlement Reports</Typography>
      <LcCard sx={{ p: 2, mb: 2 }}>
        <Typography variant="caption">Net Position</Typography>
        <Typography variant="h4" color={data?.net_position >= 0 ? 'success.main' : 'error.main'}>
          {formatAmount(data?.net_position || 0)}
        </Typography>
      </LcCard>
      {(data?.squads || []).map((s: any) => (
        <LcCard key={s.id} sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={600}>{s.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            Total {formatAmount(s.total_spend)} · Your share {formatAmount(s.your_share)}
          </Typography>
          <LinearProgress variant="determinate" value={s.settled_percent} sx={{ my: 1 }} />
          <Typography variant="caption">{s.settled_percent}% Settled</Typography>
        </LcCard>
      ))}
    </Box>
  );
};

export default SettlementReportsPage;
