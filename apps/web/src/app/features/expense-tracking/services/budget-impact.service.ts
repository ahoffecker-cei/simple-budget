import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, shareReplay } from 'rxjs/operators';
import { BudgetImpactPreview, MonthlyProgressData, OverallBudgetHealth } from '../../../../../../../shared/src/models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BudgetImpactService {
  private readonly apiUrl = environment.apiBaseUrl;
  private readonly debounceDelay = 300; // 300ms debounce delay as per requirements

  constructor(private http: HttpClient) {}

  getBudgetImpactPreview(categoryId: string, amount: number, expenseDate?: string): Observable<BudgetImpactPreview> {
    if (!categoryId || amount <= 0) {
      return of({
        categoryId: '',
        categoryName: '',
        currentSpent: 0,
        monthlyLimit: 0,
        remainingAfterExpense: 0,
        percentageUsed: 0,
        healthStatus: 'excellent',
        isEssential: false,
        impactMessage: '',
        encouragementLevel: 'encouragement'
      } as BudgetImpactPreview);
    }

    let params = new HttpParams()
      .set('categoryId', categoryId)
      .set('amount', amount.toString());

    if (expenseDate) {
      params = params.set('expenseDate', expenseDate);
    }

    return this.http.get<BudgetImpactPreview>(`${this.apiUrl}/expenses/budget-impact-preview`, { params })
      .pipe(shareReplay(1));
  }

  getDebouncedBudgetImpactPreview(categoryId: string, amount: number, expenseDate?: string): Observable<BudgetImpactPreview> {
    return of({ categoryId, amount, expenseDate }).pipe(
      debounceTime(this.debounceDelay),
      distinctUntilChanged(),
      switchMap(({ categoryId, amount, expenseDate }) => 
        this.getBudgetImpactPreview(categoryId, amount, expenseDate)
      )
    );
  }

  getOverallBudgetHealth(): Observable<OverallBudgetHealth> {
    return this.http.get<OverallBudgetHealth>(`${this.apiUrl}/dashboard/budget-health`)
      .pipe(shareReplay(1));
  }

  getMonthlyProgressData(): Observable<MonthlyProgressData[]> {
    // Remove shareReplay to always fetch fresh data
    return this.http.get<MonthlyProgressData[]>(`${this.apiUrl}/dashboard/monthly-progress`);
  }

  getHealthStatusColor(healthStatus: 'excellent' | 'good' | 'attention' | 'concern'): string {
    switch (healthStatus) {
      case 'excellent':
        return '#4caf50'; // Green
      case 'good':
        return '#8bc34a'; // Light green
      case 'attention':
        return '#ff9800'; // Orange/Yellow
      case 'concern':
        return '#f44336'; // Red
      default:
        return '#4caf50';
    }
  }

  getHealthStatusIcon(healthStatus: 'excellent' | 'good' | 'attention' | 'concern'): string {
    switch (healthStatus) {
      case 'excellent':
        return 'check_circle';
      case 'good':
        return 'thumb_up';
      case 'attention':
        return 'warning';
      case 'concern':
        return 'error';
      default:
        return 'check_circle';
    }
  }

  getEncouragementIcon(encouragementLevel: 'celebration' | 'encouragement' | 'guidance' | 'support'): string {
    switch (encouragementLevel) {
      case 'celebration':
        return 'celebration';
      case 'encouragement':
        return 'thumb_up';
      case 'guidance':
        return 'lightbulb';
      case 'support':
        return 'support';
      default:
        return 'thumb_up';
    }
  }
}