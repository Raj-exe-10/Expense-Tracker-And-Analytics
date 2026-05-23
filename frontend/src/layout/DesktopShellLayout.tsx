import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { AppSidebar, AppSidebarProps } from './AppSidebar';
import { AppTopBar, AppTopBarProps } from './AppTopBar';
import { CONTENT_MAX_WIDTH } from './constants';

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
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}
    >
      <AppTopBar {...topBar} variant="static" />
      <Box
        sx={{
          flex: 1,
          px: { md: 3, lg: 4 },
          py: 3,
          maxWidth: CONTENT_MAX_WIDTH.lg,
          width: '100%',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  </Box>
);
