import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';
import { tokenStorage } from '../../utils/storage';

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
  timezone: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | { detail?: string; message?: string } | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: tokenStorage.getAccessToken(),
  refreshToken: tokenStorage.getRefreshToken(),
  isLoading: false,
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
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch user');
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
    setTokens: (state, action: PayloadAction<{ access: string; refresh: string }>) => {
      state.token = action.payload.access;
      state.refreshToken = action.payload.refresh;
      localStorage.setItem('access_token', action.payload.access);
      localStorage.setItem('refresh_token', action.payload.refresh);
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
      .addCase(fetchUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        // Clear tokens if user fetch fails
        state.token = null;
        state.refreshToken = null;
        tokenStorage.clearTokens();
      })
      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.token = localStorage.getItem('access_token');
        state.refreshToken = localStorage.getItem('refresh_token');
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.refreshToken = null;
        state.user = null;
      });
  },
});

// Thunk to check authentication status on app start
export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        throw new Error('No token found');
      }
      
      // Verify token and get user data
      const response = await authAPI.getProfile();
      return response;
    } catch (error: any) {
      // Clear invalid tokens
      tokenStorage.clearTokens();
      return rejectWithValue(error.response?.data?.message || 'Authentication failed');
    }
  }
);

// Create aliases for the component naming convention
export const loginUser = login;
export const registerUser = register;

export const { clearError, setTokens } = authSlice.actions;
export default authSlice.reducer;
