import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSliderModule } from '@angular/material/slider';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { SavingsGoalsService } from '../../../services/savings-goals.service';
import { SavingsGoalProgress } from '@simple-budget/shared';

export interface SavingsGoalsDialogData {
  savingsGoals?: SavingsGoalProgress[];
}

export interface SavingsGoalsDialogResult {
  type: 'save' | 'cancel';
}

interface SavingsGoalFormData {
  savingsGoalId?: string;
  name: string;
  targetAmount: number;
  currentProgress: number;
  percentageComplete: number;
  monthlyContributions: number;
  monthlySavingsTarget: number;
}

@Component({
  selector: 'app-savings-goals-management-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSliderModule
  ],
  template: `
    <div class="savings-goals-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>flag</mat-icon>
          Manage Savings Goals
        </h2>
        <button mat-icon-button mat-dialog-close class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="savingsGoalsForm" (ngSubmit)="onSave()" class="goals-form">
        <mat-dialog-content class="dialog-content">
          
          <!-- Overview Summary -->
          <div class="goals-overview">
            <div class="overview-item">
              <div class="overview-label">Total Goals</div>
              <div class="overview-value">{{ savingsGoalsArray.length }}</div>
            </div>
            <div class="overview-item">
              <div class="overview-label">Target Amount</div>
              <div class="overview-value">{{ getTotalTargetAmount() | currency }}</div>
            </div>
            <div class="overview-item">
              <div class="overview-label">Current Progress</div>
              <div class="overview-value">{{ getTotalCurrentProgress() | currency }}</div>
            </div>
            <div class="overview-item">
              <div class="overview-label">Overall Progress</div>
              <div class="overview-value">{{ getOverallProgressPercentage() }}%</div>
            </div>
          </div>

          <!-- Savings Goals List -->
          <div class="savings-goals-section">
            <div class="section-header">
              <h3>Savings Goals</h3>
              <button type="button" mat-raised-button color="primary" 
                      (click)="addSavingsGoal()" class="add-goal-btn">
                <mat-icon>add</mat-icon>
                Add Goal
              </button>
            </div>

            <div formArrayName="savingsGoals" class="goals-list">
              <div *ngFor="let goal of savingsGoalsArray.controls; let i = index" 
                   [formGroupName]="i" class="goal-item">
                <mat-card class="goal-card">
                  <div class="goal-form">
                    <div class="goal-header">
                      <div class="form-row">
                        <mat-form-field class="goal-name-field">
                          <mat-label>Goal Name</mat-label>
                          <input matInput formControlName="name" placeholder="e.g., Emergency Fund, Vacation">
                          <mat-error *ngIf="goal.get('name')?.hasError('required')">
                            Goal name is required
                          </mat-error>
                          <mat-error *ngIf="goal.get('name')?.hasError('maxlength')">
                            Goal name must be 100 characters or less
                          </mat-error>
                        </mat-form-field>

                        <button type="button" mat-icon-button color="warn" 
                                (click)="removeSavingsGoal(i)" class="remove-btn"
                                [disabled]="savingsGoalsArray.length === 1">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>

                      <div class="form-row">
                        <mat-form-field class="target-amount-field">
                          <mat-label>Target Amount</mat-label>
                          <input matInput type="number" formControlName="targetAmount" 
                                 placeholder="0.00" min="0.01" step="0.01">
                          <span matPrefix>$</span>
                          <mat-error *ngIf="goal.get('targetAmount')?.hasError('required')">
                            Target amount is required
                          </mat-error>
                          <mat-error *ngIf="goal.get('targetAmount')?.hasError('min')">
                            Target amount must be greater than 0
                          </mat-error>
                        </mat-form-field>

                        <div class="current-progress-display" *ngIf="goal.get('currentProgress')?.value > 0">
                          <div class="progress-label">Current Progress</div>
                          <div class="progress-amount">{{ goal.get('currentProgress')?.value | currency }}</div>
                        </div>
                      </div>
                    </div>

                    <!-- Progress Visualization -->
                    <div class="goal-progress" *ngIf="goal.get('targetAmount')?.value > 0">
                      <div class="progress-info">
                        <div class="progress-percentage">
                          {{ getGoalProgressPercentage(goal.value) }}% complete
                        </div>
                        <div class="progress-remaining">
                          {{ getRemainingAmount(goal.value) | currency }} remaining
                        </div>
                      </div>
                      <mat-progress-bar 
                        [value]="getGoalProgressPercentage(goal.value)"
                        [color]="getProgressColor(goal.value)"
                        class="progress-bar">
                      </mat-progress-bar>
                    </div>

                    <!-- Monthly Savings Target Slider -->
                    <div class="monthly-target-section" *ngIf="goal.get('targetAmount')?.value > 0">
                      <h4>Monthly Savings Target</h4>
                      <div class="slider-container">
                        <div class="slider-header">
                          <span class="slider-label">$0</span>
                          <span class="slider-value">{{ goal.get('monthlySavingsTarget')?.value || 0 | currency }}</span>
                          <span class="slider-label">$2,000</span>
                        </div>
                        <mat-slider 
                          class="savings-target-slider"
                          [min]="0" 
                          [max]="2000" 
                          [step]="25"
                          discrete
                          showTickMarks>
                          <input matSliderThumb 
                                 [formControlName]="'monthlySavingsTarget'"
                                 (input)="onMonthlySavingsTargetChange(i)">
                        </mat-slider>
                      </div>

                      <!-- Time to Goal Calculation -->
                      <div class="time-to-goal" *ngIf="getTimeToGoalMonths(goal.value) > 0">
                        <div class="time-info">
                          <div class="time-label">Time to Goal</div>
                          <div class="time-value" [class]="getTimeToGoalClass(goal.value)">
                            {{ getTimeToGoalMonths(goal.value) }} months
                            <span class="years-helper" *ngIf="getTimeToGoalMonths(goal.value) > 12">
                              ({{ (getTimeToGoalMonths(goal.value) / 12) | number:'1.1-1' }} years)
                            </span>
                          </div>
                        </div>
                        <mat-icon [class]="getTimeToGoalClass(goal.value)">{{ getTimeToGoalIcon(goal.value) }}</mat-icon>
                      </div>
                    </div>

                    <!-- Monthly Contributions Info -->
                    <div class="monthly-contributions" *ngIf="goal.get('monthlyContributions')?.value > 0">
                      <mat-icon>trending_up</mat-icon>
                      <span>{{ goal.get('monthlyContributions')?.value | currency }} contributed this month</span>
                    </div>
                  </div>
                </mat-card>
              </div>
            </div>

            <!-- Empty State -->
            <div *ngIf="savingsGoalsArray.length === 0" class="empty-state">
              <mat-icon>flag</mat-icon>
              <h3>No savings goals added</h3>
              <p>Create your first savings goal to start tracking your progress.</p>
              <button mat-raised-button color="primary" (click)="addSavingsGoal()">
                <mat-icon>add</mat-icon>
                Add Savings Goal
              </button>
            </div>
          </div>
        </mat-dialog-content>

        <mat-dialog-actions class="dialog-actions">
          <button type="button" mat-button mat-dialog-close>Cancel</button>
          <button type="submit" mat-raised-button color="primary" 
                  [disabled]="!savingsGoalsForm.valid || isLoading">
            <mat-progress-spinner *ngIf="isLoading" diameter="20" mode="indeterminate">
            </mat-progress-spinner>
            <span *ngIf="!isLoading">Save Changes</span>
            <span *ngIf="isLoading">Saving...</span>
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .savings-goals-dialog {
      width: 100%;
      max-width: 900px;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 24px;
      border-bottom: 1px solid var(--color-neutral-200);
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: var(--color-accent);
      font-weight: 600;
    }

    .close-btn {
      color: var(--color-neutral-500);
    }

    .dialog-content {
      padding: 24px !important;
      max-height: 70vh;
      overflow-y: auto;
    }

    .goals-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      padding: 20px;
      background: rgba(244, 162, 97, 0.08);
      border-radius: 12px;
      border-left: 4px solid var(--color-accent);
      margin-bottom: 24px;
    }

    .overview-item {
      text-align: center;
    }

    .overview-label {
      font-size: 12px;
      color: var(--color-neutral-600);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .overview-value {
      font-family: var(--font-mono, monospace);
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--color-accent);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-header h3 {
      margin: 0;
      color: var(--color-neutral-700);
      font-weight: 600;
    }

    .goals-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .goal-card {
      position: relative;
      transition: all 0.2s ease-out;
      border: 1px solid rgba(244, 162, 97, 0.2);
    }

    .goal-card:hover {
      box-shadow: var(--shadow-md);
    }

    .goal-form {
      padding: 20px;
    }

    .goal-header {
      margin-bottom: 16px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .goal-name-field {
      flex: 2;
    }

    .target-amount-field {
      flex: 1;
    }

    .current-progress-display {
      flex: 1;
      text-align: center;
      padding: 16px 12px;
      background: rgba(82, 183, 136, 0.1);
      border-radius: 8px;
    }

    .progress-label {
      font-size: 12px;
      color: var(--color-neutral-600);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .progress-amount {
      font-family: var(--font-mono, monospace);
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-success);
    }

    .remove-btn {
      flex-shrink: 0;
      margin-top: 8px;
    }

    .goal-progress {
      background: white;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid var(--color-neutral-200);
      margin-bottom: 12px;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .progress-percentage {
      font-weight: 600;
      color: var(--color-accent);
    }

    .progress-remaining {
      font-size: 0.9rem;
      color: var(--color-neutral-600);
    }

    .progress-bar {
      height: 8px !important;
      border-radius: 4px;
    }

    .monthly-contributions {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: rgba(90, 155, 212, 0.08);
      border-radius: 6px;
      color: var(--color-secondary);
      font-size: 0.9rem;
      font-weight: 500;
    }

    .monthly-contributions mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    // Monthly Savings Target Section
    .monthly-target-section {
      background: white;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid var(--color-neutral-200);
      margin-bottom: 12px;
    }

    .monthly-target-section h4 {
      margin: 0 0 12px 0;
      color: var(--color-neutral-700);
      font-weight: 600;
      font-size: 0.9rem;
    }

    .slider-container {
      margin-bottom: 16px;
    }

    .slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .slider-label {
      font-size: 0.8rem;
      color: var(--color-neutral-600);
    }

    .slider-value {
      font-family: var(--font-mono, monospace);
      font-weight: 600;
      font-size: 1.1rem;
      color: var(--color-primary);
    }

    .savings-target-slider {
      width: 100%;
    }

    .time-to-goal {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: rgba(90, 155, 212, 0.08);
      border-radius: 6px;
      border-left: 3px solid var(--color-secondary);
    }

    .time-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .time-label {
      font-size: 0.8rem;
      color: var(--color-neutral-600);
      font-weight: 500;
    }

    .time-value {
      font-family: var(--font-mono, monospace);
      font-weight: 700;
      font-size: 1.2rem;
    }

    .time-value.excellent {
      color: var(--color-success);
    }

    .time-value.good {
      color: var(--color-secondary);
    }

    .time-value.moderate {
      color: var(--color-warning);
    }

    .time-value.slow {
      color: #f44336;
    }

    .years-helper {
      font-size: 0.8rem;
      font-weight: 400;
      opacity: 0.7;
      display: block;
      margin-top: 2px;
    }

    .time-to-goal mat-icon.excellent {
      color: var(--color-success);
    }

    .time-to-goal mat-icon.good {
      color: var(--color-secondary);
    }

    .time-to-goal mat-icon.moderate {
      color: var(--color-warning);
    }

    .time-to-goal mat-icon.slow {
      color: #f44336;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--color-neutral-500);
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: var(--color-neutral-400);
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: var(--color-neutral-600);
    }

    .empty-state p {
      margin: 0 0 24px 0;
      color: var(--color-neutral-500);
    }

    .dialog-actions {
      padding: 16px 24px !important;
      border-top: 1px solid var(--color-neutral-200);
      gap: 12px;
    }

    .dialog-actions button {
      min-width: 100px;
    }

    // Responsive adjustments
    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
        gap: 8px;
      }

      .goal-name-field,
      .target-amount-field {
        flex: none;
        width: 100%;
      }

      .current-progress-display {
        flex: none;
        width: 100%;
      }

      .remove-btn {
        align-self: flex-end;
        margin-top: 0;
      }

      .goals-overview {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        padding: 16px;
      }

      .overview-value {
        font-size: 1rem;
      }
    }

    // Angular Material adjustments
    ::ng-deep .mat-mdc-form-field {
      .mdc-text-field--filled {
        background-color: rgba(0, 0, 0, 0.04);
      }
    }

    ::ng-deep .mat-progress-spinner {
      margin-right: 8px;
    }
  `]
})
export class SavingsGoalsManagementModalComponent implements OnInit, OnDestroy {
  savingsGoalsForm: FormGroup;
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SavingsGoalsManagementModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SavingsGoalsDialogData,
    private savingsGoalsService: SavingsGoalsService
  ) {
    this.savingsGoalsForm = this.fb.group({
      savingsGoals: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get savingsGoalsArray(): FormArray {
    return this.savingsGoalsForm.get('savingsGoals') as FormArray;
  }

  private initializeForm(): void {
    const goals = this.data.savingsGoals || [];
    
    if (goals.length === 0) {
      // Add one empty savings goal by default
      this.addSavingsGoal();
    } else {
      // Load existing savings goals
      goals.forEach(goal => {
        this.addSavingsGoal(goal);
      });
    }
  }

  addSavingsGoal(existingGoal?: SavingsGoalProgress): void {
    const goalGroup = this.fb.group({
      savingsGoalId: [existingGoal?.savingsGoalId || ''],
      name: [existingGoal?.name || '', [Validators.required, Validators.maxLength(100)]],
      targetAmount: [existingGoal?.targetAmount || '', [Validators.required, Validators.min(0.01)]],
      currentProgress: [existingGoal?.currentProgress || 0],
      percentageComplete: [existingGoal?.percentageComplete || 0],
      monthlyContributions: [existingGoal?.monthlyContributions || 0],
      monthlySavingsTarget: [existingGoal?.monthlySavingsTarget || 0]
    });

    this.savingsGoalsArray.push(goalGroup);
  }

  removeSavingsGoal(index: number): void {
    if (this.savingsGoalsArray.length > 1) {
      this.savingsGoalsArray.removeAt(index);
    }
  }

  getGoalProgressPercentage(goalValue: SavingsGoalFormData): number {
    if (!goalValue.targetAmount || goalValue.targetAmount === 0) {
      return 0;
    }
    return Math.min((goalValue.currentProgress / goalValue.targetAmount) * 100, 100);
  }

  getRemainingAmount(goalValue: SavingsGoalFormData): number {
    return Math.max(goalValue.targetAmount - goalValue.currentProgress, 0);
  }

  getProgressColor(goalValue: SavingsGoalFormData): 'primary' | 'accent' | 'warn' {
    const percentage = this.getGoalProgressPercentage(goalValue);
    if (percentage >= 75) return 'primary';
    if (percentage >= 50) return 'accent';
    return 'warn';
  }

  getTotalTargetAmount(): number {
    return this.savingsGoalsArray.controls.reduce((total, control) => {
      const amount = parseFloat(control.get('targetAmount')?.value) || 0;
      return total + amount;
    }, 0);
  }

  getTotalCurrentProgress(): number {
    return this.savingsGoalsArray.controls.reduce((total, control) => {
      const progress = parseFloat(control.get('currentProgress')?.value) || 0;
      return total + progress;
    }, 0);
  }

  getOverallProgressPercentage(): number {
    const totalTarget = this.getTotalTargetAmount();
    if (totalTarget === 0) return 0;
    return Math.round((this.getTotalCurrentProgress() / totalTarget) * 100);
  }

  onSave(): void {
    if (this.savingsGoalsForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      const goals = this.savingsGoalsArray.value;
      const requests: any[] = [];

      // Process each savings goal
      goals.forEach((goal: SavingsGoalFormData) => {
        const request = {
          name: goal.name,
          targetAmount: parseFloat(goal.targetAmount.toString()),
          monthlySavingsTarget: goal.monthlySavingsTarget > 0 ? parseFloat(goal.monthlySavingsTarget.toString()) : undefined
        };

        if (goal.savingsGoalId) {
          // Update existing goal
          requests.push(this.savingsGoalsService.updateSavingsGoal(goal.savingsGoalId, request));
        } else {
          // Create new goal
          requests.push(this.savingsGoalsService.createSavingsGoal(request));
        }
      });

      // Execute all requests in parallel
      if (requests.length > 0) {
        forkJoin(requests).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.isLoading = false;
            this.dialogRef.close({ type: 'save' } as SavingsGoalsDialogResult);
          },
          error: (error) => {
            console.error('Failed to save savings goals:', error);
            this.isLoading = false;
            // TODO: Show error message to user
          }
        });
      } else {
        this.isLoading = false;
        this.dialogRef.close({ type: 'save' } as SavingsGoalsDialogResult);
      }
    }
  }

  onMonthlySavingsTargetChange(index: number): void {
    // Method called when slider value changes - calculations are automatic via getTimeToGoalMonths
  }

  getTimeToGoalMonths(goalValue: SavingsGoalFormData): number {
    const remaining = this.getRemainingAmount(goalValue);
    const monthlyTarget = goalValue.monthlySavingsTarget || 0;
    
    if (remaining <= 0 || monthlyTarget <= 0) {
      return 0;
    }
    
    return Math.ceil(remaining / monthlyTarget);
  }

  getTimeToGoalClass(goalValue: SavingsGoalFormData): string {
    const months = this.getTimeToGoalMonths(goalValue);
    if (months <= 12) return 'excellent';
    if (months <= 24) return 'good';
    if (months <= 36) return 'moderate';
    return 'slow';
  }

  getTimeToGoalIcon(goalValue: SavingsGoalFormData): string {
    const months = this.getTimeToGoalMonths(goalValue);
    if (months <= 12) return 'flash_on';
    if (months <= 24) return 'schedule';
    if (months <= 36) return 'access_time';
    return 'hourglass_empty';
  }
}