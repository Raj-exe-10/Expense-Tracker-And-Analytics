import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Add, Download } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchExpenses } from '../../store/slices/expenseSlice';
import { fetchCategories } from '../../store/slices/coreSlice';
import { format } from 'date-fns';
import { formatAmount } from '../../utils/formatting';
import { StatusDot } from '../../components/admin/StatusDot';

const AdminLedgerPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { expenses, loading } = useAppSelector((state) => state.expenses);
  const { categories } = useAppSelector((state) => state.core);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchExpenses({}));
    dispatch(fetchCategories());
  }, [dispatch]);

  const filtered = (expenses || []).filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      e.title?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      String(e.id).includes(q);
    const matchCat = categoryFilter === 'all' || e.category?.id === categoryFilter;
    const expenseStatus = (e as { status?: string }).status || 'verified';
    const matchStatus = statusFilter === 'all' || expenseStatus === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Global Ledger Query
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Search and filter transaction ledger entries
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search entity, ID, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/app/add')}
            >
              New Entry
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                label="Category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {(categories || []).map((c: any) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">Any Status</MenuItem>
                <MenuItem value="verified">Verified</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="flagged">Flagged</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Transaction Ledger
          </Typography>
          <Button startIcon={<Download />} size="small">
            Export
          </Button>
        </Box>
        {loading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.slice(0, 50).map((e) => {
                  const rowStatus = (e as { status?: string }).status || 'verified';
                  return (
                    <TableRow
                      key={e.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/app/expenses/${e.id}`)}
                    >
                      <TableCell>
                        <Typography variant="caption">TX-{String(e.id).slice(0, 6)}</Typography>
                      </TableCell>
                      <TableCell>
                        {e.expense_date ? format(new Date(e.expense_date), 'yyyy-MM-dd') : '-'}
                      </TableCell>
                      <TableCell>{e.title || e.description}</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>
                        - ${formatAmount(e.amount)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={e.category?.name || 'Uncategorized'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <StatusDot status={rowStatus} label={rowStatus} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            Showing 1-{Math.min(filtered.length, 50)} of {filtered.length} entries
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default AdminLedgerPage;
