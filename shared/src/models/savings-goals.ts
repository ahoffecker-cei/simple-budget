export interface SavingsGoal {
  savingsGoalId: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentProgress: number;
  monthlySavingsTarget?: number;
  createdAt: string;
  lastUpdated: string;
}

export interface CreateSavingsGoalRequest {
  name: string;
  targetAmount: number;
  monthlySavingsTarget?: number;
}

export interface UpdateSavingsGoalRequest {
  name: string;
  targetAmount: number;
  monthlySavingsTarget?: number;
}

export interface SavingsGoalProgress {
  savingsGoalId: string;
  name: string;
  targetAmount: number;
  currentProgress: number;
  percentageComplete: number;
  monthlyContributions: number;
  monthlySavingsTarget?: number;
}

export interface ContributeToSavingsGoalRequest {
  amount: number;
  description?: string;
}