import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BudgetCategorySummary, CATEGORY_COLORS, CATEGORY_ICONS } from '@simple-budget/shared';
import { CategoryTransactionsModalComponent, CategoryTransactionsDialogData } from './category-transactions-modal.component';

@Component({
  selector: 'app-budget-category-summary',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule
  ],
  template: `
    <mat-card class="budget-summary-card">
      <div class="card-header">
        <h3>Budget Categories</h3>
        <button mat-button color="primary" (click)="navigateToBudgetCategories()" class="manage-btn">
          Manage
          <mat-icon>settings</mat-icon>
        </button>
      </div>

      <div class="categories-list" *ngIf="categories && categories.length > 0">
        <!-- Essential Categories First -->
        <div class="category-group">
          <h4 class="group-title essential-title">
            <mat-icon class="group-icon essential-icon">shield</mat-icon>
            Essential Categories
          </h4>
          <div class="category-item" 
               *ngFor="let category of essentialCategories" 
               class="essential-category clickable-category"
               (click)="openCategoryTransactions(category)"
               [title]="'Click to view ' + category.categoryName + ' transactions'"
               [style.border-left-color]="getCategoryColor(category.colorId)">
            <div class="category-header">
              <div class="category-name-section">
                <div class="category-title">
                  <mat-icon class="category-icon" [style.color]="getCategoryColor(category.colorId)">{{ getCategoryIcon(category.iconId) }}</mat-icon>
                  <span class="category-name">{{ category.categoryName }}</span>
                </div>
                <span class="expense-count">{{ category.expenseCount }} expense{{ category.expenseCount !== 1 ? 's' : '' }}</span>
              </div>
              <div class="category-amounts">
                <span class="spent-amount">{{ category.currentSpent | currency }}</span>
                <span class="budget-limit">/ {{ category.monthlyLimit | currency }}</span>
              </div>
            </div>
            
            <div class="category-progress">
              <div class="progress-bar">
                <div class="progress-fill" 
                     [style.width.%]="Math.min(category.percentageUsed, 100)"
                     [style.background-color]="getCategoryColor(category.colorId)"
                     [ngClass]="'health-' + category.healthStatus">
                </div>
              </div>
              <div class="progress-details">
                <span class="remaining-amount">{{ category.remainingBudget | currency }} remaining</span>
                <span class="health-status" [ngClass]="'status-' + category.healthStatus">
                  {{ getHealthStatusText(category.healthStatus) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Non-Essential Categories -->
        <div class="category-group" *ngIf="nonEssentialCategories.length > 0">
          <h4 class="group-title non-essential-title">
            <mat-icon class="group-icon non-essential-icon">star</mat-icon>
            Non-Essential Categories
          </h4>
          <div class="category-item" 
               *ngFor="let category of nonEssentialCategories" 
               class="non-essential-category clickable-category"
               (click)="openCategoryTransactions(category)"
               [title]="'Click to view ' + category.categoryName + ' transactions'"
               [style.border-left-color]="getCategoryColor(category.colorId)">
            <div class="category-header">
              <div class="category-name-section">
                <div class="category-title">
                  <mat-icon class="category-icon" [style.color]="getCategoryColor(category.colorId)">{{ getCategoryIcon(category.iconId) }}</mat-icon>
                  <span class="category-name">{{ category.categoryName }}</span>
                </div>
                <span class="expense-count">{{ category.expenseCount }} expense{{ category.expenseCount !== 1 ? 's' : '' }}</span>
              </div>
              <div class="category-amounts">
                <span class="spent-amount">{{ category.currentSpent | currency }}</span>
                <span class="budget-limit">/ {{ category.monthlyLimit | currency }}</span>
              </div>
            </div>
            
            <div class="category-progress">
              <div class="progress-bar">
                <div class="progress-fill" 
                     [style.width.%]="Math.min(category.percentageUsed, 100)"
                     [style.background-color]="getCategoryColor(category.colorId)"
                     [ngClass]="'health-' + category.healthStatus">
                </div>
              </div>
              <div class="progress-details">
                <span class="remaining-amount">{{ category.remainingBudget | currency }} remaining</span>
                <span class="health-status" [ngClass]="'status-' + category.healthStatus">
                  {{ getHealthStatusText(category.healthStatus) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-categories" *ngIf="!categories || categories.length === 0">
        <div class="empty-icon">
          <mat-icon>category</mat-icon>
        </div>
        <h4>Set up your budget categories</h4>
        <p>Create budget categories to track your spending and stay on top of your financial goals</p>
        <button mat-raised-button color="primary" (click)="navigateToBudgetCategories()">
          <mat-icon>add</mat-icon>
          Create Budget Categories
        </button>
      </div>
    </mat-card>
  `,
  styles: [`
    .budget-summary-card {
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

    .manage-btn {
      color: var(--color-primary);
      font-weight: 500;
      padding-right: var(--spacing-md);
    }

    .manage-btn mat-icon {
      margin-left: var(--spacing-sm);
      margin-right: var(--spacing-sm);
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
    }

    .categories-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      max-height: 500px;
      overflow-y: auto;
    }

    .category-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .group-title {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 var(--spacing-sm) 0;
      padding-bottom: var(--spacing-xs);
      border-bottom: 1px solid var(--color-neutral-200);
    }

    .group-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
    }

    .essential-title {
      color: var(--color-success);
    }

    .essential-icon {
      color: var(--color-success);
    }

    .non-essential-title {
      color: var(--color-accent);
    }

    .non-essential-icon {
      color: var(--color-accent);
    }

    .category-item {
      padding: var(--spacing-lg);
      border-radius: var(--border-radius-md);
      border: 1px solid;
      background: white;
      transition: all 0.2s ease-out;
    }

    .category-item:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .clickable-category {
      cursor: pointer;
    }

    .clickable-category:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .clickable-category:active {
      transform: translateY(0px);
    }

    .essential-category {
      border-color: rgba(82, 183, 136, 0.3);
      background: rgba(82, 183, 136, 0.03);
      border-left: 4px solid var(--color-success);
    }

    .non-essential-category {
      border-color: rgba(244, 162, 97, 0.3);
      background: rgba(244, 162, 97, 0.03);
      border-left: 4px solid var(--color-accent);
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-md);
    }

    .category-name-section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .category-title {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .category-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      margin-left: var(--spacing-sm);
    }

    .category-name {
      font-weight: 600;
      color: var(--color-neutral-900);
      font-size: 1.05rem;
    }

    .expense-count {
      font-size: 0.8rem;
      color: var(--color-neutral-500);
      font-weight: 500;
      margin-left: var(--spacing-sm);
    }

    .category-amounts {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-family: var(--font-mono);
      margin-right: var(--spacing-xs);
    }

    .spent-amount {
      font-weight: 600;
      color: var(--color-neutral-900);
      font-size: 1.1rem;
    }

    .budget-limit {
      color: var(--color-neutral-500);
      font-size: 0.95rem;
    }

    .category-progress {
      margin-top: var(--spacing-md);
    }

    .progress-bar {
      height: 8px;
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      overflow: hidden;
      margin: 0 var(--spacing-sm) var(--spacing-sm) var(--spacing-sm);
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

    .progress-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
      padding: 0 var(--spacing-xs);
    }

    .remaining-amount {
      color: var(--color-neutral-600);
      font-family: var(--font-mono);
    }

    .health-status {
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

    .empty-categories {
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

    .empty-categories h4 {
      font-family: var(--font-secondary);
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--color-neutral-700);
    }

    .empty-categories p {
      margin: 0 0 var(--spacing-md) 0;
      color: var(--color-neutral-500);
      line-height: 1.4;
    }

    @media (max-width: 768px) {
      .category-header {
        flex-direction: column;
        align-items: stretch;
        gap: var(--spacing-sm);
      }

      .category-amounts {
        justify-content: flex-end;
      }

      .progress-details {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-xs);
      }
    }
  `]
})
export class BudgetCategorySummaryComponent {
  @Input() categories: BudgetCategorySummary[] = [];

  // Make Math available in template
  Math = Math;

  constructor(private router: Router, private dialog: MatDialog) {}

  get essentialCategories(): BudgetCategorySummary[] {
    return this.categories.filter(cat => cat.isEssential);
  }

  get nonEssentialCategories(): BudgetCategorySummary[] {
    return this.categories.filter(cat => !cat.isEssential);
  }

  navigateToBudgetCategories(): void {
    this.router.navigate(['/budget-categories']);
  }

  openCategoryTransactions(category: BudgetCategorySummary): void {
    const dialogData: CategoryTransactionsDialogData = {
      category: category
    };

    const dialogRef = this.dialog.open(CategoryTransactionsModalComponent, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: dialogData,
      panelClass: 'category-transactions-dialog'
    });

    dialogRef.afterClosed().subscribe(() => {
      // Optional: refresh data if needed
    });
  }

  getHealthStatusText(status: string): string {
    console.log('getHealthStatusText called with status:', status);
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'attention': return 'Needs Attention';
      case 'concern': return 'Over Budget';
      default: return 'Unknown';
    }
  }

  getCategoryColor(colorId: string): string {
    const color = CATEGORY_COLORS.find(c => c.id === colorId);
    return color?.value || '#2196F3'; // Default to blue
  }

  getCategoryIcon(iconId: string): string {
    const icon = CATEGORY_ICONS.find(i => i.id === iconId);
    return icon?.materialIcon || 'home'; // Default to home
  }
}