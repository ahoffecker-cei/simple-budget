import { Component, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, of, EMPTY } from 'rxjs';
import { BudgetImpactPreview } from '../../../../../../shared/src/models';
import { BudgetImpactService } from './services/budget-impact.service';

@Component({
  selector: 'app-budget-impact-preview',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressBarModule],
  template: `
    <div class="budget-impact-preview" *ngIf="budgetImpact">
      <mat-card [ngClass]="getHealthStatusClass()">
        <mat-card-content>
          <!-- Essential Category Indicator -->
          <div class="category-header">
            <div class="category-info">
              <mat-icon [ngClass]="{'essential-icon': budgetImpact.isEssential}">
                {{ budgetImpact.isEssential ? 'shield' : 'star' }}
              </mat-icon>
              <span class="category-name">{{ budgetImpact.categoryName }}</span>
            </div>
            <div class="health-indicator" [ngClass]="getHealthStatusClass()">
              <mat-icon>{{ getHealthStatusIcon() }}</mat-icon>
            </div>
          </div>

          <!-- Budget Impact Information -->
          <div class="budget-info">
            <div class="budget-amounts">
              <div class="amount-row">
                <span class="label">Current Spent:</span>
                <span class="amount">\${{ budgetImpact.currentSpent | number:'1.2-2' }}</span>
              </div>
              <div class="amount-row">
                <span class="label">After This Expense:</span>
                <span class="amount">\${{ (budgetImpact.currentSpent + previewAmount) | number:'1.2-2' }}</span>
              </div>
              <div class="amount-row" [ngClass]="{'negative': budgetImpact.remainingAfterExpense < 0}">
                <span class="label">{{ budgetImpact.remainingAfterExpense >= 0 ? 'Remaining:' : 'Over Budget:' }}</span>
                <span class="amount">\${{ Math.abs(budgetImpact.remainingAfterExpense) | number:'1.2-2' }}</span>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="progress-section">
              <mat-progress-bar 
                mode="determinate" 
                [value]="budgetImpact.percentageUsed"
                [ngClass]="getProgressBarClass()">
              </mat-progress-bar>
              <div class="progress-labels">
                <span>\$0</span>
                <span class="percentage">{{ budgetImpact.percentageUsed | number:'1.1-1' }}%</span>
                <span>\${{ budgetImpact.monthlyLimit | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>

          <!-- Encouraging Message -->
          <div class="impact-message" [ngClass]="getEncouragementClass()">
            <mat-icon>{{ getEncouragementIcon() }}</mat-icon>
            <span>{{ budgetImpact.impactMessage }}</span>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Loading State -->
    <div class="loading-preview" *ngIf="isLoading">
      <mat-card>
        <mat-card-content>
          <div class="loading-content">
            <mat-icon>calculate</mat-icon>
            <span>Calculating budget impact...</span>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Error State -->
    <div class="error-preview" *ngIf="hasError">
      <mat-card>
        <mat-card-content>
          <div class="error-content">
            <mat-icon>error</mat-icon>
            <span>Unable to calculate budget impact</span>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .budget-impact-preview {
      margin: 16px 0;
      transition: all 0.3s ease-in-out;
    }

    mat-card {
      border-left: 4px solid;
      transition: all 0.3s ease-in-out;
    }

    .excellent { 
      border-left-color: #4caf50;
      background-color: #f1f8e9;
    }

    .good { 
      border-left-color: #2196f3;
      background-color: #e3f2fd;
    }

    .attention { 
      border-left-color: #ff9800;
      background-color: #fff3e0;
    }

    .concern { 
      border-left-color: #f44336;
      background-color: #ffebee;
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .category-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .essential-icon {
      color: #1976d2;
      font-weight: bold;
    }

    .category-name {
      font-weight: 500;
      font-size: 1.1em;
    }

    .health-indicator mat-icon {
      font-size: 24px;
    }

    .excellent .health-indicator mat-icon { color: #4caf50; }
    .good .health-indicator mat-icon { color: #2196f3; }
    .attention .health-indicator mat-icon { color: #ff9800; }
    .concern .health-indicator mat-icon { color: #f44336; }

    .budget-info {
      margin-bottom: 16px;
    }

    .budget-amounts {
      margin-bottom: 16px;
    }

    .amount-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .amount-row.negative {
      color: #f44336;
      font-weight: 500;
    }

    .label {
      color: #666;
    }

    .amount {
      font-weight: 500;
    }

    .progress-section {
      margin: 16px 0;
    }

    mat-progress-bar {
      height: 8px;
      border-radius: 4px;
    }

    .progress-bar-excellent ::ng-deep .mat-progress-bar-fill::after { 
      background-color: #4caf50 !important; 
    }

    .progress-bar-good ::ng-deep .mat-progress-bar-fill::after { 
      background-color: #2196f3 !important; 
    }

    .progress-bar-attention ::ng-deep .mat-progress-bar-fill::after { 
      background-color: #ff9800 !important; 
    }

    .progress-bar-concern ::ng-deep .mat-progress-bar-fill::after { 
      background-color: #f44336 !important; 
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 4px;
      font-size: 0.9em;
      color: #666;
    }

    .percentage {
      font-weight: 500;
    }

    .impact-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border-radius: 4px;
      font-weight: 500;
    }

    .celebration {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .encouragement {
      background-color: #e3f2fd;
      color: #1565c0;
    }

    .guidance {
      background-color: #fff3e0;
      color: #ef6c00;
    }

    .support {
      background-color: #ffebee;
      color: #c62828;
    }

    .loading-preview, .error-preview {
      margin: 16px 0;
    }

    .loading-content, .error-content {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
      padding: 16px;
      color: #666;
    }

    .error-content {
      color: #f44336;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .budget-impact-preview {
      animation: fadeIn 0.3s ease-in-out;
    }
  `]
})
export class BudgetImpactPreviewComponent implements OnChanges, OnDestroy {
  @Input() categoryId: string | null = null;
  @Input() amount: number = 0;
  @Input() expenseDate?: string;

  budgetImpact: BudgetImpactPreview | null = null;
  isLoading = false;
  hasError = false;
  previewAmount = 0;

  private destroy$ = new Subject<void>();
  private previewSubject = new Subject<{ categoryId: string; amount: number; expenseDate?: string }>();

  // Make Math available in template
  Math = Math;

  constructor(private budgetImpactService: BudgetImpactService) {
    this.previewSubject.pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => 
        prev.categoryId === curr.categoryId && 
        prev.amount === curr.amount && 
        prev.expenseDate === curr.expenseDate
      ),
      switchMap(({ categoryId, amount, expenseDate }) => {
        if (!categoryId || amount <= 0) {
          return of(null);
        }
        
        this.isLoading = true;
        this.hasError = false;
        
        return this.budgetImpactService.getBudgetImpactPreview(categoryId, amount, expenseDate);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (impact) => {
        this.budgetImpact = impact;
        this.isLoading = false;
        this.hasError = false;
      },
      error: (error) => {
        console.error('Budget impact preview error:', error);
        this.budgetImpact = null;
        this.isLoading = false;
        this.hasError = true;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['categoryId'] || changes['amount'] || changes['expenseDate']) && 
        this.categoryId && this.amount > 0) {
      
      this.previewAmount = this.amount;
      this.previewSubject.next({
        categoryId: this.categoryId,
        amount: this.amount,
        expenseDate: this.expenseDate
      });
    } else if (!this.categoryId || this.amount <= 0) {
      this.budgetImpact = null;
      this.isLoading = false;
      this.hasError = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getHealthStatusClass(): string {
    return this.budgetImpact?.healthStatus || 'excellent';
  }

  getHealthStatusIcon(): string {
    switch (this.budgetImpact?.healthStatus) {
      case 'excellent': return 'check_circle';
      case 'good': return 'thumb_up';
      case 'attention': return 'warning';
      case 'concern': return 'error';
      default: return 'help';
    }
  }

  getProgressBarClass(): string {
    return `progress-bar-${this.budgetImpact?.healthStatus || 'excellent'}`;
  }

  getEncouragementClass(): string {
    return this.budgetImpact?.encouragementLevel || 'encouragement';
  }

  getEncouragementIcon(): string {
    switch (this.budgetImpact?.encouragementLevel) {
      case 'celebration': return 'celebration';
      case 'encouragement': return 'thumb_up';
      case 'guidance': return 'lightbulb';
      case 'support': return 'favorite';
      default: return 'info';
    }
  }
}