import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { ExpenseWithCategory } from '@simple-budget/shared';

@Component({
  selector: 'app-recent-expenses-summary',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <mat-card class="recent-expenses-card">
      <div class="card-header">
        <h3>Recent Expenses</h3>
        <button mat-button color="primary" (click)="navigateToExpenseHistory()" class="view-all-btn">
          View All
          <mat-icon>arrow_forward</mat-icon>
        </button>
      </div>
      
      <div class="expenses-list" *ngIf="expenses && expenses.length > 0">
        <div class="expense-item" 
             *ngFor="let expense of expenses" 
             [ngClass]="expense.isEssential ? 'essential-expense' : 'non-essential-expense'">
          <div class="expense-info">
            <div class="expense-header">
              <span class="expense-amount">{{ expense.amount | currency }}</span>
              <span class="expense-date">{{ expense.expenseDate | date:'MMM dd' }}</span>
            </div>
            <div class="expense-details">
              <span class="expense-category">
                <mat-icon class="category-icon" 
                          [ngClass]="expense.isEssential ? 'essential-icon' : 'non-essential-icon'">
                  {{ expense.isEssential ? 'shield' : 'star' }}
                </mat-icon>
                {{ expense.categoryName }}
              </span>
              <span class="expense-description" *ngIf="expense.description">
                {{ expense.description }}
              </span>
            </div>
          </div>
          <div class="expense-priority" 
               [ngClass]="expense.isEssential ? 'essential-priority' : 'non-essential-priority'">
            <span class="priority-badge">
              {{ expense.isEssential ? 'Essential' : 'Non-Essential' }}
            </span>
          </div>
        </div>
      </div>

      <div class="empty-expenses" *ngIf="!expenses || expenses.length === 0">
        <div class="empty-icon">
          <mat-icon>receipt</mat-icon>
        </div>
        <h4>No recent expenses</h4>
        <p>Your expense history will appear here once you start logging expenses</p>
        <button mat-raised-button color="primary" (click)="navigateToExpenseLogging()">
          <mat-icon>add</mat-icon>
          Log Your First Expense
        </button>
      </div>
    </mat-card>
  `,
  styles: [`
    .recent-expenses-card {
      height: 100%;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
      padding-bottom: var(--spacing-sm);
      border-bottom: 1px solid var(--color-neutral-300);
    }

    .card-header h3 {
      font-family: var(--font-secondary);
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-neutral-900);
      margin: 0;
    }

    .view-all-btn {
      color: var(--color-primary);
      font-weight: 500;
    }

    .expenses-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      max-height: 400px;
      overflow-y: auto;
    }

    .expense-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm);
      border-radius: var(--border-radius-md);
      border: 1px solid;
      background: white;
      transition: all 0.2s ease-out;
    }

    .expense-item:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    .essential-expense {
      border-color: rgba(82, 183, 136, 0.3);
      background: rgba(82, 183, 136, 0.03);
      border-left: 3px solid var(--color-success);
    }

    .non-essential-expense {
      border-color: rgba(244, 162, 97, 0.3);
      background: rgba(244, 162, 97, 0.03);
      border-left: 3px solid var(--color-accent);
    }

    .expense-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .expense-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xs);
    }

    .expense-amount {
      font-family: var(--font-mono);
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-neutral-900);
    }

    .expense-date {
      font-size: 0.85rem;
      color: var(--color-neutral-500);
      font-weight: 500;
    }

    .expense-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .expense-category {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--color-neutral-700);
    }

    .category-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
    }

    .essential-icon {
      color: var(--color-success);
    }

    .non-essential-icon {
      color: var(--color-accent);
    }

    .expense-description {
      font-size: 0.8rem;
      color: var(--color-neutral-600);
      font-style: italic;
    }

    .expense-priority {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .priority-badge {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 8px;
      border-radius: var(--border-radius-sm);
    }

    .essential-priority .priority-badge {
      background: rgba(82, 183, 136, 0.15);
      color: var(--color-success);
    }

    .non-essential-priority .priority-badge {
      background: rgba(244, 162, 97, 0.15);
      color: var(--color-accent);
    }

    .empty-expenses {
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

    .empty-expenses h4 {
      font-family: var(--font-secondary);
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--color-neutral-700);
    }

    .empty-expenses p {
      margin: 0 0 var(--spacing-md) 0;
      color: var(--color-neutral-500);
      line-height: 1.4;
    }

    @media (max-width: 768px) {
      .expense-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-xs);
      }

      .expense-item {
        flex-direction: column;
        align-items: stretch;
        gap: var(--spacing-sm);
      }

      .expense-priority {
        justify-content: flex-end;
      }
    }
  `]
})
export class RecentExpensesSummaryComponent {
  @Input() expenses: ExpenseWithCategory[] = [];

  constructor(private router: Router) {}

  navigateToExpenseHistory(): void {
    this.router.navigate(['/expense-history']);
  }

  navigateToExpenseLogging(): void {
    this.router.navigate(['/expense-logging']);
  }
}