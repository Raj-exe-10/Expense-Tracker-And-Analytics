import React, { useEffect, useState } from 'react';
import { Typography, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import { enterpriseAPI } from '../../services/api';
import { LcCard } from '../../components/lc';
import { canAccessAdminZone } from '../../utils/roles';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Link } from 'react-router-dom';

const SearchAuditPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (canAccessAdminZone(user)) {
      enterpriseAPI.audit.list().then((d) => setEvents(d.results || d || [])).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!canAccessAdminZone(user)) {
    return <Typography>Audit trail requires admin access. <Link to="/admin/audit">Open Admin</Link></Typography>;
  }

  if (loading) return <CircularProgress />;

  return (
    <>
      <Typography variant="h6" fontWeight={700} gutterBottom>Audit Trail</Typography>
      <LcCard>
        <List>
          {events.map((e: any) => (
            <ListItem key={e.id}>
              <ListItemText primary={e.action_type} secondary={e.description} />
              <Typography variant="caption">{e.status}</Typography>
            </ListItem>
          ))}
        </List>
      </LcCard>
    </>
  );
};

export default SearchAuditPage;
