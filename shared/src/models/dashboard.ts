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