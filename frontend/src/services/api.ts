import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

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
    const token = localStorage.getItem('access_token');
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

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${BASE_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
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
};

// Expenses API
export const expensesAPI = {
  getExpenses: (params?: any) =>
    api.get('/expenses/expenses/', { params }).then(res => res.data),
  
  createExpense: (data: any) =>
    api.post('/expenses/expenses/', data).then(res => res.data),
  
  updateExpense: (id: string, data: any) =>
    api.patch(`/expenses/expenses/${id}/`, data).then(res => res.data),
  
  deleteExpense: (id: string) =>
    api.delete(`/expenses/expenses/${id}/`).then(res => res.data),
  
  getExpenseComments: (expenseId: string) =>
    api.get(`/expenses/expenses/${expenseId}/comments/`).then(res => res.data),
  
  addExpenseComment: (expenseId: string, data: { comment: string }) =>
    api.post(`/expenses/expenses/${expenseId}/comments/`, data).then(res => res.data),
};

// Groups API
export const groupsAPI = {
  getGroups: (params?: any) =>
    api.get('/groups/groups/', { params }).then(res => res.data),
  
  createGroup: (data: any) =>
    api.post('/groups/groups/', data).then(res => res.data),
  
  updateGroup: (id: string, data: any) =>
    api.patch(`/groups/groups/${id}/`, data).then(res => res.data),
  
  deleteGroup: (id: string) =>
    api.delete(`/groups/groups/${id}/`).then(res => res.data),
  
  getGroupBalances: (groupId: string) =>
    api.get(`/groups/groups/${groupId}/balances/`).then(res => res.data),
  
  inviteToGroup: (groupId: string, data: { email?: string; phone_number?: string; message?: string }) =>
    api.post(`/groups/groups/${groupId}/invite/`, data).then(res => res.data),
  
  joinGroup: (inviteCode: string) =>
    api.post(`/groups/groups/join/`, { invite_code: inviteCode }).then(res => res.data),
  
  leaveGroup: (groupId: string) =>
    api.post(`/groups/groups/${groupId}/leave/`).then(res => res.data),
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
  
  exportData: (format: 'csv' | 'pdf', params?: any) =>
    api.get(`/analytics/export/${format}/`, { 
      params,
      responseType: 'blob'
    }).then(res => res.data),
};

export default api;
