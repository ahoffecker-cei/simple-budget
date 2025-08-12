import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { BudgetCategoriesService } from './services/budget-categories.service';
import { BudgetCalculationUtils } from './services/budget-calculation.utils';
import { AuthService } from '../../services/auth.service';
import { AddCategoryDialogComponent } from './dialogs/add-category-dialog.component';
import { EditCategoryDialogComponent } from './dialogs/edit-category-dialog.component';
import { DeleteCategoryDialogComponent } from './dialogs/delete-category-dialog.component';
import { BudgetCategory, CreateBudgetCategoryRequest, DefaultBudgetCategory, User } from '../../../../../../shared/src/models';

@Component({
  selector: 'app-budget-categories',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './budget-categories.component.html',
  styleUrls: ['./budget-categories.component.scss']
})
export class BudgetCategoriesComponent implements OnInit, OnDestroy {
  budgetCategories: BudgetCategory[] = [];
  essentialCategories: BudgetCategory[] = [];
  nonEssentialCategories: BudgetCategory[] = [];
  totalBudget = 0;
  userIncome = 0;
  remainingIncome = 0;
  budgetPercentage = 0;
  isLoading = false;
  showSuggestions = false;
  categorySuggestions: CreateBudgetCategoryRequest[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(
    private budgetCategoriesService: BudgetCategoriesService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadBudgetCategories();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    // Subscribe to budget categories changes
    this.budgetCategoriesService.budgetCategories$
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => {
        this.budgetCategories = categories;
        this.essentialCategories = categories.filter(cat => cat.isEssential);
        this.nonEssentialCategories = categories.filter(cat => !cat.isEssential);
        this.updateBudgetCalculations();
      });

    // Subscribe to total budget changes
    this.budgetCategoriesService.totalBudget$
      .pipe(takeUntil(this.destroy$))
      .subscribe(total => {
        this.totalBudget = total;
        this.updateBudgetCalculations();
      });
  }

  private loadUserProfile(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: User | null) => {
        if (user) {
          this.userIncome = user.monthlyIncome;
          this.updateBudgetCalculations();
        }
      });
  }

  private loadBudgetCategories(): void {
    this.isLoading = true;
    this.budgetCategoriesService.loadBudgetCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.isLoading = false;
          if (categories.length === 0) {
            this.loadCategorySuggestions();
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open('Failed to load budget categories', 'Close', { duration: 3000 });
          console.error('Error loading budget categories:', error);
        }
      });
  }

  private loadCategorySuggestions(): void {
    this.budgetCategoriesService.getCategorySuggestions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (suggestions) => {
          this.categorySuggestions = suggestions;
          this.showSuggestions = suggestions.length > 0;
        },
        error: (error) => {
          console.error('Error loading category suggestions:', error);
        }
      });
  }

  private updateBudgetCalculations(): void {
    this.remainingIncome = this.userIncome - this.totalBudget;
    this.budgetPercentage = BudgetCalculationUtils.calculateTotalBudgetPercentage(
      this.budgetCategories, 
      this.userIncome
    );
  }

  get budgetHealthStatus() {
    return BudgetCalculationUtils.getBudgetHealthStatus(this.budgetCategories, this.userIncome);
  }

  get progressBarColor(): string {
    const status = this.budgetHealthStatus.status;
    switch (status) {
      case 'excellent': return 'primary';
      case 'good': return 'accent';
      case 'fair': return 'warn';
      case 'over-budget': return 'warn';
      default: return 'primary';
    }
  }

  formatCurrency(amount: number): string {
    return BudgetCalculationUtils.formatCurrency(amount);
  }

  formatPercentage(percentage: number): string {
    return BudgetCalculationUtils.formatPercentage(percentage);
  }

  // Expose BudgetCalculationUtils for template use
  calculateBudgetPercentage(amount: number): string {
    return BudgetCalculationUtils.formatPercentage(
      BudgetCalculationUtils.calculateBudgetPercentage(amount, this.userIncome)
    );
  }

  addNewCategory(): void {
    const dialogRef = this.dialog.open(AddCategoryDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        userIncome: this.userIncome,
        existingCategories: this.budgetCategories.map(cat => cat.name)
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && !result.error) {
        this.snackBar.open(`${result.name} category created successfully!`, 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
      } else if (result?.error) {
        this.snackBar.open(
          result.error.error?.message || 'Failed to create category',
          'Close',
          { duration: 3000, panelClass: 'error-snackbar' }
        );
      }
    });
  }

  editCategory(category: BudgetCategory): void {
    const dialogRef = this.dialog.open(EditCategoryDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        category: category,
        userIncome: this.userIncome,
        existingCategories: this.budgetCategories.map(cat => cat.name)
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && !result.error) {
        this.snackBar.open(`${result.name} updated successfully!`, 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
      } else if (result?.error) {
        this.snackBar.open(
          result.error.error?.message || 'Failed to update category',
          'Close',
          { duration: 3000, panelClass: 'error-snackbar' }
        );
      }
    });
  }

  deleteCategory(category: BudgetCategory): void {
    const dialogRef = this.dialog.open(DeleteCategoryDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: { category }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.budgetCategoriesService.deleteBudgetCategory(category.categoryId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.snackBar.open(`${category.name} deleted successfully`, 'Close', {
                duration: 3000,
                panelClass: 'success-snackbar'
              });
            },
            error: (error) => {
              this.snackBar.open(
                error.error?.message || 'Failed to delete category',
                'Close',
                { duration: 3000, panelClass: 'error-snackbar' }
              );
            }
          });
      }
    });
  }

  createCategoryFromSuggestion(suggestion: CreateBudgetCategoryRequest): void {
    this.budgetCategoriesService.createBudgetCategory(suggestion)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newCategory) => {
          this.snackBar.open(`${newCategory.name} category created!`, 'Close', { 
            duration: 3000,
            panelClass: 'success-snackbar'
          });
          this.loadCategorySuggestions(); // Refresh suggestions
        },
        error: (error) => {
          this.snackBar.open(error.error?.message || 'Failed to create category', 'Close', { 
            duration: 3000,
            panelClass: 'error-snackbar'
          });
        }
      });
  }

  createAllSuggestedCategories(): void {
    if (this.categorySuggestions.length === 0) return;

    this.isLoading = true;
    this.budgetCategoriesService.createCategoriesFromSuggestions(this.categorySuggestions)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdCategories) => {
          this.isLoading = false;
          this.showSuggestions = false;
          this.categorySuggestions = [];
          this.snackBar.open(`Created ${createdCategories.length} budget categories!`, 'Close', { 
            duration: 3000,
            panelClass: 'success-snackbar'
          });
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open(error.error?.message || 'Failed to create categories', 'Close', { 
            duration: 3000,
            panelClass: 'error-snackbar'
          });
        }
      });
  }

  dismissSuggestions(): void {
    this.showSuggestions = false;
  }

  navigateBackToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  proceedToNextStep(): void {
    if (this.budgetCategories.length === 0) {
      this.snackBar.open('Please create at least one budget category to continue', 'Close', { 
        duration: 3000,
        panelClass: 'info-snackbar'
      });
      return;
    }

    // Navigate to next budget setup step or dashboard
    this.router.navigate(['/dashboard'], {
      state: { 
        message: 'Budget categories set up successfully! You\'re making great progress.',
        showAchievement: true 
      }
    });
  }
}