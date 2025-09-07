import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { coreAPI } from '../../services/api';

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
}

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
}

interface Tag {
  id: string;
  name: string;
  color?: string;
}

interface CoreState {
  categories: Category[];
  currencies: Currency[];
  tags: Tag[];
  loading: boolean;
  error: string | null;
}

const initialState: CoreState = {
  categories: [],
  currencies: [],
  tags: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchCategories = createAsyncThunk(
  'core/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await coreAPI.getCategories();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch categories');
    }
  }
);

export const fetchCurrencies = createAsyncThunk(
  'core/fetchCurrencies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await coreAPI.getCurrencies();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch currencies');
    }
  }
);

export const fetchTags = createAsyncThunk(
  'core/fetchTags',
  async (_, { rejectWithValue }) => {
    try {
      const response = await coreAPI.getTags();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch tags');
    }
  }
);

export const convertCurrency = createAsyncThunk(
  'core/convertCurrency',
  async (data: { from_currency: string; to_currency: string; amount: number }, { rejectWithValue }) => {
    try {
      const response = await coreAPI.convertCurrency(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to convert currency');
    }
  }
);

const coreSlice = createSlice({
  name: 'core',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch currencies
      .addCase(fetchCurrencies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrencies.fulfilled, (state, action) => {
        state.loading = false;
        state.currencies = action.payload;
      })
      .addCase(fetchCurrencies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch tags
      .addCase(fetchTags.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.loading = false;
        state.tags = action.payload;
      })
      .addCase(fetchTags.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = coreSlice.actions;
export default coreSlice.reducer;
