import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from './store';
import { checkAuthStatus } from './store/slices/authSlice';
import { theme } from './theme/theme';

// Components
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import { DashboardLayout } from './components/dashboard/DashboardLayout';

// Pages
import { Dashboard } from './pages/Dashboard';
import Expenses from './pages/Expenses';
import ExpenseDetail from './pages/ExpenseDetail';
import Groups from './pages/Groups';
import JoinGroup from './pages/JoinGroup';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Settlements from './pages/Settlements';
import Profile from './pages/Profile';
import HelpSupport from './pages/HelpSupport';
// Auth wrapper component
interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isAuthenticated, isLoading: loading } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Public route wrapper (redirect to dashboard if authenticated)
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading: loading } = useSelector((state: RootState) => state.auth);
  
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Auth pages layout
const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 'sm', px: 2 }}>
        {children}
      </Box>
    </Box>
  );
};

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading: loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Check if user is authenticated on app start
    dispatch(checkAuthStatus());
  }, [dispatch]);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <AuthLayout>
                  <LoginForm />
                </AuthLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <AuthLayout>
                  <RegisterForm />
                </AuthLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <AuthLayout>
                  <ForgotPasswordForm />
                </AuthLayout>
              </PublicRoute>
            }
          />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <AuthWrapper>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </AuthWrapper>
            }
          />
          
          <Route
            path="/expenses"
            element={
              <AuthWrapper>
                <DashboardLayout>
                  <Expenses />
                </DashboardLayout>
              </AuthWrapper>
            }
          />
          
          <Route
            path="/expenses/add"
            element={
              <AuthWrapper>
                <DashboardLayout>
                  <Expenses />
                </DashboardLayout>
              </AuthWrapper>
            }
          />
          
          <Route
            path="/expenses/:id"
            element={
              <AuthWrapper>
                <DashboardLayout>
                  <ExpenseDetail />
                </DashboardLayout>
              </AuthWrapper>
            }
          />
          
          <Route
            path="/expenses/:id/edit"
            element={
              <AuthWrapper>
                <DashboardLayout>
                  <ExpenseDetail />
                </DashboardLayout>
              </AuthWrapper>
            }
          />
          
          <Route
            path="/groups"
            element={
              <AuthWrapper>
                <DashboardLayout>
                  <Groups />
                </DashboardLayout>
              </AuthWrapper>
            }
          />
          
          <Route
            path="/groups/join/:inviteCode"
            element={
              <AuthWrapper>
                <DashboardLayout>
                  <JoinGroup />
                </DashboardLayout>
              </AuthWrapper>
            }
          />
          
          <Route
            path="/analytics"
            element={
              <AuthWrapper>
                <DashboardLayout>
                  <Analytics />
                </DashboardLayout>
              </AuthWrapper>
            }
          />
          
          <Route
            path="/settlements"
            element={
              <AuthWrapper>
                <DashboardLayout>
                  <Settlements />
                </DashboardLayout>
              </AuthWrapper>
            }
          />
          
          <Route
            path="/settings"
            element={
              <AuthWrapper>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </AuthWrapper>
            }
          />
          
          <Route
            path="/profile"
            element={
              <AuthWrapper>
                <DashboardLayout>
                  <Profile />
                </DashboardLayout>
              </AuthWrapper>
            }
          />
          
          <Route
            path="/help"
            element={
              <AuthWrapper>
                <DashboardLayout>
                  <HelpSupport />
                </DashboardLayout>
              </AuthWrapper>
            }
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
