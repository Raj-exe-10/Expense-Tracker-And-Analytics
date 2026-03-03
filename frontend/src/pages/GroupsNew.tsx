import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  AvatarGroup,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  InputAdornment,
  CircularProgress,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add,
  Group as GroupIcon,
  MoreVert,
  PersonAdd,
  AttachMoney,
  Edit,
  Delete,
  Share,
  ExitToApp,
  ContentCopy,
  PersonRemove,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
  fetchGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  fetchGroupMembers,
  searchUsers,
  addMember,
  removeMember,
  leaveGroup,
  getInviteLink,
  clearSearchedUsers,
  clearInviteLink,
} from '../store/slices/groupSlice';
import { fetchCurrencies } from '../store/slices/coreSlice';

const Groups: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    groups,
    currentGroupMembers,
    searchedUsers,
    inviteLink,
    loading,
    membersLoading,
    error,
  } = useAppSelector((state) => state.groups);

  const { currencies } = useAppSelector((state) => state.core);
  const currenciesArray = Array.isArray(currencies) ? currencies : [];

  const [openDialog, setOpenDialog] = useState(false);
  const [membersDialog, setMembersDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuGroupId, setMenuGroupId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [formData, setFormData] = useState({ name: '', description: '', currency: '' });
  const [manageMembersGroup, setManageMembersGroup] = useState<any>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchGroups());
    dispatch(fetchCurrencies());
  }, [dispatch]);

  useEffect(() => {
    if (currenciesArray.length > 0 && !formData.currency) {
      const usd = currenciesArray.find((c: any) => c.code === 'USD');
      const defaultCurrency = usd || currenciesArray[0];
      if (defaultCurrency) {
        setFormData(prev => ({ ...prev, currency: String(defaultCurrency.id) }));
      }
    }
  }, [currenciesArray, formData.currency]);

  useEffect(() => {
    if (error) {
      setSnackbar({ open: true, message: error, severity: 'error' });
    }
  }, [error]);

  const handleCreateGroup = () => {
    const usd = currenciesArray.find((c: any) => c.code === 'USD');
    const defaultCurrency = usd || currenciesArray[0];
    setFormData({ name: '', description: '', currency: defaultCurrency ? String(defaultCurrency.id) : '' });
    setSelectedGroup(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedGroup(null);
    const usd = currenciesArray.find((c: any) => c.code === 'USD');
    const defaultCurrency = usd || currenciesArray[0];
    setFormData({ name: '', description: '', currency: defaultCurrency ? String(defaultCurrency.id) : '' });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    const currencyId = formData.currency ? parseInt(formData.currency, 10) : 1;

    try {
      if (selectedGroup) {
        await dispatch(
          updateGroup({ id: selectedGroup.id, data: { name: formData.name, description: formData.description, currency: currencyId } as any })
        ).unwrap();
        setSnackbar({ open: true, message: 'Group updated successfully!', severity: 'success' });
      } else {
        await dispatch(
          createGroup({ name: formData.name, description: formData.description, currency: currencyId })
        ).unwrap();
        setSnackbar({ open: true, message: 'Group created successfully!', severity: 'success' });
      }
      handleCloseDialog();
    } catch {
      setSnackbar({ open: true, message: 'Operation failed. Please try again.', severity: 'error' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, groupId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuGroupId(groupId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuGroupId(null);
  };

  const handleViewExpenses = (groupId: string) => {
    navigate(`/expenses?group_id=${groupId}`);
  };

  const handleInvite = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (group) {
      setManageMembersGroup(group);
      dispatch(fetchGroupMembers(groupId));
      dispatch(getInviteLink({ groupId }));
      setMembersDialog(true);
      handleMenuClose();
    }
  };

  const handleEditGroup = (groupId: string) => {
    handleMenuClose();
    const group = groups.find((g) => g.id === groupId);
    if (group) {
      setSelectedGroup(group);
      setFormData({
        name: group.name,
        description: group.description || '',
        currency: group.currency ? String(group.currency) : '',
      });
      setOpenDialog(true);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    handleMenuClose();
    try {
      await dispatch(deleteGroup(groupId)).unwrap();
      setSnackbar({ open: true, message: 'Group deleted', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete group', severity: 'error' });
    }
  };

  const handleExitGroup = async (groupId: string) => {
    handleMenuClose();
    try {
      await dispatch(leaveGroup(groupId)).unwrap();
      setSnackbar({ open: true, message: 'You have left the group', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to leave group', severity: 'error' });
    }
  };

  const handleCloseMembersDialog = () => {
    setMembersDialog(false);
    setSelectedUserToAdd(null);
    setUserSearchQuery('');
    dispatch(clearSearchedUsers());
    dispatch(clearInviteLink());
  };

  const handleUserSearch = useCallback(
    (query: string) => {
      setUserSearchQuery(query);
      if (query.length >= 2 && manageMembersGroup) {
        dispatch(searchUsers({ query, groupId: manageMembersGroup.id }));
      } else {
        dispatch(clearSearchedUsers());
      }
    },
    [dispatch, manageMembersGroup],
  );

  const handleAddMember = async () => {
    if (!manageMembersGroup || !selectedUserToAdd) return;
    try {
      await dispatch(addMember({ groupId: manageMembersGroup.id, userId: selectedUserToAdd.id })).unwrap();
      setSnackbar({ open: true, message: 'Member added successfully!', severity: 'success' });
      setSelectedUserToAdd(null);
      setUserSearchQuery('');
      dispatch(clearSearchedUsers());
      dispatch(fetchGroupMembers(manageMembersGroup.id));
    } catch {
      setSnackbar({ open: true, message: 'Failed to add member', severity: 'error' });
    }
  };

  const handleRemoveMember = async (groupId: string, userId: string) => {
    try {
      await dispatch(removeMember({ groupId, userId })).unwrap();
      setSnackbar({ open: true, message: 'Member removed from group', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to remove member', severity: 'error' });
    }
  };

  const handleCopyInviteLink = () => {
    const link = inviteLink || `${window.location.origin}/join-group/${manageMembersGroup?.invite_code}`;
    navigator.clipboard.writeText(link);
    setSnackbar({ open: true, message: 'Invite link copied to clipboard!', severity: 'success' });
  };

  if (loading && groups.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Groups</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleCreateGroup} size="large">
          Create Group
        </Button>
      </Box>

      <Grid container spacing={3}>
        {groups.map((group) => (
          <Grid item xs={12} sm={6} md={4} key={group.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <GroupIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="div">
                        {group.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {group.description}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton size="small" onClick={(e) => handleMenuOpen(e, group.id)}>
                    <MoreVert />
                  </IconButton>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Members ({group.member_count || 0})
                  </Typography>
                  <AvatarGroup max={4} sx={{ justifyContent: 'flex-start' }}>
                    <Tooltip title="Add members">
                      <Avatar
                        sx={{ width: 32, height: 32, cursor: 'pointer', bgcolor: 'grey.400' }}
                        onClick={() => handleInvite(group.id)}
                      >
                        <Add fontSize="small" />
                      </Avatar>
                    </Tooltip>
                  </AvatarGroup>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Expenses
                    </Typography>
                    <Typography variant="h6">
                      ${parseFloat(group.total_expenses || '0').toFixed(2)}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="body2" color="text.secondary">
                      Your Balance
                    </Typography>
                    <Typography
                      variant="h6"
                      color={parseFloat(group.user_balance || '0') >= 0 ? 'success.main' : 'error.main'}
                    >
                      {parseFloat(group.user_balance || '0') >= 0 ? '+' : ''}
                      ${Math.abs(parseFloat(group.user_balance || '0')).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<AttachMoney />} onClick={() => handleViewExpenses(group.id)}>
                  View Expenses
                </Button>
                <Button size="small" startIcon={<PersonAdd />} onClick={() => handleInvite(group.id)}>
                  Manage Members
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {groups.length === 0 && (
          <Grid item xs={12}>
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8}>
              <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No groups yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Create your first group to start sharing expenses
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={handleCreateGroup}>
                Create Your First Group
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Create / Edit Group Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedGroup ? 'Edit Group' : 'Create New Group'}</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <TextField
              fullWidth
              label="Group Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={3}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Currency</InputLabel>
              <Select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value as string }))}
                label="Currency"
              >
                {currenciesArray.map((currency: any) => (
                  <MenuItem key={currency.id} value={String(currency.id)}>
                    {currency.symbol} {currency.code} — {currency.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {selectedGroup ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Members Dialog */}
      <Dialog open={membersDialog} onClose={handleCloseMembersDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Members - {manageMembersGroup?.name}</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <Typography variant="subtitle1" gutterBottom>
              Current Members
            </Typography>
            {membersLoading ? (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <List>
                {currentGroupMembers.map((member) => (
                  <ListItem key={member.id}>
                    <ListItemAvatar>
                      <Avatar>
                        {(member.user.first_name?.[0] || member.user.email?.[0] || '?').toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.user.full_name || `${member.user.first_name} ${member.user.last_name}`}
                      secondary={`${member.user.email} · ${member.role}`}
                    />
                    <ListItemSecondaryAction>
                      {member.role !== 'admin' && (
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveMember(manageMembersGroup!.id, member.user.id)}
                          title="Remove member"
                        >
                          <PersonRemove />
                        </IconButton>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}

            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Add New Members
            </Typography>
            <Box display="flex" gap={1} alignItems="flex-start">
              <Autocomplete
                fullWidth
                options={searchedUsers}
                getOptionLabel={(option) =>
                  option.full_name || `${option.first_name} ${option.last_name}` || option.email
                }
                value={selectedUserToAdd}
                onChange={(_e, value) => setSelectedUserToAdd(value)}
                inputValue={userSearchQuery}
                onInputChange={(_e, value) => handleUserSearch(value)}
                noOptionsText={userSearchQuery.length < 2 ? 'Type to search...' : 'No users found'}
                renderInput={(params) => (
                  <TextField {...params} label="Search users by name or email" size="small" />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 14 }}>
                        {(option.first_name?.[0] || option.email?.[0] || '?').toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={option.full_name || `${option.first_name} ${option.last_name}`}
                      secondary={option.email}
                    />
                  </li>
                )}
              />
              <Button
                variant="contained"
                onClick={handleAddMember}
                disabled={!selectedUserToAdd}
                sx={{ minWidth: 80, mt: '2px' }}
              >
                Add
              </Button>
            </Box>

            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
              Invite Link
            </Typography>
            <TextField
              fullWidth
              value={inviteLink || `${window.location.origin}/join-group/${manageMembersGroup?.invite_code}`}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleCopyInviteLink}>
                      <ContentCopy />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMembersDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Menu for group actions */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleEditGroup(menuGroupId!)}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit Group
        </MenuItem>
        <MenuItem onClick={() => handleDeleteGroup(menuGroupId!)}>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete Group
        </MenuItem>
        <MenuItem onClick={() => handleExitGroup(menuGroupId!)}>
          <ExitToApp fontSize="small" sx={{ mr: 1 }} /> Exit Group
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); handleInvite(menuGroupId!); }}>
          <Share fontSize="small" sx={{ mr: 1 }} /> Share Invite Link
        </MenuItem>
      </Menu>

      {/* FAB for mobile */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16, display: { xs: 'flex', md: 'none' } }}
        onClick={handleCreateGroup}
      >
        <Add />
      </Fab>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Groups;
