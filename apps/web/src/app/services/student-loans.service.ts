import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StudentLoanSummary, StudentLoan } from '@simple-budget/shared';
import { environment } from '../../environments/environment';

export interface CreateStudentLoanRequest {
  servicerName: string;
  accountNumber: string;
  balance: number;
  interestRate: number;
  monthlyPayment: number;
  loanType: 'federal' | 'private';
  status: 'active' | 'deferred' | 'forbearance' | 'paid_off';
}

export interface UpdateStudentLoanRequest {
  servicerName: string;
  accountNumber: string;
  balance: number;
  interestRate: number;
  monthlyPayment: number;
  loanType: 'federal' | 'private';
  status: 'active' | 'deferred' | 'forbearance' | 'paid_off';
}

@Injectable({
  providedIn: 'root'
})
export class StudentLoansService {
  private readonly apiUrl = `${environment.apiBaseUrl.replace('/api/v1', '')}/api/StudentLoans`;

  constructor(private http: HttpClient) {}

  getStudentLoans(): Observable<StudentLoanSummary> {
    return this.http.get<StudentLoanSummary>(this.apiUrl);
  }

  getStudentLoan(id: string): Observable<StudentLoan> {
    return this.http.get<StudentLoan>(`${this.apiUrl}/${id}`);
  }

  createStudentLoan(loan: CreateStudentLoanRequest): Observable<StudentLoan> {
    return this.http.post<StudentLoan>(this.apiUrl, loan);
  }

  updateStudentLoan(id: string, loan: UpdateStudentLoanRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, loan);
  }

  deleteStudentLoan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}