import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from './store';
import { checkAuthStatus } from './store/slices/authSlice';
import { ledgerCoreDarkTheme, ledgerCoreLightAuthTheme } from './theme/ledgerCoreTheme';
import { AppRoutes } from './routes/AppRoutes';
import { useLocation } from 'react-router-dom';

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isLightRoute =
    location.pathname === '/' ||
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/register') ||
    location.pathname.startsWith('/forgot-password') ||
    location.pathname === '/terms' ||
    location.pathname === '/privacy';

  return (
    <ThemeProvider theme={isLightRoute ? ledgerCoreLightAuthTheme : ledgerCoreDarkTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

function AppContent() {
  const dispatch = useDispatch<AppDispatch>();
  const { isInitialized } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  if (!isInitialized) {
    return (
      <ThemeProvider theme={ledgerCoreDarkTheme}>
        <CssBaseline />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <Router>
      <ThemeWrapper>
        <AppRoutes />
      </ThemeWrapper>
    </Router>
  );
}

function App() {
  return <AppContent />;
}

export default App;
