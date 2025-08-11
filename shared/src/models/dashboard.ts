import { Account } from './account';

export interface DashboardResponse {
  overallHealthStatus: 'excellent' | 'good' | 'attention' | 'concern';
  totalNetWorth: number;
  accounts: Account[];
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