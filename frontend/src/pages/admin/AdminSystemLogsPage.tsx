import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  MenuItem,
  Button,
  Grid,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert,
  Stack,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Refresh, Download } from '@mui/icons-material';
import { systemLogsAPI } from '../../services/api';
import { format } from 'date-fns';
import { appLogger } from '../../utils/appLogger';

const LEVEL_COLORS: Record<string, 'default' | 'info' | 'warning' | 'error' | 'success'> = {
  debug: 'default',
  info: 'info',
  warning: 'warning',
  error: 'error',
  critical: 'error',
};

const CATEGORIES = [
  { value: '', label: 'All categories' },
  { value: 'http', label: 'HTTP' },
  { value: 'auth', label: 'Auth' },
  { value: 'user_activity', label: 'User activity' },
  { value: 'system', label: 'System' },
  { value: 'security', label: 'Security' },
];

const LEVELS = [
  { value: '', label: 'All levels' },
  { value: 'debug', label: 'Debug' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
  { value: 'critical', label: 'Critical' },
];

function LogCard({ row }: { row: any }) {
  return (
    <Card variant="outlined" sx={{ mb: 1.5 }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Typography variant="caption" color="text.secondary">
            {format(new Date(row.created_at), 'MMM d HH:mm:ss')}
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <Chip size="small" label={row.level} color={LEVEL_COLORS[row.level] || 'default'} />
            <Chip size="small" variant="outlined" label={row.category} />
          </Stack>
        </Stack>
        <Typography variant="body2" fontWeight={500} sx={{ mt: 1, wordBreak: 'break-word' }}>
          {row.message}
        </Typography>
        {row.request_path && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            {row.request_method} {row.request_path}
          </Typography>
        )}
        <Stack direction="row" spacing={2} sx={{ mt: 1 }} flexWrap="wrap">
          <Typography variant="caption">User: {row.user_email || '—'}</Typography>
          <Typography variant="caption">Status: {row.status_code ?? '—'}</Typography>
          <Typography variant="caption">Duration: {row.duration_ms != null ? `${row.duration_ms}ms` : '—'}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

const AdminSystemLogsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [hours, setHours] = useState('24');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page: page + 1,
        page_size: rowsPerPage,
        hours,
      };
      if (category) params.category = category;
      if (level) params.level = level;
      if (search.trim()) params.search = search.trim();

      const [logsRes, statsRes] = await Promise.all([
        systemLogsAPI.list(params),
        systemLogsAPI.stats(),
      ]);
      const list = Array.isArray(logsRes) ? logsRes : logsRes.results || [];
      setLogs(list);
      setTotal(logsRes.count ?? list.length);
      setStats(statsRes);
      appLogger.info('admin-logs', `Loaded ${list.length} log entries (total ${logsRes.count ?? list.length})`);
    } catch (err: any) {
      const msg =
        err.response?.status === 403
          ? 'Access denied. Your account needs the enterprise_admin role.'
          : err.response?.data?.detail || err.message || 'Failed to load system logs';
      setError(msg);
      appLogger.error('admin-logs', msg, err.response?.data);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, category, level, hours, search]);

  useEffect(() => {
    load();
  }, [load]);

  const exportCsv = () => {
    const header = ['Time', 'Level', 'Category', 'Message', 'User', 'Path', 'Status', 'Duration ms'];
    const rows = logs.map((l) => [
      l.created_at,
      l.level,
      l.category,
      l.message,
      l.user_email || '',
      l.request_path || '',
      l.status_code ?? '',
      l.duration_ms ?? '',
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.35rem', sm: '2rem' } }}>
            System Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live HTTP, auth, and user activity — also printed in browser &amp; backend consoles
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-end', sm: 'flex-end' }}>
          <Tooltip title="Export current page to CSV">
            <IconButton onClick={exportCsv} disabled={logs.length === 0}>
              <Download />
            </IconButton>
          </Tooltip>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load} disabled={loading} fullWidth={isMobile}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Last 24h events', value: stats.total, color: undefined },
            { label: 'HTTP 4xx', value: stats.http_4xx, color: 'warning.main' },
            { label: 'HTTP 5xx', value: stats.http_5xx, color: 'error.main' },
            { label: 'Slow (>2s)', value: stats.slow_requests, color: undefined },
          ].map((item) => (
            <Grid item xs={6} md={3} key={item.label}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h5" fontWeight={700} color={item.color}>
                  {item.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(0);
              }}
            >
              {CATEGORIES.map((c) => (
                <MenuItem key={c.value || 'all'} value={c.value}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Level"
              value={level}
              onChange={(e) => {
                setLevel(e.target.value);
                setPage(0);
              }}
            >
              {LEVELS.map((l) => (
                <MenuItem key={l.value || 'all'} value={l.value}>
                  {l.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Time window"
              value={hours}
              onChange={(e) => {
                setHours(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="1">Last hour</MenuItem>
              <MenuItem value="6">Last 6 hours</MenuItem>
              <MenuItem value="24">Last 24 hours</MenuItem>
              <MenuItem value="168">Last 7 days</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                fullWidth
                size="small"
                label="Search message, path, or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load()}
              />
              <Button variant="contained" onClick={load} sx={{ minWidth: { sm: 100 }, flexShrink: 0 }}>
                Search
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        <Box>
          {logs.length === 0 ? (
            <Alert severity="info">
              No logs in this window. Use the app or refresh after granting admin access.
            </Alert>
          ) : (
            logs.map((row) => <LogCard key={row.id} row={row} />)
          )}
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            width: '100%',
            maxWidth: '100%',
            overflowX: 'auto',
          }}
        >
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Time</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>ms</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No logs in this window. Use the app to generate activity, then click Refresh.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {format(new Date(row.created_at), 'MMM d HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={row.level} color={LEVEL_COLORS[row.level] || 'default'} />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" label={row.category} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                        {row.message}
                      </Typography>
                      {row.request_path && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {row.request_method} {row.request_path}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.user_email || '—'}</TableCell>
                    <TableCell>{row.status_code ?? '—'}</TableCell>
                    <TableCell>{row.duration_ms ?? '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </TableContainer>
      )}
    </Box>
  );
};

export default AdminSystemLogsPage;
