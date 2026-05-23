import React from 'react';
import { Box } from '@mui/material';
import {
  AccountBalanceWallet,
  Search as SearchIcon,
  Groups,
  FactCheck,
  FileUpload,
} from '@mui/icons-material';
import { Outlet } from 'react-router-dom';
import { BottomNav, NavItem } from './BottomNav';
import { AppTopBar } from './AppTopBar';
import { DesktopShellLayout } from './DesktopShellLayout';
import { useIsMobileLayout } from './useIsMobileLayout';
import { SidebarNavItem } from './AppSidebar';

const mobileNavItems: NavItem[] = [
  { label: 'Ledger', path: '/search/ledger', icon: <AccountBalanceWallet /> },
  { label: 'Search', path: '/search', icon: <SearchIcon /> },
  { label: 'Squads', path: '/search/squads', icon: <Groups /> },
  { label: 'Audit', path: '/search/audit', icon: <FactCheck /> },
  { label: 'Export', path: '/search/export', icon: <FileUpload /> },
];

const sidebarItems: SidebarNavItem[] = [
  { label: 'Search Hub', path: '/search', icon: <SearchIcon />, matchPrefix: false },
  { label: 'Ledger', path: '/search/ledger', icon: <AccountBalanceWallet /> },
  { label: 'Squads', path: '/search/squads', icon: <Groups /> },
  { label: 'Audit', path: '/search/audit', icon: <FactCheck /> },
  { label: 'Export', path: '/search/export', icon: <FileUpload /> },
];

export const SearchShell: React.FC = () => {
  const isMobile = useIsMobileLayout();

  if (!isMobile) {
    return (
      <DesktopShellLayout
        sidebar={{
          title: 'Search Hub',
          subtitle: 'LedgerCore',
          items: sidebarItems,
          showAvatar: false,
        }}
        topBar={{
          title: 'LedgerCore Search',
          showNotifications: false,
        }}
      />
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      <AppTopBar title="LedgerCore Search" variant="sticky" showNotifications={false} />
      <Box sx={{ width: '100%', px: 2, pt: 2 }}>
        <Outlet />
      </Box>
      <BottomNav items={mobileNavItems} />
    </Box>
  );
};
