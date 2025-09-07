import React, { useState, useEffect } from 'react';
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
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Tooltip,
  InputAdornment,
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
import { useAppContext } from '../context/AppContext';

const Groups: React.FC = () => {
  const navigate = useNavigate();
  const { 
    groups, 
    allMembers, 
    addGroup, 
    updateGroup, 
    deleteGroup, 
    addMemberToGroup, 
    removeMemberFromGroup, 
    setCurrentFilter 
  } = useAppContext();
  
  const [openDialog, setOpenDialog] = useState(false);
  const [membersDialog, setMembersDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuGroupId, setMenuGroupId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    currency_id: 'USD',
    members: [] as any[],
  });
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [inviteLink, setInviteLink] = useState('');
  const [manageMembersGroup, setManageMembersGroup] = useState<any>(null);

  const handleCreateGroup = () => {
    setFormData({ name: '', description: '', currency_id: 'USD', members: [] });
    setSelectedMembers([]);
    setSelectedGroup(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedGroup(null);
    setFormData({ name: '', description: '', currency_id: 'USD', members: [] });
    setSelectedMembers([]);
  };

  const handleSubmit = () => {
    if (formData.name.trim()) {
      const membersToAdd = allMembers.filter(m => selectedMembers.includes(m.id));
      
      if (selectedGroup) {
        // Update existing group
        updateGroup(selectedGroup.id, {
          name: formData.name,
          description: formData.description,
        });
        setSnackbar({ open: true, message: 'Group updated successfully!', severity: 'success' });
      } else {
        // Create new group
        addGroup({
          name: formData.name,
          description: formData.description,
          members: membersToAdd,
          currency_id: formData.currency_id,
        });
        setSnackbar({ open: true, message: 'Group created successfully!', severity: 'success' });
      }
      handleCloseDialog();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleMemberChange = (event: any) => {
    const value = event.target.value;
    setSelectedMembers(typeof value === 'string' ? value.split(',') : value);
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
    const group = groups.find(g => g.id === groupId);
    setCurrentFilter({ type: 'group', value: groupId });
    navigate('/expenses');
  };

  const handleInvite = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setManageMembersGroup(group);
      setMembersDialog(true);
      handleMenuClose();
    }
  };

  const handleEditGroup = (groupId: string) => {
    handleMenuClose();
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setSelectedGroup(group);
      setFormData({ 
        name: group.name, 
        description: group.description, 
        currency_id: group.currency_id || 'USD',
        members: group.members 
      });
      setSelectedMembers(group.members.map(m => m.id));
      setOpenDialog(true);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    handleMenuClose();
    deleteGroup(groupId);
    setSnackbar({ open: true, message: 'Group deleted', severity: 'success' });
  };

  const handleExitGroup = (groupId: string) => {
    handleMenuClose();
    // In a real app, this would remove the current user from the group
    setSnackbar({ open: true, message: 'You have left the group', severity: 'success' });
  };

  const handleAddMembers = () => {
    if (manageMembersGroup) {
      const membersToAdd = allMembers.filter(m => 
        selectedMembers.includes(m.id) && 
        !manageMembersGroup.members.some((gm: any) => gm.id === m.id)
      );
      
      membersToAdd.forEach(member => {
        addMemberToGroup(manageMembersGroup.id, member);
      });
      
      setSnackbar({ open: true, message: 'Members added successfully!', severity: 'success' });
      setMembersDialog(false);
      setSelectedMembers([]);
    }
  };

  const handleRemoveMember = (groupId: string, memberId: string) => {
    removeMemberFromGroup(groupId, memberId);
    setSnackbar({ open: true, message: 'Member removed from group', severity: 'success' });
  };

  const handleCopyInviteLink = () => {
    const link = `${window.location.origin}/join-group/${manageMembersGroup?.id}`;
    navigator.clipboard.writeText(link);
    setInviteLink(link);
    setSnackbar({ open: true, message: 'Invite link copied to clipboard!', severity: 'success' });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Groups</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateGroup}
          size="large"
        >
          Create Group
        </Button>
      </Box>

      <Grid container spacing={3}>
        {groups.map((group: any) => (
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
                  <IconButton 
                    size="small"
                    onClick={(e) => handleMenuOpen(e, group.id)}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Members ({group.members?.length || 0})
                  </Typography>
                  <AvatarGroup max={4} sx={{ justifyContent: 'flex-start' }}>
                    {group.members?.map((member: any) => (
                      <Tooltip key={member.id} title={member.name}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {member.name?.[0]}
                        </Avatar>
                      </Tooltip>
                    ))}
                    <Tooltip title="Add members">
                      <Avatar 
                        sx={{ width: 32, height: 32, cursor: 'pointer', bgcolor: 'grey.400' }}
                        onClick={() => {
                          setManageMembersGroup(group);
                          setMembersDialog(true);
                        }}
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
                      ${group.totalExpenses?.toFixed(2) || '0.00'}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="body2" color="text.secondary">
                      Your Balance
                    </Typography>
                    <Typography
                      variant="h6"
                      color={group.balance >= 0 ? 'success.main' : 'error.main'}
                    >
                      {group.balance >= 0 ? '+' : ''}${Math.abs(group.balance || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  startIcon={<AttachMoney />}
                  onClick={() => handleViewExpenses(group.id)}
                >
                  View Expenses
                </Button>
                <Button 
                  size="small" 
                  startIcon={<PersonAdd />}
                  onClick={() => handleInvite(group.id)}
                >
                  Manage Members
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {/* Empty state */}
        {groups.length === 0 && (
          <Grid item xs={12}>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={8}
            >
              <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No groups yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Create your first group to start sharing expenses
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateGroup}
              >
                Create Your First Group
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Create/Edit Group Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedGroup ? 'Edit Group' : 'Create New Group'}
        </DialogTitle>
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
            {!selectedGroup && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Select Members</InputLabel>
                <Select
                  multiple
                  value={selectedMembers}
                  onChange={handleMemberChange}
                  input={<OutlinedInput label="Select Members" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const member = allMembers.find(m => m.id === value);
                        return <Chip key={value} label={member?.name} size="small" />;
                      })}
                    </Box>
                  )}
                >
                  {allMembers.map((member) => (
                    <MenuItem key={member.id} value={member.id}>
                      <Checkbox checked={selectedMembers.indexOf(member.id) > -1} />
                      <ListItemText primary={member.name} secondary={member.email} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedGroup ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Members Dialog */}
      <Dialog open={membersDialog} onClose={() => setMembersDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Manage Members - {manageMembersGroup?.name}
        </DialogTitle>
        <DialogContent>
          <Box pt={1}>
            {/* Current Members */}
            <Typography variant="subtitle1" gutterBottom>
              Current Members
            </Typography>
            <List>
              {manageMembersGroup?.members?.map((member: any) => (
                <ListItem key={member.id}>
                  <ListItemAvatar>
                    <Avatar>{member.name[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={member.name} secondary={member.email} />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      onClick={() => handleRemoveMember(manageMembersGroup.id, member.id)}
                      title="Remove member"
                    >
                      <PersonRemove />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            {/* Add New Members */}
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Add New Members
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Select Members to Add</InputLabel>
              <Select
                multiple
                value={selectedMembers}
                onChange={handleMemberChange}
                input={<OutlinedInput label="Select Members to Add" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const member = allMembers.find(m => m.id === value);
                      return <Chip key={value} label={member?.name} size="small" />;
                    })}
                  </Box>
                )}
              >
                {allMembers
                  .filter(member => !manageMembersGroup?.members?.some((m: any) => m.id === member.id))
                  .map((member) => (
                    <MenuItem key={member.id} value={member.id}>
                      <Checkbox checked={selectedMembers.indexOf(member.id) > -1} />
                      <ListItemText primary={member.name} secondary={member.email} />
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {/* Invite Link */}
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Invite Link
            </Typography>
            <TextField
              fullWidth
              value={inviteLink || `${window.location.origin}/join-group/${manageMembersGroup?.id}`}
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
          <Button onClick={() => { setMembersDialog(false); setSelectedMembers([]); }}>
            Close
          </Button>
          {selectedMembers.length > 0 && (
            <Button onClick={handleAddMembers} variant="contained">
              Add Selected Members
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Menu for group actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEditGroup(menuGroupId!)}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit Group
        </MenuItem>
        <MenuItem onClick={() => handleDeleteGroup(menuGroupId!)}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete Group
        </MenuItem>
        <MenuItem onClick={() => handleExitGroup(menuGroupId!)}>
          <ExitToApp fontSize="small" sx={{ mr: 1 }} />
          Exit Group
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); handleInvite(menuGroupId!); }}>
          <Share fontSize="small" sx={{ mr: 1 }} />
          Share Invite Link
        </MenuItem>
      </Menu>

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' },
        }}
        onClick={handleCreateGroup}
      >
        <Add />
      </Fab>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Groups;
