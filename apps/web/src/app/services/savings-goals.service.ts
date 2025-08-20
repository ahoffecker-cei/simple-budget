import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { SavingsGoal, CreateSavingsGoalRequest, UpdateSavingsGoalRequest, SavingsGoalProgress, ContributeToSavingsGoalRequest } from '@simple-budget/shared';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SavingsGoalsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/savings-goals`;

  constructor(private http: HttpClient) { }

  getSavingsGoals(): Observable<SavingsGoalProgress[]> {
    return this.http.get<SavingsGoalProgress[]>(this.apiUrl).pipe(
      tap(response => {
        console.log('SavingsGoalsService: Savings goals data received', response);
      })
    );
  }

  createSavingsGoal(request: CreateSavingsGoalRequest): Observable<SavingsGoal> {
    return this.http.post<SavingsGoal>(this.apiUrl, request).pipe(
      tap(() => {
        console.log('SavingsGoalsService: Savings goal created');
      })
    );
  }

  getSavingsGoal(id: string): Observable<SavingsGoal> {
    return this.http.get<SavingsGoal>(`${this.apiUrl}/${id}`);
  }

  updateSavingsGoal(id: string, request: UpdateSavingsGoalRequest): Observable<SavingsGoal> {
    return this.http.put<SavingsGoal>(`${this.apiUrl}/${id}`, request).pipe(
      tap(() => {
        console.log('SavingsGoalsService: Savings goal updated');
      })
    );
  }

  deleteSavingsGoal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        console.log('SavingsGoalsService: Savings goal deleted');
      })
    );
  }

  contributeToSavingsGoal(id: string, request: ContributeToSavingsGoalRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/contribute`, request).pipe(
      tap(() => {
        console.log('SavingsGoalsService: Contribution made to savings goal');
      })
    );
  }
}