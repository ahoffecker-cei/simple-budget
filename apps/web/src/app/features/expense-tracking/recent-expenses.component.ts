import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';

import { ExpenseTrackingService } from './services/expense-tracking.service';
import { 
  Expense,
  ExpenseListQueryParameters
} from '../../../../../../shared/src/models';

@Component({
  selector: 'app-recent-expenses',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    MatMenuModule
  ],
  templateUrl: './recent-expenses.component.html',
  styleUrls: ['./recent-expenses.component.scss']
})
export class RecentExpensesComponent implements OnInit, OnDestroy {
  @Input() title: string = 'Recent Expenses';
  @Input() maxItems: number = 10;
  @Input() showActions: boolean = true;
  @Input() categoryFilter?: string;

  expenses: Expense[] = [];
  isLoading = false;
  duplicateExpenses: Set<string> = new Set(); // Track potential duplicates
  
  private destroy$ = new Subject<void>();

  constructor(
    private expenseService: ExpenseTrackingService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadExpenses();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    // Subscribe to recent expenses updates
    this.expenseService.recentExpenses$
      .pipe(takeUntil(this.destroy$))
      .subscribe(expenses => {
        this.expenses = this.categoryFilter 
          ? expenses.filter(exp => exp.categoryId === this.categoryFilter)
          : expenses;
        this.detectDuplicates();
      });
  }

  private loadExpenses(): void {
    this.isLoading = true;
    
    const queryParams: ExpenseListQueryParameters = {
      page: 1,
      pageSize: this.maxItems
    };

    if (this.categoryFilter) {
      queryParams.categoryId = this.categoryFilter;
    }

    this.expenseService.getExpenses(queryParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          // If we have a category filter and the service doesn't return the filtered results,
          // we filter them here
          if (this.categoryFilter && !queryParams.categoryId) {
            this.expenses = response.expenses.filter(exp => exp.categoryId === this.categoryFilter);
          }
          this.detectDuplicates();
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open('Failed to load expenses', 'Close', { 
            duration: 3000,
            panelClass: 'error-snackbar'
          });
          console.error('Error loading expenses:', error);
        }
      });
  }

  private detectDuplicates(): void {
    this.duplicateExpenses.clear();
    
    // Group expenses by category and similar amounts (within $1)
    const groups = this.expenses.reduce((acc, expense) => {
      const key = `${expense.categoryId}_${Math.floor(expense.amount)}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(expense);
      return acc;
    }, {} as { [key: string]: Expense[] });

    // Mark expenses as duplicates if they have similar amounts in the same category
    // and are within 48 hours of each other
    Object.values(groups).forEach(group => {
      if (group.length > 1) {
        group.forEach((expense, index) => {
          const hasSimilarExpense = group.some((other, otherIndex) => {
            if (index === otherIndex) return false;
            
            const timeDiff = Math.abs(
              new Date(expense.expenseDate).getTime() - new Date(other.expenseDate).getTime()
            );
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            const amountDiff = Math.abs(expense.amount - other.amount);
            
            return hoursDiff <= 48 && amountDiff <= 5; // Within 48 hours and $5 difference
          });
          
          if (hasSimilarExpense) {
            this.duplicateExpenses.add(expense.expenseId);
          }
        });
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: string): string {
    const expenseDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - expenseDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return expenseDate.toLocaleDateString();
    }
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleDateString() + ' ' + 
           new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  isDuplicate(expenseId: string): boolean {
    return this.duplicateExpenses.has(expenseId);
  }

  deleteExpense(expense: Expense): void {
    if (confirm(`Are you sure you want to delete this expense?\n\n${this.formatCurrency(expense.amount)} - ${expense.categoryName}\n${this.formatDate(expense.expenseDate)}`)) {
      this.expenseService.deleteExpense(expense.expenseId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Expense deleted successfully', 'Close', { 
              duration: 3000,
              panelClass: 'success-snackbar'
            });
          },
          error: (error) => {
            this.snackBar.open(
              error.error?.message || 'Failed to delete expense',
              'Close',
              { 
                duration: 3000,
                panelClass: 'error-snackbar'
              }
            );
          }
        });
    }
  }

  refresh(): void {
    this.loadExpenses();
  }

  getCategoryChipClass(isEssential: boolean): string {
    return isEssential ? 'essential-chip' : 'non-essential-chip';
  }

  getCategoryChipLabel(isEssential: boolean): string {
    return isEssential ? 'Essential' : 'Non-Essential';
  }

  // Group expenses by date for better organization
  getExpensesByDate(): { [date: string]: Expense[] } {
    return this.expenses.reduce((acc, expense) => {
      const date = new Date(expense.expenseDate).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(expense);
      return acc;
    }, {} as { [date: string]: Expense[] });
  }

  // Get spending summary for the loaded expenses
  getSpendingSummary(): { total: number, categoryBreakdown: { [category: string]: number } } {
    const total = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const categoryBreakdown = this.expenses.reduce((acc, expense) => {
      if (!acc[expense.categoryName]) {
        acc[expense.categoryName] = 0;
      }
      acc[expense.categoryName] += expense.amount;
      return acc;
    }, {} as { [category: string]: number });

    return { total, categoryBreakdown };
  }

  trackByExpenseId(index: number, expense: Expense): string {
    return expense.expenseId;
  }

  getDateGroupTotal(expenses: Expense[]): number {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }
}