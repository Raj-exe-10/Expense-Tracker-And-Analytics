import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { expensesAPI } from '../../services/api';

interface Expense {
  id: string;
  title?: string;
  description: string;
  amount: number;
  category?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  };
  currency?: {
    id: string;
    code: string;
    symbol: string;
  };
  date?: string;
  expense_date?: string;
  created_by?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  paid_by?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  group?: {
    id: string;
    name: string;
  };
  shares?: Array<{
    user: {
      id: string;
      first_name: string;
      last_name: string;
    };
    amount: number;
    percentage?: number;
  }>;
  notes?: string;
  tags?: string[];
  receipt_image?: string;
  is_settled?: boolean;
  settled_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface ExpenseState {
  expenses: Expense[];
  currentExpense: Expense | null;
  loading: boolean;
  error: string | null;
  totalExpenses: number;
  filters: {
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    group?: string;
  };
}

const initialState: ExpenseState = {
  expenses: [],
  currentExpense: null,
  loading: false,
  error: null,
  totalExpenses: 0,
  filters: {},
};

// Async thunks
export const fetchExpenses = createAsyncThunk(
  'expenses/fetchExpenses',
  async (params: {
    page?: number;
    limit?: number;
    filters?: Record<string, any>;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await expensesAPI.getExpenses(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch expenses');
    }
  }
);

export const fetchExpenseById = createAsyncThunk(
  'expenses/fetchExpenseById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await expensesAPI.getExpenseById(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch expense');
    }
  }
);

export const createExpense = createAsyncThunk(
  'expenses/createExpense',
  async (expenseData: {
    description: string;
    amount: number;
    category_id: string;
    currency_id: string;
    date: string;
    group_id?: string;
    splits: Array<{
      user_id: string;
      amount: number;
    }>;
    receipt?: File;
  }, { rejectWithValue }) => {
    try {
      const response = await expensesAPI.createExpense(expenseData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create expense');
    }
  }
);

export const updateExpense = createAsyncThunk(
  'expenses/updateExpense',
  async ({ id, data }: { id: string; data: Partial<Expense> }, { rejectWithValue }) => {
    try {
      const response = await expensesAPI.updateExpense(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update expense');
    }
  }
);

export const deleteExpense = createAsyncThunk(
  'expenses/deleteExpense',
  async (id: string, { rejectWithValue }) => {
    try {
      await expensesAPI.deleteExpense(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete expense');
    }
  }
);

const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Record<string, any>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setCurrentExpense: (state, action: PayloadAction<Expense | null>) => {
      state.currentExpense = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch expenses
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        state.expenses = Array.isArray(payload)
          ? payload
          : (Array.isArray(payload?.results) ? payload.results : []);
        state.totalExpenses = typeof payload?.count === 'number'
          ? payload.count
          : state.expenses.length;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch expense by ID
      .addCase(fetchExpenseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenseById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentExpense = action.payload;
      })
      .addCase(fetchExpenseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create expense
      .addCase(createExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses.unshift(action.payload);
        state.totalExpenses += 1;
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update expense
      .addCase(updateExpense.fulfilled, (state, action) => {
        const index = state.expenses.findIndex(exp => exp.id === action.payload.id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
        if (state.currentExpense?.id === action.payload.id) {
          state.currentExpense = action.payload;
        }
      })
      // Delete expense
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter(exp => exp.id !== action.payload);
        state.totalExpenses -= 1;
        if (state.currentExpense?.id === action.payload) {
          state.currentExpense = null;
        }
      });
  },
});

export const { clearError, setFilters, clearFilters, setCurrentExpense } = expenseSlice.actions;
export default expenseSlice.reducer;
