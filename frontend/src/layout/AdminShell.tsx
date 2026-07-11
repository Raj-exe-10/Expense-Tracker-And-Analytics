import React from 'react';
import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import {
  Dashboard,
  Receipt,
  FactCheck,
  ListAlt,
  Business,
  Assessment,
  FileUpload,
  Settings,
} from '@mui/icons-material';
import { Outlet, useNavigate } from 'react-router-dom';
import { BottomNav, NavItem } from './BottomNav';
import { AppTopBar } from './AppTopBar';
import { DesktopShellLayout } from './DesktopShellLayout';
import { useIsMobileLayout } from './useIsMobileLayout';
import { SidebarNavItem } from './AppSidebar';
import { ledgerCoreAdminLightTheme } from '../theme/ledgerCoreTheme';

const sidebarItems: SidebarNavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: <Dashboard /> },
  { label: 'Ledger', path: '/admin/ledger', icon: <Receipt />, matchPrefix: true },
  { label: 'Audit Trails', path: '/admin/audit', icon: <FactCheck /> },
  { label: 'System Logs', path: '/admin/logs', icon: <ListAlt /> },
  { label: 'Entities', path: '/admin/entities', icon: <Business />, matchPrefix: true },
  { label: 'Reports', path: '/admin/reports', icon: <Assessment /> },
  { label: 'Export Control', path: '/admin/export', icon: <FileUpload /> },
];

const footerItems: SidebarNavItem[] = [
  { label: 'Settings', path: '/admin/settings', icon: <Settings /> },
];

const mobileNav: NavItem[] = [
  { label: 'Home', path: '/admin', icon: <Dashboard /> },
  { label: 'Logs', path: '/admin/logs', icon: <ListAlt /> },
  { label: 'Ledger', path: '/admin/ledger', icon: <Receipt /> },
  { label: 'More', path: '/admin/settings', icon: <Settings /> },
];

export const AdminShell: React.FC = () => {
  const isMobile = useIsMobileLayout();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <ThemeProvider theme={ledgerCoreAdminLightTheme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
          <AppTopBar title="LedgerCore Admin" variant="sticky" showNotifications={false} />
          <Box
            component="main"
            id="main-content"
            sx={{
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              px: { xs: 1.5, sm: 2 },
              pt: 2,
              pb: 2,
              boxSizing: 'border-box',
            }}
          >
            <Outlet />
          </Box>
          <BottomNav items={mobileNav} />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={ledgerCoreAdminLightTheme}>
      <CssBaseline />
      <DesktopShellLayout
        sidebar={{
          title: 'Admin Console',
          subtitle: 'Ledger Management',
          items: sidebarItems,
          footerItems,
          showAvatar: true,
        }}
        topBar={{
          showSearch: true,
          showNotifications: false,
          onSearchClick: () => navigate('/search'),
        }}
      />
    </ThemeProvider>
  );
};
