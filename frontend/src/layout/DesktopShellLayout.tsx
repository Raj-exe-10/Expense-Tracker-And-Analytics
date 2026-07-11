import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { AppSidebar, AppSidebarProps } from './AppSidebar';
import { AppTopBar, AppTopBarProps } from './AppTopBar';
import { PAGE_PADDING_X, PAGE_PADDING_Y } from './constants';

interface DesktopShellLayoutProps {
  sidebar: AppSidebarProps;
  topBar: AppTopBarProps;
}

export const DesktopShellLayout: React.FC<DesktopShellLayoutProps> = ({ sidebar, topBar }) => (
  <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
    <AppSidebar {...sidebar} />
    <Box
      component="main"
      sx={{
        flex: '1 1 0',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        width: 0,
      }}
    >
      <AppTopBar {...topBar} variant="static" />
      <Box
        sx={{
          flex: 1,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          px: PAGE_PADDING_X,
          py: PAGE_PADDING_Y,
          boxSizing: 'border-box',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  </Box>
);
