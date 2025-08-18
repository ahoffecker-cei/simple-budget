import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { DashboardOverviewResponse } from '@simple-budget/shared';

@Component({
  selector: 'app-financial-health-answer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="health-hero" *ngIf="dashboardData">
      <div class="health-indicator" [ngClass]="getHealthStatusClass()">
        <div class="health-icon">
          <mat-icon>{{ getHealthStatusIcon() }}</mat-icon>
        </div>
        <div class="health-content">
          <h1 class="health-question">Am I doing okay?</h1>
          <h2 class="health-answer">{{ getHealthStatusTitle() }}</h2>
          <p class="health-message">{{ dashboardData.overallHealthMessage }}</p>
          <div class="quick-actions" *ngIf="shouldShowActions()">
            <button mat-raised-button 
                    color="primary" 
                    class="action-button"
                    (click)="navigateToMostRelevantAction()">
              <mat-icon>{{ getActionIcon() }}</mat-icon>
              {{ getActionText() }}
            </button>
          </div>
        </div>
        <div class="health-decoration">
          <div class="decoration-circle"></div>
          <div class="decoration-circle"></div>
          <div class="decoration-circle"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .health-hero {
      margin-bottom: var(--spacing-lg);
    }

    .health-indicator {
      background: white;
      border-radius: var(--border-radius-lg);
      padding: var(--spacing-xl);
      box-shadow: var(--shadow-lg);
      border: 1px solid;
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      position: relative;
      overflow: hidden;
      min-height: 160px;
    }

    .health-indicator::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
    }

    .health-indicator.excellent {
      border-color: rgba(82, 183, 136, 0.3);
      background: linear-gradient(135deg, rgba(82, 183, 136, 0.08) 0%, rgba(82, 183, 136, 0.03) 100%);
    }

    .health-indicator.excellent::before {
      background: linear-gradient(90deg, var(--color-success) 0%, rgba(82, 183, 136, 0.8) 100%);
    }

    .health-indicator.good {
      border-color: rgba(90, 155, 212, 0.3);
      background: linear-gradient(135deg, rgba(90, 155, 212, 0.08) 0%, rgba(90, 155, 212, 0.03) 100%);
    }

    .health-indicator.good::before {
      background: linear-gradient(90deg, var(--color-secondary) 0%, rgba(90, 155, 212, 0.8) 100%);
    }

    .health-indicator.attention {
      border-color: rgba(249, 199, 79, 0.4);
      background: linear-gradient(135deg, rgba(249, 199, 79, 0.08) 0%, rgba(249, 199, 79, 0.03) 100%);
    }

    .health-indicator.attention::before {
      background: linear-gradient(90deg, var(--color-warning) 0%, rgba(249, 199, 79, 0.8) 100%);
    }

    .health-indicator.concern {
      border-color: rgba(231, 76, 60, 0.3);
      background: linear-gradient(135deg, rgba(231, 76, 60, 0.08) 0%, rgba(231, 76, 60, 0.03) 100%);
    }

    .health-indicator.concern::before {
      background: linear-gradient(90deg, var(--color-danger) 0%, rgba(231, 76, 60, 0.8) 100%);
    }

    .health-icon {
      border-radius: 50%;
      width: 100px;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      position: relative;
      z-index: 2;
    }

    .excellent .health-icon {
      background: linear-gradient(135deg, rgba(82, 183, 136, 0.2) 0%, rgba(82, 183, 136, 0.1) 100%);
      border: 2px solid rgba(82, 183, 136, 0.3);
    }

    .good .health-icon {
      background: linear-gradient(135deg, rgba(90, 155, 212, 0.2) 0%, rgba(90, 155, 212, 0.1) 100%);
      border: 2px solid rgba(90, 155, 212, 0.3);
    }

    .attention .health-icon {
      background: linear-gradient(135deg, rgba(249, 199, 79, 0.2) 0%, rgba(249, 199, 79, 0.1) 100%);
      border: 2px solid rgba(249, 199, 79, 0.4);
    }

    .concern .health-icon {
      background: linear-gradient(135deg, rgba(231, 76, 60, 0.2) 0%, rgba(231, 76, 60, 0.1) 100%);
      border: 2px solid rgba(231, 76, 60, 0.3);
    }

    .health-icon mat-icon {
      font-size: 40px !important;
      width: 40px !important;
      height: 40px !important;
      font-family: 'Material Icons' !important;
      line-height: 1 !important;
    }

    .excellent .health-icon mat-icon {
      color: var(--color-success);
    }

    .good .health-icon mat-icon {
      color: var(--color-secondary);
    }

    .attention .health-icon mat-icon {
      color: var(--color-warning);
    }

    .concern .health-icon mat-icon {
      color: var(--color-danger);
    }

    .health-content {
      flex: 1;
      z-index: 2;
      position: relative;
    }

    .health-question {
      font-family: var(--font-secondary);
      font-size: 1.2rem;
      font-weight: 500;
      color: var(--color-neutral-600);
      margin: 0 0 var(--spacing-xs) 0;
      line-height: 1.2;
    }

    .health-answer {
      font-family: var(--font-secondary);
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 var(--spacing-sm) 0;
      line-height: 1.1;
    }

    .excellent .health-answer {
      color: var(--color-success);
    }

    .good .health-answer {
      color: var(--color-secondary);
    }

    .attention .health-answer {
      color: var(--color-warning);
    }

    .concern .health-answer {
      color: var(--color-danger);
    }

    .health-message {
      font-size: 1.1rem;
      color: var(--color-neutral-700);
      margin: 0 0 var(--spacing-md) 0;
      line-height: 1.4;
    }

    .quick-actions {
      display: flex;
      gap: var(--spacing-md);
      margin-top: var(--spacing-md);
    }

    .action-button {
      height: 48px;
      font-weight: 600;
      font-size: 1rem;
      border-radius: var(--border-radius-md);
      padding: 0 var(--spacing-lg);
      min-width: 160px;
      box-shadow: var(--shadow-md);
      text-transform: none;
    }

    .health-decoration {
      position: absolute;
      right: var(--spacing-lg);
      top: 50%;
      transform: translateY(-50%);
      opacity: 0.1;
      z-index: 1;
    }

    .decoration-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 2px solid;
      margin-bottom: var(--spacing-sm);
    }

    .excellent .decoration-circle {
      border-color: var(--color-success);
    }

    .good .decoration-circle {
      border-color: var(--color-secondary);
    }

    .attention .decoration-circle {
      border-color: var(--color-warning);
    }

    .concern .decoration-circle {
      border-color: var(--color-danger);
    }

    .decoration-circle:nth-child(2) {
      transform: scale(0.7);
      margin-top: -80px;
      margin-left: 20px;
    }

    .decoration-circle:nth-child(3) {
      transform: scale(0.5);
      margin-top: -60px;
      margin-left: 40px;
    }

    @media (max-width: 768px) {
      .health-indicator {
        flex-direction: column;
        text-align: center;
        gap: var(--spacing-md);
        padding: var(--spacing-lg);
        min-height: auto;
      }

      .health-icon {
        width: 80px;
        height: 80px;
      }

      .health-icon mat-icon {
        font-size: 32px !important;
        width: 32px !important;
        height: 32px !important;
      }

      .health-answer {
        font-size: 1.5rem;
      }

      .health-message {
        font-size: 1rem;
      }

      .health-decoration {
        display: none;
      }

      .quick-actions {
        justify-content: center;
      }

      .action-button {
        min-width: 140px;
      }
    }

    @media (max-width: 480px) {
      .health-question {
        font-size: 1rem;
      }

      .health-answer {
        font-size: 1.25rem;
      }

      .health-message {
        font-size: 0.95rem;
      }
    }
  `]
})
export class FinancialHealthAnswerComponent {
  @Input() dashboardData: DashboardOverviewResponse | null = null;

  constructor(private router: Router) {}

  getHealthStatusClass(): string {
    return this.dashboardData?.overallHealthStatus || 'concern';
  }

  getHealthStatusIcon(): string {
    const status = this.dashboardData?.overallHealthStatus || 'concern';
    switch (status) {
      case 'excellent': return 'check_circle';
      case 'good': return 'thumb_up';
      case 'attention': return 'warning';
      case 'concern': return 'error_outline';
      default: return 'help_outline';
    }
  }

  getHealthStatusTitle(): string {
    const status = this.dashboardData?.overallHealthStatus || 'concern';
    switch (status) {
      case 'excellent': return "Yes, you're doing great!";
      case 'good': return "Yes, you're doing well!";
      case 'attention': return 'You need some attention';
      case 'concern': return 'Let\'s work on this together';
      default: return 'Getting started';
    }
  }

  shouldShowActions(): boolean {
    const status = this.dashboardData?.overallHealthStatus;
    return status === 'attention' || status === 'concern' || 
           !this.dashboardData?.budgetSummary?.length ||
           (this.dashboardData?.budgetSummary?.length || 0) === 0;
  }

  getActionText(): string {
    const status = this.dashboardData?.overallHealthStatus;
    const hasBudget = (this.dashboardData?.budgetSummary?.length || 0) > 0;

    if (!hasBudget) {
      return 'Set Up Budget';
    }

    switch (status) {
      case 'attention': return 'Review Budget';
      case 'concern': return 'Get Help';
      default: return 'Manage Budget';
    }
  }

  getActionIcon(): string {
    const status = this.dashboardData?.overallHealthStatus;
    const hasBudget = (this.dashboardData?.budgetSummary?.length || 0) > 0;

    if (!hasBudget) {
      return 'category';
    }

    switch (status) {
      case 'attention': return 'visibility';
      case 'concern': return 'support';
      default: return 'settings';
    }
  }

  navigateToMostRelevantAction(): void {
    const status = this.dashboardData?.overallHealthStatus;
    const hasBudget = (this.dashboardData?.budgetSummary?.length || 0) > 0;

    if (!hasBudget) {
      this.router.navigate(['/budget-categories']);
    } else {
      switch (status) {
        case 'attention':
        case 'concern':
          this.router.navigate(['/budget-categories']);
          break;
        default:
          this.router.navigate(['/budget-categories']);
      }
    }
  }
}