import React from 'react';
import { List, ListItemButton, ListItemText, Typography, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { canAccessAdminZone } from '../../utils/roles';
import { LcCard } from '../../components/lc';

const links = [
  { label: 'Budget & Envelopes', path: '/app/budget' },
  { label: 'Classic Analytics', path: '/app/analytics' },
  { label: 'Settlements', path: '/app/settlements' },
  { label: 'Settlement Reports', path: '/app/settlements/reports' },
  { label: 'Search Hub', path: '/search' },
  { label: 'Recurring Expenses', path: '/app/recurring' },
  { label: 'Security & Privacy', path: '/app/settings/security' },
  { label: 'Settings', path: '/app/settings' },
  { label: 'Profile', path: '/app/profile' },
  { label: 'Notifications', path: '/app/notifications' },
  { label: 'Help & Support', path: '/app/help' },
];

export const MorePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const showAdmin = canAccessAdminZone(user);

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        More
      </Typography>
      <LcCard>
        <List>
          {links.map((link) => (
            <ListItemButton key={link.path} onClick={() => navigate(link.path)}>
              <ListItemText primary={link.label} />
            </ListItemButton>
          ))}
          {showAdmin && (
            <>
              <Divider />
              <ListItemButton onClick={() => navigate('/admin')}>
                <ListItemText primary="Enterprise Admin" secondary="LedgerCore Admin Console" />
              </ListItemButton>
            </>
          )}
        </List>
      </LcCard>
    </>
  );
};

export default MorePage;
