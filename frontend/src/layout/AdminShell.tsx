import React from 'react';
import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import {
  Dashboard,
  Receipt,
  FactCheck,
  Business,
  Assessment,
  FileUpload,
  Settings,
  Notifications,
  Security,
  AdminPanelSettings,
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
  { label: 'Entities', path: '/admin/entities', icon: <Business />, matchPrefix: true },
  { label: 'Reports', path: '/admin/reports', icon: <Assessment /> },
  { label: 'Export Control', path: '/admin/export', icon: <FileUpload /> },
];

const footerItems: SidebarNavItem[] = [
  { label: 'Settings', path: '/admin/settings', icon: <Settings /> },
];

const mobileNav: NavItem[] = [
  { label: 'Ledger', path: '/admin/ledger', icon: <Receipt /> },
  { label: 'Alerts', path: '/admin/alerts', icon: <Notifications /> },
  { label: 'Vault', path: '/admin/vault', icon: <Security /> },
  { label: 'Admin', path: '/admin', icon: <AdminPanelSettings /> },
];

export const AdminShell: React.FC = () => {
  const isMobile = useIsMobileLayout();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
        <AppTopBar title="LedgerCore Admin" variant="sticky" showNotifications={false} />
        <Box sx={{ width: '100%', px: 2, pt: 2 }}>
          <Outlet />
        </Box>
        <BottomNav items={mobileNav} />
      </Box>
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
          title: 'LedgerCore',
          showSearch: true,
          showNotifications: false,
          onSearchClick: () => navigate('/search'),
        }}
      />
    </ThemeProvider>
  );
};
