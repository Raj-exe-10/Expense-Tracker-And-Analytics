import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import { Search as SearchIcon, NotificationsNone } from '@mui/icons-material';

export interface AppTopBarProps {
  title: string;
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
  showSearch?: boolean;
  showNotifications?: boolean;
  /** Sticky mobile bar vs static desktop header inside main */
  variant?: 'sticky' | 'static';
  actions?: React.ReactNode;
}

export const AppTopBar: React.FC<AppTopBarProps> = ({
  title,
  onSearchClick,
  onNotificationsClick,
  showSearch = false,
  showNotifications = true,
  variant = 'sticky',
  actions,
}) => (
  <AppBar
    position={variant === 'sticky' ? 'sticky' : 'static'}
    elevation={0}
    color="transparent"
    sx={{
      borderBottom: variant === 'sticky' ? 1 : 0,
      borderColor: 'divider',
      bgcolor: 'background.default',
    }}
  >
    <Toolbar sx={{ width: '100%', px: { xs: 2, md: 3 } }}>
      <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
        {title}
      </Typography>
      {actions}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {showSearch && onSearchClick && (
          <IconButton color="inherit" onClick={onSearchClick} aria-label="Search">
            <SearchIcon />
          </IconButton>
        )}
        {showNotifications && onNotificationsClick && (
          <IconButton color="inherit" onClick={onNotificationsClick} aria-label="Notifications">
            <NotificationsNone />
          </IconButton>
        )}
      </Box>
    </Toolbar>
  </AppBar>
);
