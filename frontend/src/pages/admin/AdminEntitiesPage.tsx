import React, { useEffect, useState } from 'react';
import {
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
} from '@mui/material';
import { enterpriseAPI } from '../../services/api';
import { StatusDot } from '../../components/admin/StatusDot';

const statusLabel: Record<string, string> = {
  active: 'Cleared',
  flagged: 'Audit Required',
  inactive: 'Pending',
};

const AdminEntitiesPage: React.FC = () => {
  const [entities, setEntities] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');

  const load = () => {
    setLoading(true);
    enterpriseAPI.entities
      .list({ q: q || undefined })
      .then((d) => setEntities(d.results || d || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const add = () => {
    enterpriseAPI.entities.create({ name, tax_id: taxId }).then(() => {
      setName('');
      setTaxId('');
      load();
    });
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Supervised Entities
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage corporate entities under audit supervision
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search entity or tax ID..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} size="small" />
              <TextField label="Tax ID" value={taxId} onChange={(e) => setTaxId(e.target.value)} size="small" />
              <Button variant="outlined" onClick={load}>
                Search
              </Button>
              <Button variant="contained" onClick={add} disabled={!name}>
                Add Entity
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Entity</TableCell>
                <TableCell>Tax ID</TableCell>
                <TableCell align="right">Balance (USD)</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entities.map((e) => (
                <TableRow
                  key={e.id}
                  sx={{ bgcolor: e.status === 'flagged' ? 'error.light' : undefined }}
                >
                  <TableCell>
                    <Typography fontWeight={600}>{e.name}</Typography>
                  </TableCell>
                  <TableCell>{e.tax_id || '—'}</TableCell>
                  <TableCell align="right">
                    ${Number(e.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <StatusDot
                      status={e.status === 'active' ? 'cleared' : e.status}
                      label={statusLabel[e.status] || e.status}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AdminEntitiesPage;
