import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  AvatarGroup,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  AttachMoney,
  CalendarToday,
  Category,
  Group,
  Person,
  Receipt,
  Comment,
  ContentCopy,
  Share,
  MoreVert,
  Send,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
  fetchExpenseById,
  updateExpense,
  deleteExpense,
  setCurrentExpense,
} from '../store/slices/expenseSlice';
import { fetchGroups } from '../store/slices/groupSlice';
import ExpenseForm from '../components/expenses/ExpenseForm';
import { expensesAPI } from '../services/api';
import { formatAmount } from '../utils/formatting';

const ExpenseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { currentExpense, loading, error } = useAppSelector((state) => state.expenses);
  const { groups: storeGroups } = useAppSelector((state) => state.groups);
  // Ensure groups is always an array
  const groups = Array.isArray(storeGroups) ? storeGroups : [];

  const [editMode, setEditMode] = useState(location.pathname.includes('/edit'));
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchExpenseById(id));
      loadComments();
    }
    // Fetch groups if not already loaded
    dispatch(fetchGroups());
    return () => {
      dispatch(setCurrentExpense(null));
    };
  }, [id, dispatch]);

  const loadComments = async () => {
    if (id) {
      try {
        const data = await expensesAPI.getExpenseComments(id);
        setComments(data);
      } catch (error) {
        console.error('Failed to load comments:', error);
      }
    }
  };

  const handleEdit = () => {
    setEditMode(true);
    setMenuAnchor(null);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    if (id) {
      dispatch(fetchExpenseById(id));
    }
  };

  const handleSave = async (expenseData: any) => {
    if (id) {
      await dispatch(updateExpense({ id, data: expenseData }));
      setEditMode(false);
      if (id) {
        dispatch(fetchExpenseById(id));
      }
    }
  };

  const handleDelete = async () => {
    if (id) {
      await dispatch(deleteExpense(id));
      setDeleteDialogOpen(false);
      navigate('/expenses');
    }
  };

  const handleDuplicate = () => {
    if (currentExpense) {
      navigate('/expenses/add', { state: { duplicate: currentExpense } });
    }
    setMenuAnchor(null);
  };

  const handleSettle = async () => {
    if (id) {
      setSettling(true);
      try {
        await expensesAPI.settleExpense(id);
        if (id) {
          dispatch(fetchExpenseById(id));
        }
      } catch (error) {
        console.error('Failed to settle expense:', error);
      } finally {
        setSettling(false);
        setMenuAnchor(null);
      }
    }
  };

  const handleAddComment = async () => {
    if (id && newComment.trim()) {
      try {
        await expensesAPI.addExpenseComment(id, { comment: newComment });
        setNewComment('');
        setCommentDialogOpen(false);
        loadComments();
      } catch (error) {
        console.error('Failed to add comment:', error);
      }
    }
  };

  if (loading && !currentExpense) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !currentExpense) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/expenses')} sx={{ mb: 2 }}>
          Back to Expenses
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!currentExpense) {
    return null;
  }

  if (editMode) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Edit Expense</Typography>
          <Button variant="outlined" onClick={handleCancelEdit}>
            Cancel
          </Button>
        </Box>
        <ExpenseForm
          editMode={true}
          expenseId={id}
          onClose={handleCancelEdit}
          onSuccess={handleSave}
          groups={groups}
        />
      </Box>
    );
  }

  const getCategoryColor = (categoryName?: string) => {
    const colors: { [key: string]: any } = {
      'Food': 'error',
      'Transportation': 'info',
      'Entertainment': 'secondary',
      'Shopping': 'warning',
      'Bills': 'primary',
      'Healthcare': 'success',
    };
    return colors[categoryName || ''] || 'default';
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/expenses')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">Expense Details</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Comment />}
            onClick={() => setCommentDialogOpen(true)}
          >
            Comment
          </Button>
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
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
        {!currentExpense.is_settled && (
          <MenuItem onClick={handleSettle} disabled={settling}>
            <ListItemIcon>
              <CheckCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText>{settling ? 'Settling...' : 'Mark as Settled'}</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => setDeleteDialogOpen(true)} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <Grid container spacing={3}>
        {/* Main Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {currentExpense.title || currentExpense.description}
                  </Typography>
                  {currentExpense.title && currentExpense.description && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {currentExpense.description}
                    </Typography>
                  )}
                  <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                    {currentExpense.category && (
                      <Chip
                        icon={<Category />}
                        label={currentExpense.category.name}
                        color={getCategoryColor(currentExpense.category.name)}
                        size="small"
                      />
                    )}
                    {currentExpense.is_settled ? (
                      <Chip
                        icon={<CheckCircle />}
                        label="Settled"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        icon={<Cancel />}
                        label="Pending"
                        color="warning"
                        size="small"
                      />
                    )}
                  </Box>
                </Box>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  ${currentExpense.amount.toFixed(2)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Expense Information */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <CalendarToday color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Date
                      </Typography>
                      <Typography variant="body1">
                        {(() => {
                          const expenseDate = currentExpense.date || currentExpense.expense_date;
                          return expenseDate ? format(new Date(expenseDate), 'MMMM dd, yyyy') : 'N/A';
                        })()}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Person color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Paid By
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          {currentExpense.created_by?.first_name?.[0]}
                        </Avatar>
                        <Typography variant="body1">
                          {currentExpense.created_by?.first_name}{' '}
                          {currentExpense.created_by?.last_name}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {currentExpense.group && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Group color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Group
                        </Typography>
                        <Typography variant="body1">{currentExpense.group.name}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {currentExpense.currency && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <AttachMoney color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Currency
                        </Typography>
                        <Typography variant="body1">
                          {currentExpense.currency.code}
                          {currentExpense.currency.symbol && ` (${currentExpense.currency.symbol})`}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>

              {currentExpense.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Notes
                    </Typography>
                    <Typography variant="body2">{currentExpense.notes}</Typography>
                  </Box>
                </>
              )}

              {currentExpense.receipt_image && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Receipt
                    </Typography>
                    <Box
                      component="img"
                      src={currentExpense.receipt_image}
                      alt="Receipt"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 400,
                        borderRadius: 1,
                        mt: 1,
                      }}
                    />
                  </Box>
                </>
              )}
            </CardContent>
          </Card>

          {/* Shares Section */}
          {currentExpense.shares && currentExpense.shares.length > 0 && (() => {
            const shares = currentExpense.shares!; // Non-null assertion since we checked above
            return (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Split Details
                  </Typography>
                  <List>
                    {shares.map((share: any, index: number) => (
                      <React.Fragment key={share.user?.id || index}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar>
                              {share.user?.first_name?.[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`${share.user?.first_name} ${share.user?.last_name || ''}`}
                            secondary={
                              share.percentage
                                ? `${share.percentage.toFixed(1)}%`
                                : undefined
                            }
                          />
                          <Typography variant="body1" fontWeight="bold">
                            ${formatAmount(share.amount)}
                          </Typography>
                        </ListItem>
                        {index < shares.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            );
          })()}

          {/* Comments Section */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Comments</Typography>
                <Button
                  size="small"
                  startIcon={<Comment />}
                  onClick={() => setCommentDialogOpen(true)}
                >
                  Add Comment
                </Button>
              </Box>
              {comments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No comments yet
                </Typography>
              ) : (
                <List>
                  {comments.map((comment: any, index: number) => (
                    <React.Fragment key={comment.id || index}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar>
                            {comment.user?.first_name?.[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="subtitle2">
                                {comment.user?.first_name} {comment.user?.last_name || ''}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                              </Typography>
                            </Box>
                          }
                          secondary={comment.comment}
                        />
                      </ListItem>
                      {index < comments.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={handleEdit}
                  fullWidth
                >
                  Edit Expense
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={handleDuplicate}
                  fullWidth
                >
                  Duplicate
                </Button>
                {!currentExpense.is_settled && (
                  <Button
                    variant="outlined"
                    startIcon={<CheckCircle />}
                    onClick={handleSettle}
                    disabled={settling}
                    fullWidth
                  >
                    {settling ? 'Settling...' : 'Mark as Settled'}
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => setDeleteDialogOpen(true)}
                  fullWidth
                >
                  Delete
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Information
              </Typography>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body2">
                  {currentExpense.created_at
                    ? format(new Date(currentExpense.created_at), 'MMM dd, yyyy HH:mm')
                    : 'N/A'}
                </Typography>
              </Box>
              {currentExpense.updated_at && (
                <Box mt={1}>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {currentExpense.updated_at
                      ? format(new Date(currentExpense.updated_at), 'MMM dd, yyyy HH:mm')
                      : 'N/A'}
                  </Typography>
                </Box>
              )}
              {currentExpense.settled_at && (
                <Box mt={1}>
                  <Typography variant="caption" color="text.secondary">
                    Settled At
                  </Typography>
                  <Typography variant="body2">
                    {format(new Date(currentExpense.settled_at), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Expense</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this expense? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Comment"
            fullWidth
            multiline
            rows={4}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddComment} variant="contained" startIcon={<Send />}>
            Post Comment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExpenseDetail;
