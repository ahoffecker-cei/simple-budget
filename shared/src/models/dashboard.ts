import { Account } from './account';

export interface DashboardResponse {
  overallHealthStatus: 'excellent' | 'good' | 'attention' | 'concern';
  totalNetWorth: number;
  accounts: Account[];
  budgetOverview?: BudgetOverviewData;
  budgetCategories: BudgetCategoryWithAllocation[];
}

export interface BudgetCategoryWithAllocation {
  categoryId: string;
  name: string;
  monthlyLimit: number;
  currentSpending: number;
  isEssential: boolean;
  description?: string;
  colorId: string;
  iconId: string;
  allocationPercentage: number;
  remainingAmount: number;
  healthStatus: 'excellent' | 'good' | 'attention' | 'concern';
}

export interface BudgetOverviewData {
  totalBudgetAllocated: number;
  totalIncome: number;
  budgetHealthStatus: 'excellent' | 'good' | 'attention' | 'concern';
  isSetupComplete: boolean;
  allocationPercentage: number;
}

export interface CreateAccountRequest {
  accountType: string;
  accountName: string;
  currentBalance: number;
}

export interface UpdateAccountRequest {
  accountName: string;
  currentBalance: number;
}

// Enhanced Dashboard Interfaces for Story 3.3
export interface DashboardOverviewResponse {
  overallHealthStatus: 'excellent' | 'good' | 'attention' | 'concern';
  overallHealthMessage: string;
  totalNetWorth: number;
  accounts: Account[];
  budgetSummary: BudgetCategorySummary[];
  recentExpenses: ExpenseWithCategory[];
  monthlyProgress: MonthlyProgressSummary;
}

export interface BudgetCategorySummary {
  categoryId: string;
  categoryName: string;
  monthlyLimit: number;
  currentSpent: number;
  remainingBudget: number;
  percentageUsed: number;
  healthStatus: 'excellent' | 'good' | 'attention' | 'concern';
  isEssential: boolean;
  colorId: string;
  iconId: string;
  expenseCount: number;
}

export interface ExpenseWithCategory {
  expenseId: string;
  amount: number;
  description?: string;
  expenseDate: string;
  createdAt: string;
  categoryName: string;
  categoryId: string;
  isEssential: boolean;
  colorId: string;
  iconId: string;
}

export interface MonthlyProgressSummary {
  totalBudgeted: number;
  totalSpent: number;
  percentageUsed: number;
  daysRemainingInMonth: number;
  projectedMonthlySpending: number;
  onTrackForMonth: boolean;
}