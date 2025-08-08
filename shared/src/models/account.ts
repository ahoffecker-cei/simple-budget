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