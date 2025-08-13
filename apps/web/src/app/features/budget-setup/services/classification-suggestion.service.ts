import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  CategoryClassificationSuggestion, 
  ClassificationUpdateRequest, 
  BulkClassificationUpdateRequest, 
  BudgetCategory,
  BudgetHealthByClassification
} from '../../../../../../../shared/src/models';

@Injectable({
  providedIn: 'root'
})
export class ClassificationSuggestionService {
  private apiUrl = `${environment.apiBaseUrl}/budget-categories`;
  private dashboardUrl = `${environment.apiBaseUrl}/dashboard`;

  private classificationHealthSubject = new BehaviorSubject<BudgetHealthByClassification | null>(null);
  public classificationHealth$ = this.classificationHealthSubject.asObservable();

  constructor(private http: HttpClient) {}

  getClassificationSuggestions(categoryName?: string): Observable<CategoryClassificationSuggestion[]> {
    const params: any = {};
    if (categoryName) {
      params.categoryName = categoryName;
    }
    return this.http.get<CategoryClassificationSuggestion[]>(`${this.apiUrl}/classification-suggestions`, { params });
  }

  updateCategoryClassification(categoryId: string, request: ClassificationUpdateRequest): Observable<BudgetCategory> {
    return this.http.put<BudgetCategory>(`${this.apiUrl}/${categoryId}/classification`, request);
  }

  updateBulkClassifications(request: BulkClassificationUpdateRequest): Observable<BudgetCategory[]> {
    return this.http.put<BudgetCategory[]>(`${this.apiUrl}/bulk-classification`, request);
  }

  getClassificationHealth(): Observable<BudgetHealthByClassification> {
    return this.http.get<BudgetHealthByClassification>(`${this.dashboardUrl}/classification-health`)
      .pipe(
        tap(health => this.classificationHealthSubject.next(health))
      );
  }

  loadClassificationHealth(): void {
    this.getClassificationHealth().subscribe();
  }
}