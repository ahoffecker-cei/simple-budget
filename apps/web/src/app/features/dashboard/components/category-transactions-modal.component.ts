import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { DashboardService } from '../../../services/dashboard.service';
import { BudgetCategorySummary, ExpenseWithCategory } from '@simple-budget/shared';

export interface CategoryTransactionsDialogData {
  category: BudgetCategorySummary;
}

@Component({
  selector: 'app-category-transactions-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  template: `
    <div class="category-transactions-modal">
      <div class="modal-header">
        <div class="header-info">
          <div class="category-icon">
            <mat-icon [ngClass]="data.category.isEssential ? 'essential-icon' : 'non-essential-icon'">
              {{ data.category.isEssential ? 'shield' : 'star' }}
            </mat-icon>
          </div>
          <div class="header-content">
            <h2 class="category-name">{{ data.category.categoryName }} Transactions</h2>
            <p class="category-subtitle">{{ getCurrentMonthName() }} {{ getCurrentYear() }}</p>
          </div>
        </div>
        <button mat-icon-button class="close-button" (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-content">
        <!-- Category Summary -->
        <mat-card class="category-summary">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Monthly Budget</div>
              <div class="summary-value budget">{{ data.category.monthlyLimit | currency }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Spent This Month</div>
              <div class="summary-value spent" [ngClass]="getSpentClass()">
                {{ data.category.currentSpent | currency }}
              </div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Remaining Budget</div>
              <div class="summary-value remaining" [ngClass]="getRemainingClass()">
                {{ data.category.remainingBudget | currency }}
              </div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Budget Usage</div>
              <div class="summary-value percentage" [ngClass]="getUsageClass()">
                {{ data.category.percentageUsed.toFixed(1) }}%
              </div>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" 
                   [style.width.%]="Math.min(data.category.percentageUsed, 100)"
                   [ngClass]="'health-' + data.category.healthStatus">
              </div>
            </div>
            <div class="progress-label">
              <span class="health-status" [ngClass]="'status-' + data.category.healthStatus">
                {{ getHealthStatusText(data.category.healthStatus) }}
              </span>
            </div>
          </div>
        </mat-card>

        <!-- Transactions List -->
        <div class="transactions-section">
          <div class="section-header">
            <h3>Transactions ({{ data.category.expenseCount }})</h3>
            <button mat-button color="primary" (click)="navigateToExpenseLogging()" class="add-expense-btn">
              <mat-icon>add</mat-icon>
              Add Expense
            </button>
          </div>

          <!-- Loading State -->
          <div class="loading-state" *ngIf="isLoading">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading transactions...</p>
          </div>

          <!-- Transactions List -->
          <div class="transactions-list" *ngIf="!isLoading && transactions.length > 0">
            <div class="transaction-item" 
                 *ngFor="let transaction of transactions; trackBy: trackTransaction"
                 [ngClass]="transaction.isEssential ? 'essential-transaction' : 'non-essential-transaction'">
              <div class="transaction-date">
                <div class="date-day">{{ transaction.expenseDate | date:'dd' }}</div>
                <div class="date-month">{{ transaction.expenseDate | date:'MMM' }}</div>
              </div>
              
              <div class="transaction-info">
                <div class="transaction-header">
                  <span class="transaction-amount">{{ transaction.amount | currency }}</span>
                  <span class="transaction-time">{{ transaction.expenseDate | date:'shortTime' }}</span>
                </div>
                <div class="transaction-description" *ngIf="transaction.description">
                  {{ transaction.description }}
                </div>
                <div class="transaction-category">
                  <mat-icon class="category-icon" 
                            [ngClass]="transaction.isEssential ? 'essential-icon' : 'non-essential-icon'">
                    {{ transaction.isEssential ? 'shield' : 'star' }}
                  </mat-icon>
                  <span class="category-name">{{ transaction.categoryName }}</span>
                  <span class="category-type" 
                        [ngClass]="transaction.isEssential ? 'essential-type' : 'non-essential-type'">
                    {{ transaction.isEssential ? 'Essential' : 'Non-Essential' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="!isLoading && transactions.length === 0">
            <div class="empty-icon">
              <mat-icon>receipt_long</mat-icon>
            </div>
            <h4>No transactions this month</h4>
            <p>You haven't logged any expenses for {{ data.category.categoryName }} in {{ getCurrentMonthName() }}.</p>
            <button mat-raised-button color="primary" (click)="navigateToExpenseLogging()">
              <mat-icon>add</mat-icon>
              Log Your First Expense
            </button>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button mat-button (click)="close()">Close</button>
        <button mat-raised-button color="primary" (click)="navigateToExpenseLogging()">
          <mat-icon>add</mat-icon>
          Add Expense
        </button>
      </div>
    </div>
  `,
  styles: [`
    .category-transactions-modal {
      width: 100%;
      max-width: 700px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md) var(--spacing-lg);
      border-bottom: 1px solid var(--color-neutral-300);
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .category-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .category-icon.essential {
      background: rgba(82, 183, 136, 0.15);
    }

    .category-icon.non-essential {
      background: rgba(244, 162, 97, 0.15);
    }

    .category-icon mat-icon {
      font-size: 24px !important;
      width: 24px !important;
      height: 24px !important;
    }

    .essential-icon {
      color: var(--color-success);
    }

    .non-essential-icon {
      color: var(--color-accent);
    }

    .header-content .category-name {
      font-family: var(--font-secondary);
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-neutral-900);
      margin: 0 0 var(--spacing-xs) 0;
    }

    .category-subtitle {
      color: var(--color-neutral-600);
      font-size: 0.95rem;
      margin: 0;
    }

    .close-button {
      color: var(--color-neutral-500);
    }

    .modal-content {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .category-summary {
      padding: var(--spacing-lg);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }

    .summary-item {
      text-align: center;
    }

    .summary-label {
      font-size: 0.8rem;
      color: var(--color-neutral-600);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: var(--spacing-xs);
    }

    .summary-value {
      font-family: var(--font-mono);
      font-size: 1.25rem;
      font-weight: 600;
    }

    .summary-value.budget {
      color: var(--color-secondary);
    }

    .summary-value.spent.over-budget {
      color: var(--color-danger);
    }

    .summary-value.spent.on-track {
      color: var(--color-neutral-900);
    }

    .summary-value.remaining.positive {
      color: var(--color-success);
    }

    .summary-value.remaining.negative {
      color: var(--color-danger);
    }

    .summary-value.percentage.excellent {
      color: var(--color-success);
    }

    .summary-value.percentage.good {
      color: var(--color-secondary);
    }

    .summary-value.percentage.attention {
      color: var(--color-warning);
    }

    .summary-value.percentage.concern {
      color: var(--color-danger);
    }

    .progress-container {
      margin-top: var(--spacing-md);
    }

    .progress-bar {
      height: 8px;
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: var(--spacing-xs);
    }

    .progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.6s ease-out;
    }

    .progress-fill.health-excellent {
      background: var(--color-success);
    }

    .progress-fill.health-good {
      background: var(--color-secondary);
    }

    .progress-fill.health-attention {
      background: var(--color-warning);
    }

    .progress-fill.health-concern {
      background: var(--color-danger);
    }

    .progress-label {
      text-align: center;
    }

    .health-status {
      font-size: 0.85rem;
      font-weight: 500;
    }

    .health-status.status-excellent {
      color: var(--color-success);
    }

    .health-status.status-good {
      color: var(--color-secondary);
    }

    .health-status.status-attention {
      color: var(--color-warning);
    }

    .health-status.status-concern {
      color: var(--color-danger);
    }

    .transactions-section {
      flex: 1;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
    }

    .section-header h3 {
      font-family: var(--font-secondary);
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-neutral-900);
      margin: 0;
    }

    .add-expense-btn {
      font-weight: 500;
    }

    .loading-state {
      text-align: center;
      padding: var(--spacing-xl);
      color: var(--color-neutral-600);
    }

    .loading-state p {
      margin-top: var(--spacing-md);
      margin-bottom: 0;
    }

    .transactions-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      max-height: 400px;
      overflow-y: auto;
    }

    .transaction-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      border-radius: var(--border-radius-md);
      border: 1px solid;
      background: white;
      transition: all 0.2s ease-out;
    }

    .transaction-item:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    .essential-transaction {
      border-color: rgba(82, 183, 136, 0.3);
      background: rgba(82, 183, 136, 0.03);
      border-left: 4px solid var(--color-success);
    }

    .non-essential-transaction {
      border-color: rgba(244, 162, 97, 0.3);
      background: rgba(244, 162, 97, 0.03);
      border-left: 4px solid var(--color-accent);
    }

    .transaction-date {
      text-align: center;
      flex-shrink: 0;
      padding: var(--spacing-xs);
      background: rgba(0, 0, 0, 0.05);
      border-radius: var(--border-radius-sm);
      min-width: 60px;
    }

    .date-day {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-neutral-900);
      line-height: 1;
    }

    .date-month {
      font-size: 0.75rem;
      color: var(--color-neutral-600);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .transaction-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .transaction-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .transaction-amount {
      font-family: var(--font-mono);
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-neutral-900);
    }

    .transaction-time {
      font-size: 0.8rem;
      color: var(--color-neutral-500);
    }

    .transaction-description {
      font-size: 0.9rem;
      color: var(--color-neutral-700);
      font-style: italic;
      line-height: 1.3;
    }

    .transaction-category {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: 0.8rem;
    }

    .transaction-category .category-icon {
      font-size: 14px !important;
      width: 14px !important;
      height: 14px !important;
    }

    .category-name {
      font-weight: 500;
      color: var(--color-neutral-700);
    }

    .category-type {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 6px;
      border-radius: var(--border-radius-sm);
    }

    .essential-type {
      background: rgba(82, 183, 136, 0.15);
      color: var(--color-success);
    }

    .non-essential-type {
      background: rgba(244, 162, 97, 0.15);
      color: var(--color-accent);
    }

    .empty-state {
      text-align: center;
      padding: var(--spacing-xl);
      color: var(--color-neutral-600);
    }

    .empty-icon {
      margin-bottom: var(--spacing-md);
    }

    .empty-icon mat-icon {
      font-size: 48px !important;
      width: 48px !important;
      height: 48px !important;
      color: var(--color-neutral-400);
    }

    .empty-state h4 {
      font-family: var(--font-secondary);
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--color-neutral-700);
    }

    .empty-state p {
      margin: 0 0 var(--spacing-md) 0;
      color: var(--color-neutral-500);
      line-height: 1.4;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
      padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg) var(--spacing-lg);
      border-top: 1px solid var(--color-neutral-300);
    }

    @media (max-width: 768px) {
      .category-transactions-modal {
        max-width: 100vw;
        max-height: 100vh;
      }

      .modal-header {
        padding: var(--spacing-md);
      }

      .header-info {
        flex-direction: column;
        text-align: center;
        gap: var(--spacing-sm);
      }

      .modal-content {
        padding: var(--spacing-md);
      }

      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .section-header {
        flex-direction: column;
        align-items: stretch;
        gap: var(--spacing-sm);
      }

      .transaction-item {
        flex-direction: column;
        align-items: stretch;
        gap: var(--spacing-sm);
      }

      .transaction-date {
        align-self: flex-start;
      }

      .modal-actions {
        padding: var(--spacing-md);
      }
    }
  `]
})
export class CategoryTransactionsModalComponent implements OnInit {
  transactions: ExpenseWithCategory[] = [];
  isLoading = false;
  
  // Make Math available in template
  Math = Math;

  constructor(
    public dialogRef: MatDialogRef<CategoryTransactionsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CategoryTransactionsDialogData,
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading = true;
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // getMonth() returns 0-11

    this.dashboardService.getCategoryExpenses(this.data.category.categoryId, year, month).subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load category transactions:', error);
        this.isLoading = false;
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  navigateToExpenseLogging(): void {
    this.close();
    this.router.navigate(['/expense-logging'], { 
      queryParams: { 
        categoryId: this.data.category.categoryId,
        categoryName: this.data.category.categoryName
      } 
    });
  }

  getCurrentMonthName(): string {
    return new Date().toLocaleDateString('en-US', { month: 'long' });
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  getSpentClass(): string {
    return this.data.category.remainingBudget >= 0 ? 'on-track' : 'over-budget';
  }

  getRemainingClass(): string {
    return this.data.category.remainingBudget >= 0 ? 'positive' : 'negative';
  }

  getUsageClass(): string {
    return this.data.category.healthStatus;
  }

  getHealthStatusText(status: string): string {
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'attention': return 'Needs Attention';
      case 'concern': return 'Over Budget';
      default: return 'Unknown';
    }
  }

  trackTransaction(index: number, transaction: ExpenseWithCategory): string {
    return transaction.expenseId;
  }
}