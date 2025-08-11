import { StudentLoanSummary } from './student-loan';

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