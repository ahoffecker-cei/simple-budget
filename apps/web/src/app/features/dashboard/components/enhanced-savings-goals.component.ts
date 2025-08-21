import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { SavingsGoalProgress } from '@simple-budget/shared';

@Component({
  selector: 'app-enhanced-savings-goals',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  template: `
    <mat-card class="savings-goals-card card-accent">
      <div class="card-header">
        <h3>
          <mat-icon>flag</mat-icon>
          Savings Goals
        </h3>
        <div class="header-actions">
          <button mat-icon-button class="manage-goals-btn" (click)="onManageGoals()" title="Manage Goals">
            <mat-icon>settings</mat-icon>
          </button>
          <button mat-icon-button class="add-goal-btn" (click)="onAddGoal()" title="Add Goal">
            <mat-icon>add</mat-icon>
          </button>
        </div>
      </div>

      <div class="goals-content">
        <!-- Savings Goals List -->
        <div *ngIf="savingsGoals && savingsGoals.length > 0; else noGoalsState" 
             class="goals-list">
          
          <!-- Overall Progress Summary -->
          <div class="overall-progress" *ngIf="savingsGoals.length > 1">
            <div class="progress-header">
              <span class="progress-label">Overall Progress</span>
              <span class="progress-amount">
                {{ getTotalCurrentProgress() | currency }} of {{ getTotalTargetAmount() | currency }}
              </span>
            </div>
            <mat-progress-bar 
              [value]="getOverallProgressPercentage()"
              [color]="getOverallProgressColor()"
              class="overall-progress-bar">
            </mat-progress-bar>
            <div class="progress-percentage">{{ getOverallProgressPercentage() }}% complete</div>
          </div>

          <!-- Individual Goals -->
          <div *ngFor="let goal of savingsGoals; trackBy: trackByGoalId" 
               class="goal-item"
               [class.goal-completed]="isGoalCompleted(goal)">
            
            <div class="goal-header">
              <div class="goal-info">
                <div class="goal-name">{{ goal.name }}</div>
                <div class="goal-progress-text">
                  {{ goal.currentProgress | currency }} of {{ goal.targetAmount | currency }}
                </div>
              </div>
              
              <div class="goal-status">
                <mat-icon *ngIf="isGoalCompleted(goal)" class="completed-icon">check_circle</mat-icon>
                <div class="percentage-badge" [class]="getProgressBadgeClass(goal)">
                  {{ goal.percentageComplete }}%
                </div>
              </div>
            </div>

            <!-- Progress Bar -->
            <mat-progress-bar 
              [value]="goal.percentageComplete"
              [color]="getProgressColor(goal)"
              class="goal-progress-bar">
            </mat-progress-bar>

            <!-- Goal Details -->
            <div class="goal-details">
              <div class="detail-item" *ngIf="goal.monthlyContributions > 0">
                <mat-icon>trending_up</mat-icon>
                <span>{{ goal.monthlyContributions | currency }} this month</span>
              </div>
              
              <div class="detail-item" *ngIf="!isGoalCompleted(goal)">
                <mat-icon>schedule</mat-icon>
                <span>{{ getRemainingAmount(goal) | currency }} remaining</span>
              </div>

              <div class="detail-item" *ngIf="!isGoalCompleted(goal) && goal.monthlySavingsTarget && goal.monthlySavingsTarget > 0">
                <mat-icon>event</mat-icon>
                <span>{{ getTimeToGoal(goal) }} months to goal</span>
              </div>

              <div class="detail-item" *ngIf="isGoalCompleted(goal)">
                <mat-icon>celebration</mat-icon>
                <span>Goal achieved!</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <ng-template #noGoalsState>
          <div class="empty-state">
            <mat-icon class="empty-icon">flag</mat-icon>
            <h4>No savings goals yet</h4>
            <p>Set savings goals to track your progress and stay motivated</p>
            <button mat-raised-button color="primary" (click)="onAddGoal()">
              <mat-icon>add</mat-icon>
              Create Your First Goal
            </button>
          </div>
        </ng-template>

        <!-- Loading state -->
        <div *ngIf="isLoading" class="loading-state">
          <mat-icon class="loading-icon">hourglass_empty</mat-icon>
          <p>Loading savings goals...</p>
        </div>
      </div>
    </mat-card>
  `,
  styles: [`
    .savings-goals-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: rgba(244, 162, 97, 0.06);
      border: 1px solid rgba(244, 162, 97, 0.25);
      border-left: 4px solid var(--color-accent);
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
      color: var(--color-accent);
      font-weight: 600;
      font-size: 1.1rem;
    }

    .card-header mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .header-actions {
      display: flex;
      gap: 4px;
    }

    .manage-goals-btn,
    .add-goal-btn {
      width: 32px;
      height: 32px;
      color: var(--color-accent);
    }

    .manage-goals-btn:hover,
    .add-goal-btn:hover {
      background-color: rgba(244, 162, 97, 0.1);
    }

    .manage-goals-btn mat-icon,
    .add-goal-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .goals-content {
      flex: 1;
      padding: 16px 20px 20px 20px;
    }

    .goals-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .overall-progress {
      padding: 16px;
      background: white;
      border-radius: 8px;
      border: 1px solid rgba(244, 162, 97, 0.2);
      margin-bottom: 8px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .progress-label {
      font-weight: 600;
      color: var(--color-accent);
      font-size: 0.9rem;
    }

    .progress-amount {
      font-family: var(--font-mono, monospace);
      font-size: 0.9rem;
      color: var(--color-neutral-700);
      font-weight: 500;
    }

    .overall-progress-bar {
      height: 8px !important;
      border-radius: 4px;
      margin-bottom: 4px;
    }

    .progress-percentage {
      text-align: center;
      font-size: 0.8rem;
      color: var(--color-accent);
      font-weight: 500;
    }

    .goal-item {
      padding: 16px;
      background: white;
      border-radius: 8px;
      border: 1px solid var(--color-neutral-200);
      transition: all 0.2s ease-out;
    }

    .goal-item:hover {
      box-shadow: var(--shadow-sm);
    }

    .goal-item.goal-completed {
      background: rgba(82, 183, 136, 0.05);
      border-color: rgba(82, 183, 136, 0.3);
    }

    .goal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .goal-info {
      flex: 1;
    }

    .goal-name {
      font-weight: 600;
      color: var(--color-neutral-800);
      font-size: 0.95rem;
      margin-bottom: 4px;
    }

    .goal-progress-text {
      font-family: var(--font-mono, monospace);
      font-size: 0.8rem;
      color: var(--color-neutral-600);
    }

    .goal-status {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .completed-icon {
      color: var(--color-success);
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
    }

    .percentage-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      min-width: 35px;
      text-align: center;
    }

    .percentage-badge.excellent {
      background: rgba(82, 183, 136, 0.2);
      color: var(--color-success);
    }

    .percentage-badge.good {
      background: rgba(244, 162, 97, 0.2);
      color: var(--color-accent);
    }

    .percentage-badge.attention {
      background: rgba(249, 199, 79, 0.2);
      color: var(--color-warning);
    }

    .percentage-badge.concern {
      background: rgba(156, 163, 175, 0.2);
      color: var(--color-neutral-600);
    }

    .goal-progress-bar {
      height: 6px !important;
      border-radius: 3px;
      margin-bottom: 12px;
    }

    .goal-details {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: var(--color-neutral-600);
    }

    .detail-item mat-icon {
      font-size: 14px !important;
      width: 14px !important;
      height: 14px !important;
      color: var(--color-neutral-500);
    }

    .goal-completed .detail-item mat-icon {
      color: var(--color-success);
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

      .goals-content {
        padding: 12px 16px 16px 16px;
      }

      .goal-item {
        padding: 12px;
      }

      .goal-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .goal-status {
        align-self: flex-end;
      }

      .goal-details {
        gap: 8px;
      }

      .detail-item {
        font-size: 0.75rem;
      }

      .progress-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }
  `]
})
export class EnhancedSavingsGoalsComponent implements OnInit, OnChanges {
  @Input() savingsGoals: SavingsGoalProgress[] = [];
  @Input() isLoading: boolean = false;
  @Output() manageGoals = new EventEmitter<void>();
  @Output() addGoal = new EventEmitter<void>();

  constructor() {}

  ngOnInit(): void {
    // Component initialization
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['savingsGoals']) {
      console.log('Savings goals updated:', this.savingsGoals);
    }
  }

  trackByGoalId(index: number, goal: SavingsGoalProgress): string {
    return goal.savingsGoalId;
  }

  onManageGoals(): void {
    this.manageGoals.emit();
  }

  onAddGoal(): void {
    this.addGoal.emit();
  }

  isGoalCompleted(goal: SavingsGoalProgress): boolean {
    return goal.percentageComplete >= 100;
  }

  getRemainingAmount(goal: SavingsGoalProgress): number {
    return Math.max(goal.targetAmount - goal.currentProgress, 0);
  }

  getProgressColor(goal: SavingsGoalProgress): 'primary' | 'accent' | 'warn' {
    if (goal.percentageComplete >= 75) return 'primary';
    if (goal.percentageComplete >= 50) return 'accent';
    return 'warn';
  }

  getProgressBadgeClass(goal: SavingsGoalProgress): string {
    if (goal.percentageComplete >= 100) return 'excellent';
    if (goal.percentageComplete >= 75) return 'excellent';
    if (goal.percentageComplete >= 50) return 'good';
    if (goal.percentageComplete >= 25) return 'attention';
    return 'concern';
  }

  getTotalTargetAmount(): number {
    return this.savingsGoals.reduce((total, goal) => total + goal.targetAmount, 0);
  }

  getTotalCurrentProgress(): number {
    return this.savingsGoals.reduce((total, goal) => total + goal.currentProgress, 0);
  }

  getOverallProgressPercentage(): number {
    const totalTarget = this.getTotalTargetAmount();
    if (totalTarget === 0) return 0;
    return Math.round((this.getTotalCurrentProgress() / totalTarget) * 100);
  }

  getOverallProgressColor(): 'primary' | 'accent' | 'warn' {
    const percentage = this.getOverallProgressPercentage();
    if (percentage >= 75) return 'primary';
    if (percentage >= 50) return 'accent';
    return 'warn';
  }

  getTimeToGoal(goal: SavingsGoalProgress): number {
    const remaining = this.getRemainingAmount(goal);
    const monthlyTarget = goal.monthlySavingsTarget || 0;
    
    if (remaining <= 0 || monthlyTarget <= 0) {
      return 0;
    }
    
    return Math.ceil(remaining / monthlyTarget);
  }
}