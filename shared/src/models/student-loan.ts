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