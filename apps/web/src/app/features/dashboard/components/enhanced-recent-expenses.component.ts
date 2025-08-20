import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';
import { ExpenseWithCategory } from '@simple-budget/shared';

@Component({
  selector: 'app-enhanced-recent-expenses',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <mat-card class="recent-expenses-card card-subtle">
      <div class="card-header">
        <h3>
          <mat-icon>receipt</mat-icon>
          Recent Expenses
        </h3>
        <button mat-button color="primary" class="view-all-btn" (click)="navigateToExpenseLogging()">
          <mat-icon>arrow_forward</mat-icon>
          View All
        </button>
      </div>

      <div class="expenses-content">
        <!-- Real-time expenses list -->
        <div *ngIf="recentExpenses && recentExpenses.length > 0; else noExpensesState" 
             class="expenses-list">
          <div *ngFor="let expense of recentExpenses; trackBy: trackByExpenseId" 
               class="expense-item"
               [class]="getExpenseCategoryClass(expense)">
            <div class="expense-main">
              <div class="expense-icon-wrapper">
                <mat-icon class="expense-icon">{{ getCategoryIcon(expense.categoryName) }}</mat-icon>
              </div>
              
              <div class="expense-details">
                <div class="expense-description">{{ expense.description || 'No description' }}</div>
                <div class="expense-meta">
                  <span class="expense-category">{{ expense.categoryName }}</span>
                  <span class="expense-date">{{ formatExpenseDate(expense.expenseDate) }}</span>
                </div>
              </div>
              
              <div class="expense-amount">
                -{{ expense.amount | currency }}
              </div>
            </div>

            <!-- Savings goal indicator if expense is tagged -->
            <div *ngIf="expense.savingsGoalName" class="savings-goal-tag">
              <mat-chip class="goal-chip">
                <mat-icon matChipAvatar>flag</mat-icon>
                {{ expense.savingsGoalName }}
              </mat-chip>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <ng-template #noExpensesState>
          <div class="empty-state">
            <mat-icon class="empty-icon">receipt</mat-icon>
            <h4>No expenses logged yet</h4>
            <p>Start tracking your expenses to see them here</p>
            <button mat-raised-button color="primary" (click)="navigateToExpenseLogging()">
              <mat-icon>add</mat-icon>
              Log Your First Expense
            </button>
          </div>
        </ng-template>

        <!-- Loading state -->
        <div *ngIf="isLoading" class="loading-state">
          <mat-icon class="loading-icon">hourglass_empty</mat-icon>
          <p>Loading recent expenses...</p>
        </div>
      </div>
    </mat-card>
  `,
  styles: [`
    .recent-expenses-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 20px 0 20px;
    }

    .card-header h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: var(--color-neutral-700);
      font-weight: 600;
      font-size: 1.1rem;
    }

    .card-header mat-icon {
      color: var(--color-primary);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .view-all-btn {
      font-weight: 500;
      font-size: 0.9rem;
      min-width: auto;
    }

    .view-all-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .expenses-content {
      flex: 1;
      padding: 16px 20px 20px 20px;
    }

    .expenses-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .expense-item {
      padding: 14px;
      border-radius: 8px;
      border: 1px solid var(--color-neutral-200);
      background: white;
      transition: all 0.2s ease-out;
    }

    .expense-item:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    .expense-main {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .expense-icon-wrapper {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.9);
    }

    .expense-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      color: white;
    }

    .expense-details {
      flex: 1;
      min-width: 0;
    }

    .expense-description {
      font-weight: 500;
      color: var(--color-neutral-800);
      font-size: 0.95rem;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .expense-meta {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 0.8rem;
      color: var(--color-neutral-600);
    }

    .expense-category {
      background: rgba(0, 0, 0, 0.05);
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }

    .expense-date {
      font-weight: 400;
    }

    .expense-amount {
      font-family: var(--font-mono, monospace);
      font-weight: 600;
      color: var(--color-neutral-800);
      font-size: 0.95rem;
      flex-shrink: 0;
    }

    .savings-goal-tag {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }

    .goal-chip {
      font-size: 0.75rem;
      height: 24px;
      background: rgba(244, 162, 97, 0.15);
      color: var(--color-accent);
    }

    .goal-chip mat-icon {
      font-size: 14px !important;
      width: 14px !important;
      height: 14px !important;
      color: var(--color-accent) !important;
    }

    // Category-specific colors
    .expense-item.grocery-category .expense-icon-wrapper {
      background: rgba(76, 175, 80, 0.1);
    }
    .expense-item.grocery-category .expense-icon {
      color: #4CAF50;
    }

    .expense-item.transportation-category .expense-icon-wrapper {
      background: rgba(33, 150, 243, 0.1);
    }
    .expense-item.transportation-category .expense-icon {
      color: #2196F3;
    }

    .expense-item.dining-category .expense-icon-wrapper {
      background: rgba(255, 152, 0, 0.1);
    }
    .expense-item.dining-category .expense-icon {
      color: #FF9800;
    }

    .expense-item.shopping-category .expense-icon-wrapper {
      background: rgba(156, 39, 176, 0.1);
    }
    .expense-item.shopping-category .expense-icon {
      color: #9C27B0;
    }

    .expense-item.entertainment-category .expense-icon-wrapper {
      background: rgba(233, 30, 99, 0.1);
    }
    .expense-item.entertainment-category .expense-icon {
      color: #E91E63;
    }

    .expense-item.utilities-category .expense-icon-wrapper {
      background: rgba(121, 85, 72, 0.1);
    }
    .expense-item.utilities-category .expense-icon {
      color: #795548;
    }

    .expense-item.health-category .expense-icon-wrapper {
      background: rgba(244, 67, 54, 0.1);
    }
    .expense-item.health-category .expense-icon {
      color: #F44336;
    }

    // Empty state
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 40px 20px;
      gap: 12px;
    }

    .empty-icon {
      font-size: 48px !important;
      width: 48px !important;
      height: 48px !important;
      color: var(--color-neutral-400);
    }

    .empty-state h4 {
      margin: 0;
      color: var(--color-neutral-600);
      font-weight: 600;
    }

    .empty-state p {
      margin: 0;
      color: var(--color-neutral-500);
      font-size: 0.9rem;
    }

    // Loading state
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 40px 20px;
      gap: 12px;
    }

    .loading-icon {
      font-size: 32px !important;
      width: 32px !important;
      height: 32px !important;
      color: var(--color-neutral-400);
      animation: spin 1s linear infinite;
    }

    .loading-state p {
      margin: 0;
      color: var(--color-neutral-500);
      font-size: 0.9rem;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    // Responsive adjustments
    @media (max-width: 768px) {
      .card-header {
        padding: 16px 16px 0 16px;
      }

      .expenses-content {
        padding: 12px 16px 16px 16px;
      }

      .expense-item {
        padding: 12px;
      }

      .expense-description {
        font-size: 0.9rem;
      }

      .expense-meta {
        font-size: 0.75rem;
      }

      .expense-amount {
        font-size: 0.9rem;
      }

      .view-all-btn {
        font-size: 0.8rem;
        padding: 4px 8px;
      }
    }
  `]
})
export class EnhancedRecentExpensesComponent implements OnInit, OnChanges {
  @Input() recentExpenses: ExpenseWithCategory[] = [];
  @Input() isLoading: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Component initialization
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recentExpenses']) {
      console.log('Recent expenses updated:', this.recentExpenses);
    }
  }

  trackByExpenseId(index: number, expense: ExpenseWithCategory): string {
    return expense.expenseId;
  }

  navigateToExpenseLogging(): void {
    this.router.navigate(['/expense-logging']);
  }

  formatExpenseDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  getCategoryIcon(categoryName: string): string {
    const categoryLower = categoryName?.toLowerCase() || '';
    
    // Map common category names to icons
    if (categoryLower.includes('grocery') || categoryLower.includes('food')) return 'shopping_cart';
    if (categoryLower.includes('gas') || categoryLower.includes('transport') || categoryLower.includes('fuel')) return 'local_gas_station';
    if (categoryLower.includes('restaurant') || categoryLower.includes('dining') || categoryLower.includes('eat')) return 'restaurant';
    if (categoryLower.includes('shopping') || categoryLower.includes('retail') || categoryLower.includes('clothes')) return 'shopping_bag';
    if (categoryLower.includes('entertainment') || categoryLower.includes('movie') || categoryLower.includes('game')) return 'theaters';
    if (categoryLower.includes('utilities') || categoryLower.includes('electric') || categoryLower.includes('water')) return 'electrical_services';
    if (categoryLower.includes('health') || categoryLower.includes('medical') || categoryLower.includes('doctor')) return 'local_hospital';
    if (categoryLower.includes('insurance')) return 'security';
    if (categoryLower.includes('rent') || categoryLower.includes('mortgage')) return 'home';
    if (categoryLower.includes('phone') || categoryLower.includes('internet')) return 'phone_android';
    
    // Default icon
    return 'receipt_long';
  }

  getExpenseCategoryClass(expense: ExpenseWithCategory): string {
    const categoryLower = expense.categoryName?.toLowerCase() || '';
    
    if (categoryLower.includes('grocery') || categoryLower.includes('food')) return 'grocery-category';
    if (categoryLower.includes('gas') || categoryLower.includes('transport') || categoryLower.includes('fuel')) return 'transportation-category';
    if (categoryLower.includes('restaurant') || categoryLower.includes('dining') || categoryLower.includes('eat')) return 'dining-category';
    if (categoryLower.includes('shopping') || categoryLower.includes('retail') || categoryLower.includes('clothes')) return 'shopping-category';
    if (categoryLower.includes('entertainment') || categoryLower.includes('movie') || categoryLower.includes('game')) return 'entertainment-category';
    if (categoryLower.includes('utilities') || categoryLower.includes('electric') || categoryLower.includes('water')) return 'utilities-category';
    if (categoryLower.includes('health') || categoryLower.includes('medical') || categoryLower.includes('doctor')) return 'health-category';
    
    return 'general-category';
  }
}