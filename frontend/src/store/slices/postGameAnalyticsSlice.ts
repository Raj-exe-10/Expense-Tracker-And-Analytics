import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsAPI } from '../../services/api';

export interface PostGameParams {
  year?: number;
  month?: number;
  scope?: 'personal' | 'group' | 'combined';
}

export const fetchPostGameAnalytics = createAsyncThunk(
  'postGame/fetch',
  async (params: PostGameParams, { rejectWithValue }) => {
    try {
      return await analyticsAPI.getPostGame(params);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to load post-game analytics');
    }
  }
);

interface PostGameState {
  data: any | null;
  loading: boolean;
  error: string | null;
  invalidateVersion: number;
}

const initialState: PostGameState = {
  data: null,
  loading: false,
  error: null,
  invalidateVersion: 0,
};

const postGameAnalyticsSlice = createSlice({
  name: 'postGame',
  initialState,
  reducers: {
    invalidatePostGame: (state) => {
      state.invalidateVersion += 1;
    },
    clearPostGame: (state) => {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPostGameAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPostGameAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchPostGameAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { invalidatePostGame, clearPostGame } = postGameAnalyticsSlice.actions;
export default postGameAnalyticsSlice.reducer;
