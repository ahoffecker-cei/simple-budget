export interface SavingsGoal {
  savingsGoalId: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentProgress: number;
  createdAt: string;
  lastUpdated: string;
}

export interface CreateSavingsGoalRequest {
  name: string;
  targetAmount: number;
}

export interface UpdateSavingsGoalRequest {
  name: string;
  targetAmount: number;
}

export interface SavingsGoalProgress {
  savingsGoalId: string;
  name: string;
  targetAmount: number;
  currentProgress: number;
  percentageComplete: number;
  monthlyContributions: number;
}

export interface ContributeToSavingsGoalRequest {
  amount: number;
  description?: string;
}