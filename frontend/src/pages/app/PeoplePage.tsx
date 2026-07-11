import React, { useState, useEffect } from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup, List, ListItem, ListItemAvatar, ListItemText, Avatar, Button, CircularProgress, Grid } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import Groups from '../Groups';
import { settlementsAPI } from '../../services/api';
import { LcCard } from '../../components/lc';
import { formatAmount } from '../../utils/formatting';

const PeoplePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'people' ? 'people' : 'squads';
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'people') {
      setLoading(true);
      settlementsAPI.getUserBalances().then((d) => setBalances(d.balances || d || [])).finally(() => setLoading(false));
    }
  }, [tab]);

  const owesYou = balances.filter((b: any) => b.owes_you);

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <ToggleButtonGroup
        value={tab}
        exclusive
        onChange={(_, v) => v && setSearchParams(v === 'people' ? { tab: 'people' } : {})}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="squads">Squads</ToggleButton>
        <ToggleButton value="people">People</ToggleButton>
      </ToggleButtonGroup>

      {tab === 'squads' ? (
        <Groups />
      ) : (
        <>
          <Typography color="success.main" sx={{ mb: 2 }}>
            {owesYou.length} people owe you{' '}
            {formatAmount(owesYou.reduce((s: number, b: any) => s + (b.amount || 0), 0))} total
          </Typography>
          {loading ? (
            <CircularProgress />
          ) : (
            <Grid container spacing={2}>
              {balances.map((b: any, i: number) => (
                <Grid item xs={12} md={6} lg={4} key={i}>
                  <LcCard sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar>{b.user_name?.[0]}</Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={600}>{b.user_name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {b.owes_you ? `Owes you ${formatAmount(b.amount)}` : `You owe ${formatAmount(b.amount)}`}
                        </Typography>
                      </Box>
                      {!b.on_app && (
                        <Button size="small" variant="outlined">
                          Invite
                        </Button>
                      )}
                    </Box>
                  </LcCard>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
};

export default PeoplePage;
