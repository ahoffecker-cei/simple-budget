import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';

export interface SavingsGoalData {
  monthlyIncome: number;
  totalBudgetCategories: number;
  totalStudentLoans: number;
  availableForSavings: number;
}

export interface SavingsGoalResult {
  goalName: string;
  targetAmount: number;
  monthlyContribution: number;
  monthsToGoal: number;
}

@Component({
  selector: 'app-smart-savings-goal-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSliderModule,
    MatFormFieldModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  template: `
    <div class="savings-goal-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>Smart Savings Goal Calculator</h2>
        <button mat-icon-button (click)="close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="dialog-content">
        
        <!-- Financial Summary Section -->
        <div class="financial-summary">
          <h3>Your Financial Summary</h3>
          <div class="summary-grid">
            <div class="summary-item income">
              <div class="summary-info">
                <span class="summary-label">Monthly Income</span>
                <span class="summary-value">{{data.monthlyIncome | currency}}</span>
              </div>
              <mat-icon>trending_up</mat-icon>
            </div>
            <div class="summary-item expenses">
              <div class="summary-info">
                <span class="summary-label">Budget Categories</span>
                <span class="summary-value">{{data.totalBudgetCategories | currency}}</span>
              </div>
              <mat-icon>receipt</mat-icon>
            </div>
            <div class="summary-item loans">
              <div class="summary-info">
                <span class="summary-label">Student Loans</span>
                <span class="summary-value">{{data.totalStudentLoans | currency}}</span>
              </div>
              <mat-icon>school</mat-icon>
            </div>
            <div class="summary-item available" [class.positive]="data.availableForSavings > 0" [class.negative]="data.availableForSavings <= 0">
              <div class="summary-info">
                <span class="summary-label">Available for Savings</span>
                <span class="summary-value">{{data.availableForSavings | currency}}</span>
              </div>
              <mat-icon>{{data.availableForSavings > 0 ? 'savings' : 'warning'}}</mat-icon>
            </div>
          </div>
        </div>

        <!-- Savings Goal Setup -->
        <div class="goal-setup" *ngIf="data.availableForSavings > 0">
          <form [formGroup]="goalForm">
            
            <!-- Preset Goals -->
            <div class="preset-goals">
              <h3>Choose a Savings Goal</h3>
              <mat-chip-set>
                <mat-chip 
                  *ngFor="let preset of presetGoals" 
                  [class.selected]="selectedPreset === preset.key"
                  (click)="selectPreset(preset.key)"
                  [class]="'chip-' + preset.key">
                  <mat-icon>{{preset.icon}}</mat-icon>
                  {{preset.label}}
                </mat-chip>
              </mat-chip-set>
            </div>

            <!-- Custom Goal Name (only for custom goals) -->
            <mat-form-field appearance="outline" class="full-width" *ngIf="selectedPreset === 'custom'">
              <mat-label>Goal Name</mat-label>
              <input matInput 
                     formControlName="goalName"
                     placeholder="Enter your goal name"
                     maxlength="50">
              <mat-error *ngIf="goalForm.get('goalName')?.hasError('required')">
                Goal name is required
              </mat-error>
            </mat-form-field>

            <!-- Goal Amount -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Goal Amount</mat-label>
              <span matTextPrefix>$</span>
              <input matInput 
                     type="number"
                     formControlName="targetAmount"
                     placeholder="0"
                     min="1"
                     step="100"
                     (input)="onGoalAmountChange()">
              <mat-error *ngIf="goalForm.get('targetAmount')?.hasError('required')">
                Goal amount is required
              </mat-error>
              <mat-error *ngIf="goalForm.get('targetAmount')?.hasError('min')">
                Goal amount must be positive
              </mat-error>
            </mat-form-field>

            <!-- Monthly Contribution Slider -->
            <div class="contribution-section">
              <h4>Monthly Contribution</h4>
              <div class="slider-container">
                <div class="slider-header">
                  <span class="slider-label">$0</span>
                  <span class="slider-value">{{monthlyContribution | currency}}</span>
                  <span class="slider-label">{{data.availableForSavings | currency}}</span>
                </div>
                <mat-slider 
                  class="contribution-slider"
                  [min]="0" 
                  [max]="data.availableForSavings" 
                  [step]="25"
                  discrete
                  showTickMarks>
                  <input matSliderThumb 
                         [value]="monthlyContribution" 
                         (input)="onContributionChange($event)">
                </mat-slider>
              </div>
            </div>

            <!-- Goal Visualization -->
            <div class="goal-visualization" *ngIf="goalForm.get('targetAmount')?.value > 0 && monthlyContribution > 0">
              <h4>Goal Timeline</h4>
              <div class="timeline-card">
                <div class="timeline-header">
                  <div class="timeline-info">
                    <span class="months-label">Time to Goal</span>
                    <span class="months-value" [class]="getTimelineClass()">
                      {{monthsToGoal}} months
                      <span class="years-helper" *ngIf="monthsToGoal > 12">
                        ({{(monthsToGoal / 12) | number:'1.1-1'}} years)
                      </span>
                    </span>
                  </div>
                  <mat-icon [class]="getTimelineClass()">{{getTimelineIcon()}}</mat-icon>
                </div>
                
                <div class="progress-visualization">
                  <mat-progress-bar 
                    mode="determinate" 
                    [value]="getSampleProgress()"
                    [class]="getTimelineClass()">
                  </mat-progress-bar>
                  <div class="progress-labels">
                    <span>$0</span>
                    <span>{{goalForm.get('targetAmount')?.value | currency}}</span>
                  </div>
                </div>

                <div class="savings-breakdown">
                  <div class="breakdown-item">
                    <span class="breakdown-label">Monthly saving:</span>
                    <span class="breakdown-value">{{monthlyContribution | currency}}</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="breakdown-label">Remaining income:</span>
                    <span class="breakdown-value">{{(data.availableForSavings - monthlyContribution) | currency}}</span>
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>

        <!-- No Available Money Warning -->
        <div class="no-money-warning" *ngIf="data.availableForSavings <= 0">
          <mat-icon class="warning-icon">warning</mat-icon>
          <h3>Focus on Budget Management First</h3>
          <p>It looks like your current budget categories and loan payments use up all your monthly income. 
             Consider reviewing your budget categories or increasing your income before setting savings goals.</p>
          <div class="suggestions">
            <button mat-stroked-button (click)="navigateToBudgetCategories()">
              <mat-icon>category</mat-icon>
              Review Budget Categories
            </button>
          </div>
        </div>

      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions" *ngIf="data.availableForSavings > 0">
        <button mat-button (click)="close()">Cancel</button>
        <button mat-raised-button 
                color="primary" 
                (click)="createGoal()"
                [disabled]="!isFormValid()">
          Create Savings Goal
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .savings-goal-dialog {
      max-width: 800px;
      width: 100%;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md);
      border-bottom: 1px solid var(--color-neutral-300);
    }

    .dialog-header h2 {
      margin: 0;
      font-family: var(--font-secondary);
      color: var(--color-neutral-900);
      font-size: 1.5rem;
      font-weight: 600;
    }

    .close-btn {
      color: var(--color-neutral-600);
    }

    .dialog-content {
      padding: var(--spacing-md);
      max-height: 80vh;
      overflow-y: auto;
    }

    /* Financial Summary */
    .financial-summary {
      margin-bottom: var(--spacing-lg);
    }

    .financial-summary h3 {
      margin: 0 0 var(--spacing-md) 0;
      font-family: var(--font-secondary);
      color: var(--color-neutral-800);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-sm);
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm);
      border-radius: var(--border-radius-md);
      border: 1px solid;
      transition: all 0.2s ease-out;
    }

    .summary-item.income {
      background: rgba(90, 155, 212, 0.08);
      border-color: rgba(90, 155, 212, 0.2);
      color: var(--color-secondary);
    }

    .summary-item.expenses {
      background: rgba(244, 162, 97, 0.08);
      border-color: rgba(244, 162, 97, 0.2);
      color: var(--color-accent);
    }

    .summary-item.loans {
      background: rgba(249, 199, 79, 0.08);
      border-color: rgba(249, 199, 79, 0.2);
      color: var(--color-warning);
    }

    .summary-item.available.positive {
      background: rgba(82, 183, 136, 0.08);
      border-color: rgba(82, 183, 136, 0.2);
      color: var(--color-success);
    }

    .summary-item.available.negative {
      background: rgba(244, 67, 54, 0.08);
      border-color: rgba(244, 67, 54, 0.2);
      color: #f44336;
    }

    .summary-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .summary-label {
      font-size: 0.8rem;
      font-weight: 500;
      opacity: 0.8;
    }

    .summary-value {
      font-family: var(--font-mono);
      font-weight: 600;
      font-size: 1rem;
    }

    /* Preset Goals */
    .preset-goals {
      margin-bottom: var(--spacing-lg);
    }

    .preset-goals h3 {
      margin: 0 0 var(--spacing-sm) 0;
      font-family: var(--font-secondary);
      color: var(--color-neutral-800);
    }

    mat-chip-set {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-xs);
    }

    .chip-emergency {
      background-color: rgba(82, 183, 136, 0.1) !important;
      color: var(--color-success) !important;
    }

    .chip-emergency.selected {
      background-color: var(--color-success) !important;
      color: white !important;
    }

    .chip-vacation {
      background-color: rgba(244, 162, 97, 0.1) !important;
      color: var(--color-accent) !important;
    }

    .chip-vacation.selected {
      background-color: var(--color-accent) !important;
      color: white !important;
    }

    .chip-house {
      background-color: rgba(90, 155, 212, 0.1) !important;
      color: var(--color-secondary) !important;
    }

    .chip-house.selected {
      background-color: var(--color-secondary) !important;
      color: white !important;
    }

    .chip-custom {
      background-color: rgba(156, 39, 176, 0.1) !important;
      color: #9c27b0 !important;
    }

    .chip-custom.selected {
      background-color: #9c27b0 !important;
      color: white !important;
    }

    /* Contribution Section */
    .contribution-section {
      margin-bottom: var(--spacing-lg);
    }

    .contribution-section h4 {
      margin: 0 0 var(--spacing-sm) 0;
      font-family: var(--font-secondary);
      color: var(--color-neutral-800);
    }

    .slider-container {
      padding: var(--spacing-sm);
      border: 1px solid var(--color-neutral-300);
      border-radius: var(--border-radius-md);
      background: white;
    }

    .slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-sm);
    }

    .slider-label {
      font-size: 0.8rem;
      color: var(--color-neutral-600);
    }

    .slider-value {
      font-family: var(--font-mono);
      font-weight: 600;
      font-size: 1.1rem;
      color: var(--color-primary);
    }

    .contribution-slider {
      width: 100%;
    }

    /* Goal Visualization */
    .goal-visualization h4 {
      margin: 0 0 var(--spacing-sm) 0;
      font-family: var(--font-secondary);
      color: var(--color-neutral-800);
    }

    .timeline-card {
      padding: var(--spacing-md);
      border: 1px solid var(--color-neutral-300);
      border-radius: var(--border-radius-md);
      background: white;
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
    }

    .timeline-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .months-label {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--color-neutral-600);
    }

    .months-value {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 1.5rem;
    }

    .months-value.excellent {
      color: var(--color-success);
    }

    .months-value.good {
      color: var(--color-secondary);
    }

    .months-value.moderate {
      color: var(--color-warning);
    }

    .months-value.slow {
      color: #f44336;
    }

    .years-helper {
      font-size: 0.8rem;
      font-weight: 400;
      opacity: 0.7;
      display: block;
      margin-top: 2px;
    }

    .progress-visualization {
      margin-bottom: var(--spacing-md);
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: var(--color-neutral-600);
      margin-top: var(--spacing-xs);
    }

    .savings-breakdown {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      padding-top: var(--spacing-sm);
      border-top: 1px solid var(--color-neutral-200);
    }

    .breakdown-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .breakdown-label {
      font-size: 0.9rem;
      color: var(--color-neutral-600);
    }

    .breakdown-value {
      font-family: var(--font-mono);
      font-weight: 600;
      color: var(--color-neutral-800);
    }

    /* No Money Warning */
    .no-money-warning {
      text-align: center;
      padding: var(--spacing-lg);
      color: var(--color-neutral-700);
    }

    .warning-icon {
      font-size: 48px !important;
      width: 48px !important;
      height: 48px !important;
      color: var(--color-warning);
      margin-bottom: var(--spacing-sm);
    }

    .no-money-warning h3 {
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--color-neutral-800);
    }

    .suggestions {
      margin-top: var(--spacing-md);
    }

    /* Dialog Actions */
    .dialog-actions {
      padding: var(--spacing-md);
      border-top: 1px solid var(--color-neutral-300);
      justify-content: flex-end;
      gap: var(--spacing-sm);
    }

    .full-width {
      width: 100%;
      margin-bottom: var(--spacing-md);
    }

    /* Responsive */
    @media (max-width: 600px) {
      .savings-goal-dialog {
        max-width: 100vw;
        height: 100vh;
        max-height: 100vh;
      }

      .dialog-content {
        max-height: calc(100vh - 150px);
      }

      .summary-grid {
        grid-template-columns: 1fr;
      }

      .timeline-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-sm);
      }
    }
  `]
})
export class SmartSavingsGoalDialogComponent implements OnInit {
  goalForm: FormGroup;
  monthlyContribution = 0;
  monthsToGoal = 0;
  selectedPreset = '';

  presetGoals = [
    {
      key: 'emergency',
      label: 'Emergency Fund',
      icon: 'security',
      amount: (income: number) => income * 3 // 3 months of income
    },
    {
      key: 'vacation',
      label: 'Vacation Fund',
      icon: 'flight',
      amount: (income: number) => Math.min(income * 0.5, 5000) // Half month income or $5k max
    },
    {
      key: 'house',
      label: 'House Down Payment',
      icon: 'home',
      amount: (income: number) => income * 6 // 6 months of income
    },
    {
      key: 'custom',
      label: 'Custom Goal',
      icon: 'flag',
      amount: () => 0
    }
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<SmartSavingsGoalDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SavingsGoalData
  ) {
    this.goalForm = this.fb.group({
      goalName: ['', Validators.required],
      targetAmount: [0, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    // Set initial contribution to 50% of available money
    this.monthlyContribution = Math.round(this.data.availableForSavings * 0.5);
    this.updateTimelineCalculation();
  }

  selectPreset(presetKey: string): void {
    this.selectedPreset = presetKey;
    const preset = this.presetGoals.find(g => g.key === presetKey);
    
    if (preset) {
      if (presetKey === 'custom') {
        // For custom goals, clear the name and amount to let user set them
        this.goalForm.patchValue({
          goalName: '',
          targetAmount: 0
        });
      } else {
        // For preset goals, set the name and calculated amount
        this.goalForm.patchValue({
          goalName: preset.label,
          targetAmount: preset.amount(this.data.monthlyIncome)
        });
      }
      this.updateTimelineCalculation();
    }
  }

  onGoalAmountChange(): void {
    this.updateTimelineCalculation();
  }

  onContributionChange(event: any): void {
    this.monthlyContribution = Number(event.target.value);
    this.updateTimelineCalculation();
  }

  private updateTimelineCalculation(): void {
    const targetAmount = this.goalForm.get('targetAmount')?.value || 0;
    if (targetAmount <= 0 || this.monthlyContribution <= 0) {
      this.monthsToGoal = 0;
    } else {
      this.monthsToGoal = Math.ceil(targetAmount / this.monthlyContribution);
    }
  }

  getMonthsToGoal(): number {
    return this.monthsToGoal;
  }

  getTimelineClass(): string {
    if (this.monthsToGoal <= 12) return 'excellent';
    if (this.monthsToGoal <= 24) return 'good';
    if (this.monthsToGoal <= 36) return 'moderate';
    return 'slow';
  }

  getTimelineIcon(): string {
    if (this.monthsToGoal <= 12) return 'flash_on';
    if (this.monthsToGoal <= 24) return 'schedule';
    if (this.monthsToGoal <= 36) return 'access_time';
    return 'hourglass_empty';
  }

  getSampleProgress(): number {
    // Show 25% progress as example
    return 25;
  }

  isFormValid(): boolean {
    const targetAmount = this.goalForm.get('targetAmount')?.value || 0;
    const goalName = this.goalForm.get('goalName')?.value || '';
    
    // Check basic form validity and monthly contribution
    if (!this.goalForm.valid || this.monthlyContribution <= 0 || targetAmount <= 0) {
      return false;
    }
    
    // For custom goals, require a goal name
    if (this.selectedPreset === 'custom' && !goalName.trim()) {
      return false;
    }
    
    return true;
  }

  createGoal(): void {
    if (this.isFormValid()) {
      const result: SavingsGoalResult = {
        goalName: this.goalForm.get('goalName')?.value,
        targetAmount: this.goalForm.get('targetAmount')?.value,
        monthlyContribution: this.monthlyContribution,
        monthsToGoal: this.getMonthsToGoal()
      };
      
      this.dialogRef.close(result);
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  navigateToBudgetCategories(): void {
    this.dialogRef.close('navigate-budget');
  }
}