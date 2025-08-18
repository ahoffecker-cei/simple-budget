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

import { User } from './user';