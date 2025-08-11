import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest, ErrorResponse } from '@simple-budget/shared';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>Create Account</mat-card-title>
          <mat-card-subtitle>Start managing your budget today</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div class="form-field-container">
              <mat-form-field appearance="outline" class="full-width">
                <input matInput formControlName="firstName" [disabled]="isLoading" placeholder="First name">
                <mat-error *ngIf="registerForm.get('firstName')?.hasError('required')">
                  First name is required
                </mat-error>
                <mat-error *ngIf="registerForm.get('firstName')?.hasError('minlength')">
                  First name must be at least 1 character
                </mat-error>
              </mat-form-field>
              <mat-icon class="manual-icon">person</mat-icon>
            </div>

            <div class="form-field-container">
              <mat-form-field appearance="outline" class="full-width">
                <input matInput type="email" formControlName="email" [disabled]="isLoading" placeholder="Email address">
                <mat-error *ngIf="registerForm.get('email')?.hasError('required')">
                  Email is required
                </mat-error>
                <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
                  Please enter a valid email address
                </mat-error>
              </mat-form-field>
              <mat-icon class="manual-icon">email</mat-icon>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" [disabled]="isLoading" placeholder="Password">
              <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button" [disabled]="isLoading">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="registerForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
              <mat-error *ngIf="registerForm.get('password')?.hasError('pattern')">
                Password must contain at least 8 characters with uppercase, lowercase, and numbers
              </mat-error>
            </mat-form-field>


            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit" 
                      [disabled]="registerForm.invalid || isLoading" class="full-width">
                <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
                <span *ngIf="!isLoading">Create Account</span>
              </button>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <p class="login-link">
            Already have an account? 
            <a routerLink="/login" class="link">Sign in here</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: var(--spacing-md);
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
      font-family: var(--font-primary);
    }

    .register-card {
      width: 100%;
      max-width: 480px;
      padding: var(--spacing-lg);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-lg);
      background: white;
      border: 1px solid var(--color-neutral-300);
    }

    .register-card mat-card-header {
      margin-bottom: var(--spacing-lg);
      text-align: center;
    }

    .register-card mat-card-title {
      font-family: var(--font-secondary);
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-neutral-900);
      margin-bottom: var(--spacing-xs);
    }

    .register-card mat-card-subtitle {
      font-family: var(--font-primary);
      color: var(--color-neutral-600);
      font-size: 1rem;
      line-height: 1.5;
    }

    .form-field-container {
      position: relative;
      width: 100%;
      margin-bottom: var(--spacing-md);
    }

    .full-width {
      width: 100%;
    }

    .manual-icon {
      position: absolute;
      right: 16px;
      top: 38px;
      color: var(--color-neutral-500);
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
      z-index: 10;
      pointer-events: none;
    }
    
    ::ng-deep .mat-mdc-form-field {
      font-size: 16px;
      font-family: var(--font-primary);
    }
    
    ::ng-deep .mat-mdc-form-field .mat-mdc-text-field-wrapper {
      padding: var(--spacing-sm) 72px var(--spacing-sm) var(--spacing-sm);
      border-radius: var(--border-radius-md);
      border: 2px solid var(--color-neutral-300);
      background-color: white;
      transition: all 0.2s ease-out;
    }

    ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-text-field-wrapper {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(46, 125, 90, 0.1);
    }

    ::ng-deep .mat-mdc-form-field .mat-mdc-floating-label {
      color: var(--color-neutral-600);
      font-weight: 500;
    }

    ::ng-deep .mat-mdc-form-field input {
      font-family: var(--font-primary);
      color: var(--color-neutral-900);
      padding: var(--spacing-xs) 0;
    }

    .form-actions {
      margin-top: var(--spacing-lg);
    }

    .form-actions button {
      height: 56px;
      font-size: 1rem;
      font-weight: 600;
      border-radius: var(--border-radius-md);
      background-color: var(--color-primary);
      transition: all 0.15s ease-out;
      padding: 0 var(--spacing-lg);
      min-width: 140px;
      line-height: 1.2;
    }

    .form-actions button:hover:not([disabled]) {
      background-color: #297552;
      transform: translateY(-1px);
      box-shadow: var(--shadow-lg);
    }

    .form-actions button:disabled {
      background-color: var(--color-neutral-500);
      cursor: not-allowed;
    }

    .login-link {
      text-align: center;
      margin: var(--spacing-lg) 0 0 0;
      color: var(--color-neutral-600);
      font-family: var(--font-primary);
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .link {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 600;
      transition: color 0.15s ease-out;
    }

    .link:hover {
      color: #297552;
      text-decoration: underline;
    }

    mat-spinner {
      margin-right: var(--spacing-xs);
    }

    // Error styling improvements
    ::ng-deep .mat-mdc-form-field .mat-mdc-form-field-error {
      color: var(--color-error);
      font-size: 0.875rem;
      font-weight: 500;
      margin-top: var(--spacing-xs);
    }

    // Manual icon positioning works better than suffix icons

    // Password toggle button - align with manual icons
    ::ng-deep .mat-mdc-form-field button.mat-mdc-icon-button[matSuffix] {
      position: absolute !important;
      right: 16px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      width: 28px !important;
      height: 28px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      background: transparent !important;
      min-width: 28px !important;
      z-index: 10 !important;
    }

    ::ng-deep .mat-mdc-form-field button.mat-mdc-icon-button[matSuffix] .mat-icon {
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
    }

    // Loading state
    .form-actions button mat-spinner {
      color: white;
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  hidePassword = true;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(1)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)]]
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid && !this.isLoading) {
      this.isLoading = true;
      // For now, we'll use default values for the required fields
      const registerRequest: RegisterRequest = {
        ...this.registerForm.value,
        monthlyIncome: 1000 // Temporary default - will be set in onboarding
      };

      this.authService.register(registerRequest).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open('Account created successfully! Let\'s set up your budget.', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          // Navigate to onboarding instead of dashboard
          this.router.navigate(['/onboarding']);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          console.error('Registration error:', error);
          
          let errorMessage = 'Registration failed. Please try again.';
          
          if (error.status === 0) {
            errorMessage = 'Cannot connect to server. Please check if the API is running.';
          } else if (error.error && typeof error.error === 'object' && 'error' in error.error) {
            const errorResponse = error.error as ErrorResponse;
            errorMessage = errorResponse.error.message;
          } else if (error.message) {
            errorMessage = `Server error: ${error.message}`;
          }

          this.snackBar.open(errorMessage, 'Close', {
            duration: 10000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }
}