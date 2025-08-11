import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { BudgetWizardRequest, BudgetWizardResponse } from '@simple-budget/shared';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatStepperModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCheckboxModule
  ],
  template: `
    <div class="onboarding-container">
      <mat-card class="onboarding-card">
        <mat-card-header>
          <mat-card-title>Welcome! Let's Set Up Your Budget</mat-card-title>
          <mat-card-subtitle>This will take just a few minutes</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <mat-stepper [linear]="true" #stepper>
            <!-- Step 1: Monthly Income -->
            <mat-step [stepControl]="incomeForm">
              <form [formGroup]="incomeForm">
                <ng-template matStepLabel>Monthly Income</ng-template>
                <h3>What's your monthly income?</h3>
                <p>This helps us create accurate budget recommendations.</p>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Monthly Income</mat-label>
                  <input matInput type="number" formControlName="monthlyIncome" placeholder="Enter your monthly income">
                  <span matPrefix>$&nbsp;</span>
                  <mat-error *ngIf="incomeForm.get('monthlyIncome')?.hasError('required')">
                    Monthly income is required
                  </mat-error>
                  <mat-error *ngIf="incomeForm.get('monthlyIncome')?.hasError('min')">
                    Please enter a valid income amount
                  </mat-error>
                </mat-form-field>
                
                <div class="step-actions">
                  <button mat-raised-button color="primary" matStepperNext [disabled]="incomeForm.invalid">
                    Continue
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Step 2: Essential Expenses -->
            <mat-step [stepControl]="expensesForm">
              <form [formGroup]="expensesForm">
                <ng-template matStepLabel>Essential Expenses</ng-template>
                <h3>What are your essential monthly expenses?</h3>
                <p>Include rent, utilities, groceries, transportation, etc.</p>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Rent/Mortgage</mat-label>
                  <input matInput type="number" formControlName="rent" placeholder="0">
                  <span matPrefix>$&nbsp;</span>
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Utilities (Electric, Gas, Water, etc.)</mat-label>
                  <input matInput type="number" formControlName="utilities" placeholder="0">
                  <span matPrefix>$&nbsp;</span>
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Groceries</mat-label>
                  <input matInput type="number" formControlName="groceries" placeholder="0">
                  <span matPrefix>$&nbsp;</span>
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Transportation</mat-label>
                  <input matInput type="number" formControlName="transportation" placeholder="0">
                  <span matPrefix>$&nbsp;</span>
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Other Essential Expenses</mat-label>
                  <input matInput type="number" formControlName="otherEssentials" placeholder="0">
                  <span matPrefix>$&nbsp;</span>
                </mat-form-field>
                
                <div class="step-actions">
                  <button mat-button matStepperPrevious>Back</button>
                  <button mat-raised-button color="primary" matStepperNext>
                    Continue
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Step 3: Student Loans -->
            <mat-step [stepControl]="studentLoanForm">
              <form [formGroup]="studentLoanForm">
                <ng-template matStepLabel>Student Loans</ng-template>
                <h3>Do you have student loans?</h3>
                
                <mat-checkbox formControlName="hasStudentLoans" class="student-loan-checkbox">
                  Yes, I have student loans
                </mat-checkbox>
                
                <div *ngIf="studentLoanForm.get('hasStudentLoans')?.value" class="student-loan-details">
                  <h4>Current Student Loan Details</h4>
                  <p>We'll help you track and optimize your student loan payments.</p>
                  
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Current Balance</mat-label>
                    <input matInput type="number" formControlName="balance" placeholder="0">
                    <span matPrefix>$&nbsp;</span>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Interest Rate</mat-label>
                    <input matInput type="number" formControlName="interestRate" placeholder="0" step="0.01">
                    <span matSuffix>%</span>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Monthly Minimum Payment</mat-label>
                    <input matInput type="number" formControlName="monthlyPayment" placeholder="0">
                    <span matPrefix>$&nbsp;</span>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Remaining Loan Term (months)</mat-label>
                    <input matInput type="number" formControlName="termMonths" placeholder="0">
                  </mat-form-field>
                </div>
                
                <div class="step-actions">
                  <button mat-button matStepperPrevious>Back</button>
                  <button mat-raised-button color="primary" matStepperNext>
                    Continue
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Step 4: Summary & Completion -->
            <mat-step>
              <ng-template matStepLabel>Review & Complete</ng-template>
              <h3>Great! Let's review your budget setup</h3>
              
              <div class="summary-section">
                <h4>Monthly Income</h4>
                <p class="summary-amount">{{ formatCurrency(incomeForm.get('monthlyIncome')?.value || 0) }}</p>
              </div>
              
              <div class="summary-section">
                <h4>Essential Expenses</h4>
                <p class="summary-amount">{{ formatCurrency(getTotalExpenses()) }}</p>
              </div>
              
              <div class="summary-section" *ngIf="studentLoanForm.get('hasStudentLoans')?.value">
                <h4>Student Loan Payment</h4>
                <p class="summary-amount">{{ formatCurrency(studentLoanForm.get('monthlyPayment')?.value || 0) }}</p>
              </div>
              
              <div class="summary-section available-budget">
                <h4>Available for Other Expenses & Savings</h4>
                <p class="summary-amount">{{ formatCurrency(getAvailableBudget()) }}</p>
              </div>
              
              <div class="step-actions">
                <button mat-button matStepperPrevious>Back</button>
                <button mat-raised-button color="primary" (click)="completeOnboarding()" [disabled]="isLoading">
                  <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
                  <span *ngIf="!isLoading">Complete Setup</span>
                </button>
              </div>
            </mat-step>
          </mat-stepper>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .onboarding-container {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .onboarding-card {
      width: 100%;
      max-width: 800px;
      padding: 20px;
      margin-top: 20px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    ::ng-deep mat-form-field {
      font-size: 12px;
    }
    
    ::ng-deep .mat-mdc-form-field-label {
      font-size: 12px !important;
    }

    .step-actions {
      margin-top: 24px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .student-loan-checkbox {
      margin-bottom: 20px;
    }

    .student-loan-details {
      margin-top: 20px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .summary-section {
      margin-bottom: 16px;
      padding: 12px;
      border-left: 4px solid #667eea;
      background-color: #f9f9f9;
    }

    .summary-section h4 {
      margin: 0 0 8px 0;
      color: #333;
    }

    .summary-amount {
      font-size: 18px;
      font-weight: bold;
      color: #667eea;
      margin: 0;
    }

    .available-budget {
      border-left-color: #4caf50;
    }

    .available-budget .summary-amount {
      color: #4caf50;
    }

    h3 {
      color: #333;
      margin-bottom: 8px;
    }

    p {
      color: #666;
      margin-bottom: 20px;
    }
  `]
})
export class OnboardingComponent implements OnInit {
  incomeForm: FormGroup;
  expensesForm: FormGroup;
  studentLoanForm: FormGroup;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.incomeForm = this.formBuilder.group({
      monthlyIncome: ['', [Validators.required, Validators.min(1)]]
    });

    this.expensesForm = this.formBuilder.group({
      rent: [0, [Validators.min(0)]],
      utilities: [0, [Validators.min(0)]],
      groceries: [0, [Validators.min(0)]],
      transportation: [0, [Validators.min(0)]],
      otherEssentials: [0, [Validators.min(0)]]
    });

    this.studentLoanForm = this.formBuilder.group({
      hasStudentLoans: [false],
      balance: [0, [Validators.min(0)]],
      interestRate: [0, [Validators.min(0), Validators.max(100)]],
      monthlyPayment: [0, [Validators.min(0)]],
      termMonths: [0, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    // Check if user is authenticated
    // If not authenticated, redirect to login
  }

  getTotalExpenses(): number {
    const expenses = this.expensesForm.value;
    return (expenses.rent || 0) + (expenses.utilities || 0) + (expenses.groceries || 0) + 
           (expenses.transportation || 0) + (expenses.otherEssentials || 0);
  }

  getAvailableBudget(): number {
    const income = this.incomeForm.get('monthlyIncome')?.value || 0;
    const totalExpenses = this.getTotalExpenses();
    const studentLoanPayment = this.studentLoanForm.get('hasStudentLoans')?.value ? 
                              (this.studentLoanForm.get('monthlyPayment')?.value || 0) : 0;
    
    return income - totalExpenses - studentLoanPayment;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  completeOnboarding(): void {
    this.isLoading = true;
    
    // Prepare the budget wizard request
    const expenses = this.expensesForm.value;
    const studentLoan = this.studentLoanForm.value;
    
    const wizardRequest: BudgetWizardRequest = {
      monthlyIncome: this.incomeForm.get('monthlyIncome')?.value || 0,
      studentLoanPayment: studentLoan.hasStudentLoans ? (studentLoan.monthlyPayment || 0) : undefined,
      studentLoanBalance: studentLoan.hasStudentLoans ? (studentLoan.balance || 0) : undefined,
      majorExpenses: {
        rent: expenses.rent || 0,
        utilities: expenses.utilities || 0,
        transportation: expenses.transportation || 0,
        groceries: expenses.groceries || 0,
        otherEssentials: expenses.otherEssentials || 0
      }
    };
    
    // First update the user profile
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.isLoading = false;
      this.snackBar.open('Authentication error. Please log in again.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      this.authService.logoutLocal();
      return;
    }
    
    const profileUpdateRequest = {
      monthlyIncome: wizardRequest.monthlyIncome,
      studentLoanPayment: wizardRequest.studentLoanPayment || 0,
      studentLoanBalance: wizardRequest.studentLoanBalance || 0
    };
    
    // Update user profile first
    this.apiService.put(`Users/profile`, profileUpdateRequest).subscribe({
      next: (updatedUser) => {
        // Then complete the budget wizard
        this.apiService.post<BudgetWizardResponse>('budget/wizard/complete', wizardRequest).subscribe({
          next: (response) => {
            this.isLoading = false;
            
            // Refresh user data to get updated profile
            this.authService.refreshCurrentUser().subscribe(() => {
              this.snackBar.open('Budget setup complete! Welcome to Simple Budget.', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.router.navigate(['/dashboard']);
            });
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Budget wizard completion failed:', error);
            this.snackBar.open('Failed to complete budget setup. Please try again.', 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Profile update failed:', error);
        this.snackBar.open('Failed to update profile. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}