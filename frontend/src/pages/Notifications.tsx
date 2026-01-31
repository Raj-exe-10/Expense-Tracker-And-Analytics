import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Receipt,
  Group,
  Payment,
  Person,
  Settings,
  Info,
  CheckCircle,
  Delete,
  MarkEmailRead,
  Refresh,
  FilterList,
  GroupAdd,
  AttachMoney,
  Edit,
  NotificationsActive,
  Schedule,
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { notificationsAPI } from '../services/api';

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  priority: string;
  created_at: string;
  action_url?: string;
  sender?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  metadata?: any;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { limit: 100 };
      if (filter !== 'all') {
        params.type = filter;
      }
      const data = await notificationsAPI.getNotifications(params);
      const notificationsList = Array.isArray(data) ? data : data.results || [];
      setNotifications(notificationsList);
      
      // Get unread count
      const countData = await notificationsAPI.getUnreadCount();
      setUnreadCount(countData.count || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'expense_added':
        return <Receipt color="primary" />;
      case 'expense_updated':
        return <Edit color="info" />;
      case 'expense_deleted':
        return <Delete color="error" />;
      case 'settlement_created':
      case 'settlement_completed':
      case 'payment_received':
        return <AttachMoney color="success" />;
      case 'payment_reminder':
      case 'payment_due':
        return <Schedule color="warning" />;
      case 'group_joined':
      case 'group_invitation':
        return <GroupAdd color="primary" />;
      case 'group_created':
        return <Group color="primary" />;
      default:
        return <NotificationsIcon color="action" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'expense_added':
        return '#1976d2';
      case 'expense_updated':
        return '#0288d1';
      case 'settlement_completed':
      case 'payment_received':
        return '#2e7d32';
      case 'payment_reminder':
      case 'payment_due':
        return '#ed6c02';
      case 'group_joined':
      case 'group_invitation':
        return '#9c27b0';
      default:
        return '#757575';
    }
  };

  const getPriorityChip = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Chip label="High" size="small" color="error" />;
      case 'normal':
        return <Chip label="Normal" size="small" color="primary" variant="outlined" />;
      case 'low':
        return <Chip label="Low" size="small" color="default" variant="outlined" />;
      default:
        return null;
    }
  };

  const formatNotificationType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  const displayedNotifications = tabValue === 0 
    ? notifications 
    : tabValue === 1 
    ? unreadNotifications 
    : readNotifications;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stay updated with your expense activities
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadNotifications} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              startIcon={<MarkEmailRead />}
              onClick={handleMarkAllAsRead}
            >
              Mark All as Read
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <Card sx={{ minWidth: 150, flex: 1 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <Badge badgeContent={notifications.length} color="primary">
                <NotificationsIcon />
              </Badge>
              <Box>
                <Typography variant="h6">{notifications.length}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Total
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 150, flex: 1 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsActive color="warning" />
              </Badge>
              <Box>
                <Typography variant="h6">{unreadCount}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Unread
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 150, flex: 1 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <CheckCircle color="success" />
              <Box>
                <Typography variant="h6">{readNotifications.length}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Read
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Paper sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label={`All (${notifications.length})`} />
            <Tab 
              label={
                <Badge badgeContent={unreadCount} color="error" sx={{ pr: 2 }}>
                  Unread
                </Badge>
              } 
            />
            <Tab label={`Read (${readNotifications.length})`} />
          </Tabs>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter Type</InputLabel>
            <Select
              value={filter}
              label="Filter Type"
              onChange={(e) => setFilter(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="expense_added">Expense Added</MenuItem>
              <MenuItem value="expense_updated">Expense Updated</MenuItem>
              <MenuItem value="settlement_completed">Settlement</MenuItem>
              <MenuItem value="payment_reminder">Payment Reminder</MenuItem>
              <MenuItem value="group_joined">Group Joined</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Notifications List */}
      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : displayedNotifications.length === 0 ? (
            <Box textAlign="center" py={4}>
              <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tabValue === 1 ? "You're all caught up!" : 'Your notifications will appear here'}
              </Typography>
            </Box>
          ) : (
            <List>
              {displayedNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                    }}
                    secondaryAction={
                      <Box display="flex" gap={1}>
                        {!notification.is_read && (
                          <Tooltip title="Mark as read">
                            <IconButton
                              edge="end"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <MarkEmailRead />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton
                            edge="end"
                            onClick={() => handleDelete(notification.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: `${getNotificationColor(notification.notification_type)}20`,
                          color: getNotificationColor(notification.notification_type),
                        }}
                      >
                        {getNotificationIcon(notification.notification_type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography variant="subtitle1" fontWeight={notification.is_read ? 400 : 600}>
                            {notification.title}
                          </Typography>
                          <Chip
                            label={formatNotificationType(notification.notification_type)}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                          {notification.priority === 'high' && getPriorityChip(notification.priority)}
                          {!notification.is_read && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            {notification.message}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={2} mt={1}>
                            {notification.sender && (
                              <Typography variant="caption" color="text.secondary">
                                From: {notification.sender.first_name} {notification.sender.last_name}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < displayedNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationsPage;
