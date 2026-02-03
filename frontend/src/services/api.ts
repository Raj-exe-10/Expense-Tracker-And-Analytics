import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { tokenStorage } from '../utils/storage';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: AxiosRequestConfig | any) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${BASE_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          tokenStorage.setAccessToken(access);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          tokenStorage.clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login/', credentials).then(res => res.data),

  register: (userData: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    password_confirm: string;
  }) => api.post('/auth/register/', userData).then(res => res.data),

  logout: (data: { refresh: string }) =>
    api.post('/auth/logout/', data).then(res => res.data),

  getProfile: () =>
    api.get('/auth/me/').then(res => res.data),

  updateProfile: (data: any) =>
    api.patch('/auth/me/', data).then(res => res.data),

  changePassword: (data: {
    current_password: string;
    new_password: string;
    new_password_confirm: string;
  }) => api.post('/auth/password/change/', data).then(res => res.data),

  requestPasswordReset: (data: { email: string }) =>
    api.post('/auth/password/reset/', data).then(res => res.data),

  resetPassword: (data: { uid: string; token: string; new_password: string; new_password_confirm: string }) =>
    api.post('/auth/password/reset/confirm/', data).then(res => res.data),
};

// Expenses API
export const expensesAPI = {
  getExpenses: (params?: any) =>
    api.get('/expenses/expenses/', { params }).then(res => res.data),

  getExpenseById: (id: string) =>
    api.get(`/expenses/expenses/${id}/`).then(res => res.data),

  createExpense: (data: any) => {
    // If data is FormData, don't set Content-Type header (browser will set it with boundary)
    const config = data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    return api.post('/expenses/expenses/', data, config).then(res => res.data);
  },

  updateExpense: (id: string, data: any) =>
    api.patch(`/expenses/expenses/${id}/`, data).then(res => res.data),

  deleteExpense: (id: string) =>
    api.delete(`/expenses/expenses/${id}/`).then(res => res.data),

  settleExpense: (id: string) =>
    api.post(`/expenses/expenses/${id}/settle/`).then(res => res.data),

  getExpenseComments: (expenseId: string) =>
    api.get(`/expenses/expenses/${expenseId}/comments/`).then(res => res.data),

  addExpenseComment: (expenseId: string, data: { comment: string }) =>
    api.post(`/expenses/expenses/${expenseId}/add_comment/`, data).then(res => res.data),

  // Recurring Expenses
  getRecurringExpenses: (params?: any) =>
    api.get('/expenses/recurring/', { params }).then(res => res.data),

  getRecurringExpenseById: (id: string) =>
    api.get(`/expenses/recurring/${id}/`).then(res => res.data),

  createRecurringExpense: (data: any) =>
    api.post('/expenses/recurring/', data).then(res => res.data),

  updateRecurringExpense: (id: string, data: any) =>
    api.patch(`/expenses/recurring/${id}/`, data).then(res => res.data),

  deleteRecurringExpense: (id: string) =>
    api.delete(`/expenses/recurring/${id}/`).then(res => res.data),

  pauseRecurringExpense: (id: string) =>
    api.post(`/expenses/recurring/${id}/pause/`).then(res => res.data),

  resumeRecurringExpense: (id: string) =>
    api.post(`/expenses/recurring/${id}/resume/`).then(res => res.data),

  createNextExpense: (id: string) =>
    api.post(`/expenses/recurring/${id}/create_next_expense/`).then(res => res.data),
};

// Groups API
export const groupsAPI = {
  getGroups: (params?: any) =>
    api.get('/groups/groups/', { params }).then(res => res.data),

  getGroup: (id: string) =>
    api.get(`/groups/groups/${id}/`).then(res => res.data),

  createGroup: (data: any) =>
    api.post('/groups/groups/', data).then(res => res.data),

  updateGroup: (id: string, data: any) =>
    api.patch(`/groups/groups/${id}/`, data).then(res => res.data),

  deleteGroup: (id: string) =>
    api.delete(`/groups/groups/${id}/`).then(res => res.data),

  getGroupBalances: (groupId: string) =>
    api.get(`/groups/groups/${groupId}/balances/`).then(res => res.data),

  getGroupMembers: (groupId: string) =>
    api.get(`/groups/groups/${groupId}/members/`).then(res => res.data),

  getGroupActivities: (groupId: string) =>
    api.get(`/groups/groups/${groupId}/activities/`).then(res => res.data),

  getGroupStatistics: (groupId: string, days?: number) =>
    api.get(`/groups/groups/${groupId}/statistics/`, { params: { days } }).then(res => res.data),

  // Member management
  searchUsers: (query: string, groupId?: string) =>
    api.get('/groups/groups/search_users/', { params: { q: query, group_id: groupId } }).then(res => res.data),

  addMember: (groupId: string, userId: string, role?: string) =>
    api.post(`/groups/groups/${groupId}/add_member/`, { user_id: userId, role: role || 'member' }).then(res => res.data),

  removeMember: (groupId: string, userId: string) =>
    api.post(`/groups/groups/${groupId}/remove_member/`, { user_id: userId }).then(res => res.data),

  changeMemberRole: (groupId: string, userId: string, role: string) =>
    api.post(`/groups/groups/${groupId}/change_member_role/`, { user_id: userId, role }).then(res => res.data),

  // Invite management
  getInviteLink: (groupId: string, regenerate?: boolean) =>
    api.get(`/groups/groups/${groupId}/invite_link/`, { params: { regenerate } }).then(res => res.data),

  inviteToGroup: (groupId: string, data: { email?: string; phone_number?: string; message?: string }) =>
    api.post(`/groups/groups/${groupId}/invite_member/`, data).then(res => res.data),

  joinByCode: (inviteCode: string) =>
    api.post('/groups/groups/join_by_code/', { invite_code: inviteCode }).then(res => res.data),

  leaveGroup: (groupId: string) =>
    api.post(`/groups/groups/${groupId}/leave/`).then(res => res.data),

  settleAll: (groupId: string) =>
    api.post(`/groups/groups/${groupId}/settle_all/`).then(res => res.data),
};

// Core API
export const coreAPI = {
  getCurrencies: () =>
    api.get('/core/currencies/').then(res => res.data),

  getCategories: (params?: any) =>
    api.get('/core/categories/', { params }).then(res => res.data),

  getTags: (params?: any) =>
    api.get('/core/tags/', { params }).then(res => res.data),

  convertCurrency: (data: {
    from_currency: string;
    to_currency: string;
    amount: number;
  }) => api.post('/core/currencies/convert/', data).then(res => res.data),

  healthCheck: () =>
    api.get('/core/health/').then(res => res.data),
};

// Budget (Envelope) API
export const budgetAPI = {
  getWallets: () =>
    api.get('/budget/wallets/').then(res => res.data),
  createWallet: (data: { name: string; wallet_type?: string; rollover_enabled?: boolean; order?: number; color?: string }) =>
    api.post('/budget/wallets/', data).then(res => res.data),
  updateWallet: (id: string, data: any) =>
    api.patch(`/budget/wallets/${id}/`, data).then(res => res.data),
  deleteWallet: (id: string) =>
    api.delete(`/budget/wallets/${id}/`).then(res => res.data),

  getWalletCategories: (params?: any) =>
    api.get('/budget/wallet-categories/', { params }).then(res => res.data),
  assignCategoryToWallet: (data: { wallet: string; category: string }) =>
    api.post('/budget/wallet-categories/', data).then(res => res.data),
  removeWalletCategory: (id: string) =>
    api.delete(`/budget/wallet-categories/${id}/`).then(res => res.data),

  getUserCategories: (params?: any) =>
    api.get('/budget/user-categories/', { params }).then(res => res.data),
  createUserCategory: (data: { wallet: string; name: string; icon?: string; color?: string }) =>
    api.post('/budget/user-categories/', data).then(res => res.data),
  updateUserCategory: (id: string, data: any) =>
    api.patch(`/budget/user-categories/${id}/`, data).then(res => res.data),
  deleteUserCategory: (id: string) =>
    api.delete(`/budget/user-categories/${id}/`).then(res => res.data),

  getCurrentBudget: (params?: any) =>
    api.get('/budget/monthly-budgets/current/', { params }).then(res => res.data),
  getBudgetByMonth: (year: number, month: number) =>
    api.get('/budget/monthly-budgets/by-month/', { params: { year, month } }).then(res => res.data),
  getMonthlyBudgets: (params?: any) =>
    api.get('/budget/monthly-budgets/', { params }).then(res => res.data),
  createMonthlyBudget: (data: { year: number; month: number; total_amount: string | number; currency: string }) =>
    api.post('/budget/monthly-budgets/', data).then(res => res.data),
  updateMonthlyBudget: (id: string, data: any) =>
    api.patch(`/budget/monthly-budgets/${id}/`, data).then(res => res.data),
  applyRollover: (budgetId: string) =>
    api.post(`/budget/monthly-budgets/${budgetId}/apply-rollover/`).then(res => res.data),

  getAllocations: (params?: any) =>
    api.get('/budget/allocations/', { params }).then(res => res.data),
  createAllocation: (data: { monthly_budget: string; wallet: string; amount: string | number }) =>
    api.post('/budget/allocations/', data).then(res => res.data),
  updateAllocation: (id: string, data: any) =>
    api.patch(`/budget/allocations/${id}/`, data).then(res => res.data),
  deleteAllocation: (id: string) =>
    api.delete(`/budget/allocations/${id}/`).then(res => res.data),

  getAdjustments: (params?: any) =>
    api.get('/budget/adjustments/', { params }).then(res => res.data),
  createAdjustment: (data: { monthly_budget: string; wallet: string; amount: number; note?: string }) =>
    api.post('/budget/adjustments/', data).then(res => res.data),

  getBudgetCategories: (walletId?: string) =>
    api.get('/budget/categories/', { params: walletId ? { wallet_id: walletId } : {} }).then(res => res.data),
};

// Settlements API
export const settlementsAPI = {
  getSettlements: (params?: any) =>
    api.get('/payments/settlements/', { params }).then(res => res.data),

  getSettlementById: (id: string) =>
    api.get(`/payments/settlements/${id}/`).then(res => res.data),

  createSettlement: (data: any) =>
    api.post('/payments/settle/', data).then(res => res.data),

  updateSettlement: (id: string, data: any) =>
    api.patch(`/payments/settlements/${id}/`, data).then(res => res.data),

  confirmSettlement: (id: string) =>
    api.post(`/payments/settlements/${id}/confirm/`).then(res => res.data),

  completeSettlement: (id: string) =>
    api.post(`/payments/settlements/${id}/complete/`).then(res => res.data),

  rejectSettlement: (id: string, reason?: string) =>
    api.post(`/payments/settlements/${id}/reject/`, { reason }).then(res => res.data),

  sendSettlementReminder: (id: string) =>
    api.post(`/payments/settlements/${id}/send_reminder/`).then(res => res.data),

  getUserBalances: (params?: any) =>
    api.get('/payments/balances/', { params }).then(res => res.data),

  getGroupBalances: (groupId: string) =>
    api.get(`/payments/groups/${groupId}/balances/`).then(res => res.data),

  quickSettle: (data: { payee_id: string; amount: number; payment_method?: string; note?: string; group_id?: string; complete_immediately?: boolean }) =>
    api.post('/payments/quick-settle/', data).then(res => res.data),

  sendReminder: (data: { to_user_id: string; amount?: number; message?: string }) =>
    api.post('/payments/send-reminder/', data).then(res => res.data),

  getTransactionHistory: (params?: { status?: string; limit?: number }) =>
    api.get('/payments/history/', { params }).then(res => res.data),

  getExpenseSettlements: (params?: { status?: string }) =>
    api.get('/payments/expense-settlements/', { params }).then(res => res.data),

  settleExpenseShare: (shareId: string, data?: { payment_method?: string; note?: string }) =>
    api.post(`/payments/expense-settlements/${shareId}/settle/`, data).then(res => res.data),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params?: any) =>
    api.get('/notifications/notifications/', { params }).then(res => res.data),

  getNotificationById: (id: string) =>
    api.get(`/notifications/notifications/${id}/`).then(res => res.data),

  markAsRead: (id: string) =>
    api.post(`/notifications/notifications/${id}/mark_read/`).then(res => res.data),

  markAllAsRead: () =>
    api.post('/notifications/notifications/mark_all_read/').then(res => res.data),

  getUnreadCount: () =>
    api.get('/notifications/notifications/unread_count/').then(res => res.data),

  deleteNotification: (id: string) =>
    api.delete(`/notifications/notifications/${id}/`).then(res => res.data),

  getPreferences: () =>
    api.get('/notifications/preferences/').then(res => res.data),

  updatePreference: (id: string, data: any) =>
    api.patch(`/notifications/preferences/${id}/`, data).then(res => res.data),

  createPreference: (data: any) =>
    api.post('/notifications/preferences/', data).then(res => res.data),
};

// Analytics API
export const analyticsAPI = {
  getDashboardStats: (params?: any) =>
    api.get('/analytics/dashboard/', { params }).then(res => res.data),

  getExpenseTrends: (params?: any) =>
    api.get('/analytics/expenses/trends/', { params }).then(res => res.data),

  getCategoryBreakdown: (params?: any) =>
    api.get('/analytics/categories/breakdown/', { params }).then(res => res.data),

  getGroupAnalytics: (groupId: string, params?: any) =>
    api.get(`/analytics/groups/${groupId}/analytics/`, { params }).then(res => res.data),

  exportData: (format: 'csv' | 'pdf', params?: any) => {
    const config: any = { params };
    // Set responseType based on format
    if (format === 'csv') {
      config.responseType = 'blob';
      config.headers = { 'Accept': 'text/csv' };
    } else if (format === 'pdf') {
      config.responseType = 'blob';
      config.headers = { 'Accept': 'application/pdf' };
    }
    return api.get(`/analytics/export/${format}/`, config).then(res => res.data);
  },
};

export default api;
