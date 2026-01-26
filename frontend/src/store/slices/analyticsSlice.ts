import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsAPI } from '../../services/api';

interface CategoryBreakdown {
  category_id?: string;
  category_name?: string;
  category?: {
    id: string;
    name: string;
  };
  amount?: number;
  value?: number;
  total_amount?: number;
  count?: number;
  percentage: number;
  color?: string;
  icon?: string;
}

interface MonthlyTrend {
  month?: string;
  date?: string;
  expense_date?: string;
  total_amount?: number;
  amount?: number;
  expense_count?: number;
  count?: number;
}

interface AnalyticsSummary {
  total_expenses: number;
  expense_count: number;
  average_expense: number;
  most_expensive_category: string;
  most_frequent_category: string;
  change_percentage?: number;
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
      
      // response should be a Blob for file downloads
      if (response instanceof Blob) {
        const url = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = url;
        const dateStr = params.startDate && params.endDate 
          ? `${params.startDate}_${params.endDate}`
          : new Date().toISOString().split('T')[0];
        link.download = `expenses_export_${dateStr}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return { success: true, format, message: 'Export downloaded successfully' };
      }
      
      return { success: true, data: response };
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
        // Backend returns the data directly, not nested
        state.summary = {
          total_expenses: action.payload.total_expenses || 0,
          expense_count: action.payload.expense_count || 0,
          average_expense: action.payload.average_expense || 0,
          most_expensive_category: action.payload.category_breakdown?.[0]?.category__name || '',
          most_frequent_category: action.payload.category_breakdown?.[0]?.category__name || '',
          period: action.payload.period || { start_date: '', end_date: '' }
        };
      })
      .addCase(fetchAnalyticsSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch category breakdown
      .addCase(fetchCategoryBreakdown.fulfilled, (state, action) => {
        // Backend returns { breakdown: [...], total: ..., period: {...} }
        state.categoryBreakdown = action.payload.breakdown || action.payload || [];
      })
      // Fetch monthly trends
      .addCase(fetchMonthlyTrends.fulfilled, (state, action) => {
        // Backend returns { trends: [...], period: {...} }
        state.monthlyTrends = action.payload.trends || action.payload || [];
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
