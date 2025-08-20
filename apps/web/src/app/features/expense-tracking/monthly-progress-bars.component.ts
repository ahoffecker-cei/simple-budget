import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, interval, startWith } from 'rxjs';
import { MonthlyProgressData, CATEGORY_COLORS, CATEGORY_ICONS } from '../../../../../../shared/src/models';
import { BudgetImpactService } from './services/budget-impact.service';

@Component({
  selector: 'app-monthly-progress-bars',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressBarModule, MatTooltipModule],
  template: `
    <div class="monthly-progress-container">
      <h3>Monthly Budget Progress</h3>
      
      <div class="progress-categories" *ngIf="progressData.length > 0; else noData">
        <div 
          class="category-progress" 
          *ngFor="let category of progressData; trackBy: trackByCategory"
          [ngClass]="getCategoryClass(category)"
        >
          <div class="category-header">
            <div class="category-info">
              <mat-icon class="category-icon" [style.color]="getCategoryColor(category.colorId)">
                {{ getCategoryIcon(category.iconId) }}
              </mat-icon>
              <span class="category-name">{{ category.categoryName }}</span>
              <mat-icon 
                class="health-indicator"
                [matTooltip]="getHealthTooltip(category)"
                [ngClass]="'health-' + category.healthStatus"
              >
                {{ getHealthIcon(category.healthStatus) }}
              </mat-icon>
            </div>
            <div class="category-amounts">
              <span class="current-amount">\${{ category.currentSpent | number:'1.2-2' }}</span>
              <span class="separator">/</span>
              <span class="limit-amount">\${{ category.monthlyLimit | number:'1.2-2' }}</span>
            </div>
          </div>

          <div class="progress-section">
            <mat-progress-bar 
              mode="determinate" 
              [value]="Math.min(category.percentageUsed, 100)"
              [style.--mdc-linear-progress-active-indicator-color]="getCategoryColor(category.colorId)"
              [ngClass]="getProgressBarClass(category.healthStatus)"
              [matTooltip]="getProgressTooltip(category)"
            ></mat-progress-bar>
            
            <div class="progress-details">
              <span class="percentage">{{ category.percentageUsed | number:'1.1-1' }}%</span>
              <span class="days-remaining">{{ category.daysRemainingInMonth }} days left</span>
            </div>
          </div>

          <!-- Projected Spending Alert -->
          <div 
            class="projection-alert" 
            *ngIf="category.projectedSpending > category.monthlyLimit"
            [matTooltip]="getProjectionTooltip(category)"
          >
            <mat-icon>trending_up</mat-icon>
            <span>Projected: \${{ category.projectedSpending | number:'1.2-2' }}</span>
          </div>

          <!-- Encouraging Message -->
          <div class="category-message" [ngClass]="'message-' + category.healthStatus">
            {{ getCategoryMessage(category) }}
          </div>
        </div>
      </div>

      <ng-template #noData>
        <div class="no-data">
          <mat-icon>bar_chart</mat-icon>
          <p>No budget categories found</p>
        </div>
      </ng-template>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <mat-icon>hourglass_empty</mat-icon>
        <span>Loading progress data...</span>
      </div>
    </div>
  `,
  styles: [`
    .monthly-progress-container {
      padding: 16px;
    }

    h3 {
      margin-bottom: 24px;
      color: #333;
      font-weight: 500;
    }

    .progress-categories {
      display: grid;
      gap: 16px;
    }

    .category-progress {
      background: white;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-left: 4px solid;
      transition: all 0.3s ease;
    }

    .category-progress:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      transform: translateY(-2px);
    }

    .excellent { border-left-color: #4caf50; }
    .good { border-left-color: #2196f3; }
    .attention { border-left-color: #ff9800; }
    .concern { border-left-color: #f44336; }

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .category-info {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .essential-icon {
      color: #1976d2;
      font-weight: bold;
    }

    .category-name {
      font-weight: 500;
      color: #333;
      flex: 1;
    }

    .health-indicator {
      font-size: 20px;
      cursor: help;
    }

    .health-excellent { color: #4caf50; }
    .health-good { color: #2196f3; }
    .health-attention { color: #ff9800; }
    .health-concern { color: #f44336; }

    .category-amounts {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
    }

    .current-amount {
      color: #333;
    }

    .separator {
      color: #666;
    }

    .limit-amount {
      color: #666;
    }

    .progress-section {
      margin-bottom: 12px;
    }

    mat-progress-bar {
      height: 8px;
      border-radius: 4px;
      margin-bottom: 8px;
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

    .progress-details {
      display: flex;
      justify-content: space-between;
      font-size: 0.9em;
    }

    .percentage {
      font-weight: 500;
      color: #333;
    }

    .days-remaining {
      color: #666;
    }

    .projection-alert {
      display: flex;
      align-items: center;
      gap: 6px;
      background-color: #fff3e0;
      border: 1px solid #ffcc02;
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 12px;
      color: #f57c00;
      font-size: 0.9em;
      cursor: help;
    }

    .projection-alert mat-icon {
      font-size: 18px;
      color: #f57c00;
    }

    .category-message {
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 0.9em;
      text-align: center;
    }

    .message-excellent {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .message-good {
      background-color: #e3f2fd;
      color: #1565c0;
    }

    .message-attention {
      background-color: #fff3e0;
      color: #ef6c00;
    }

    .message-concern {
      background-color: #ffebee;
      color: #c62828;
    }

    .no-data, .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: #666;
      text-align: center;
    }

    .no-data mat-icon, .loading-state mat-icon {
      font-size: 48px;
      margin-bottom: 16px;
      color: #ccc;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .loading-state mat-icon {
      animation: pulse 2s infinite;
    }

    @media (max-width: 768px) {
      .category-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .category-amounts {
        align-self: flex-end;
      }
    }
  `]
})
export class MonthlyProgressBarsComponent implements OnInit, OnDestroy {
  progressData: MonthlyProgressData[] = [];
  isLoading = true;
  private destroy$ = new Subject<void>();

  // Make Math available in template
  Math = Math;

  constructor(private budgetImpactService: BudgetImpactService) {}

  ngOnInit(): void {
    this.loadProgressData();
    
    // Auto-refresh progress data every 30 seconds to catch expense updates
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('MonthlyProgressBars: Auto-refreshing progress data');
        this.loadProgressData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProgressData(): void {
    this.budgetImpactService.getMonthlyProgressData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('MonthlyProgressBars: Progress data received:', data.length, 'categories');
          this.progressData = data.sort((a, b) => {
            // Sort essential categories first, then by health status (worst first for attention)
            if (a.isEssential !== b.isEssential) {
              return a.isEssential ? -1 : 1;
            }
            
            const statusOrder = { 'concern': 0, 'attention': 1, 'good': 2, 'excellent': 3 };
            return statusOrder[a.healthStatus as keyof typeof statusOrder] - 
                   statusOrder[b.healthStatus as keyof typeof statusOrder];
          });
          this.isLoading = false;
        },
        error: (error) => {
          console.error('MonthlyProgressBars: Error loading progress data:', error);
          this.isLoading = false;
        }
      });
  }

  // Public method to manually refresh progress data
  refreshProgressData(): void {
    console.log('MonthlyProgressBars: Manually refreshing progress data');
    this.isLoading = true;
    this.loadProgressData();
  }

  trackByCategory(index: number, category: MonthlyProgressData): string {
    return category.categoryId;
  }

  getCategoryClass(category: MonthlyProgressData): string {
    return category.healthStatus;
  }

  getHealthIcon(status: string): string {
    switch (status) {
      case 'excellent': return 'check_circle';
      case 'good': return 'thumb_up';
      case 'attention': return 'warning';
      case 'concern': return 'error';
      default: return 'help';
    }
  }

  getProgressBarClass(status: string): string {
    return `progress-bar-${status}`;
  }

  getHealthTooltip(category: MonthlyProgressData): string {
    const percentage = category.percentageUsed;
    switch (category.healthStatus) {
      case 'excellent':
        return `Excellent! Only ${percentage.toFixed(1)}% of budget used`;
      case 'good':
        return `Good progress - ${percentage.toFixed(1)}% of budget used`;
      case 'attention':
        return `Attention needed - ${percentage.toFixed(1)}% of budget used`;
      case 'concern':
        return `Over budget! ${percentage.toFixed(1)}% of limit reached`;
      default:
        return `${percentage.toFixed(1)}% of budget used`;
    }
  }

  getProgressTooltip(category: MonthlyProgressData): string {
    const remaining = category.monthlyLimit - category.currentSpent;
    if (remaining >= 0) {
      return `\$${remaining.toFixed(2)} remaining this month`;
    } else {
      return `\$${Math.abs(remaining).toFixed(2)} over budget`;
    }
  }

  getProjectionTooltip(category: MonthlyProgressData): string {
    const overage = category.projectedSpending - category.monthlyLimit;
    return `Based on current spending, you may exceed your budget by \$${overage.toFixed(2)} this month`;
  }

  getCategoryMessage(category: MonthlyProgressData): string {
    const isEssential = category.isEssential;
    const categoryType = isEssential ? 'essential' : 'discretionary';
    
    switch (category.healthStatus) {
      case 'excellent':
        return `Great job! Your ${categoryType} spending is well under control.`;
      case 'good':
        return `Good work! Your ${categoryType} spending is within a healthy range.`;
      case 'attention':
        return `Keep an eye on your ${categoryType} spending - you're approaching your limit.`;
      case 'concern':
        return isEssential 
          ? `Your essential spending needs attention - consider reviewing your budget.`
          : `Time to pause discretionary spending in this category.`;
      default:
        return `Track your ${categoryType} spending carefully.`;
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