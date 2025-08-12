import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  BudgetCategory, 
  CreateBudgetCategoryRequest, 
  UpdateBudgetCategoryRequest, 
  BudgetValidationResult,
  DefaultBudgetCategory
} from '../../../../../../../shared/src/models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BudgetCategoriesService {
  private readonly apiUrl = `${environment.apiBaseUrl}/budget-categories`;
  
  private budgetCategoriesSubject = new BehaviorSubject<BudgetCategory[]>([]);
  private totalBudgetSubject = new BehaviorSubject<number>(0);

  budgetCategories$ = this.budgetCategoriesSubject.asObservable();
  totalBudget$ = this.totalBudgetSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadBudgetCategories(): Observable<BudgetCategory[]> {
    return this.http.get<BudgetCategory[]>(this.apiUrl).pipe(
      tap(categories => {
        this.budgetCategoriesSubject.next(categories);
        this.updateTotalBudget(categories);
      })
    );
  }

  getBudgetCategory(id: string): Observable<BudgetCategory> {
    return this.http.get<BudgetCategory>(`${this.apiUrl}/${id}`);
  }

  createBudgetCategory(request: CreateBudgetCategoryRequest): Observable<BudgetCategory> {
    return this.http.post<BudgetCategory>(this.apiUrl, request).pipe(
      tap(newCategory => {
        const currentCategories = this.budgetCategoriesSubject.value;
        const updatedCategories = [...currentCategories, newCategory]
          .sort((a, b) => {
            // Sort by essential first, then by name
            if (a.isEssential !== b.isEssential) {
              return a.isEssential ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          });
        this.budgetCategoriesSubject.next(updatedCategories);
        this.updateTotalBudget(updatedCategories);
      })
    );
  }

  updateBudgetCategory(id: string, request: UpdateBudgetCategoryRequest): Observable<BudgetCategory> {
    return this.http.put<BudgetCategory>(`${this.apiUrl}/${id}`, request).pipe(
      tap(updatedCategory => {
        const currentCategories = this.budgetCategoriesSubject.value;
        const updatedCategories = currentCategories
          .map(cat => cat.categoryId === id ? updatedCategory : cat)
          .sort((a, b) => {
            // Sort by essential first, then by name
            if (a.isEssential !== b.isEssential) {
              return a.isEssential ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          });
        this.budgetCategoriesSubject.next(updatedCategories);
        this.updateTotalBudget(updatedCategories);
      })
    );
  }

  deleteBudgetCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentCategories = this.budgetCategoriesSubject.value;
        const updatedCategories = currentCategories.filter(cat => cat.categoryId !== id);
        this.budgetCategoriesSubject.next(updatedCategories);
        this.updateTotalBudget(updatedCategories);
      })
    );
  }

  validateBudgetAllocation(amount: number, excludeCategoryId?: string): Observable<BudgetValidationResult> {
    const params: any = { amount };
    if (excludeCategoryId) {
      params.excludeCategoryId = excludeCategoryId;
    }
    return this.http.get<BudgetValidationResult>(`${this.apiUrl}/validation`, { params });
  }

  getCategorySuggestions(): Observable<CreateBudgetCategoryRequest[]> {
    return this.http.get<CreateBudgetCategoryRequest[]>(`${this.apiUrl}/suggestions`);
  }

  createCategoriesFromSuggestions(suggestions: CreateBudgetCategoryRequest[]): Observable<BudgetCategory[]> {
    return this.http.post<BudgetCategory[]>(`${this.apiUrl}/create-from-suggestions`, suggestions).pipe(
      tap(newCategories => {
        const currentCategories = this.budgetCategoriesSubject.value;
        const updatedCategories = [...currentCategories, ...newCategories]
          .sort((a, b) => {
            // Sort by essential first, then by name
            if (a.isEssential !== b.isEssential) {
              return a.isEssential ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          });
        this.budgetCategoriesSubject.next(updatedCategories);
        this.updateTotalBudget(updatedCategories);
      })
    );
  }

  getTotalBudgetAllocation(): number {
    return this.totalBudgetSubject.value;
  }

  getEssentialCategories(): BudgetCategory[] {
    return this.budgetCategoriesSubject.value.filter(cat => cat.isEssential);
  }

  getNonEssentialCategories(): BudgetCategory[] {
    return this.budgetCategoriesSubject.value.filter(cat => !cat.isEssential);
  }

  calculateRemainingIncome(userIncome: number): number {
    return userIncome - this.getTotalBudgetAllocation();
  }

  // Default categories to suggest to new users
  getDefaultCategories(): DefaultBudgetCategory[] {
    return [
      {
        name: 'Groceries',
        isEssential: true,
        description: 'Food and household essentials like cleaning supplies, personal care items'
      },
      {
        name: 'Transportation',
        isEssential: true,
        description: 'Gas, public transit, car payments, insurance, and maintenance'
      },
      {
        name: 'Utilities',
        isEssential: true,
        description: 'Electricity, water, internet, phone, and other essential services'
      },
      {
        name: 'Housing',
        isEssential: true,
        description: 'Rent, mortgage, property taxes, and home insurance'
      },
      {
        name: 'Entertainment',
        isEssential: false,
        description: 'Movies, games, hobbies, streaming services, and recreational activities'
      },
      {
        name: 'Dining Out',
        isEssential: false,
        description: 'Restaurants, takeout, coffee shops, and other food outside the home'
      },
      {
        name: 'Shopping',
        isEssential: false,
        description: 'Clothing, electronics, and other non-essential purchases'
      },
      {
        name: 'Health & Fitness',
        isEssential: true,
        description: 'Medical expenses, gym memberships, health insurance copays'
      }
    ];
  }

  private updateTotalBudget(categories: BudgetCategory[]): void {
    const total = categories.reduce((sum, category) => sum + category.monthlyLimit, 0);
    this.totalBudgetSubject.next(total);
  }
}