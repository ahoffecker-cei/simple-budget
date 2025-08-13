import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { StudentLoan } from '@simple-budget/shared';

export interface StudentLoanFormData {
  loan?: StudentLoan;
  isEdit: boolean;
}

export interface StudentLoanFormResult {
  type: 'create' | 'update';
  data: {
    servicerName: string;
    accountNumber: string;
    balance: number;
    interestRate: number;
    monthlyPayment: number;
    loanType: 'federal' | 'private';
    status: 'active' | 'deferred' | 'forbearance' | 'paid_off';
  };
}

@Component({
  selector: 'app-student-loan-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule
  ],
  template: `
    <div class="student-loan-form">
      <div class="form-header">
        <h2 mat-dialog-title>
          {{ data.isEdit ? 'Edit Student Loan' : 'Add Student Loan' }}
        </h2>
        <button mat-icon-button (click)="close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="form-content">
        <form [formGroup]="loanForm" (ngSubmit)="onSubmit()">
          
          <!-- Servicer Information -->
          <div class="form-section">
            <h3>Servicer Information</h3>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Loan Servicer</mat-label>
              <input matInput 
                     formControlName="servicerName"
                     placeholder="e.g., Navient, Great Lakes, FedLoan"
                     autocomplete="off">
              <mat-error *ngIf="loanForm.get('servicerName')?.hasError('required')">
                Servicer name is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Account Number</mat-label>
              <input matInput 
                     formControlName="accountNumber"
                     placeholder="Enter account number"
                     autocomplete="off">
              <mat-error *ngIf="loanForm.get('accountNumber')?.hasError('required')">
                Account number is required
              </mat-error>
            </mat-form-field>
          </div>

          <!-- Loan Details -->
          <div class="form-section">
            <h3>Loan Details</h3>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Current Balance</mat-label>
                <span matTextPrefix>$</span>
                <input matInput 
                       type="number"
                       formControlName="balance"
                       placeholder="0.00"
                       min="0"
                       step="0.01">
                <mat-error *ngIf="loanForm.get('balance')?.hasError('required')">
                  Balance is required
                </mat-error>
                <mat-error *ngIf="loanForm.get('balance')?.hasError('min')">
                  Balance must be positive
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Interest Rate</mat-label>
                <input matInput 
                       type="number"
                       formControlName="interestRate"
                       placeholder="0.00"
                       min="0"
                       max="30"
                       step="0.01">
                <span matTextSuffix>%</span>
                <mat-error *ngIf="loanForm.get('interestRate')?.hasError('required')">
                  Interest rate is required
                </mat-error>
                <mat-error *ngIf="loanForm.get('interestRate')?.hasError('min')">
                  Interest rate must be positive
                </mat-error>
                <mat-error *ngIf="loanForm.get('interestRate')?.hasError('max')">
                  Interest rate seems too high
                </mat-error>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Monthly Payment</mat-label>
              <span matTextPrefix>$</span>
              <input matInput 
                     type="number"
                     formControlName="monthlyPayment"
                     placeholder="0.00"
                     min="0"
                     step="0.01">
              <mat-error *ngIf="loanForm.get('monthlyPayment')?.hasError('required')">
                Monthly payment is required
              </mat-error>
              <mat-error *ngIf="loanForm.get('monthlyPayment')?.hasError('min')">
                Monthly payment must be positive
              </mat-error>
            </mat-form-field>
          </div>

          <!-- Loan Classification -->
          <div class="form-section">
            <h3>Loan Classification</h3>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Loan Type</mat-label>
                <mat-select formControlName="loanType">
                  <mat-option value="federal">Federal</mat-option>
                  <mat-option value="private">Private</mat-option>
                </mat-select>
                <mat-error *ngIf="loanForm.get('loanType')?.hasError('required')">
                  Loan type is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="active">Active</mat-option>
                  <mat-option value="deferred">Deferred</mat-option>
                  <mat-option value="forbearance">Forbearance</mat-option>
                  <mat-option value="paid_off">Paid Off</mat-option>
                </mat-select>
                <mat-error *ngIf="loanForm.get('status')?.hasError('required')">
                  Status is required
                </mat-error>
              </mat-form-field>
            </div>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions class="form-actions">
        <button mat-button type="button" (click)="close()">
          Cancel
        </button>
        <button mat-raised-button 
                color="primary" 
                (click)="onSubmit()"
                [disabled]="loanForm.invalid || isSubmitting">
          <mat-icon *ngIf="isSubmitting">hourglass_empty</mat-icon>
          {{ isSubmitting ? 'Saving...' : (data.isEdit ? 'Update Loan' : 'Add Loan') }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .student-loan-form {
      max-width: 600px;
      width: 100%;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md);
      border-bottom: 1px solid var(--color-neutral-300);
    }

    .form-header h2 {
      margin: 0;
      font-family: var(--font-secondary);
      color: var(--color-neutral-900);
      font-size: 1.5rem;
      font-weight: 600;
    }

    .close-btn {
      color: var(--color-neutral-600);
    }

    .form-content {
      padding: var(--spacing-md);
      max-height: 80vh;
      overflow-y: auto;
    }

    .form-section {
      margin-bottom: var(--spacing-lg);
    }

    .form-section h3 {
      margin: 0 0 var(--spacing-md) 0;
      font-family: var(--font-secondary);
      color: var(--color-neutral-800);
      font-size: 1.1rem;
      font-weight: 500;
      border-bottom: 1px solid var(--color-neutral-200);
      padding-bottom: var(--spacing-xs);
    }

    .form-row {
      display: flex;
      gap: var(--spacing-md);
    }

    .full-width {
      width: 100%;
    }

    .half-width {
      flex: 1;
    }

    .form-actions {
      padding: var(--spacing-md);
      border-top: 1px solid var(--color-neutral-300);
      justify-content: flex-end;
      gap: var(--spacing-sm);
    }

    /* Custom styling for form fields */
    ::ng-deep .mat-mdc-form-field-outline {
      color: var(--color-neutral-400);
    }

    ::ng-deep .mat-mdc-form-field-outline-thick {
      color: var(--color-primary);
    }

    ::ng-deep .mat-mdc-form-field-label {
      color: var(--color-neutral-600);
    }

    ::ng-deep .mat-mdc-form-field-focus .mat-mdc-form-field-label {
      color: var(--color-primary);
    }

    /* Responsive design */
    @media (max-width: 600px) {
      .student-loan-form {
        max-width: 100vw;
        height: 100vh;
        max-height: 100vh;
      }

      .form-content {
        max-height: calc(100vh - 150px);
      }

      .form-row {
        flex-direction: column;
      }

      .half-width {
        width: 100%;
      }
    }
  `]
})
export class StudentLoanFormComponent {
  loanForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<StudentLoanFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StudentLoanFormData
  ) {
    this.loanForm = this.createForm();
    
    if (data.isEdit && data.loan) {
      this.populateForm(data.loan);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      servicerName: ['', [Validators.required, Validators.minLength(2)]],
      accountNumber: ['', [Validators.required]],
      balance: [0, [Validators.required, Validators.min(0)]],
      interestRate: [0, [Validators.required, Validators.min(0), Validators.max(30)]],
      monthlyPayment: [0, [Validators.required, Validators.min(0)]],
      loanType: ['federal', [Validators.required]],
      status: ['active', [Validators.required]]
    });
  }

  private populateForm(loan: StudentLoan): void {
    this.loanForm.patchValue({
      servicerName: loan.servicerName,
      accountNumber: loan.accountNumber,
      balance: loan.balance,
      interestRate: loan.interestRate,
      monthlyPayment: loan.monthlyPayment,
      loanType: loan.loanType,
      status: loan.status
    });
  }

  onSubmit(): void {
    if (this.loanForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const formValue = this.loanForm.value;
      const result: StudentLoanFormResult = {
        type: this.data.isEdit ? 'update' : 'create',
        data: {
          servicerName: formValue.servicerName,
          accountNumber: formValue.accountNumber,
          balance: Number(formValue.balance),
          interestRate: Number(formValue.interestRate),
          monthlyPayment: Number(formValue.monthlyPayment),
          loanType: formValue.loanType,
          status: formValue.status
        }
      };

      this.dialogRef.close(result);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}