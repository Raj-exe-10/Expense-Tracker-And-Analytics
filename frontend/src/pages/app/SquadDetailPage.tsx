import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, IconButton, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { groupsAPI } from '../../services/api';
import { formatAmount } from '../../utils/formatting';
import { LcCard } from '../../components/lc';

const SquadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      groupsAPI.getGroup(id),
      groupsAPI.getGroupActivities(id).catch(() => []),
    ]).then(([g, acts]) => {
      setGroup(g);
      setActivities(Array.isArray(acts) ? acts : acts.results || []);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <CircularProgress />;
  if (!group) return <Typography>Squad not found</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => navigate('/app/people')}><ArrowBack /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700}>{group.name}</Typography>
          <Typography variant="caption" color="text.secondary">{group.member_count} members</Typography>
        </Box>
      </Box>
      <LcCard sx={{ p: 2, mb: 2 }}>
        <List dense>
          {activities.slice(0, 20).map((a: any) => (
            <ListItem key={a.id}>
              <ListItemText primary={a.description || a.activity_type} secondary={a.created_at} />
            </ListItem>
          ))}
        </List>
      </LcCard>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="outlined" fullWidth onClick={() => navigate(`/app/add?group=${id}`)}>Add Expense</Button>
        <Button variant="contained" fullWidth onClick={() => navigate('/app/settlements')}>Settle Up</Button>
      </Box>
    </Box>
  );
};

export default SquadDetailPage;
