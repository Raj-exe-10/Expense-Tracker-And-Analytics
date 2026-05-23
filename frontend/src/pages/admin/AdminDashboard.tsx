import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { enterpriseAPI } from '../../services/api';
import { StatusDot } from '../../components/admin/StatusDot';
import { useIsMobileLayout } from '../../layout/useIsMobileLayout';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobileLayout();
  const [entities, setEntities] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [exports, setExports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      enterpriseAPI.entities.list(),
      enterpriseAPI.audit.list(),
      enterpriseAPI.exports.list(),
    ])
      .then(([e, a, x]) => {
        setEntities(e.results || e || []);
        setAuditEvents(a.results || a || []);
        setExports(x.results || x || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const flaggedEntities = entities.filter((e) => e.status === 'flagged');
  const pendingAudits = auditEvents.filter((e) => e.status === 'pending' || e.status === 'flagged');
  const pendingExports = exports.filter((e) => e.status === 'pending' || e.status === 'processing');

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supervised entities and system activity
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate('/admin/entities')}>
          Add Entity
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, borderLeft: 4, borderColor: 'success.main' }}>
            <Typography variant="caption" color="text.secondary">
              Supervised Entities
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {entities.length}
            </Typography>
            <StatusDot status="verified" label={`${entities.filter((e) => e.status === 'active').length} active`} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="caption" color="text.secondary">
              Pending Settlements
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {pendingAudits.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Requires clearance review
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2.5,
              borderLeft: 4,
              borderColor: flaggedEntities.length > 0 ? 'error.main' : 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Audit Alerts
            </Typography>
            <Typography variant="h4" fontWeight={700} color={flaggedEntities.length > 0 ? 'error.main' : 'inherit'}>
              {flaggedEntities.length + pendingAudits.filter((e) => e.status === 'flagged').length}
            </Typography>
            <Typography variant="caption" color="error.main">
              {flaggedEntities.length > 0 ? 'Immediate action required' : 'All clear'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Supervised Entities
            </Typography>
            {entities.length === 0 ? (
              <Alert severity="info">No entities yet. Add one to get started.</Alert>
            ) : (
              <List>
                {entities.map((e) => (
                  <ListItem
                    key={e.id}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      bgcolor: e.status === 'flagged' ? 'error.light' : 'transparent',
                      opacity: e.status === 'flagged' ? 1 : undefined,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    secondaryAction={
                      <StatusDot
                        status={e.status === 'active' ? 'cleared' : e.status}
                        label={e.status === 'active' ? 'Cleared' : e.status}
                      />
                    }
                  >
                    <ListItemText
                      primary={e.name}
                      secondary={`Tax ID: ${e.tax_id || '—'}`}
                    />
                    <Typography fontWeight={600} sx={{ mr: 2 }}>
                      ${Number(e.balance || 0).toLocaleString()}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              System Log
            </Typography>
            <List dense>
              {auditEvents.slice(0, 6).map((ev) => (
                <ListItem key={ev.id} alignItems="flex-start" sx={{ px: 0 }}>
                  <Box sx={{ mr: 1, mt: 0.5 }}>
                    <StatusDot status={ev.status === 'flagged' ? 'flagged' : ev.status === 'verified' ? 'verified' : 'pending'} />
                  </Box>
                  <ListItemText
                    primary={ev.action_type}
                    secondary={
                      <>
                        <Typography variant="caption" display="block">
                          {ev.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ev.actor_display} · {new Date(ev.created_at).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
              {exports.slice(0, 2).map((job) => (
                <ListItem key={job.id} sx={{ px: 0 }}>
                  <ListItemText
                    primary={`Export ${job.status}`}
                    secondary={job.error_message || job.created_at}
                  />
                  <StatusDot status={job.status === 'completed' ? 'verified' : job.status === 'failed' ? 'flagged' : 'pending'} />
                </ListItem>
              ))}
            </List>
            {pendingExports.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                {pendingExports.length} export job(s) in progress
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {isMobile && (
        <Box sx={{ mt: 2 }}>
          <Button fullWidth variant="outlined" onClick={() => navigate('/admin/audit')}>
            Open Audit Trail
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default AdminDashboard;
