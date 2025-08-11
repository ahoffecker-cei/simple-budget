import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BudgetWizardService } from './services/budget-wizard.service';
import { IncomeStepComponent } from './steps/income-step.component';
import { StudentLoanStepComponent } from './steps/student-loan-step.component';
import { MajorExpensesStepComponent } from './steps/major-expenses-step.component';
import { SavingsGoalsStepComponent } from './steps/savings-goals-step.component';

@Component({
  selector: 'app-budget-wizard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    IncomeStepComponent,
    StudentLoanStepComponent,
    MajorExpensesStepComponent,
    SavingsGoalsStepComponent
  ],
  templateUrl: './budget-wizard.component.html',
  styleUrls: ['./budget-wizard.component.scss']
})
export class BudgetWizardComponent implements OnInit, OnDestroy {
  currentStep = 0;
  totalSteps = 4;
  isLoading = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    protected budgetWizardService: BudgetWizardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.budgetWizardService.steps$
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get progressPercentage(): number {
    return ((this.currentStep + 1) / this.totalSteps) * 100;
  }

  get stepMessage(): string {
    const messages = [
      "Step 1 of 4 - Let's start with your income!",
      "Step 2 of 4 - Tell us about your student loans",
      "Step 3 of 4 - What are your major expenses?",
      "Step 4 of 4 - Set your savings goals!"
    ];
    return messages[this.currentStep] || '';
  }

  get encouragementMessage(): string {
    const messages = [
      "You're doing great! Every journey starts with a single step.",
      "Fantastic progress! Understanding your debt is key to financial freedom.",
      "Excellent work! Tracking expenses puts you in control.",
      "Almost there! Setting goals is the foundation of success."
    ];
    return messages[this.currentStep] || '';
  }

  canGoNext(): boolean {
    return this.budgetWizardService.isStepValid(this.currentStep);
  }

  canGoPrevious(): boolean {
    return this.currentStep > 0;
  }

  nextStep(): void {
    if (this.canGoNext() && this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
    } else if (this.canGoNext() && this.currentStep === this.totalSteps - 1) {
      this.completeWizard();
    }
  }

  previousStep(): void {
    if (this.canGoPrevious()) {
      this.currentStep--;
    }
  }

  goToStep(stepIndex: number): void {
    if (this.budgetWizardService.canProceedToStep(stepIndex)) {
      this.currentStep = stepIndex;
    }
  }

  private completeWizard(): void {
    this.isLoading = true;
    
    this.budgetWizardService.completeWizard()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          // Navigate to dashboard with success message
          this.router.navigate(['/dashboard'], {
            state: { 
              message: 'Budget Setup Complete! You\'re on your way to financial wellness.',
              showAchievement: true 
            }
          });
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error completing wizard:', error);
          // Handle error appropriately
        }
      });
  }
}