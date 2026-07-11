import React from 'react';
import { Box } from '@mui/material';
import {
  Home,
  Receipt,
  Add,
  People,
  MoreHoriz,
  AccountBalanceWallet,
  Analytics,
  Handshake,
} from '@mui/icons-material';
import { Outlet, useNavigate } from 'react-router-dom';
import { BottomNav, NavItem } from './BottomNav';
import { AppTopBar } from './AppTopBar';
import { DesktopShellLayout } from './DesktopShellLayout';
import { useIsMobileLayout } from './useIsMobileLayout';
import { SidebarNavItem } from './AppSidebar';

const mobileNavItems: NavItem[] = [
  { label: 'Home', path: '/app/home', icon: <Home /> },
  { label: 'Expenses', path: '/app/expenses', icon: <Receipt /> },
  { label: 'Add', path: '/app/add', icon: <Add />, isFab: true },
  { label: 'People', path: '/app/people', icon: <People /> },
  { label: 'More', path: '/app/more', icon: <MoreHoriz /> },
];

const sidebarItems: SidebarNavItem[] = [
  { label: 'Home', path: '/app/home', icon: <Home /> },
  { label: 'Expenses', path: '/app/expenses', icon: <Receipt />, matchPrefix: true },
  { label: 'People', path: '/app/people', icon: <People />, matchPrefix: true },
  { label: 'Budget', path: '/app/budget', icon: <AccountBalanceWallet /> },
  { label: 'Analytics', path: '/app/analytics/post-game', icon: <Analytics /> },
  { label: 'Settlements', path: '/app/settlements', icon: <Handshake />, matchPrefix: true },
];

const footerItems: SidebarNavItem[] = [
  { label: 'More', path: '/app/more', icon: <MoreHoriz /> },
];

export const PersonalShell: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobileLayout();

  if (!isMobile) {
    return (
      <DesktopShellLayout
        sidebar={{
          title: 'LedgerCore',
          subtitle: 'Personal',
          items: sidebarItems,
          footerItems,
          showAvatar: false,
          headerAction: {
            label: 'Add Expense',
            icon: <Add />,
            onClick: () => navigate('/app/add'),
          },
        }}
        topBar={{
          showSearch: true,
          onSearchClick: () => navigate('/search'),
          onNotificationsClick: () => navigate('/app/notifications'),
        }}
      />
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      <AppTopBar
        title="LedgerCore"
        variant="sticky"
        onNotificationsClick={() => navigate('/app/notifications')}
      />
      <Box sx={{ width: '100%', maxWidth: '100%', minWidth: 0, px: 2, pt: 2, pb: 2, boxSizing: 'border-box' }}>
        <Outlet />
      </Box>
      <BottomNav items={mobileNavItems} />
    </Box>
  );
};
