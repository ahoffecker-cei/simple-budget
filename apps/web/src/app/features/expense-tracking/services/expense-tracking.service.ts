import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { tap, catchError, switchMap, map } from 'rxjs/operators';
import { 
  Expense, 
  CreateExpenseRequest, 
  ExpenseWithBudgetImpact,
  RecentExpensesResponse,
  ExpenseListQueryParameters
} from '../../../../../../../shared/src/models';
import { environment } from '../../../../environments/environment';

interface OfflineExpense extends CreateExpenseRequest {
  tempId: string;
  timestamp: number;
  syncStatus: 'pending' | 'syncing' | 'failed';
}

interface IndexedDBSchema {
  offlineExpenses: OfflineExpense;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseTrackingService {
  private readonly apiUrl = `${environment.apiBaseUrl}/expenses`;
  private readonly dbName = 'ExpenseTrackingDB';
  private readonly dbVersion = 1;
  private readonly offlineStoreName = 'offlineExpenses';
  
  private recentExpensesSubject = new BehaviorSubject<Expense[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private offlineExpensesSubject = new BehaviorSubject<OfflineExpense[]>([]);
  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);

  recentExpenses$ = this.recentExpensesSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  offlineExpenses$ = this.offlineExpensesSubject.asObservable();
  isOnline$ = this.isOnlineSubject.asObservable();

  private db: IDBDatabase | null = null;

  constructor(private http: HttpClient) {
    this.initIndexedDB();
    this.setupOnlineStatusListener();
    this.loadOfflineExpenses();
  }

  createExpense(request: CreateExpenseRequest): Observable<ExpenseWithBudgetImpact> {
    this.loadingSubject.next(true);
    
    if (!this.isOnlineSubject.value) {
      // Store offline and return a mock response
      return this.storeOfflineExpense(request).pipe(
        tap(() => this.loadingSubject.next(false))
      );
    }

    return this.http.post<ExpenseWithBudgetImpact>(this.apiUrl, request).pipe(
      tap(result => {
        // Add the new expense to the front of the recent expenses list
        const currentExpenses = this.recentExpensesSubject.value;
        const updatedExpenses = [result.expense, ...currentExpenses].slice(0, 20);
        this.recentExpensesSubject.next(updatedExpenses);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        // If online but request fails, store offline
        console.warn('Failed to create expense online, storing offline:', error);
        return this.storeOfflineExpense(request).pipe(
          tap(() => this.loadingSubject.next(false))
        );
      })
    );
  }

  getExpenses(parameters?: ExpenseListQueryParameters): Observable<RecentExpensesResponse> {
    this.loadingSubject.next(true);
    const params: any = {};
    
    if (parameters) {
      if (parameters.page) params.page = parameters.page.toString();
      if (parameters.pageSize) params.pageSize = parameters.pageSize.toString();
      if (parameters.categoryId) params.categoryId = parameters.categoryId;
      if (parameters.startDate) params.startDate = parameters.startDate;
      if (parameters.endDate) params.endDate = parameters.endDate;
    }

    return this.http.get<RecentExpensesResponse>(this.apiUrl, { params }).pipe(
      tap(response => {
        if (!parameters || parameters.page === 1) {
          // If it's the first page or no parameters, update the recent expenses
          this.recentExpensesSubject.next(response.expenses);
        }
        this.loadingSubject.next(false);
      })
    );
  }

  getExpense(id: string): Observable<Expense> {
    return this.http.get<Expense>(`${this.apiUrl}/${id}`);
  }

  deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentExpenses = this.recentExpensesSubject.value;
        const updatedExpenses = currentExpenses.filter(expense => expense.expenseId !== id);
        this.recentExpensesSubject.next(updatedExpenses);
      })
    );
  }

  loadRecentExpenses(count: number = 10): Observable<RecentExpensesResponse> {
    return this.getExpenses({ page: 1, pageSize: count });
  }

  getExpensesForCategory(categoryId: string, limit: number = 5): Observable<RecentExpensesResponse> {
    return this.getExpenses({ 
      categoryId: categoryId, 
      page: 1, 
      pageSize: limit 
    });
  }

  getExpensesForDateRange(startDate: string, endDate: string): Observable<RecentExpensesResponse> {
    return this.getExpenses({ 
      startDate: startDate, 
      endDate: endDate,
      page: 1,
      pageSize: 100
    });
  }

  // Get expenses for the current month
  getCurrentMonthExpenses(): Observable<RecentExpensesResponse> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return this.getExpensesForDateRange(
      startOfMonth.toISOString().split('T')[0],
      endOfMonth.toISOString().split('T')[0]
    );
  }

  // Utility method to detect potential duplicate expenses
  findPotentialDuplicates(newExpense: CreateExpenseRequest, threshold: number = 24): Expense[] {
    const currentExpenses = this.recentExpensesSubject.value;
    const expenseDate = new Date(newExpense.expenseDate || new Date());
    
    return currentExpenses.filter(expense => {
      const existingDate = new Date(expense.expenseDate);
      const hoursDiff = Math.abs(expenseDate.getTime() - existingDate.getTime()) / (1000 * 60 * 60);
      
      return expense.categoryId === newExpense.categoryId &&
             Math.abs(expense.amount - newExpense.amount) < 0.01 &&
             hoursDiff <= threshold;
    });
  }

  // Utility method to get spending summary by category
  getSpendingSummaryByCategory(expenses: Expense[]): { [categoryId: string]: { total: number, count: number, categoryName: string } } {
    return expenses.reduce((summary, expense) => {
      if (!summary[expense.categoryId]) {
        summary[expense.categoryId] = {
          total: 0,
          count: 0,
          categoryName: expense.categoryName
        };
      }
      summary[expense.categoryId].total += expense.amount;
      summary[expense.categoryId].count += 1;
      return summary;
    }, {} as { [categoryId: string]: { total: number, count: number, categoryName: string } });
  }

  // Clear cached expenses (useful for logout or data refresh)
  clearExpenses(): void {
    this.recentExpensesSubject.next([]);
  }

  // ========== OFFLINE STORAGE METHODS ==========

  private initIndexedDB(): void {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not supported');
      return;
    }

    const request = indexedDB.open(this.dbName, this.dbVersion);

    request.onerror = () => {
      console.error('IndexedDB initialization failed');
    };

    request.onsuccess = (event: any) => {
      this.db = event.target.result;
      this.syncOfflineExpenses();
    };

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(this.offlineStoreName)) {
        const store = db.createObjectStore(this.offlineStoreName, { keyPath: 'tempId' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
      }
    };
  }

  private setupOnlineStatusListener(): void {
    window.addEventListener('online', () => {
      this.isOnlineSubject.next(true);
      this.syncOfflineExpenses();
    });

    window.addEventListener('offline', () => {
      this.isOnlineSubject.next(false);
    });
  }

  private storeOfflineExpense(request: CreateExpenseRequest): Observable<ExpenseWithBudgetImpact> {
    return from(this.addOfflineExpenseToIndexedDB(request)).pipe(
      switchMap(offlineExpense => {
        // Create a mock response for offline expense
        const mockExpense: Expense = {
          expenseId: offlineExpense.tempId,
          userId: '', // Will be filled when synced
          categoryId: request.categoryId,
          amount: request.amount,
          description: request.description || '',
          expenseDate: request.expenseDate || new Date().toISOString(),
          createdAt: new Date().toISOString(),
          categoryName: '', // Will be filled when synced
          isEssential: false // Will be filled when synced
        };

        const mockResponse: ExpenseWithBudgetImpact = {
          expense: mockExpense,
          categoryRemainingBudget: 0,
          budgetHealthStatus: 'attention',
          categoryMonthlyLimit: 0,
          categoryCurrentSpending: request.amount
        };

        // Add to recent expenses with offline indicator
        const currentExpenses = this.recentExpensesSubject.value;
        const updatedExpenses = [mockExpense, ...currentExpenses].slice(0, 20);
        this.recentExpensesSubject.next(updatedExpenses);

        return of(mockResponse);
      })
    );
  }

  private async addOfflineExpenseToIndexedDB(request: CreateExpenseRequest): Promise<OfflineExpense> {
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    const offlineExpense: OfflineExpense = {
      ...request,
      tempId: this.generateTempId(),
      timestamp: Date.now(),
      syncStatus: 'pending'
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.offlineStoreName], 'readwrite');
      const store = transaction.objectStore(this.offlineStoreName);
      const request = store.add(offlineExpense);

      request.onsuccess = () => {
        this.updateOfflineExpensesList();
        resolve(offlineExpense);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadOfflineExpenses(): void {
    if (!this.db) {
      setTimeout(() => this.loadOfflineExpenses(), 100);
      return;
    }

    this.updateOfflineExpensesList();
  }

  private updateOfflineExpensesList(): void {
    if (!this.db) return;

    const transaction = this.db.transaction([this.offlineStoreName], 'readonly');
    const store = transaction.objectStore(this.offlineStoreName);
    const request = store.getAll();

    request.onsuccess = () => {
      const offlineExpenses: OfflineExpense[] = request.result || [];
      this.offlineExpensesSubject.next(offlineExpenses);
    };
  }

  private syncOfflineExpenses(): void {
    if (!this.isOnlineSubject.value || !this.db) {
      return;
    }

    const currentOfflineExpenses = this.offlineExpensesSubject.value;
    const pendingExpenses = currentOfflineExpenses.filter(expense => expense.syncStatus === 'pending');

    if (pendingExpenses.length === 0) {
      return;
    }

    console.log(`Starting sync of ${pendingExpenses.length} offline expenses`);

    pendingExpenses.forEach(offlineExpense => {
      this.syncSingleOfflineExpense(offlineExpense);
    });
  }

  private syncSingleOfflineExpense(offlineExpense: OfflineExpense): void {
    // Update status to syncing
    this.updateOfflineExpenseStatus(offlineExpense.tempId, 'syncing');

    const createRequest: CreateExpenseRequest = {
      categoryId: offlineExpense.categoryId,
      amount: offlineExpense.amount,
      description: offlineExpense.description,
      expenseDate: offlineExpense.expenseDate
    };

    this.http.post<ExpenseWithBudgetImpact>(this.apiUrl, createRequest).pipe(
      tap(result => {
        // Successfully synced, remove from offline storage
        this.removeOfflineExpense(offlineExpense.tempId);
        
        // Update recent expenses with the synced expense
        const currentExpenses = this.recentExpensesSubject.value;
        const updatedExpenses = currentExpenses.map(expense => 
          expense.expenseId === offlineExpense.tempId ? result.expense : expense
        );
        this.recentExpensesSubject.next(updatedExpenses);
        
        console.log('Successfully synced offline expense:', result.expense.expenseId);
      }),
      catchError(error => {
        // Sync failed, update status back to pending
        console.error('Failed to sync offline expense:', error);
        this.updateOfflineExpenseStatus(offlineExpense.tempId, 'failed');
        return of(null);
      })
    ).subscribe();
  }

  private updateOfflineExpenseStatus(tempId: string, status: 'pending' | 'syncing' | 'failed'): void {
    if (!this.db) return;

    const transaction = this.db.transaction([this.offlineStoreName], 'readwrite');
    const store = transaction.objectStore(this.offlineStoreName);
    const request = store.get(tempId);

    request.onsuccess = () => {
      const offlineExpense = request.result;
      if (offlineExpense) {
        offlineExpense.syncStatus = status;
        store.put(offlineExpense);
        this.updateOfflineExpensesList();
      }
    };
  }

  private removeOfflineExpense(tempId: string): void {
    if (!this.db) return;

    const transaction = this.db.transaction([this.offlineStoreName], 'readwrite');
    const store = transaction.objectStore(this.offlineStoreName);
    const request = store.delete(tempId);

    request.onsuccess = () => {
      this.updateOfflineExpensesList();
    };
  }

  // Public method to manually trigger sync
  forceSyncOfflineExpenses(): void {
    this.syncOfflineExpenses();
  }

  // Public method to get offline expenses count
  getOfflineExpensesCount(): Observable<number> {
    return this.offlineExpenses$.pipe(
      map(expenses => expenses.length)
    );
  }

  // Public method to clear all offline expenses (for testing/debugging)
  clearOfflineExpenses(): void {
    if (!this.db) return;

    const transaction = this.db.transaction([this.offlineStoreName], 'readwrite');
    const store = transaction.objectStore(this.offlineStoreName);
    const request = store.clear();

    request.onsuccess = () => {
      this.updateOfflineExpensesList();
      console.log('All offline expenses cleared');
    };
  }
}