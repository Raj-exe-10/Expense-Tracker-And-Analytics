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
import { fetchCategories } from '../../store/slices/coreSlice';
import { fetchGroups as fetchGroupsAction } from '../../store/slices/groupSlice';
import { formatAmount, toNumber } from '../../utils/formatting';
import { useAppContext } from '../../context/AppContext';

interface ExpenseListProps {
  groupId?: string;
  expenses?: any[];
  currentGroupFilter?: string | null;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ groupId, currentGroupFilter, expenses: propsExpenses }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { expenses: storeExpenses, loading } = useAppSelector((state) => state.expenses);
  const { groups: reduxGroups } = useAppSelector((state) => state.groups);
  const { categories } = useAppSelector((state) => state.core);
  
  // Use AppContext groups for consistency with Groups page
  const { groups: contextGroups } = useAppContext();
  
  // Use expenses from props if provided and not empty, otherwise from store
  // If propsExpenses is explicitly undefined, use store expenses
  const expenses = (propsExpenses !== undefined && propsExpenses !== null) 
    ? propsExpenses 
    : (storeExpenses || []);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  // Load categories for filter dropdowns
  useEffect(() => {
    dispatch(fetchCategories());
    // Also try to fetch from API in case backend has data
    dispatch(fetchGroupsAction());
  }, [dispatch]);

  const categoriesArray = Array.isArray(categories) ? categories : [];
  // Use AppContext groups (same source as Groups page) for consistency
  const groupsArray = Array.isArray(contextGroups) ? contextGroups : [];

  // Sync group filter when parent passes currentGroupFilter (e.g. from Groups page)
  useEffect(() => {
    if (currentGroupFilter) setGroupFilter(currentGroupFilter);
  }, [currentGroupFilter]);

  // Build flat query params for backend (backend expects top-level params; omit undefined/empty)
  useEffect(() => {
    const params: Record<string, string> = {};
    const effectiveGroupId = groupId || currentGroupFilter || (groupFilter !== 'all' ? groupFilter : undefined);
    if (effectiveGroupId) params.group_id = String(effectiveGroupId);
    const search = searchTerm.trim();
    if (search) params.search = search;
    if (categoryFilter !== 'all') params.category_id = categoryFilter;
    if (statusFilter === 'settled') params.is_settled = 'true';
    if (statusFilter === 'pending') params.is_settled = 'false';

    dispatch(fetchExpenses(params));
  }, [dispatch, groupId, currentGroupFilter, searchTerm, categoryFilter, statusFilter, groupFilter]);

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
        const dateA = a.date || a.expense_date;
        const dateB = b.date || b.expense_date;
        compareValue = new Date(dateA).getTime() - new Date(dateB).getTime();
        break;
      case 'amount':
        compareValue = toNumber(a.amount) - toNumber(b.amount);
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

  // Get group name for display when filtering (use contextGroups for consistency)
  const currentGroup = currentGroupFilter ? 
    contextGroups.find((g: any) => g.id === currentGroupFilter) : null;

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
              {categoriesArray.map((cat: any) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Group</InputLabel>
            <Select
              value={groupFilter}
              label="Group"
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <MenuItem value="all">All Groups</MenuItem>
              {groupsArray.map((g: any) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name}
                </MenuItem>
              ))}
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
          
          <Tooltip title={sortOrder === 'desc' ? 'Descending (click for ascending)' : 'Ascending (click for descending)'}>
            <IconButton
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              size="small"
            >
              <Sort />
            </IconButton>
          </Tooltip>
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
                    {format(new Date(expense.date || expense.expense_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{expense.title || expense.description}</Typography>
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
                      ${typeof expense.amount === 'number' 
                        ? expense.amount.toFixed(2) 
                        : parseFloat(expense.amount || '0').toFixed(2)}
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
