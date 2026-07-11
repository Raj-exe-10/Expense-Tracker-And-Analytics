import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import { RootState } from '../store';
import { canAccessAdminZone } from '../utils/roles';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  // Still bootstrapping profile
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  // Tokens present but profile failed to load — force re-auth rather than infinite spinner
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

export const PublicGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  if (isAuthenticated) {
    return <Navigate to="/app/home" replace />;
  }
  return <>{children}</>;
};

export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  if (!canAccessAdminZone(user)) {
    return <Navigate to="/app/more" replace />;
  }
  return <>{children}</>;
};
