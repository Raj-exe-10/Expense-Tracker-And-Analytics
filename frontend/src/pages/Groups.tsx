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
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  InputAdornment,
  CircularProgress,
  Divider,
  Tab,
  Tabs,
  Paper,
  Badge,
  Autocomplete,
  Switch,
  FormControlLabel,
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
  Search,
  AdminPanelSettings,
  Person,
  Link as LinkIcon,
  Refresh,
  Close,
  CheckCircle,
  Settings,
  History,
  People,
  Assessment,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
  fetchGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  fetchGroupMembers,
  fetchGroupActivities,
  searchUsers,
  addMember,
  removeMember,
  changeMemberRole,
  getInviteLink,
  leaveGroup,
  clearSearchedUsers,
  clearError,
} from '../store/slices/groupSlice';
import { fetchCurrencies } from '../store/slices/coreSlice';

// Types
interface SearchedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  is_member?: boolean;
}

interface GroupMember {
  id: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  role: 'admin' | 'member' | 'viewer';
  status: string;
  is_active: boolean;
  joined_at: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  group_type: string;
  currency: number;
  currency_details?: {
    id: number;
    code: string;
    symbol: string;
    name: string;
  };
  invite_code: string;
  member_count: number;
  total_expenses: string;
  user_role: 'admin' | 'member' | 'viewer' | null;
  user_balance: string;
  recent_activity: any[];
  created_at: string;
}

const GROUP_TYPES = [
  { value: 'personal', label: 'Personal' },
  { value: 'trip', label: 'Trip' },
  { value: 'home', label: 'Home/Apartment' },
  { value: 'couple', label: 'Couple' },
  { value: 'project', label: 'Project' },
  { value: 'other', label: 'Other' },
];

const Groups: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Redux state
  const { 
    groups, 
    currentGroupMembers, 
    currentGroupActivities,
    searchedUsers,
    inviteLink,
    loading, 
    membersLoading,
    error 
  } = useAppSelector((state) => state.groups);
  const { currencies } = useAppSelector((state) => state.core);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  
  // Local state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [manageTab, setManageTab] = useState(0);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<SearchedUser[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    group_type: 'other',
    currency: 1,
    is_private: false,
  });

  // Fetch groups and currencies on mount
  useEffect(() => {
    dispatch(fetchGroups());
    dispatch(fetchCurrencies());
  }, [dispatch]);

  // Debounced user search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearchQuery.length >= 2) {
        dispatch(searchUsers({ 
          query: userSearchQuery, 
          groupId: selectedGroup?.id 
        }));
      } else {
        dispatch(clearSearchedUsers());
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery, dispatch, selectedGroup?.id]);

  // Handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, group: Group) => {
    setAnchorEl(event.currentTarget);
    setSelectedGroup(group);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Create group
  const handleCreateGroup = async () => {
    if (!formData.name.trim()) {
      showSnackbar('Group name is required', 'error');
      return;
    }
    
    if (selectedMembers.length < 1) {
      showSnackbar('Please add at least one member to the group', 'error');
      return;
    }

    try {
      const result = await dispatch(createGroup({
        name: formData.name,
        description: formData.description,
        group_type: formData.group_type,
        currency: formData.currency,
        is_private: formData.is_private,
      })).unwrap();
      
      // Add selected members to the group
      for (const member of selectedMembers) {
        await dispatch(addMember({
          groupId: result.id,
          userId: member.id,
          role: 'member',
        }));
      }
      
      showSnackbar('Group created successfully!');
      setCreateDialogOpen(false);
      resetForm();
      dispatch(fetchGroups());
    } catch (err: any) {
      showSnackbar(err || 'Failed to create group', 'error');
    }
  };

  // Update group
  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;
    
    try {
      await dispatch(updateGroup({
        id: selectedGroup.id,
        data: {
          name: formData.name,
          description: formData.description,
          group_type: formData.group_type,
        },
      })).unwrap();
      
      showSnackbar('Group updated successfully!');
      setEditDialogOpen(false);
      dispatch(fetchGroups());
    } catch (err: any) {
      showSnackbar(err || 'Failed to update group', 'error');
    }
  };

  // Delete group
  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    
    try {
      await dispatch(deleteGroup(selectedGroup.id)).unwrap();
      showSnackbar('Group deleted successfully!');
      setDeleteDialogOpen(false);
      setSelectedGroup(null);
    } catch (err: any) {
      showSnackbar(err || 'Failed to delete group', 'error');
    }
  };

  // Leave group
  const handleLeaveGroup = async () => {
    if (!selectedGroup) return;
    
    try {
      await dispatch(leaveGroup(selectedGroup.id)).unwrap();
      showSnackbar('Left group successfully!');
      handleMenuClose();
    } catch (err: any) {
      showSnackbar(err || 'Failed to leave group', 'error');
    }
  };

  // Add member to group
  const handleAddMember = async (user: any) => {
    if (!selectedGroup) return;
    
    try {
      await dispatch(addMember({
        groupId: selectedGroup.id,
        userId: user.id,
        role: 'member',
      })).unwrap();
      
      showSnackbar(`Added ${user.full_name || user.email} to the group`);
      dispatch(fetchGroupMembers(selectedGroup.id));
      setUserSearchQuery('');
      dispatch(clearSearchedUsers());
    } catch (err: any) {
      showSnackbar(err || 'Failed to add member', 'error');
    }
  };

  // Remove member
  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!selectedGroup) return;
    
    try {
      await dispatch(removeMember({
        groupId: selectedGroup.id,
        userId,
      })).unwrap();
      
      showSnackbar(`Removed ${userName} from the group`);
      dispatch(fetchGroupMembers(selectedGroup.id));
    } catch (err: any) {
      showSnackbar(err || 'Failed to remove member', 'error');
    }
  };

  // Change member role
  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!selectedGroup) return;
    
    try {
      await dispatch(changeMemberRole({
        groupId: selectedGroup.id,
        userId,
        role: newRole,
      })).unwrap();
      
      showSnackbar('Role updated successfully');
      dispatch(fetchGroupMembers(selectedGroup.id));
    } catch (err: any) {
      showSnackbar(err || 'Failed to change role', 'error');
    }
  };

  // Copy invite link
  const handleCopyInviteLink = async () => {
    if (!selectedGroup) return;
    
    try {
      const result = await dispatch(getInviteLink({ groupId: selectedGroup.id })).unwrap();
      const fullUrl = `${window.location.origin}${result.invite_url}`;
      await navigator.clipboard.writeText(fullUrl);
      showSnackbar('Invite link copied to clipboard!');
    } catch (err: any) {
      showSnackbar(err || 'Failed to copy invite link', 'error');
    }
  };

  // Regenerate invite link
  const handleRegenerateLink = async () => {
    if (!selectedGroup) return;
    
    try {
      await dispatch(getInviteLink({ groupId: selectedGroup.id, regenerate: true })).unwrap();
      showSnackbar('Invite link regenerated!');
    } catch (err: any) {
      showSnackbar(err || 'Failed to regenerate link', 'error');
    }
  };

  // Open manage dialog
  const handleOpenManage = (group: Group) => {
    setSelectedGroup(group);
    setManageDialogOpen(true);
    setManageTab(0);
    dispatch(fetchGroupMembers(group.id));
    dispatch(fetchGroupActivities(group.id));
    handleMenuClose();
  };

  // Open edit dialog
  const handleOpenEdit = () => {
    if (!selectedGroup) return;
    setFormData({
      name: selectedGroup.name,
      description: selectedGroup.description || '',
      group_type: selectedGroup.group_type,
      currency: selectedGroup.currency,
      is_private: false,
    });
    setEditDialogOpen(true);
    handleMenuClose();
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      group_type: 'other',
      currency: 1,
      is_private: false,
    });
    setSelectedMembers([]);
    setUserSearchQuery('');
    dispatch(clearSearchedUsers());
  };

  // View expenses
  const handleViewExpenses = (groupId: string) => {
    navigate(`/expenses?group=${groupId}`);
  };

  // Get currency array
  const currenciesArray = Array.isArray(currencies) ? currencies : [];

  // Get user initials
  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  // Format balance
  const formatBalance = (balance: string, symbol?: string) => {
    const num = parseFloat(balance);
    const formatted = Math.abs(num).toFixed(2);
    if (num > 0) {
      return { text: `+${symbol || '$'}${formatted}`, color: 'success.main' };
    } else if (num < 0) {
      return { text: `-${symbol || '$'}${formatted}`, color: 'error.main' };
    }
    return { text: `${symbol || '$'}0.00`, color: 'text.secondary' };
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'primary';
      case 'member': return 'default';
      case 'viewer': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Groups
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your expense sharing groups
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            resetForm();
            setCreateDialogOpen(true);
          }}
          size="large"
        >
          Create Group
        </Button>
      </Box>

      {/* Loading state */}
      {loading && (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      )}

      {/* Groups Grid */}
      {!loading && (
        <Grid container spacing={3}>
          {groups.map((group: Group) => {
            const balance = formatBalance(group.user_balance, group.currency_details?.symbol);
            const isAdmin = group.user_role === 'admin';
            
            return (
              <Grid item xs={12} sm={6} md={4} key={group.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar 
                          sx={{ 
                            bgcolor: 'primary.main', 
                            width: 48, 
                            height: 48,
                          }}
                        >
                          <GroupIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="600" noWrap sx={{ maxWidth: 180 }}>
                            {group.name}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Chip 
                              label={GROUP_TYPES.find(t => t.value === group.group_type)?.label || 'Other'} 
                              size="small" 
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                            {isAdmin && (
                              <Chip 
                                icon={<AdminPanelSettings sx={{ fontSize: 14 }} />}
                                label="Admin" 
                                size="small" 
                                color="primary"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, group)}>
                        <MoreVert />
                      </IconButton>
                    </Box>

                    {/* Description */}
                    {group.description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {group.description}
                      </Typography>
                    )}

                    {/* Members */}
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <People fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                      </Typography>
                    </Box>

                    {/* Stats */}
                    <Box 
                      display="flex" 
                      justifyContent="space-between" 
                      alignItems="center"
                      sx={{ 
                        bgcolor: 'grey.50', 
                        borderRadius: 1, 
                        p: 1.5,
                        mt: 'auto',
                      }}
                    >
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Total Expenses
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="600">
                          {group.currency_details?.symbol || '$'}
                          {parseFloat(group.total_expenses || '0').toFixed(2)}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="caption" color="text.secondary">
                          Your Balance
                        </Typography>
                        <Typography 
                          variant="subtitle1" 
                          fontWeight="600"
                          sx={{ color: balance.color }}
                        >
                          {balance.text}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>

                  <Divider />

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5 }}>
                    <Button
                      size="small"
                      startIcon={<AttachMoney />}
                      onClick={() => handleViewExpenses(group.id)}
                    >
                      View Expenses
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Settings />}
                      onClick={() => handleOpenManage(group)}
                    >
                      Manage
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}

          {/* Empty state */}
          {groups.length === 0 && !loading && (
            <Grid item xs={12}>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                py={8}
              >
                <GroupIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No groups yet
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">
                  Create your first group to start sharing expenses with friends and family
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    resetForm();
                    setCreateDialogOpen(true);
                  }}
                >
                  Create Your First Group
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Group Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleOpenManage(selectedGroup!)}>
          <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
          <ListItemText>Manage Group</ListItemText>
        </MenuItem>
        {selectedGroup?.user_role === 'admin' && (
          <MenuItem onClick={handleOpenEdit}>
            <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
            <ListItemText>Edit Group</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleCopyInviteLink}>
          <ListItemIcon><Share fontSize="small" /></ListItemIcon>
          <ListItemText>Share Invite Link</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLeaveGroup} sx={{ color: 'warning.main' }}>
          <ListItemIcon><ExitToApp fontSize="small" color="warning" /></ListItemIcon>
          <ListItemText>Leave Group</ListItemText>
        </MenuItem>
        {selectedGroup?.user_role === 'admin' && (
          <MenuItem 
            onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Delete Group</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Create Group Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <GroupIcon color="primary" />
            Create New Group
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2.5} pt={1}>
            <TextField
              label="Group Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Roommates, Trip to Paris"
            />
            
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="What's this group for?"
            />
            
            <Box display="flex" gap={2}>
              <FormControl fullWidth>
                <InputLabel>Group Type</InputLabel>
                <Select
                  value={formData.group_type}
                  label="Group Type"
                  onChange={(e) => setFormData({ ...formData, group_type: e.target.value })}
                >
                  {GROUP_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={formData.currency}
                  label="Currency"
                  onChange={(e) => setFormData({ ...formData, currency: Number(e.target.value) })}
                >
                  {currenciesArray.map((currency: any) => (
                    <MenuItem key={currency.id} value={currency.id}>
                      {currency.symbol} - {currency.code}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Divider sx={{ my: 1 }} />
            
            {/* Add Members Section */}
            <Typography variant="subtitle2" fontWeight="600">
              Add Members (minimum 1 required)
            </Typography>
            
            <Autocomplete
              multiple
              options={(searchedUsers as SearchedUser[]).filter(u => !u.is_member)}
              getOptionLabel={(option: SearchedUser) => option.full_name || option.email}
              value={selectedMembers}
              onChange={(_, newValue) => setSelectedMembers(newValue)}
              onInputChange={(_, value) => setUserSearchQuery(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search users by name or email"
                  placeholder="Type to search..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                      {getInitials(option.first_name, option.last_name, option.email)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">{option.full_name || option.email}</Typography>
                      <Typography variant="caption" color="text.secondary">{option.email}</Typography>
                    </Box>
                  </Box>
                </li>
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    avatar={<Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                      {getInitials(option.first_name, option.last_name, option.email)}
                    </Avatar>}
                    label={option.full_name || option.email}
                    {...getTagProps({ index })}
                    size="small"
                  />
                ))
              }
              noOptionsText={userSearchQuery.length < 2 ? "Type at least 2 characters to search" : "No users found"}
            />
            
            {selectedMembers.length === 0 && (
              <Alert severity="info" sx={{ mt: -1 }}>
                Search and add at least one member to create the group. You will be added as admin automatically.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateGroup} 
            variant="contained"
            disabled={!formData.name.trim() || selectedMembers.length < 1}
          >
            Create Group
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Group</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2.5} pt={1}>
            <TextField
              label="Group Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            
            <FormControl fullWidth>
              <InputLabel>Group Type</InputLabel>
              <Select
                value={formData.group_type}
                label="Group Type"
                onChange={(e) => setFormData({ ...formData, group_type: e.target.value })}
              >
                {GROUP_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateGroup} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Group Dialog */}
      <Dialog 
        open={manageDialogOpen} 
        onClose={() => setManageDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <GroupIcon color="primary" />
              {selectedGroup?.name}
              {selectedGroup?.user_role === 'admin' && (
                <Chip 
                  icon={<AdminPanelSettings sx={{ fontSize: 14 }} />}
                  label="Admin" 
                  size="small" 
                  color="primary"
                />
              )}
            </Box>
            <IconButton onClick={() => setManageDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Tabs 
            value={manageTab} 
            onChange={(_, v) => setManageTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            <Tab icon={<People />} label="Members" iconPosition="start" />
            <Tab icon={<History />} label="Activity" iconPosition="start" />
            <Tab icon={<LinkIcon />} label="Invite Link" iconPosition="start" />
          </Tabs>

          {/* Members Tab */}
          {manageTab === 0 && (
            <Box p={3}>
              {/* Add Member Section (Admin only) */}
              {selectedGroup?.user_role === 'admin' && (
                <Box mb={3}>
                  <Typography variant="subtitle2" fontWeight="600" mb={1}>
                    Add New Member
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Search users by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                    size="small"
                  />
                  {searchedUsers.length > 0 && (
                    <Paper sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                      <List dense>
                        {(searchedUsers as SearchedUser[]).map((user) => (
                          <ListItem
                            key={user.id}
                            button
                            onClick={() => !user.is_member && handleAddMember(user)}
                            disabled={user.is_member}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                                {getInitials(user.first_name, user.last_name, user.email)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={user.full_name || user.email}
                              secondary={user.email}
                            />
                            {user.is_member ? (
                              <Chip label="Already member" size="small" />
                            ) : (
                              <Button size="small" startIcon={<PersonAdd />}>
                                Add
                              </Button>
                            )}
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}
                </Box>
              )}

              <Divider sx={{ mb: 2 }} />

              {/* Members List */}
              <Typography variant="subtitle2" fontWeight="600" mb={1}>
                Current Members ({currentGroupMembers.length})
              </Typography>
              
              {membersLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress size={32} />
                </Box>
              ) : (
                <List>
                  {currentGroupMembers.map((member) => {
                    const isCurrentUser = String(member.user.id) === String(currentUser?.id);
                    const canManage = selectedGroup?.user_role === 'admin' && !isCurrentUser;
                    
                    return (
                      <ListItem
                        key={member.id}
                        sx={{ 
                          bgcolor: isCurrentUser ? 'action.selected' : 'transparent',
                          borderRadius: 1,
                          mb: 0.5,
                        }}
                      >
                        <ListItemAvatar>
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            badgeContent={
                              member.role === 'admin' ? (
                                <AdminPanelSettings 
                                  sx={{ 
                                    fontSize: 16, 
                                    bgcolor: 'primary.main', 
                                    borderRadius: '50%',
                                    color: 'white',
                                    p: 0.2,
                                  }} 
                                />
                              ) : null
                            }
                          >
                            <Avatar>
                              {getInitials(member.user.first_name, member.user.last_name, member.user.email)}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              {`${member.user.first_name} ${member.user.last_name}`.trim() || member.user.email}
                              {isCurrentUser && (
                                <Chip label="You" size="small" variant="outlined" sx={{ height: 20 }} />
                              )}
                            </Box>
                          }
                          secondary={member.user.email}
                        />
                        <ListItemSecondaryAction>
                          <Box display="flex" alignItems="center" gap={1}>
                            {canManage ? (
                              <>
                                <FormControl size="small" sx={{ minWidth: 100 }}>
                                  <Select
                                    value={member.role}
                                    onChange={(e) => handleChangeRole(member.user.id, e.target.value)}
                                    size="small"
                                  >
                                    <MenuItem value="admin">Admin</MenuItem>
                                    <MenuItem value="member">Member</MenuItem>
                                  </Select>
                                </FormControl>
                                <Tooltip title="Remove member">
                                  <IconButton 
                                    edge="end" 
                                    onClick={() => handleRemoveMember(
                                      member.user.id,
                                      `${member.user.first_name} ${member.user.last_name}`.trim() || member.user.email
                                    )}
                                    color="error"
                                    size="small"
                                  >
                                    <PersonRemove />
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : (
                              <Chip 
                                label={member.role.charAt(0).toUpperCase() + member.role.slice(1)} 
                                size="small"
                                color={getRoleBadgeColor(member.role) as any}
                              />
                            )}
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Box>
          )}

          {/* Activity Tab */}
          {manageTab === 1 && (
            <Box p={3}>
              <Typography variant="subtitle2" fontWeight="600" mb={2}>
                Recent Activity
              </Typography>
              {currentGroupActivities.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  No activity yet
                </Typography>
              ) : (
                <List>
                  {currentGroupActivities.map((activity) => (
                    <ListItem key={activity.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                          {activity.activity_type.includes('member') ? <Person /> : <History />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.description}
                        secondary={new Date(activity.created_at).toLocaleString()}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Invite Link Tab */}
          {manageTab === 2 && (
            <Box p={3}>
              <Typography variant="subtitle2" fontWeight="600" mb={2}>
                Share Invite Link
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Anyone with this link can join the group. Share it with people you want to invite.
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <TextField
                    fullWidth
                    value={`${window.location.origin}/groups/join/${selectedGroup?.invite_code || ''}`}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                  <Button
                    variant="contained"
                    startIcon={<ContentCopy />}
                    onClick={handleCopyInviteLink}
                  >
                    Copy
                  </Button>
                </Box>
              </Paper>
              
              {selectedGroup?.user_role === 'admin' && (
                <Button
                  startIcon={<Refresh />}
                  onClick={handleRegenerateLink}
                  color="warning"
                >
                  Regenerate Link
                </Button>
              )}
              
              <Alert severity="info" sx={{ mt: 2 }}>
                When someone joins using this link, they'll be added as a member. Admins can change their role later.
              </Alert>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Group?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedGroup?.name}"? This action cannot be undone.
            All expenses and data associated with this group will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteGroup} color="error" variant="contained">
            Delete Group
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Groups;
