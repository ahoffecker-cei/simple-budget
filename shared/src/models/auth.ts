import { User } from './user';

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

// Re-export User interface from user.ts
export type { User } from './user';