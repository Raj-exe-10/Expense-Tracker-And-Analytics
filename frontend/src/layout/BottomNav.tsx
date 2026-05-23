import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactElement;
  isFab?: boolean;
}

interface BottomNavProps {
  items: NavItem[];
}

export const BottomNav: React.FC<BottomNavProps> = ({ items }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentIndex = items.findIndex(
    (item) => !item.isFab && location.pathname.startsWith(item.path)
  );

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <Box sx={{ width: '100%' }}>
        <BottomNavigation
          value={currentIndex >= 0 ? currentIndex : false}
          showLabels
          sx={{
            bgcolor: 'transparent',
            height: 64,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 56,
              color: 'text.secondary',
              '&.Mui-selected': { color: 'text.primary' },
            },
          }}
        >
          {items.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={
                item.isFab ? (
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: -2,
                    }}
                  >
                    {item.icon}
                  </Box>
                ) : (
                  item.icon
                )
              }
              onClick={() => navigate(item.path)}
            />
          ))}
        </BottomNavigation>
      </Box>
    </Paper>
  );
};
