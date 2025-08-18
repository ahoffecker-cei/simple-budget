export interface BudgetCategory {
  categoryId: string;
  userId: string;
  name: string;
  monthlyLimit: number;
  isEssential: boolean;
  description?: string;
  colorId: string;
  iconId: string;
  createdAt: string;
}

export interface CreateBudgetCategoryRequest {
  name: string;
  monthlyLimit: number;
  isEssential: boolean;
  description?: string;
  colorId?: string;
  iconId?: string;
}

export interface UpdateBudgetCategoryRequest {
  name: string;
  monthlyLimit: number;
  isEssential: boolean;
  description?: string;
  colorId?: string;
  iconId?: string;
}

export interface BudgetCategoryWithSpending {
  categoryId: string;
  name: string;
  monthlyLimit: number;
  isEssential: boolean;
  description?: string;
  colorId: string;
  iconId: string;
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

export interface CategoryClassificationSuggestion {
  categoryName: string;
  suggestedIsEssential: boolean;
  confidence: number;
  reasoning: string;
}

export interface ClassificationUpdateRequest {
  categoryId: string;
  isEssential: boolean;
  userOverride?: boolean;
}

export interface BulkClassificationUpdateRequest {
  classifications: ClassificationUpdateRequest[];
}

export interface BudgetHealthByClassification {
  essentialSpending: number;
  essentialLimit: number;
  nonEssentialSpending: number;
  nonEssentialLimit: number;
  essentialHealthStatus: 'excellent' | 'good' | 'attention' | 'concern';
  nonEssentialHealthStatus: 'excellent' | 'good' | 'attention' | 'concern';
}