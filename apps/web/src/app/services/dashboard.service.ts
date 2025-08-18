import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DashboardResponse, Account, CreateAccountRequest, UpdateAccountRequest, DashboardOverviewResponse, ExpenseWithCategory } from '@simple-budget/shared';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiBaseUrl}/dashboard`;
  private readonly accountsUrl = `${environment.apiBaseUrl}/accounts`;

  constructor(private http: HttpClient) { }

  getDashboard(): Observable<DashboardResponse> {
    console.log('DashboardService: Making API call to', this.apiUrl);
    return this.http.get<DashboardResponse>(this.apiUrl).pipe(
      tap(response => {
        console.log('DashboardService: API response received', response);
        console.log('Budget categories in response:', response.budgetCategories?.length || 0);
        response.budgetCategories?.forEach(cat => {
          console.log(`Category ${cat.name}: spending=${cat.currentSpending}, limit=${cat.monthlyLimit}`);
        });
      })
    );
  }

  getAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(this.accountsUrl);
  }

  createAccount(request: CreateAccountRequest): Observable<Account> {
    return this.http.post<Account>(this.accountsUrl, request);
  }

  updateAccount(accountId: string, request: UpdateAccountRequest): Observable<void> {
    return this.http.put<void>(`${this.accountsUrl}/${accountId}`, request);
  }

  deleteAccount(accountId: string): Observable<void> {
    return this.http.delete<void>(`${this.accountsUrl}/${accountId}`);
  }

  // Enhanced Dashboard API for Story 3.3
  getCompleteOverview(): Observable<DashboardOverviewResponse> {
    console.log('DashboardService: Making API call to', `${this.apiUrl}/complete-overview`);
    return this.http.get<DashboardOverviewResponse>(`${this.apiUrl}/complete-overview`).pipe(
      tap(response => {
        console.log('DashboardService: Complete overview API response received', response);
        console.log('Budget summary in response:', response.budgetSummary?.length || 0);
        console.log('Recent expenses in response:', response.recentExpenses?.length || 0);
        console.log('Monthly progress:', response.monthlyProgress);
      })
    );
  }

  getCategoryExpenses(categoryId: string, year?: number, month?: number): Observable<ExpenseWithCategory[]> {
    let params = '';
    if (year && month) {
      params = `?year=${year}&month=${month}`;
    }
    console.log('DashboardService: Getting category expenses for', categoryId);
    return this.http.get<ExpenseWithCategory[]>(`${this.apiUrl}/category/${categoryId}/expenses${params}`).pipe(
      tap(response => {
        console.log('DashboardService: Category expenses received', response.length, 'expenses');
      })
    );
  }
}