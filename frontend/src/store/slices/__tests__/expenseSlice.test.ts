import { configureStore } from '@reduxjs/toolkit';
import expenseReducer, {
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  clearError,
  setCurrentExpense,
} from '../expenseSlice';

describe('expenseSlice', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        expenses: expenseReducer,
      },
    });
  });

  describe('reducer', () => {
    it('should handle initial state', () => {
      expect(store.getState().expenses).toEqual({
        expenses: [],
        currentExpense: null,
        loading: false,
        error: null,
        totalCount: 0,
        filters: {
          search: '',
          category: null,
          dateRange: null,
          groupId: null,
        },
      });
    });

    it('should handle clearError', () => {
      store.dispatch(clearError());
      expect(store.getState().expenses.error).toBeNull();
    });

    it('should handle setCurrentExpense', () => {
      const expense = { id: '1', description: 'Test', amount: 100 };
      store.dispatch(setCurrentExpense(expense));
      expect(store.getState().expenses.currentExpense).toEqual(expense);
    });
  });

  describe('async thunks', () => {
    it('should handle fetchExpenses.pending', () => {
      store.dispatch(fetchExpenses.pending('', {}));
      expect(store.getState().expenses.loading).toBe(true);
      expect(store.getState().expenses.error).toBeNull();
    });

    it('should handle fetchExpenses.fulfilled', () => {
      const expenses = [
        { id: '1', description: 'Test 1', amount: 100 },
        { id: '2', description: 'Test 2', amount: 200 },
      ];
      store.dispatch(fetchExpenses.fulfilled(expenses, '', {}));
      expect(store.getState().expenses.loading).toBe(false);
      expect(store.getState().expenses.expenses).toEqual(expenses);
    });

    it('should handle fetchExpenses.rejected', () => {
      const error = 'Failed to fetch';
      store.dispatch(fetchExpenses.rejected(null, '', {}, error));
      expect(store.getState().expenses.loading).toBe(false);
      expect(store.getState().expenses.error).toBe(error);
    });

    it('should handle createExpense.fulfilled', () => {
      const newExpense = { id: '3', description: 'New', amount: 300 };
      store.dispatch(createExpense.fulfilled(newExpense, '', {}));
      expect(store.getState().expenses.expenses).toContainEqual(newExpense);
    });

    it('should handle updateExpense.fulfilled', () => {
      // First add an expense
      const expense = { id: '1', description: 'Original', amount: 100 };
      store.dispatch(createExpense.fulfilled(expense, '', {}));
      
      // Then update it
      const updated = { ...expense, description: 'Updated' };
      store.dispatch(updateExpense.fulfilled(updated, '', { id: '1', data: {} }));
      
      const expenses = store.getState().expenses.expenses;
      expect(expenses.find((e: any) => e.id === '1').description).toBe('Updated');
    });

    it('should handle deleteExpense.fulfilled', () => {
      // First add expenses
      const expense1 = { id: '1', description: 'Test 1', amount: 100 };
      const expense2 = { id: '2', description: 'Test 2', amount: 200 };
      store.dispatch(createExpense.fulfilled(expense1, '', {}));
      store.dispatch(createExpense.fulfilled(expense2, '', {}));
      
      // Then delete one
      store.dispatch(deleteExpense.fulfilled('1', '', '1'));
      
      const expenses = store.getState().expenses.expenses;
      expect(expenses).toHaveLength(1);
      expect(expenses[0].id).toBe('2');
    });
  });
});

// API Mock tests
describe('Expense API calls', () => {
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should call API with correct parameters for fetchExpenses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const dispatch = jest.fn();
    const getState = jest.fn();
    
    const action = fetchExpenses({ search: 'test', category_id: '1' });
    await action(dispatch, getState, undefined);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/expenses/expenses/'),
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const dispatch = jest.fn();
    const getState = jest.fn();
    
    const action = fetchExpenses({});
    await action(dispatch, getState, undefined);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: fetchExpenses.rejected.type,
      })
    );
  });
});
