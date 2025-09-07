import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Divider,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  Notifications,
  Security,
  Palette,
  CloudUpload,
  Edit,
  Save,
  Cancel,
  PhotoCamera,
} from '@mui/icons-material';
import { useAppSelector } from '../hooks/redux';

const Settings: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [editMode, setEditMode] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      sms: false,
      expenseAdded: true,
      paymentReceived: true,
      groupInvite: true,
    },
    privacy: {
      profilePublic: false,
      showEmail: false,
      showPhone: false,
    },
    preferences: {
      currency: 'USD',
      language: 'en',
      theme: 'light',
      dateFormat: 'MM/DD/YYYY',
    },
    profile: {
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      email: user?.email || '',
      phone: '',
    },
  });

  const handleToggle = (category: string, setting: string) => {
    setSettings((prev) => {
      const categoryData = prev[category as keyof typeof prev] as any;
      return {
        ...prev,
        [category]: {
          ...categoryData,
          [setting]: !categoryData[setting],
        },
      };
    });
  };

  const handleProfileEdit = () => {
    setEditMode(!editMode);
  };

  const handleProfileSave = () => {
    // Save profile changes
    setEditMode(false);
  };

  const handleProfileChange = (field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value,
      },
    }));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {/* Profile Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Profile</Typography>
            <Box>
              {editMode ? (
                <>
                  <IconButton onClick={handleProfileSave} color="primary">
                    <Save />
                  </IconButton>
                  <IconButton onClick={handleProfileEdit}>
                    <Cancel />
                  </IconButton>
                </>
              ) : (
                <IconButton onClick={handleProfileEdit}>
                  <Edit />
                </IconButton>
              )}
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={3} mb={3}>
            <Box position="relative">
              <Avatar
                sx={{ width: 80, height: 80 }}
                src={user?.avatar}
              >
                {user?.first_name?.[0]}
              </Avatar>
              {editMode && (
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: -8,
                    right: -8,
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                  }}
                  size="small"
                >
                  <PhotoCamera fontSize="small" />
                </IconButton>
              )}
            </Box>

            <Box flex={1}>
              {editMode ? (
                <Box display="flex" gap={2}>
                  <TextField
                    label="First Name"
                    value={settings.profile.firstName}
                    onChange={(e) => handleProfileChange('firstName', e.target.value)}
                    size="small"
                  />
                  <TextField
                    label="Last Name"
                    value={settings.profile.lastName}
                    onChange={(e) => handleProfileChange('lastName', e.target.value)}
                    size="small"
                  />
                </Box>
              ) : (
                <>
                  <Typography variant="h6">
                    {settings.profile.firstName} {settings.profile.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {settings.profile.email}
                  </Typography>
                </>
              )}
            </Box>
          </Box>

          {editMode && (
            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="Email"
                value={settings.profile.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Phone"
                value={settings.profile.phone}
                onChange={(e) => handleProfileChange('phone', e.target.value)}
                size="small"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Box display="flex" alignItems="center" gap={1}>
              <Notifications />
              Notifications
            </Box>
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Email Notifications"
                secondary="Receive notifications via email"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.notifications.email}
                  onChange={() => handleToggle('notifications', 'email')}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Push Notifications"
                secondary="Receive push notifications on your device"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.notifications.push}
                  onChange={() => handleToggle('notifications', 'push')}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText
                primary="SMS Notifications"
                secondary="Receive notifications via SMS"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.notifications.sms}
                  onChange={() => handleToggle('notifications', 'sms')}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="New Expense Added"
                secondary="When someone adds an expense in your group"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.notifications.expenseAdded}
                  onChange={() => handleToggle('notifications', 'expenseAdded')}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Payment Received"
                secondary="When you receive a payment"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.notifications.paymentReceived}
                  onChange={() => handleToggle('notifications', 'paymentReceived')}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Box display="flex" alignItems="center" gap={1}>
              <Palette />
              Preferences
            </Box>
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select
                value={settings.preferences.currency}
                label="Currency"
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    preferences: { ...prev.preferences, currency: e.target.value },
                  }))
                }
              >
                <MenuItem value="USD">USD ($)</MenuItem>
                <MenuItem value="EUR">EUR (€)</MenuItem>
                <MenuItem value="GBP">GBP (£)</MenuItem>
                <MenuItem value="INR">INR (₹)</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                value={settings.preferences.language}
                label="Language"
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    preferences: { ...prev.preferences, language: e.target.value },
                  }))
                }
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Theme</InputLabel>
              <Select
                value={settings.preferences.theme}
                label="Theme"
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    preferences: { ...prev.preferences, theme: e.target.value },
                  }))
                }
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="auto">Auto</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Box display="flex" alignItems="center" gap={1}>
              <Security />
              Privacy
            </Box>
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Public Profile"
                secondary="Allow others to see your profile"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.privacy.profilePublic}
                  onChange={() => handleToggle('privacy', 'profilePublic')}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Show Email"
                secondary="Display your email on your profile"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.privacy.showEmail}
                  onChange={() => handleToggle('privacy', 'showEmail')}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Show Phone"
                secondary="Display your phone number on your profile"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.privacy.showPhone}
                  onChange={() => handleToggle('privacy', 'showPhone')}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Data Management
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <Button
              variant="outlined"
              startIcon={<CloudUpload />}
              fullWidth
            >
              Export My Data
            </Button>
            <Button
              variant="outlined"
              color="error"
              fullWidth
            >
              Delete Account
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;
