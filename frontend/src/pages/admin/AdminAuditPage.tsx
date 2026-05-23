import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Button,
  Grid,
  Divider,
} from '@mui/material';
import { enterpriseAPI } from '../../services/api';
import { StatusDot } from '../../components/admin/StatusDot';
import { useIsMobileLayout } from '../../layout/useIsMobileLayout';
import { formatAmount } from '../../utils/formatting';

const AdminAuditPage: React.FC = () => {
  const isMobile = useIsMobileLayout();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    enterpriseAPI.audit
      .list()
      .then((d) => {
        const list = d.results || d || [];
        setEvents(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const pending = events.filter((e) => e.status === 'pending' || e.status === 'flagged');
  const selected = events.find((e) => e.id === selectedId);

  if (loading) return <CircularProgress />;

  const detailPanel = selected ? (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {selected.id?.slice(0, 8).toUpperCase()}
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {selected.action_type}
          </Typography>
        </Box>
        <StatusDot status={selected.status} label={selected.status} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {selected.description}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Audit Trail
      </Typography>
      <Box sx={{ borderLeft: 2, borderColor: 'divider', pl: 2, ml: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {new Date(selected.created_at).toLocaleString()}
          </Typography>
          <Typography variant="body2">Event recorded — {selected.actor_display || 'System'}</Typography>
        </Box>
        {selected.metadata && Object.keys(selected.metadata).length > 0 && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
            {Object.entries(selected.metadata).map(([k, v]) => (
              <Typography key={k} variant="body2">
                {k}: {String(v)}
              </Typography>
            ))}
          </Paper>
        )}
        {selected.amount != null && (
          <Typography variant="h6" color="error.main" fontWeight={700}>
            -{formatAmount(selected.amount)}
          </Typography>
        )}
      </Box>
      <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
        <Button variant="outlined" size="small">
          Flag
        </Button>
        <Button variant="contained" size="small">
          Approve
        </Button>
      </Box>
    </Paper>
  ) : (
    <Paper sx={{ p: 3 }}>
      <Typography color="text.secondary">Select an event to view details</Typography>
    </Paper>
  );

  const queuePanel = (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Verification Queue
        </Typography>
        <Chip label={`${pending.length} Pending`} size="small" />
      </Box>
      <List disablePadding>
        {pending.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No pending verifications
          </Typography>
        ) : (
          pending.map((e) => (
            <ListItemButton
              key={e.id}
              selected={selectedId === e.id}
              onClick={() => setSelectedId(e.id)}
              sx={{ borderRadius: 1, mb: 1, border: 1, borderColor: 'divider' }}
            >
              <ListItemText
                primary={e.action_type}
                secondary={e.description}
              />
              <StatusDot status={e.status} />
            </ListItemButton>
          ))
        )}
      </List>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" gutterBottom>
        All events
      </Typography>
      <List dense>
        {events.map((e) => (
          <ListItemButton
            key={e.id}
            selected={selectedId === e.id}
            onClick={() => setSelectedId(e.id)}
          >
            <ListItemText primary={e.action_type} secondary={e.status} />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Audit Trail
      </Typography>
      {isMobile ? (
        <Box>
          {queuePanel}
          <Box sx={{ mt: 2 }}>{detailPanel}</Box>
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            {queuePanel}
          </Grid>
          <Grid item xs={12} md={8}>
            {detailPanel}
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AdminAuditPage;
