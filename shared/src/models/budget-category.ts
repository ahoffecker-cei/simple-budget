export interface BudgetCategory {
  categoryId: string;
  userId: string;
  name: string;
  monthlyLimit: number;
  isEssential: boolean;
  description?: string;
  createdAt: string;
}

export interface CreateBudgetCategoryRequest {
  name: string;
  monthlyLimit: number;
  isEssential: boolean;
  description?: string;
}

export interface UpdateBudgetCategoryRequest {
  name: string;
  monthlyLimit: number;
  isEssential: boolean;
  description?: string;
}

export interface BudgetCategoryWithSpending {
  categoryId: string;
  name: string;
  monthlyLimit: number;
  isEssential: boolean;
  description?: string;
  currentSpending: number;
  remainingBudget: number;
}

export interface BudgetValidationResult {
  isValid: boolean;
  errorMessage?: string;
  totalBudget: number;
  userIncome: number;
  remainingIncome: number;
}

export interface DefaultBudgetCategory {
  name: string;
  isEssential: boolean;
  description: string;
  suggestedLimit?: number;
}