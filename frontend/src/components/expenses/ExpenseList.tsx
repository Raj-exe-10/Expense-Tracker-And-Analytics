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
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Tooltip,
  Avatar,
  AvatarGroup,
  Menu,
  ListItemIcon,
  ListItemText,
  Alert,
} from '@mui/material';
import {
  Edit,
  Delete,
  MoreVert,
  FilterList,
  Sort,
  AttachMoney,
  Group,
  Person,
  CheckCircle,
  Cancel,
  ContentCopy,
  Share,
  Comment,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchExpenses, deleteExpense } from '../../store/slices/expenseSlice';

interface ExpenseListProps {
  groupId?: string;
  expenses?: any[];
  currentGroupFilter?: string | null;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ groupId, currentGroupFilter, expenses: propsExpenses }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { expenses: storeExpenses, loading } = useAppSelector((state) => state.expenses);
  const { groups } = useAppSelector((state) => state.groups);
  
  // Use expenses from props if provided, otherwise from store
  const expenses = propsExpenses || storeExpenses || [];
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  useEffect(() => {
    // Fetch expenses with filters
    dispatch(fetchExpenses({
      filters: {
        group_id: groupId,
        search: searchTerm,
        category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
        is_settled: statusFilter !== 'all' ? statusFilter === 'settled' : undefined,
      }
    }));
  }, [dispatch, groupId, searchTerm, categoryFilter, statusFilter]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, expense: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedExpense(expense);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedExpense(null);
  };

  const handleEdit = () => {
    if (selectedExpense) {
      navigate(`/expenses/edit/${selectedExpense.id}`);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedExpense) {
      await dispatch(deleteExpense(selectedExpense.id));
    }
    handleMenuClose();
  };

  const handleDuplicate = () => {
    if (selectedExpense) {
      navigate('/expenses/add', { state: { duplicate: selectedExpense } });
    }
    handleMenuClose();
  };

  const handleSplit = () => {
    if (selectedExpense) {
      navigate(`/expenses/${selectedExpense.id}/split`);
    }
    handleMenuClose();
  };

  const handleComments = () => {
    if (selectedExpense) {
      navigate(`/expenses/${selectedExpense.id}/comments`);
    }
    handleMenuClose();
  };

  const handleRowClick = (expense: any) => {
    navigate(`/expenses/${expense.id}`);
  };

  // Sort expenses
  const sortedExpenses = [...expenses].sort((a, b) => {
    let compareValue = 0;
    
    switch (sortBy) {
      case 'date':
        compareValue = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'amount':
        compareValue = a.amount - b.amount;
        break;
      case 'category':
        compareValue = a.category?.name.localeCompare(b.category?.name || '') || 0;
        break;
      case 'description':
        compareValue = a.description.localeCompare(b.description);
        break;
      default:
        compareValue = 0;
    }
    
    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  // Paginate expenses
  const paginatedExpenses = sortedExpenses.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Food': 'error',
      'Transportation': 'info',
      'Entertainment': 'secondary',
      'Shopping': 'warning',
      'Bills': 'primary',
      'Healthcare': 'success',
    };
    return colors[category] || 'default';
  };

  // Get group name for display when filtering
  const currentGroup = currentGroupFilter ? 
    groups.find((g: any) => g.id === currentGroupFilter) : null;

  return (
    <Card>
      <CardContent>
        {/* Display group name if filtering by group */}
        {currentGroup && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Showing expenses for group: <strong>{currentGroup.name}</strong>
          </Alert>
        )}
        
        {/* Filters */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="1">Food</MenuItem>
              <MenuItem value="2">Transportation</MenuItem>
              <MenuItem value="3">Entertainment</MenuItem>
              <MenuItem value="4">Shopping</MenuItem>
              <MenuItem value="5">Bills</MenuItem>
              <MenuItem value="6">Healthcare</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="settled">Settled</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="amount">Amount</MenuItem>
              <MenuItem value="category">Category</MenuItem>
              <MenuItem value="description">Description</MenuItem>
            </Select>
          </FormControl>
          
          <IconButton
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            size="small"
          >
            <Sort />
          </IconButton>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Paid By</TableCell>
                <TableCell>Shared With</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedExpenses.map((expense) => (
                <TableRow
                  key={expense.id}
                  hover
                  onClick={() => handleRowClick(expense)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    {format(new Date(expense.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{expense.description}</Typography>
                      {expense.notes && (
                        <Typography variant="caption" color="text.secondary">
                          {expense.notes}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {expense.category && (
                      <Chip
                        label={expense.category.name}
                        size="small"
                        color={getCategoryColor(expense.category.name) as any}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      ${expense.amount.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 24, height: 24 }}>
                        {expense.created_by?.first_name?.[0]}
                      </Avatar>
                      <Typography variant="body2">
                        {expense.created_by?.first_name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {expense.group ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Group fontSize="small" />
                        <Typography variant="body2">{expense.group.name}</Typography>
                      </Box>
                    ) : expense.shares && expense.shares.length > 0 ? (
                      <AvatarGroup max={3} sx={{ justifyContent: 'flex-start' }}>
                        {expense.shares.map((share: any) => (
                          <Avatar
                            key={share.user.id}
                            sx={{ width: 24, height: 24 }}
                            title={share.user.first_name}
                          >
                            {share.user.first_name?.[0]}
                          </Avatar>
                        ))}
                      </AvatarGroup>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Personal
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {expense.is_settled ? (
                      <Chip
                        icon={<CheckCircle />}
                        label="Settled"
                        size="small"
                        color="success"
                      />
                    ) : (
                      <Chip
                        icon={<Cancel />}
                        label="Pending"
                        size="small"
                        color="warning"
                      />
                    )}
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, expense)}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              
              {paginatedExpenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" py={4}>
                      No expenses found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={sortedExpenses.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDuplicate}>
            <ListItemIcon>
              <ContentCopy fontSize="small" />
            </ListItemIcon>
            <ListItemText>Duplicate</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleSplit}>
            <ListItemIcon>
              <Share fontSize="small" />
            </ListItemIcon>
            <ListItemText>Split Options</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleComments}>
            <ListItemIcon>
              <Comment fontSize="small" />
            </ListItemIcon>
            <ListItemText>Comments</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

export default ExpenseList;
