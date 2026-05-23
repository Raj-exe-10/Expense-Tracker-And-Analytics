/** App route paths (authenticated shell lives under /app). */
export const paths = {
  expenses: '/app/expenses',
  expenseDetail: (id: string) => `/app/expenses/${id}`,
  expenseEdit: (id: string) => `/app/expenses/${id}/edit`,
  addExpense: '/app/add',
};
