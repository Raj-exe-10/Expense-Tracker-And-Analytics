import React, { useEffect, useState } from 'react';
import { Typography, List, ListItem, ListItemText, Button, CircularProgress, Box } from '@mui/material';
import { notificationsAPI } from '../../services/api';
import { LcCard } from '../../components/lc';

const AdminAlertsPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsAPI.getNotifications({ limit: 50 }).then((d) => setItems(d.results || d || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Alerts</Typography>
        <Button size="small" onClick={() => notificationsAPI.markAllAsRead()}>Mark all read</Button>
      </Box>
      <LcCard>
        <List>
          {items.map((n: any) => (
            <ListItem key={n.id}>
              <ListItemText primary={n.title} secondary={n.message} />
            </ListItem>
          ))}
        </List>
      </LcCard>
    </>
  );
};

export default AdminAlertsPage;
