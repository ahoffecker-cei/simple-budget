import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Expense } from '@simple-budget/shared';

interface CategoryData {
  categoryId: string;
  name: string;
  color: string;
  totalAmount: number;
  expenseCount: number;
}

export interface ExpenseGraphsDetailsDialogData {
  period: string;
  totalAmount: number;
  expenseCount: number;
  categories: CategoryData[];
  expenses: Expense[];
}

@Component({
  selector: 'app-expense-graphs-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="dialog-header">
      <div class="header-content">
        <h2 mat-dialog-title>{{data.period}}</h2>
        <p class="period-subtitle">Spending breakdown</p>
      </div>
      <button mat-icon-button [mat-dialog-close]="" class="close-button">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="dialog-content">
      <!-- Summary Section -->
      <div class="summary-section">
        <div class="summary-card total-card">
          <div class="summary-icon">
            <mat-icon>payments</mat-icon>
          </div>
          <div class="summary-details">
            <div class="summary-amount">{{formatCurrency(data.totalAmount)}}</div>
            <div class="summary-label">Total Spent</div>
          </div>
        </div>
        
        <div class="summary-card count-card">
          <div class="summary-icon">
            <mat-icon>receipt</mat-icon>
          </div>
          <div class="summary-details">
            <div class="summary-amount">{{data.expenseCount}}</div>
            <div class="summary-label">{{data.expenseCount === 1 ? 'Expense' : 'Expenses'}}</div>
          </div>
        </div>
      </div>

      <mat-divider></mat-divider>

      <!-- Categories Breakdown -->
      <div class="categories-section">
        <h3 class="section-title">
          <mat-icon>category</mat-icon>
          Category Breakdown
        </h3>
        
        <div class="categories-list">
          <div 
            *ngFor="let category of data.categories" 
            class="category-item">
            <div class="category-header">
              <div class="category-color" [style.background-color]="category.color"></div>
              <div class="category-info">
                <div class="category-name">{{category.name}}</div>
                <div class="category-meta">
                  {{category.expenseCount}} {{category.expenseCount === 1 ? 'expense' : 'expenses'}}
                </div>
              </div>
              <div class="category-amount">{{formatCurrency(category.totalAmount)}}</div>
            </div>
            <div class="category-bar">
              <div 
                class="category-bar-fill" 
                [style.background-color]="category.color"
                [style.width.%]="(category.totalAmount / data.totalAmount) * 100">
              </div>
            </div>
          </div>
        </div>
      </div>

      <mat-divider></mat-divider>

      <!-- Quick Insights -->
      <div class="insights-section">
        <h3 class="section-title">
          <mat-icon>lightbulb</mat-icon>
          Quick Insights
        </h3>
        
        <div class="insights-grid">
          <div class="insight-chip">
            <mat-icon>trending_up</mat-icon>
            <span>{{getTopCategory()?.name || 'No data'}} was your biggest expense</span>
          </div>
          
          <div class="insight-chip" *ngIf="data.categories.length > 1">
            <mat-icon>pie_chart</mat-icon>
            <span>Split across {{data.categories.length}} categories</span>
          </div>
          
          <div class="insight-chip" *ngIf="getAverageExpenseAmount() > 0">
            <mat-icon>calculate</mat-icon>
            <span>{{formatCurrency(getAverageExpenseAmount())}} average per expense</span>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-button [mat-dialog-close]="" class="cancel-button">
        Close
      </button>
      <button mat-raised-button color="primary" [mat-dialog-close]="" class="view-details-button">
        <mat-icon>list_alt</mat-icon>
        View All Expenses
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--spacing-lg, 24px) var(--spacing-lg, 24px) 0;
      margin: 0;
    }

    .header-content h2 {
      margin: 0 0 var(--spacing-xs, 4px) 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-neutral-900, #111827);
    }

    .period-subtitle {
      margin: 0;
      font-size: 0.875rem;
      color: var(--color-neutral-600, #6b7280);
    }

    .close-button {
      color: var(--color-neutral-500, #6b7280);
    }

    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg, 24px);
      padding: var(--spacing-lg, 24px) !important;
      max-height: 80vh;
      overflow-y: auto;
    }

    .summary-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-md, 16px);
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: var(--spacing-md, 16px);
      padding: var(--spacing-md, 16px);
      border-radius: var(--border-radius-md, 8px);
      border: 1px solid var(--color-neutral-200, #e5e7eb);
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    }

    .summary-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: var(--border-radius-full, 50%);
      background: var(--color-primary, #3b82f6);
      color: white;
      
      mat-icon {
        font-size: 1.25rem !important;
        width: 20px !important;
        height: 20px !important;
      }
    }

    .summary-amount {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-neutral-900, #111827);
      line-height: 1.2;
    }

    .summary-label {
      font-size: 0.875rem;
      color: var(--color-neutral-600, #6b7280);
      font-weight: 500;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm, 8px);
      margin: 0 0 var(--spacing-md, 16px) 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-neutral-800, #1f2937);
      
      mat-icon {
        color: var(--color-primary, #3b82f6);
        font-size: 1.25rem !important;
        width: 20px !important;
        height: 20px !important;
      }
    }

    .categories-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md, 16px);
    }

    .category-item {
      padding: var(--spacing-md, 16px);
      border-radius: var(--border-radius-md, 8px);
      background: white;
      border: 1px solid var(--color-neutral-200, #e5e7eb);
      transition: all 0.2s ease;
      
      &:hover {
        box-shadow: var(--shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1));
        border-color: var(--color-primary, #3b82f6);
      }
    }

    .category-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-md, 16px);
      margin-bottom: var(--spacing-sm, 8px);
    }

    .category-color {
      width: 12px;
      height: 12px;
      border-radius: var(--border-radius-full, 50%);
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
    }

    .category-info {
      flex: 1;
    }

    .category-name {
      font-weight: 600;
      color: var(--color-neutral-900, #111827);
      font-size: 0.875rem;
    }

    .category-meta {
      font-size: 0.75rem;
      color: var(--color-neutral-600, #6b7280);
    }

    .category-amount {
      font-weight: 700;
      color: var(--color-neutral-900, #111827);
      font-size: 1rem;
    }

    .category-bar {
      width: 100%;
      height: 4px;
      background: var(--color-neutral-200, #e5e7eb);
      border-radius: var(--border-radius-full, 50px);
      overflow: hidden;
    }

    .category-bar-fill {
      height: 100%;
      border-radius: var(--border-radius-full, 50px);
      transition: width 0.3s ease;
    }

    .insights-grid {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm, 8px);
    }

    .insight-chip {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm, 8px);
      padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #bae6fd;
      border-radius: var(--border-radius-full, 50px);
      font-size: 0.875rem;
      color: var(--color-neutral-700, #374151);
      
      mat-icon {
        color: var(--color-primary, #3b82f6);
        font-size: 1rem !important;
        width: 16px !important;
        height: 16px !important;
      }
    }

    .dialog-actions {
      padding: 0 var(--spacing-lg, 24px) var(--spacing-lg, 24px);
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--spacing-sm, 8px);
    }

    .cancel-button {
      color: var(--color-neutral-600, #6b7280);
    }

    .view-details-button {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs, 4px);
    }

    // Mobile Responsive
    @media (max-width: 768px) {
      .dialog-header {
        padding: var(--spacing-md, 16px) var(--spacing-md, 16px) 0;
      }
      
      .dialog-content {
        padding: var(--spacing-md, 16px) !important;
        gap: var(--spacing-md, 16px);
      }

      .summary-section {
        grid-template-columns: 1fr;
        gap: var(--spacing-sm, 8px);
      }

      .summary-card {
        padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
        gap: var(--spacing-sm, 8px);
      }

      .summary-icon {
        width: 36px;
        height: 36px;
      }

      .category-header {
        gap: var(--spacing-sm, 8px);
      }

      .dialog-actions {
        padding: 0 var(--spacing-md, 16px) var(--spacing-md, 16px);
        flex-direction: column-reverse;
        
        button {
          width: 100%;
        }
      }
    }
  `]
})
export class ExpenseGraphsDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ExpenseGraphsDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExpenseGraphsDetailsDialogData
  ) {}

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getTopCategory(): CategoryData | null {
    if (!this.data.categories.length) return null;
    return this.data.categories.reduce((max, current) => 
      current.totalAmount > max.totalAmount ? current : max
    );
  }

  getAverageExpenseAmount(): number {
    if (!this.data.expenseCount) return 0;
    return this.data.totalAmount / this.data.expenseCount;
  }
}