import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MonthlyProgressSummary } from '@simple-budget/shared';

@Component({
  selector: 'app-monthly-progress-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <mat-card class="progress-card" *ngIf="monthlyProgress">
      <div class="card-header">
        <h3>Monthly Progress</h3>
        <span class="progress-status" [ngClass]="getProgressStatusClass()">
          <mat-icon class="status-icon">{{ getStatusIcon() }}</mat-icon>
          {{ getStatusText() }}
        </span>
      </div>

      <div class="progress-overview">
        <!-- Main Progress Bar -->
        <div class="main-progress">
          <div class="progress-header">
            <span class="progress-label">Budget Usage</span>
            <span class="progress-percentage">{{ monthlyProgress.percentageUsed.toFixed(1) }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" 
                 [style.width.%]="Math.min(monthlyProgress.percentageUsed, 100)"
                 [ngClass]="getProgressBarClass()">
            </div>
          </div>
          <div class="progress-amounts">
            <span class="spent-amount">{{ monthlyProgress.totalSpent | currency }} spent</span>
            <span class="budget-total">of {{ monthlyProgress.totalBudgeted | currency }}</span>
          </div>
        </div>

        <!-- Combined Stats and Insights -->
        <div class="progress-bottom">
          <!-- Progress Stats -->
          <div class="progress-stats">
            <div class="stat-item">
              <div class="stat-icon">
                <mat-icon [ngClass]="getProjectionIconClass()">{{ getProjectionIcon() }}</mat-icon>
              </div>
              <div class="stat-content">
                <span class="stat-label">Projected Spending</span>
                <span class="stat-value" [ngClass]="getProjectionValueClass()">
                  {{ monthlyProgress.projectedMonthlySpending | currency }}
                </span>
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-icon calendar-icon">
                <mat-icon>calendar_today</mat-icon>
              </div>
              <div class="stat-content">
                <span class="stat-label">Days Remaining</span>
                <span class="stat-value">{{ monthlyProgress.daysRemainingInMonth }}</span>
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-icon tracking-icon" [ngClass]="getTrackingIconClass()">
                <mat-icon>{{ getTrackingIcon() }}</mat-icon>
              </div>
              <div class="stat-content">
                <span class="stat-label">On Track</span>
                <span class="stat-value" [ngClass]="getTrackingValueClass()">
                  {{ monthlyProgress.onTrackForMonth ? 'Yes' : 'No' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Compact Insights -->
          <div class="progress-insights-compact">
            <div class="insight-item-compact" [ngClass]="getInsightClass()">
              <mat-icon class="insight-icon-compact">{{ getInsightIcon() }}</mat-icon>
              <span class="insight-text-compact">{{ getInsightMessage() }}</span>
            </div>
          </div>
        </div>
      </div>
    </mat-card>
  `,
  styles: [`
    .progress-card {
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

    .progress-status {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: 0.9rem;
      font-weight: 500;
      padding: 4px 12px;
      border-radius: var(--border-radius-sm);
    }

    .status-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
    }

    .progress-status.on-track {
      background: rgba(82, 183, 136, 0.15);
      color: var(--color-success);
    }

    .progress-status.off-track {
      background: rgba(249, 199, 79, 0.15);
      color: var(--color-warning);
    }

    .progress-status.over-budget {
      background: rgba(231, 76, 60, 0.15);
      color: var(--color-danger);
    }

    .progress-overview {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      height: 100%;
    }

    .main-progress {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .progress-label {
      font-weight: 500;
      color: var(--color-neutral-700);
    }

    .progress-percentage {
      font-weight: 600;
      color: var(--color-neutral-900);
      font-family: var(--font-mono);
      font-size: 1.1rem;
    }

    .progress-bar {
      height: 12px;
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 6px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 6px;
      transition: width 0.6s ease-out;
    }

    .progress-fill.excellent {
      background: linear-gradient(90deg, var(--color-success) 0%, rgba(82, 183, 136, 0.8) 100%);
    }

    .progress-fill.good {
      background: linear-gradient(90deg, var(--color-secondary) 0%, rgba(90, 155, 212, 0.8) 100%);
    }

    .progress-fill.attention {
      background: linear-gradient(90deg, var(--color-warning) 0%, rgba(249, 199, 79, 0.8) 100%);
    }

    .progress-fill.concern {
      background: linear-gradient(90deg, var(--color-danger) 0%, rgba(231, 76, 60, 0.8) 100%);
    }

    .progress-amounts {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
      font-family: var(--font-mono);
    }

    .spent-amount {
      font-weight: 600;
      color: var(--color-neutral-900);
    }

    .budget-total {
      color: var(--color-neutral-600);
    }

    .progress-stats {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      flex: 1;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background: rgba(250, 250, 250, 0.5);
      border-radius: var(--border-radius-md);
      border: 1px solid var(--color-neutral-200);
      box-sizing: border-box;
      min-height: 70px;
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon mat-icon {
      font-size: 22px !important;
      width: 22px !important;
      height: 22px !important;
    }

    .stat-item:nth-child(1) {
      background: rgba(244, 162, 97, 0.06);
      border-color: rgba(244, 162, 97, 0.2);
    }

    .stat-item:nth-child(1) .stat-icon {
      background: rgba(244, 162, 97, 0.15);
    }

    .stat-item:nth-child(1) .stat-icon mat-icon {
      color: var(--color-accent);
    }

    .calendar-icon {
      background: rgba(90, 155, 212, 0.15);
    }

    .calendar-icon mat-icon {
      color: var(--color-secondary);
    }

    .stat-item:nth-child(2) {
      background: rgba(90, 155, 212, 0.06);
      border-color: rgba(90, 155, 212, 0.2);
    }

    .tracking-icon.on-track {
      background: rgba(82, 183, 136, 0.15);
    }

    .tracking-icon.on-track mat-icon {
      color: var(--color-success);
    }

    .tracking-icon.off-track {
      background: rgba(231, 76, 60, 0.15);
    }

    .tracking-icon.off-track mat-icon {
      color: var(--color-danger);
    }

    .stat-item:nth-child(3) {
      background: rgba(82, 183, 136, 0.06);
      border-color: rgba(82, 183, 136, 0.2);
    }

    .stat-item:nth-child(3).off-track {
      background: rgba(231, 76, 60, 0.06);
      border-color: rgba(231, 76, 60, 0.2);
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .stat-label {
      font-size: 0.9rem;
      color: var(--color-neutral-600);
      font-weight: 500;
    }

    .stat-value {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-neutral-900);
    }

    .stat-value.projection-good {
      color: var(--color-success);
    }

    .stat-value.projection-warning {
      color: var(--color-warning);
    }

    .stat-value.projection-danger {
      color: var(--color-danger);
    }

    .stat-value.tracking-good {
      color: var(--color-success);
    }

    .stat-value.tracking-bad {
      color: var(--color-danger);
    }

    .progress-bottom {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .progress-insights-compact {
      padding: var(--spacing-sm);
      border-radius: var(--border-radius-md);
      border: 1px solid var(--color-neutral-200);
      margin-top: auto;
    }

    .insight-item-compact {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .insight-item-compact.positive {
      background: rgba(82, 183, 136, 0.05);
      border-color: rgba(82, 183, 136, 0.2);
    }

    .insight-item-compact.warning {
      background: rgba(249, 199, 79, 0.05);
      border-color: rgba(249, 199, 79, 0.3);
    }

    .insight-item-compact.danger {
      background: rgba(231, 76, 60, 0.05);
      border-color: rgba(231, 76, 60, 0.2);
    }

    .insight-icon-compact {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      flex-shrink: 0;
    }

    .insight-item-compact.positive .insight-icon-compact {
      color: var(--color-success);
    }

    .insight-item-compact.warning .insight-icon-compact {
      color: var(--color-warning);
    }

    .insight-item-compact.danger .insight-icon-compact {
      color: var(--color-danger);
    }

    .insight-text-compact {
      font-size: 0.8rem;
      line-height: 1.3;
      color: var(--color-neutral-700);
      margin: 0;
    }

    @media (max-width: 768px) {
      .stat-item {
        padding: var(--spacing-sm);
        min-height: 60px;
      }

      .stat-icon {
        width: 36px;
        height: 36px;
      }

      .stat-icon mat-icon {
        font-size: 18px !important;
        width: 18px !important;
        height: 18px !important;
      }

      .stat-value {
        font-size: 1rem;
      }

      .progress-amounts {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-xs);
      }
    }
  `]
})
export class MonthlyProgressOverviewComponent {
  @Input() monthlyProgress: MonthlyProgressSummary | null | undefined = null;

  // Make Math available in template
  Math = Math;

  getProgressStatusClass(): string {
    if (!this.monthlyProgress) return 'off-track';
    
    if (this.monthlyProgress.percentageUsed > 100) {
      return 'over-budget';
    } else if (this.monthlyProgress.onTrackForMonth) {
      return 'on-track';
    } else {
      return 'off-track';
    }
  }

  getStatusIcon(): string {
    if (!this.monthlyProgress) return 'warning';
    
    if (this.monthlyProgress.percentageUsed > 100) {
      return 'error';
    } else if (this.monthlyProgress.onTrackForMonth) {
      return 'check_circle';
    } else {
      return 'warning';
    }
  }

  getStatusText(): string {
    if (!this.monthlyProgress) return 'Off Track';
    
    if (this.monthlyProgress.percentageUsed > 100) {
      return 'Over Budget';
    } else if (this.monthlyProgress.onTrackForMonth) {
      return 'On Track';
    } else {
      return 'Needs Attention';
    }
  }

  getProgressBarClass(): string {
    if (!this.monthlyProgress) return 'concern';
    
    const percentage = this.monthlyProgress.percentageUsed;
    if (percentage <= 50) return 'excellent';
    if (percentage <= 75) return 'good';
    if (percentage <= 90) return 'attention';
    return 'concern';
  }

  getProjectionIcon(): string {
    if (!this.monthlyProgress) return 'trending_up';
    
    const projected = this.monthlyProgress.projectedMonthlySpending;
    const budgeted = this.monthlyProgress.totalBudgeted;
    
    if (projected <= budgeted * 0.9) return 'trending_down';
    if (projected <= budgeted * 1.1) return 'trending_flat';
    return 'trending_up';
  }

  getProjectionIconClass(): string {
    if (!this.monthlyProgress) return 'projection-warning';
    
    const projected = this.monthlyProgress.projectedMonthlySpending;
    const budgeted = this.monthlyProgress.totalBudgeted;
    
    if (projected <= budgeted) {
      return 'projection-good';
    } else if (projected <= budgeted * 1.2) {
      return 'projection-warning';
    } else {
      return 'projection-danger';
    }
  }

  getProjectionValueClass(): string {
    return this.getProjectionIconClass().replace('projection-', '').replace('good', 'projection-good').replace('warning', 'projection-warning').replace('danger', 'projection-danger');
  }

  getTrackingIcon(): string {
    return this.monthlyProgress?.onTrackForMonth ? 'check' : 'close';
  }

  getTrackingIconClass(): string {
    return this.monthlyProgress?.onTrackForMonth ? 'on-track' : 'off-track';
  }

  getTrackingValueClass(): string {
    return this.monthlyProgress?.onTrackForMonth ? 'tracking-good' : 'tracking-bad';
  }

  getInsightClass(): string {
    if (!this.monthlyProgress) return 'warning';
    
    if (this.monthlyProgress.percentageUsed > 100) {
      return 'danger';
    } else if (this.monthlyProgress.onTrackForMonth) {
      return 'positive';
    } else {
      return 'warning';
    }
  }

  getInsightIcon(): string {
    if (!this.monthlyProgress) return 'info';
    
    if (this.monthlyProgress.percentageUsed > 100) {
      return 'error_outline';
    } else if (this.monthlyProgress.onTrackForMonth) {
      return 'lightbulb';
    } else {
      return 'info';
    }
  }

  getInsightMessage(): string {
    if (!this.monthlyProgress) return 'No data available for monthly progress.';
    
    const daysLeft = this.monthlyProgress.daysRemainingInMonth;
    const percentageUsed = this.monthlyProgress.percentageUsed;
    const onTrack = this.monthlyProgress.onTrackForMonth;

    if (percentageUsed > 100) {
      return `You've exceeded your budget by ${(percentageUsed - 100).toFixed(1)}%. Consider reviewing your spending for the remaining ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`;
    } else if (onTrack && percentageUsed < 50) {
      return `Great job! You're using your budget wisely with ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining.`;
    } else if (onTrack) {
      return `You're on track to stay within budget. Keep monitoring your spending for the remaining ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`;
    } else {
      return `Your current spending pace suggests you might exceed budget. Consider adjusting your spending for the remaining ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`;
    }
  }
}