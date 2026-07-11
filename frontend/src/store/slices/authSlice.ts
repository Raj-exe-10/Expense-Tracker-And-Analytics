import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';
import { tokenStorage } from '../../utils/storage';
import { appLogger } from '../../utils/appLogger';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar?: string;
  role: string;
  is_verified: boolean;
  is_premium: boolean;
  preferred_currency: string;
  monthly_income?: number | null;
  timezone: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | { detail?: string; message?: string } | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: tokenStorage.getAccessToken(),
  refreshToken: tokenStorage.getRefreshToken(),
  isLoading: false,
  isInitialized: !tokenStorage.hasTokens(),
  error: null,
  isAuthenticated: false,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      tokenStorage.setAccessToken(response.access);
      tokenStorage.setRefreshToken(response.refresh);
      return response;
    } catch (error: any) {
      // Extract error message from response
      const errorData = error.response?.data;
      if (errorData) {
        // Handle non-field errors (detail or message)
        if (errorData.detail) {
          // If detail is a string, use it directly
          if (typeof errorData.detail === 'string') {
            return rejectWithValue(errorData.detail);
          }
          // If detail is an array, join it
          if (Array.isArray(errorData.detail)) {
            return rejectWithValue(errorData.detail.join('; '));
          }
          // If detail is an object (field errors), format it
          if (typeof errorData.detail === 'object') {
            const errorMessages = Object.entries(errorData.detail)
              .filter(([field]) => field !== 'username') // Filter out 'username' field errors
              .map(([field, errors]: [string, any]) => {
                if (Array.isArray(errors)) {
                  return errors.join(', ');
                }
                return String(errors);
              })
              .filter(msg => msg); // Remove empty messages
            return rejectWithValue(errorMessages.join('; ') || 'Login failed. Please check your credentials.');
          }
        }
        // Handle message field
        if (errorData.message) {
          return rejectWithValue(errorData.message);
        }
        // Handle validation errors (dict of field errors) - but exclude 'username'
        if (typeof errorData === 'object' && !errorData.detail && !errorData.message) {
          const errorMessages = Object.entries(errorData)
            .filter(([field]) => field !== 'username') // Filter out username field
            .map(([field, errors]: [string, any]) => {
              if (Array.isArray(errors)) {
                return errors.join(', ');
              }
              return String(errors);
            })
            .filter(msg => msg); // Remove empty messages
          return rejectWithValue(errorMessages.join('; ') || 'Login failed. Please check your credentials.');
        }
      }
      return rejectWithValue('Login failed. Please check your credentials.');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    password_confirm: string;
  }, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      return response;
    } catch (error: any) {
      // Extract error message from response
      const errorData = error.response?.data;
      if (errorData) {
        // Handle validation errors (dict of field errors)
        if (typeof errorData === 'object' && !errorData.detail && !errorData.message) {
          const errorMessages = Object.entries(errorData)
            .map(([field, errors]: [string, any]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`;
              }
              return `${field}: ${errors}`;
            })
            .join('; ');
          return rejectWithValue(errorMessages || 'Registration failed');
        }
        // Handle single error message
        return rejectWithValue(errorData.detail || errorData.message || 'Registration failed');
      }
      return rejectWithValue('Registration failed. Please try again.');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        await authAPI.logout({ refresh: refreshToken });
      }
      tokenStorage.clearTokens();
      return true;
    } catch (error: any) {
      // Even if logout fails on server, clear tokens
      tokenStorage.clearTokens();
      return true;
    }
  }
);

export const fetchUser = createAsyncThunk(
  'auth/fetchUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getProfile();
      return response;
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        tokenStorage.clearTokens();
      }
      return rejectWithValue({
        message: error.response?.data?.detail || 'Failed to fetch user',
        status,
      });
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSession: (state) => {
      tokenStorage.clearTokens();
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.isInitialized = true;
      state.error = null;
    },
    setTokens: (state, action: PayloadAction<{ access: string; refresh: string }>) => {
      state.token = action.payload.access;
      state.refreshToken = action.payload.refresh;
      tokenStorage.setAccessToken(action.payload.access);
      tokenStorage.setRefreshToken(action.payload.refresh);
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
        appLogger.auth('Login successful', { email: action.payload.user?.email });
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        // Handle error message - could be string or object
        const errorPayload = action.payload as any;
        if (typeof errorPayload === 'string') {
          state.error = errorPayload;
        } else if (errorPayload?.detail) {
          state.error = errorPayload.detail;
        } else if (errorPayload?.message) {
          state.error = errorPayload.message;
        } else if (errorPayload && typeof errorPayload === 'object') {
          // Handle validation errors
          const errorMessages = Object.values(errorPayload).flat();
          state.error = errorMessages.join(', ') || 'Login failed';
        } else {
          state.error = 'Login failed. Please check your credentials.';
        }
        state.isAuthenticated = false;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        // Registration successful - user needs to verify email or can login
        // Don't set user/token here, user needs to login after verification
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        // Handle error message - could be string or object
        const errorPayload = action.payload as any;
        if (typeof errorPayload === 'string') {
          state.error = errorPayload;
        } else if (errorPayload?.detail) {
          state.error = errorPayload.detail;
        } else if (errorPayload?.message) {
          state.error = errorPayload.message;
        } else if (errorPayload && typeof errorPayload === 'object') {
          // Handle validation errors
          const errorMessages = Object.values(errorPayload).flat();
          state.error = errorMessages.join(', ') || 'Registration failed';
        } else {
          state.error = 'Registration failed. Please try again.';
        }
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Fetch user
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.isLoading = false;
        const status = (action.payload as { status?: number } | undefined)?.status;
        if (status === 401 || status === 403) {
          state.isAuthenticated = false;
          state.token = null;
          state.refreshToken = null;
          tokenStorage.clearTokens();
        }
      })
      // Check auth status (initial app load)
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
          state.token = tokenStorage.getAccessToken();
          state.refreshToken = tokenStorage.getRefreshToken();
          appLogger.auth('Session restored', { email: action.payload.email });
        } else {
          state.user = null;
          state.isAuthenticated = false;
          state.token = null;
          state.refreshToken = null;
        }
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        const status = (action.payload as { status?: number } | undefined)?.status;
        if (status === 401 || status === 403 || !tokenStorage.getAccessToken()) {
          state.isAuthenticated = false;
          state.token = null;
          state.refreshToken = null;
          state.user = null;
        } else {
          state.isAuthenticated = !!tokenStorage.getAccessToken();
          state.token = tokenStorage.getAccessToken();
          state.refreshToken = tokenStorage.getRefreshToken();
        }
      });
  },
});

// Thunk to check authentication status on app start
export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    if (!tokenStorage.hasTokens()) {
      if (tokenStorage.getAccessToken() || tokenStorage.getRefreshToken()) {
        tokenStorage.clearTokens();
      }
      return null;
    }

    try {
      return await authAPI.getProfile();
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        tokenStorage.clearTokens();
      }
      return rejectWithValue({
        message: error.response?.data?.message || 'Authentication failed',
        status,
      });
    }
  }
);

// Create aliases for the component naming convention
export const loginUser = login;
export const registerUser = register;

export const { clearError, clearSession, setTokens } = authSlice.actions;
export default authSlice.reducer;
