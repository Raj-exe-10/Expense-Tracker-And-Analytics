import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Typography,
  Button,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Edit,
  Delete,
  MoreVert,
  PlayArrow,
  Pause,
  Add,
  CalendarToday,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { expensesAPI } from '../../services/api';
import { formatAmount } from '../../utils/formatting';

interface RecurringExpense {
  id: string;
  title?: string;
  description: string;
  amount: number;
  frequency: string;
  start_date: string;
  end_date?: string;
  last_generated?: string;
  next_due_date?: string;
  is_active: boolean;
  category?: {
    id: string;
    name: string;
  };
  group?: {
    id: string;
    name: string;
  };
  currency?: {
    code: string;
    symbol: string;
  };
}

const RecurringExpensesList: React.FC = () => {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedExpense, setSelectedExpense] = useState<RecurringExpense | null>(null);

  useEffect(() => {
    loadRecurringExpenses();
  }, []);

  const loadRecurringExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await expensesAPI.getRecurringExpenses();
      setRecurringExpenses(Array.isArray(data) ? data : data.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load recurring expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, expense: RecurringExpense) => {
    setAnchorEl(event.currentTarget);
    setSelectedExpense(expense);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedExpense(null);
  };

  const handleToggleActive = async (expense: RecurringExpense) => {
    try {
      if (expense.is_active) {
        await expensesAPI.pauseRecurringExpense(expense.id);
      } else {
        await expensesAPI.resumeRecurringExpense(expense.id);
      }
      loadRecurringExpenses();
    } catch (err: any) {
      setError(err.message || 'Failed to update recurring expense');
    }
  };

  const handleCreateNext = async (expense: RecurringExpense) => {
    try {
      await expensesAPI.createNextExpense(expense.id);
      handleMenuClose();
      // Optionally show success message
    } catch (err: any) {
      setError(err.message || 'Failed to create next expense');
    }
  };

  const handleDelete = async (expense: RecurringExpense) => {
    if (window.confirm('Are you sure you want to delete this recurring expense?')) {
      try {
        await expensesAPI.deleteRecurringExpense(expense.id);
        handleMenuClose();
        loadRecurringExpenses();
      } catch (err: any) {
        setError(err.message || 'Failed to delete recurring expense');
      }
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
    };
    return labels[frequency] || frequency;
  };

  const paginatedExpenses = recurringExpenses.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading && recurringExpenses.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Loading recurring expenses...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (recurringExpenses.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No recurring expenses found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create a recurring expense to automatically generate expenses on a schedule
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Frequency</TableCell>
              <TableCell>Next Due</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Group</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedExpenses.map((expense) => (
              <TableRow key={expense.id} hover>
                <TableCell>
                  <Typography variant="body2">{expense.title || expense.description}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {expense.currency?.symbol || '$'}
                    {formatAmount(expense.amount)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={getFrequencyLabel(expense.frequency)} size="small" />
                </TableCell>
                <TableCell>
                  {expense.next_due_date ? (
                    <Typography variant="body2">
                      {format(new Date(expense.next_due_date), 'MMM dd, yyyy')}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      N/A
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {expense.category ? (
                    <Chip label={expense.category.name} size="small" />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {expense.group ? (
                    <Typography variant="body2">{expense.group.name}</Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Personal
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={expense.is_active}
                        onChange={() => handleToggleActive(expense)}
                        size="small"
                      />
                    }
                    label={expense.is_active ? 'Active' : 'Paused'}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="More options">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, expense)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={recurringExpenses.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedExpense && handleCreateNext(selectedExpense)}>
          <ListItemIcon>
            <Add fontSize="small" />
          </ListItemIcon>
          <ListItemText>Create Next Expense</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => selectedExpense && handleDelete(selectedExpense)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Delete fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default RecurringExpensesList;
