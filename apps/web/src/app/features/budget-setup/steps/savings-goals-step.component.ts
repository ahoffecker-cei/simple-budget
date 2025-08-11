import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BudgetWizardService } from '../services/budget-wizard.service';

interface SavingsGoal {
  key: string;
  label: string;
  description: string;
  icon: string;
  multiplier: number; // multiplier of monthly expenses
}

@Component({
  selector: 'app-savings-goals-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule
  ],
  templateUrl: './savings-goals-step.component.html',
  styleUrls: ['./savings-goals-step.component.scss']
})
export class SavingsGoalsStepComponent implements OnInit, OnDestroy {
  @Output() stepValidChange = new EventEmitter<{data: any, isValid: boolean}>();
  
  savingsForm: FormGroup;
  monthlyIncome = 0;
  totalExpenses = 0;
  studentLoanPayments = 0;
  availableForSavings = 0;
  selectedGoalType = '';
  customGoalAmount = 0;
  
  private destroy$ = new Subject<void>();

  savingsGoals: SavingsGoal[] = [
    {
      key: 'emergency_3',
      label: '3 Months Emergency Fund',
      description: 'Covers 3 months of essential expenses',
      icon: 'security',
      multiplier: 3
    },
    {
      key: 'emergency_6',
      label: '6 Months Emergency Fund',
      description: 'Recommended full emergency fund',
      icon: 'verified_user',
      multiplier: 6
    },
    {
      key: 'custom',
      label: 'Custom Goal',
      description: 'Set your own savings target',
      icon: 'flag',
      multiplier: 0
    }
  ];

  constructor(
    private fb: FormBuilder,
    private budgetWizardService: BudgetWizardService
  ) {
    this.savingsForm = this.fb.group({
      savingsGoal: [null, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    // Get data from previous steps
    this.loadPreviousStepData();

    // Load existing data if any
    const existingData = this.budgetWizardService.getStepData(3);
    if (existingData.savingsGoal) {
      this.savingsForm.patchValue({ savingsGoal: existingData.savingsGoal });
      this.customGoalAmount = existingData.savingsGoal;
    }

    // Watch form changes
    this.savingsForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.emitStepChange();
      });

    // Initial emit (savings step is always valid since it's optional)
    this.emitStepChange();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPreviousStepData(): void {
    const incomeData = this.budgetWizardService.getStepData(0);
    const loanData = this.budgetWizardService.getStepData(1);
    const expenseData = this.budgetWizardService.getStepData(2);

    this.monthlyIncome = incomeData.monthlyIncome || 0;
    this.studentLoanPayments = loanData.studentLoanPayment || 0;
    
    if (expenseData.majorExpenses) {
      this.totalExpenses = Object.values(expenseData.majorExpenses)
        .reduce((sum: number, value: any) => sum + (value || 0), 0);
    }

    this.availableForSavings = this.monthlyIncome - this.totalExpenses - this.studentLoanPayments;
  }

  selectGoal(goalKey: string): void {
    this.selectedGoalType = goalKey;
    
    if (goalKey === 'custom') {
      this.savingsForm.patchValue({ savingsGoal: this.customGoalAmount });
    } else {
      const goal = this.savingsGoals.find(g => g.key === goalKey);
      if (goal) {
        const goalAmount = this.totalExpenses * goal.multiplier;
        this.savingsForm.patchValue({ savingsGoal: goalAmount });
      }
    }
  }

  onCustomAmountChange(event: any): void {
    this.customGoalAmount = event.target.value;
    if (this.selectedGoalType === 'custom') {
      this.savingsForm.patchValue({ savingsGoal: this.customGoalAmount });
    }
  }

  getGoalAmount(goalKey: string): number {
    if (goalKey === 'custom') {
      return this.customGoalAmount;
    }
    const goal = this.savingsGoals.find(g => g.key === goalKey);
    return goal ? this.totalExpenses * goal.multiplier : 0;
  }

  getTimeToGoal(): number {
    const goalAmount = this.savingsForm.value.savingsGoal || 0;
    if (goalAmount === 0 || this.availableForSavings <= 0) return 0;
    return Math.ceil(goalAmount / this.availableForSavings);
  }

  getSavingsRecommendation(): string {
    const percentage = this.availableForSavings / this.monthlyIncome;
    
    if (percentage >= 0.2) {
      return 'Excellent! You have great savings potential.';
    } else if (percentage >= 0.1) {
      return 'Good! You can build solid savings over time.';
    } else if (percentage > 0) {
      return 'Start small - every bit of savings helps!';
    } else {
      return 'Focus on reducing expenses or increasing income first.';
    }
  }

  getSavingsRecommendationColor(): string {
    const percentage = this.availableForSavings / this.monthlyIncome;
    
    if (percentage >= 0.2) return '#4caf50';
    if (percentage >= 0.1) return '#8bc34a';
    if (percentage > 0) return '#ff9800';
    return '#f44336';
  }

  private emitStepChange(): void {
    const formData = this.savingsForm.value;
    const isValid = this.savingsForm.valid;
    
    this.stepValidChange.emit({
      data: formData,
      isValid: isValid
    });
  }
}