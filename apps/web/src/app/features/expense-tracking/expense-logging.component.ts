import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, startWith, map } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ExpenseTrackingService } from './services/expense-tracking.service';
import { BudgetCategoriesService } from '../budget-setup/services/budget-categories.service';
import { BudgetImpactPreviewComponent } from './budget-impact-preview.component';
import { 
  BudgetCategory, 
  CreateExpenseRequest, 
  ExpenseWithBudgetImpact,
  Expense
} from '../../../../../../shared/src/models';

@Component({
  selector: 'app-expense-logging',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    BudgetImpactPreviewComponent
  ],
  templateUrl: './expense-logging.component.html',
  styleUrls: ['./expense-logging.component.scss']
})
export class ExpenseLoggingComponent implements OnInit, OnDestroy {
  expenseForm: FormGroup;
  budgetCategories: BudgetCategory[] = [];
  filteredCategories: BudgetCategory[] = [];
  recentExpenses: Expense[] = [];
  isLoading = false;
  isSubmitting = false;
  lastCreatedExpense: ExpenseWithBudgetImpact | null = null;
  potentialDuplicates: Expense[] = [];
  showDuplicateWarning = false;
  isOnline = true;
  offlineExpensesCount = 0;
  showSuccessFeedback = false;
  
  maxDate = new Date(); // Prevent future dates
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseTrackingService,
    private categoriesService: BudgetCategoriesService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.expenseForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadBudgetCategories();
    this.loadRecentExpenses();
    this.setupFormSubscriptions();
    this.setupOnlineStatusSubscription();
    this.setupOfflineExpensesSubscription();
  }

  private setupOnlineStatusSubscription(): void {
    if (this.expenseService.isOnline$) {
      this.expenseService.isOnline$
        .pipe(takeUntil(this.destroy$))
        .subscribe(isOnline => {
          this.isOnline = isOnline;
        });
    }
  }

  private setupOfflineExpensesSubscription(): void {
    if (this.expenseService.offlineExpenses$) {
      this.expenseService.offlineExpenses$
        .pipe(takeUntil(this.destroy$))
        .subscribe(expenses => {
          this.offlineExpensesCount = expenses.length;
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  focusAmountField(): void {
    setTimeout(() => {
      const amountField = document.querySelector('#amount-input') as HTMLInputElement;
      if (amountField) {
        amountField.focus();
      }
    }, 100);
  }

  onCategorySelected(categoryId: string): void {
    this.expenseForm.patchValue({ categoryId });
    this.focusAmountField();
  }

  syncOfflineExpenses(): void {
    if (this.isOnline && this.expenseService.forceSyncOfflineExpenses) {
      try {
        this.expenseService.forceSyncOfflineExpenses();
        this.snackBar.open('Offline expenses synced successfully', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
      } catch (error: any) {
        this.snackBar.open('Failed to sync offline expenses', 'Close', {
          duration: 3000,
          panelClass: 'error-snackbar'
        });
      }
    }
  }

  proceedWithDuplicateCreation(): void {
    this.showDuplicateWarning = false;
    this.onSubmit();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      amount: ['', [
        Validators.required, 
        Validators.min(0.01),
        Validators.max(999999.99),
        this.precisionValidator
      ]],
      categoryId: ['', Validators.required],
      description: ['', [Validators.maxLength(500)]],
      expenseDate: [new Date(), [Validators.required, this.futureDateValidator, this.tooOldValidator]]
    });
  }

  private precisionValidator(control: any) {
    const value = control.value;
    if (value && typeof value === 'number') {
      const decimalPlaces = (value.toString().split('.')[1] || '').length;
      if (decimalPlaces > 2) {
        return { precision: true };
      }
    }
    return null;
  }

  private futureDateValidator(control: any) {
    const value = control.value;
    if (value && new Date(value) > new Date()) {
      return { futureDate: true };
    }
    return null;
  }

  private tooOldValidator(control: any) {
    const value = control.value;
    if (value) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (new Date(value) < thirtyDaysAgo) {
        return { tooOld: true };
      }
    }
    return null;
  }

  private setupFormSubscriptions(): void {
    // Setup category autocomplete
    this.expenseForm.get('categoryId')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        startWith('')
      )
      .subscribe(value => {
        // Handle both typed text (string) and selected category ID (string)
        if (typeof value === 'string') {
          // Check if it's a category ID (GUID format) or typed text
          if (this.budgetCategories.find(cat => cat.categoryId === value)) {
            // It's a selected category ID, don't filter (show all)
            this.filteredCategories = this.budgetCategories.slice();
          } else {
            // It's typed text, filter by it
            this.filteredCategories = this.filterCategories(value);
          }
        } else {
          this.filteredCategories = this.budgetCategories.slice();
        }
      });

    // Check for potential duplicates when form changes
    this.expenseForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkForDuplicates();
      });
  }

  private filterCategories(value: string): BudgetCategory[] {
    if (!value || typeof value !== 'string') {
      return this.budgetCategories.slice();
    }
    
    const filterValue = value.toLowerCase();
    return this.budgetCategories.filter(category =>
      category.name.toLowerCase().includes(filterValue)
    );
  }

  private loadBudgetCategories(): void {
    this.categoriesService.loadBudgetCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.budgetCategories = categories;
          this.filteredCategories = categories.slice();
          
          if (categories.length === 0) {
            this.snackBar.open(
              'No budget categories found. Please set up categories first.',
              'Go to Categories',
              { 
                duration: 5000,
                panelClass: 'info-snackbar'
              }
            ).onAction().subscribe(() => {
              this.router.navigate(['/budget-categories']);
            });
          }
        },
        error: (error) => {
          this.snackBar.open('Failed to load categories', 'Close', { 
            duration: 3000,
            panelClass: 'error-snackbar'
          });
          console.error('Error loading categories:', error);
        }
      });
  }

  private loadRecentExpenses(): void {
    this.expenseService.loadRecentExpenses(5)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.recentExpenses = response.expenses;
        },
        error: (error) => {
          console.error('Error loading recent expenses:', error);
        }
      });
  }

  checkForDuplicates(): void {
    const formValue = this.expenseForm.value;
    if (formValue.amount && formValue.categoryId && formValue.expenseDate) {
      const request: CreateExpenseRequest = {
        categoryId: formValue.categoryId,
        amount: formValue.amount,
        description: formValue.description,
        expenseDate: formValue.expenseDate.toISOString()
      };
      
      this.potentialDuplicates = this.expenseService.findPotentialDuplicates(request);
      this.showDuplicateWarning = this.potentialDuplicates.length > 0;
    }
  }

  getCategoryDisplayFn = (categoryId: string): string => {
    if (!categoryId) return '';
    const category = this.budgetCategories.find(cat => cat.categoryId === categoryId);
    return category ? category.name : '';
  };

  getCategoryName(categoryId: string): string {
    const category = this.budgetCategories.find(cat => cat.categoryId === categoryId);
    return category ? category.name : '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  onSubmit(): void {
    if (this.expenseForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const formValue = this.expenseForm.value;
      const request: CreateExpenseRequest = {
        categoryId: formValue.categoryId,
        amount: formValue.amount,
        description: formValue.description || undefined,
        expenseDate: formValue.expenseDate.toISOString()
      };

      this.expenseService.createExpense(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            this.isSubmitting = false;
            this.lastCreatedExpense = result;
            this.showSuccessFeedback = true;
            
            // Show success feedback
            this.snackBar.open(
              `Expense logged successfully! ${this.formatCurrency(result.expense.amount)} spent on ${result.expense.categoryName}`,
              'Close',
              { 
                duration: 4000,
                panelClass: 'success-snackbar'
              }
            );

            // Auto-hide success feedback after delay
            setTimeout(() => {
              this.showSuccessFeedback = false;
            }, 3500);

            // Reset form for next expense
            this.resetForm();
            this.showDuplicateWarning = false;
            
            // Update recent expenses
            this.loadRecentExpenses();
            
            // Navigate back to dashboard after 2 seconds to show the success message
            setTimeout(() => {
              console.log('Navigating to dashboard after expense creation...');
              this.router.navigate(['/dashboard']);
            }, 2000);
          },
          error: (error) => {
            this.isSubmitting = false;
            this.snackBar.open(
              error.error?.message || 'Failed to log expense',
              'Close',
              { 
                duration: 3000,
                panelClass: 'error-snackbar'
              }
            );
            console.error('Error creating expense:', error);
          }
        });
    }
  }

  private resetForm(): void {
    this.expenseForm.reset();
    this.expenseForm.patchValue({
      expenseDate: new Date()
    });
    // Focus on amount field for quick next entry
    setTimeout(() => {
      const amountField = document.querySelector('#amount-input') as HTMLInputElement;
      if (amountField) {
        amountField.focus();
      }
    }, 100);
  }

  quickFillFromRecent(expense: Expense): void {
    this.expenseForm.patchValue({
      amount: expense.amount,
      categoryId: expense.categoryId,
      description: expense.description,
      expenseDate: new Date()
    });
  }

  getBudgetHealthColor(status: string): string {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'attention': return 'text-yellow-600';
      case 'concern': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  getBudgetHealthIcon(status: string): string {
    switch (status) {
      case 'excellent': return 'check_circle';
      case 'good': return 'thumb_up';
      case 'attention': return 'warning';
      case 'concern': return 'error';
      default: return 'info';
    }
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  viewAllExpenses(): void {
    this.router.navigate(['/expenses']);
  }
}