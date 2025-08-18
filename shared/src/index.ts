// Complete Model Definitions - Corrected from Original Files

// User models
export interface User {
  userId: string;
  email: string;
  firstName: string;
  monthlyIncome: number;
  studentLoanPayment: number;
  studentLoanBalance: number;
  createdAt: string;
  lastLoginAt: string;
  // New property for detailed loan information
  studentLoanSummary?: StudentLoanSummary;
}

// Auth models
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  monthlyIncome: number;
  studentLoanPayment?: number;
  studentLoanBalance?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: string;
}

export interface ErrorResponse {
  error: ErrorDetails;
}

export interface ErrorDetails {
  code: string;
  message: string;
  timestamp: string;
  requestId: string;
}

// Account models
export enum AccountType {
  Checking = 'checking',
  Savings = 'savings',
  Retirement = 'retirement'
}

export interface Account {
  accountId: string;
  userId: string;
  accountType: AccountType;
  accountName: string;
  currentBalance: number;
  lastUpdated: string;
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

// Student Loan models
export interface StudentLoan {
  id: string;
  userId: string;
  servicerName: string;
  accountNumber: string;
  balance: number;
  interestRate: number;
  monthlyPayment: number;
  loanType: 'federal' | 'private';
  status: 'active' | 'paid_off' | 'deferred' | 'forbearance';
  createdAt: string;
  updatedAt: string;
}

export interface StudentLoanSummary {
  totalBalance: number;
  totalMonthlyPayment: number;
  averageInterestRate: number;
  totalLoans: number;
  loans: StudentLoan[];
}

// Budget Category models
export interface BudgetCategory {
  categoryId: string;
  name: string;
  monthlyLimit: number;
  currentSpending: number;
  isEssential: boolean;
  description?: string;
  colorId: string;
  iconId: string;
  color?: string;
  icon?: string;
}

// Dashboard models
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

// Expense models
export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId?: string;
  userId: string;
}

// Budget Wizard models
export interface BudgetWizardRequest {
  monthlyIncome: number;
  studentLoanPayment?: number;
  studentLoanBalance?: number;
  majorExpenses: {
    rent?: number;
    utilities?: number;
    transportation?: number;
    [key: string]: number | undefined;
  };
  savingsGoal?: number;
}

export interface BudgetWizardResponse {
  userProfile: User;
  budgetHealth: BudgetWizardHealthStatus;
  message: string;
}

export interface BudgetWizardHealthStatus {
  totalIncome: number;
  totalExpenses: number;
  studentLoanPayments: number;
  availableForSavings: number;
  savingsGoal: number;
  healthRating: string;
  recommendations: string[];
}

// Category customization models
export interface CategoryColor {
  id: string;
  name: string;
  value: string;
  textColor: string; // For contrast
}

export interface CategoryIcon {
  id: string;
  name: string;
  materialIcon: string;
}

export const CATEGORY_COLORS: CategoryColor[] = [
  { id: 'blue', name: 'Blue', value: '#2196F3', textColor: '#ffffff' },
  { id: 'indigo', name: 'Indigo', value: '#3F51B5', textColor: '#ffffff' },
  { id: 'purple', name: 'Purple', value: '#9C27B0', textColor: '#ffffff' },
  { id: 'pink', name: 'Pink', value: '#E91E63', textColor: '#ffffff' },
  { id: 'red', name: 'Red', value: '#F44336', textColor: '#ffffff' },
  { id: 'orange', name: 'Orange', value: '#FF9800', textColor: '#ffffff' },
  { id: 'amber', name: 'Amber', value: '#FFC107', textColor: '#000000' },
  { id: 'yellow', name: 'Yellow', value: '#FFEB3B', textColor: '#000000' },
  { id: 'lime', name: 'Lime', value: '#CDDC39', textColor: '#000000' },
  { id: 'green', name: 'Green', value: '#4CAF50', textColor: '#ffffff' },
  { id: 'teal', name: 'Teal', value: '#009688', textColor: '#ffffff' },
  { id: 'cyan', name: 'Cyan', value: '#00BCD4', textColor: '#ffffff' },
  { id: 'light-blue', name: 'Light Blue', value: '#03A9F4', textColor: '#ffffff' },
  { id: 'deep-purple', name: 'Deep Purple', value: '#673AB7', textColor: '#ffffff' },
  { id: 'deep-orange', name: 'Deep Orange', value: '#FF5722', textColor: '#ffffff' },
  { id: 'brown', name: 'Brown', value: '#795548', textColor: '#ffffff' },
  { id: 'grey', name: 'Grey', value: '#9E9E9E', textColor: '#ffffff' },
  { id: 'blue-grey', name: 'Blue Grey', value: '#607D8B', textColor: '#ffffff' },
  { id: 'emerald', name: 'Emerald', value: '#10B981', textColor: '#ffffff' },
  { id: 'rose', name: 'Rose', value: '#F43F5E', textColor: '#ffffff' },
  { id: 'violet', name: 'Violet', value: '#8B5CF6', textColor: '#ffffff' },
  { id: 'sky', name: 'Sky', value: '#0EA5E9', textColor: '#ffffff' },
  { id: 'mint', name: 'Mint', value: '#06D6A0', textColor: '#ffffff' },
  { id: 'coral', name: 'Coral', value: '#FF6B6B', textColor: '#ffffff' },
  { id: 'lavender', name: 'Lavender', value: '#A78BFA', textColor: '#ffffff' },
  { id: 'peach', name: 'Peach', value: '#FBBF24', textColor: '#000000' },
  { id: 'turquoise', name: 'Turquoise', value: '#14B8A6', textColor: '#ffffff' },
  { id: 'slate', name: 'Slate', value: '#64748B', textColor: '#ffffff' },
  { id: 'crimson', name: 'Crimson', value: '#DC143C', textColor: '#ffffff' },
  { id: 'forest', name: 'Forest', value: '#22C55E', textColor: '#ffffff' }
];

export const CATEGORY_ICONS: CategoryIcon[] = [
  { id: 'home', name: 'Home', materialIcon: 'home' },
  { id: 'restaurant', name: 'Food', materialIcon: 'restaurant' },
  { id: 'directions_car', name: 'Transportation', materialIcon: 'directions_car' },
  { id: 'shopping_cart', name: 'Shopping', materialIcon: 'shopping_cart' },
  { id: 'local_hospital', name: 'Healthcare', materialIcon: 'local_hospital' },
  { id: 'school', name: 'Education', materialIcon: 'school' },
  { id: 'movie', name: 'Entertainment', materialIcon: 'movie' },
  { id: 'fitness_center', name: 'Fitness', materialIcon: 'fitness_center' },
  { id: 'pets', name: 'Pets', materialIcon: 'pets' },
  { id: 'child_care', name: 'Childcare', materialIcon: 'child_care' },
  { id: 'phone', name: 'Phone', materialIcon: 'phone' },
  { id: 'wifi', name: 'Internet', materialIcon: 'wifi' },
  { id: 'electric_bolt', name: 'Utilities', materialIcon: 'electric_bolt' },
  { id: 'savings', name: 'Savings', materialIcon: 'savings' },
  { id: 'account_balance', name: 'Banking', materialIcon: 'account_balance' },
  { id: 'credit_card', name: 'Credit Card', materialIcon: 'credit_card' },
  { id: 'work', name: 'Work', materialIcon: 'work' },
  { id: 'flight', name: 'Travel', materialIcon: 'flight' },
  { id: 'local_gas_station', name: 'Gas', materialIcon: 'local_gas_station' },
  { id: 'local_grocery_store', name: 'Groceries', materialIcon: 'local_grocery_store' },
  { id: 'spa', name: 'Personal Care', materialIcon: 'spa' },
  { id: 'sports_esports', name: 'Gaming', materialIcon: 'sports_esports' },
  { id: 'library_books', name: 'Books', materialIcon: 'library_books' },
  { id: 'music_note', name: 'Music', materialIcon: 'music_note' },
  { id: 'camera_alt', name: 'Photography', materialIcon: 'camera_alt' },
  { id: 'build', name: 'Tools', materialIcon: 'build' },
  { id: 'park', name: 'Recreation', materialIcon: 'park' },
  { id: 'restaurant_menu', name: 'Dining Out', materialIcon: 'restaurant_menu' },
  { id: 'local_cafe', name: 'Coffee', materialIcon: 'local_cafe' },
  { id: 'shopping_bag', name: 'Clothing', materialIcon: 'shopping_bag' }
];

export const DEFAULT_CATEGORY_COLOR = 'blue';
export const DEFAULT_CATEGORY_ICON = 'home';

// Budget Impact models
export interface BudgetImpact {
  categoryId: string;
  categoryName: string;
  currentSpending: number;
  monthlyLimit: number;
  projectedImpact: number;
  healthStatusAfter: 'excellent' | 'good' | 'attention' | 'concern';
}

export interface BudgetImpactResponse {
  canAfford: boolean;
  impacts: BudgetImpact[];
  overallHealthAfter: 'excellent' | 'good' | 'attention' | 'concern';
}

// Health status types
export interface BudgetHealthByClassification {
  essentialSpending: number;
  essentialLimit: number;
  nonEssentialSpending: number;
  nonEssentialLimit: number;
  essentialHealthStatus: 'excellent' | 'good' | 'attention' | 'concern';
  nonEssentialHealthStatus: 'excellent' | 'good' | 'attention' | 'concern';
}

// Additional Budget Category interfaces
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

// Dashboard Overview models
export interface DashboardOverview {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  budgetSummary: BudgetCategory[];
  recentExpenses: Expense[];
  accounts: Account[];
}