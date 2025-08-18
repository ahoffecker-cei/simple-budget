export interface Expense {
  expenseId: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  description?: string;
  expenseDate: string;
  createdAt: string;
  isEssential: boolean;
}

export interface CreateExpenseRequest {
  categoryId: string;
  amount: number;
  description?: string;
  expenseDate?: string;
}

export interface ExpenseWithBudgetImpact {
  expense: Expense;
  categoryRemainingBudget: number;
  budgetHealthStatus: 'excellent' | 'good' | 'attention' | 'concern';
  categoryMonthlyLimit: number;
  categoryCurrentSpending: number;
}

export interface RecentExpensesResponse {
  expenses: Expense[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ExpenseListQueryParameters {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}