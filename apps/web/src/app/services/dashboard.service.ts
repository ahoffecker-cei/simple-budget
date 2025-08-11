import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardResponse, Account, CreateAccountRequest, UpdateAccountRequest } from '@simple-budget/shared';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiBaseUrl}/dashboard`;
  private readonly accountsUrl = `${environment.apiBaseUrl}/accounts`;

  constructor(private http: HttpClient) { }

  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(this.apiUrl);
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
}