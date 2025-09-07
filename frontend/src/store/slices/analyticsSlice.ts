import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsAPI } from '../../services/api';

interface CategoryBreakdown {
  category: {
    id: string;
    name: string;
  };
  total_amount: number;
  percentage: number;
}

interface MonthlyTrend {
  month: string;
  total_amount: number;
  expense_count: number;
}

interface AnalyticsSummary {
  total_expenses: number;
  expense_count: number;
  average_expense: number;
  most_expensive_category: string;
  most_frequent_category: string;
  period: {
    start_date: string;
    end_date: string;
  };
}

interface AnalyticsState {
  summary: AnalyticsSummary | null;
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrends: MonthlyTrend[];
  loading: boolean;
  error: string | null;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

const initialState: AnalyticsState = {
  summary: null,
  categoryBreakdown: [],
  monthlyTrends: [],
  loading: false,
  error: null,
  dateRange: {
    startDate: '',
    endDate: '',
  },
};

// Async thunks
export const fetchAnalyticsSummary = createAsyncThunk(
  'analytics/fetchSummary',
  async (params: {
    startDate?: string;
    endDate?: string;
    groupId?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await analyticsAPI.getDashboardStats(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch analytics summary');
    }
  }
);

export const fetchCategoryBreakdown = createAsyncThunk(
  'analytics/fetchCategoryBreakdown',
  async (params: {
    startDate?: string;
    endDate?: string;
    groupId?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await analyticsAPI.getCategoryBreakdown(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch category breakdown');
    }
  }
);

export const fetchMonthlyTrends = createAsyncThunk(
  'analytics/fetchMonthlyTrends',
  async (params: {
    startDate?: string;
    endDate?: string;
    groupId?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await analyticsAPI.getExpenseTrends(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch monthly trends');
    }
  }
);

export const exportReport = createAsyncThunk(
  'analytics/exportReport',
  async (params: {
    format: 'csv' | 'pdf';
    startDate?: string;
    endDate?: string;
    groupId?: string;
  }, { rejectWithValue }) => {
    try {
      const { format, ...restParams } = params;
      const response = await analyticsAPI.exportData(format, restParams);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to export report');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
    },
    resetAnalytics: (state) => {
      state.summary = null;
      state.categoryBreakdown = [];
      state.monthlyTrends = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch summary
      .addCase(fetchAnalyticsSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalyticsSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchAnalyticsSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch category breakdown
      .addCase(fetchCategoryBreakdown.fulfilled, (state, action) => {
        state.categoryBreakdown = action.payload;
      })
      // Fetch monthly trends
      .addCase(fetchMonthlyTrends.fulfilled, (state, action) => {
        state.monthlyTrends = action.payload;
      })
      // Export report
      .addCase(exportReport.fulfilled, (state, action) => {
        // Handle successful export (maybe show success message)
        // The actual file download should be handled in the component
      });
  },
});

export const { clearError, setDateRange, resetAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;
