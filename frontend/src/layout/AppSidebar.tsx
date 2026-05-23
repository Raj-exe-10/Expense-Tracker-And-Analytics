import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Button,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { DRAWER_WIDTH } from './constants';

export interface SidebarNavItem {
  label: string;
  path: string;
  icon: React.ReactElement;
  /** Match when pathname equals or starts with path (default: exact for index paths) */
  matchPrefix?: boolean;
}

export interface AppSidebarProps {
  title: string;
  subtitle?: string;
  items: SidebarNavItem[];
  footerItems?: SidebarNavItem[];
  headerAction?: { label: string; onClick: () => void; icon?: React.ReactElement };
  showAvatar?: boolean;
}

function isActive(pathname: string, item: SidebarNavItem): boolean {
  const exactOnly = item.path === '/admin' || item.path === '/search' || item.path === '/app/home';
  if (exactOnly) {
    return pathname === item.path;
  }
  if (item.matchPrefix) {
    return pathname === item.path || pathname.startsWith(`${item.path}/`);
  }
  return pathname === item.path;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  title,
  subtitle,
  items,
  footerItems,
  headerAction,
  showAvatar = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navList = (navItems: SidebarNavItem[]) => (
    <List disablePadding>
      {navItems.map((item) => {
        const active = isActive(location.pathname, item);
        return (
          <ListItemButton
            key={item.path}
            selected={active}
            onClick={() => navigate(item.path)}
            sx={{
              mx: 1,
              mb: 0.5,
              borderRadius: 1,
              borderLeft: active ? '4px solid' : '4px solid transparent',
              borderColor: active ? 'secondary.main' : 'transparent',
              bgcolor: active ? 'action.selected' : 'transparent',
              '&.Mui-selected': {
                bgcolor: 'action.selected',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: active ? 'text.primary' : 'text.secondary' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontWeight: active ? 600 : 400, fontSize: '0.9rem' }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2, pt: 2.5, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: headerAction ? 2 : 0 }}>
          {showAvatar && (
            <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              LC
            </Avatar>
          )}
          <Box>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {headerAction && (
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={headerAction.icon}
            onClick={headerAction.onClick}
            sx={{ py: 1.25 }}
          >
            {headerAction.label}
          </Button>
        )}
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>{navList(items)}</Box>
      {footerItems && footerItems.length > 0 && (
        <Box sx={{ borderTop: 1, borderColor: 'divider', pb: 2 }}>{navList(footerItems)}</Box>
      )}
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: 1,
          borderColor: 'divider',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};
