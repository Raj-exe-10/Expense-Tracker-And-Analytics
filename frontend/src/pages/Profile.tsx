import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  TextField,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Edit,
  PhotoCamera,
  Email,
  Phone,
  LocationOn,
  Work,
  CalendarToday,
  Save,
  Cancel,
  Person,
  Settings,
  Security,
  Payment,
  History,
} from '@mui/icons-material';
import { useAppSelector } from '../hooks/redux';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [editMode, setEditMode] = useState(false);
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  
  const [profile, setProfile] = useState({
    firstName: user?.first_name || 'John',
    lastName: user?.last_name || 'Doe',
    email: user?.email || 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    occupation: 'Software Engineer',
    bio: 'Passionate about splitting expenses fairly and keeping track of group finances.',
    joinDate: '2024-01-15',
    avatar: user?.avatar || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const stats = {
    totalExpenses: 125,
    activeGroups: 5,
    totalOwed: 450.75,
    totalOwing: 325.50,
    expensesThisMonth: 15,
    settledThisMonth: 8,
  };

  const recentActivity = [
    { id: 1, type: 'expense', description: 'Added expense "Dinner at Restaurant"', date: '2 hours ago', amount: 45.50 },
    { id: 2, type: 'settlement', description: 'Settled with Jane Smith', date: '1 day ago', amount: 125.00 },
    { id: 3, type: 'group', description: 'Joined group "Weekend Trip"', date: '3 days ago' },
    { id: 4, type: 'expense', description: 'Added expense "Grocery Shopping"', date: '5 days ago', amount: 78.25 },
  ];

  const handleEditToggle = () => {
    setEditMode(!editMode);
  };

  const handleSaveProfile = () => {
    // Save profile changes
    setEditMode(false);
    // In real app, would save to backend
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordChange = () => {
    // Validate and save password
    setChangePasswordDialog(false);
    // In real app, would save to backend
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setProfile(prev => ({ ...prev, avatar: e.target?.result as string }));
        }
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Info Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Box position="relative" mb={2}>
                  <Avatar
                    sx={{ width: 120, height: 120 }}
                    src={profile.avatar}
                  >
                    {profile.firstName[0]}{profile.lastName[0]}
                  </Avatar>
                  {editMode && (
                    <>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="avatar-upload"
                        type="file"
                        onChange={handleAvatarUpload}
                      />
                      <label htmlFor="avatar-upload">
                        <IconButton
                          component="span"
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            bgcolor: 'background.paper',
                            boxShadow: 2,
                          }}
                        >
                          <PhotoCamera />
                        </IconButton>
                      </label>
                    </>
                  )}
                </Box>

                {editMode ? (
                  <Box width="100%" mb={2}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={profile.firstName}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      margin="dense"
                    />
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={profile.lastName}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      margin="dense"
                    />
                  </Box>
                ) : (
                  <>
                    <Typography variant="h5">
                      {profile.firstName} {profile.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {profile.email}
                    </Typography>
                  </>
                )}

                <Box display="flex" gap={1} mt={2}>
                  {editMode ? (
                    <>
                      <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSaveProfile}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Cancel />}
                        onClick={handleEditToggle}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={handleEditToggle}
                    >
                      Edit Profile
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Stats
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Total Expenses"
                    secondary={stats.totalExpenses}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Active Groups"
                    secondary={stats.activeGroups}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="You Owe"
                    secondary={`$${stats.totalOwing.toFixed(2)}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Owed to You"
                    secondary={`$${stats.totalOwed.toFixed(2)}`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <ListItem>
                    <ListItemIcon>
                      <Email />
                    </ListItemIcon>
                    {editMode ? (
                      <TextField
                        fullWidth
                        label="Email"
                        value={profile.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                      />
                    ) : (
                      <ListItemText
                        primary="Email"
                        secondary={profile.email}
                      />
                    )}
                  </ListItem>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <ListItem>
                    <ListItemIcon>
                      <Phone />
                    </ListItemIcon>
                    {editMode ? (
                      <TextField
                        fullWidth
                        label="Phone"
                        value={profile.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                      />
                    ) : (
                      <ListItemText
                        primary="Phone"
                        secondary={profile.phone}
                      />
                    )}
                  </ListItem>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <ListItem>
                    <ListItemIcon>
                      <LocationOn />
                    </ListItemIcon>
                    {editMode ? (
                      <TextField
                        fullWidth
                        label="Location"
                        value={profile.location}
                        onChange={(e) => handleProfileChange('location', e.target.value)}
                      />
                    ) : (
                      <ListItemText
                        primary="Location"
                        secondary={profile.location}
                      />
                    )}
                  </ListItem>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <ListItem>
                    <ListItemIcon>
                      <Work />
                    </ListItemIcon>
                    {editMode ? (
                      <TextField
                        fullWidth
                        label="Occupation"
                        value={profile.occupation}
                        onChange={(e) => handleProfileChange('occupation', e.target.value)}
                      />
                    ) : (
                      <ListItemText
                        primary="Occupation"
                        secondary={profile.occupation}
                      />
                    )}
                  </ListItem>
                </Grid>

                <Grid item xs={12}>
                  <ListItem>
                    <ListItemIcon>
                      <Person />
                    </ListItemIcon>
                    {editMode ? (
                      <TextField
                        fullWidth
                        label="Bio"
                        value={profile.bio}
                        onChange={(e) => handleProfileChange('bio', e.target.value)}
                        multiline
                        rows={3}
                      />
                    ) : (
                      <ListItemText
                        primary="Bio"
                        secondary={profile.bio}
                      />
                    )}
                  </ListItem>
                </Grid>

                <Grid item xs={12}>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarToday />
                    </ListItemIcon>
                    <ListItemText
                      primary="Member Since"
                      secondary={new Date(profile.joinDate).toLocaleDateString()}
                    />
                  </ListItem>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Security />}
                    onClick={() => setChangePasswordDialog(true)}
                  >
                    Change Password
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Settings />}
                    onClick={() => navigate('/settings')}
                  >
                    Account Settings
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Payment />}
                    onClick={() => navigate('/settlements')}
                  >
                    Payment Methods
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<History />}
                    onClick={() => navigate('/expenses')}
                  >
                    Expense History
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <List>
                {recentActivity.map((activity) => (
                  <ListItem key={activity.id}>
                    <ListItemText
                      primary={activity.description}
                      secondary={
                        <Box display="flex" justifyContent="space-between">
                          <span>{activity.date}</span>
                          {activity.amount && (
                            <Chip
                              label={`$${activity.amount.toFixed(2)}`}
                              size="small"
                              color={activity.type === 'settlement' ? 'success' : 'primary'}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordDialog} onClose={() => setChangePasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordDialog(false)}>Cancel</Button>
          <Button onClick={handlePasswordChange} variant="contained">
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
