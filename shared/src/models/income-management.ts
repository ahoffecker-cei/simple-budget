export interface IncomeSource {
  incomeSourceId: string;
  userId: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  createdAt: string;
}

export interface CreateIncomeSourceRequest {
  name: string;
  amount: number;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
}

export interface UpdateIncomeSourceRequest {
  name: string;
  amount: number;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
}

export interface IncomeManagementResponse {
  incomeSources: IncomeSource[];
  totalMonthlyIncome: number;
  lastUpdated: string;
}