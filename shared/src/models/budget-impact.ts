export interface BudgetImpactPreview {
  categoryId: string;
  categoryName: string;
  currentSpent: number;
  monthlyLimit: number;
  remainingAfterExpense: number;
  percentageUsed: number;
  healthStatus: 'excellent' | 'good' | 'attention' | 'concern';
  isEssential: boolean;
  impactMessage: string;
  encouragementLevel: 'celebration' | 'encouragement' | 'guidance' | 'support';
}

export interface BudgetImpactPreviewRequest {
  categoryId: string;
  amount: number;
  expenseDate?: string;
}

export interface MonthlyProgressData {
  categoryId: string;
  categoryName: string;
  currentSpent: number;
  monthlyLimit: number;
  percentageUsed: number;
  isEssential: boolean;
  healthStatus: 'excellent' | 'good' | 'attention' | 'concern';
  daysRemainingInMonth: number;
  projectedSpending: number;
  colorId: string;
  iconId: string;
}

export interface OverallBudgetHealth {
  overallStatus: 'excellent' | 'good' | 'attention' | 'concern';
  totalBudgeted: number;
  totalSpent: number;
  percentageUsed: number;
  essentialCategoriesHealth: 'excellent' | 'good' | 'attention' | 'concern';
  nonEssentialCategoriesHealth: 'excellent' | 'good' | 'attention' | 'concern';
  healthMessage: string;
  encouragementMessage: string;
}

export type BudgetHealthStatus = 'excellent' | 'good' | 'attention' | 'concern';
export type EncouragementLevel = 'celebration' | 'encouragement' | 'guidance' | 'support';