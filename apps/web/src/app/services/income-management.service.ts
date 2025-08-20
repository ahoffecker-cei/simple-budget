import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { IncomeSource, CreateIncomeSourceRequest, UpdateIncomeSourceRequest, IncomeManagementResponse } from '@simple-budget/shared';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IncomeManagementService {
  private readonly apiUrl = `${environment.apiBaseUrl}/income-sources`;

  constructor(private http: HttpClient) { }

  getIncomeManagement(): Observable<IncomeManagementResponse> {
    return this.http.get<IncomeManagementResponse>(this.apiUrl).pipe(
      tap(response => {
        console.log('IncomeManagementService: Income management data received', response);
      })
    );
  }

  createIncomeSource(request: CreateIncomeSourceRequest): Observable<IncomeSource> {
    return this.http.post<IncomeSource>(this.apiUrl, request).pipe(
      tap(() => {
        console.log('IncomeManagementService: Income source created');
      })
    );
  }

  getIncomeSource(id: string): Observable<IncomeSource> {
    return this.http.get<IncomeSource>(`${this.apiUrl}/${id}`);
  }

  updateIncomeSource(id: string, request: UpdateIncomeSourceRequest): Observable<IncomeSource> {
    return this.http.put<IncomeSource>(`${this.apiUrl}/${id}`, request).pipe(
      tap(() => {
        console.log('IncomeManagementService: Income source updated');
      })
    );
  }

  deleteIncomeSource(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        console.log('IncomeManagementService: Income source deleted');
      })
    );
  }
}