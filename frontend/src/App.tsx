import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from './store';
import { checkAuthStatus, clearSession } from './store/slices/authSlice';
import { ledgerCoreDarkTheme, ledgerCoreLightAuthTheme } from './theme/ledgerCoreTheme';
import { AppRoutes } from './routes/AppRoutes';
import { registerSessionExpiredHandler } from './services/authSession';
import { shouldDispatchAuthCheck } from './auth/authBootstrap';
import { tokenStorage } from './utils/storage';

const PUBLIC_PATH_PREFIXES = ['/', '/login', '/register', '/forgot-password', '/terms', '/privacy'];

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PATH_PREFIXES.some(
    (p) => p !== '/' && (pathname === p || pathname.startsWith(`${p}/`))
  );
}

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isLightRoute =
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

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isInitialized } = useSelector((state: RootState) => state.auth);
  const pathnameRef = useRef(window.location.pathname);

  useEffect(() => {
    pathnameRef.current = window.location.pathname;
  });

  useEffect(() => {
    registerSessionExpiredHandler(() => {
      dispatch(clearSession());
      if (!isPublicPath(pathnameRef.current)) {
        navigate('/login', { replace: true, state: { sessionExpired: true } });
      }
    });
    return () => registerSessionExpiredHandler(null);
  }, [dispatch, navigate]);

  useEffect(() => {
    if (!shouldDispatchAuthCheck()) return;
    if (tokenStorage.hasTokens()) {
      dispatch(checkAuthStatus());
    }
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

  return <>{children}</>;
}

const skipLinkStyles: React.CSSProperties = {
  position: 'absolute',
  left: '-9999px',
  top: 'auto',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
};

const skipLinkFocusStyles: React.CSSProperties = {
  position: 'fixed',
  top: 8,
  left: 8,
  zIndex: 9999,
  padding: '8px 16px',
  background: '#000',
  color: '#fff',
  borderRadius: 4,
  fontSize: 14,
  fontWeight: 600,
  width: 'auto',
  height: 'auto',
  overflow: 'visible',
};

function SkipLink() {
  const [focused, setFocused] = React.useState(false);
  return (
    <a
      href="#main-content"
      style={focused ? skipLinkFocusStyles : skipLinkStyles}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      Skip to main content
    </a>
  );
}

function App() {
  return (
    <Router>
      <SkipLink />
      <AuthBootstrap>
        <ThemeWrapper>
          <AppRoutes />
        </ThemeWrapper>
      </AuthBootstrap>
    </Router>
  );
}

export default App;
