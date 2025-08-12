import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Account, CreateAccountRequest, UpdateAccountRequest } from '@simple-budget/shared';

export interface AccountFormData {
  account?: Account;
  isEdit?: boolean;
}

@Component({
  selector: 'app-account-form-dialog',
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
    <div class="account-form-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>{{ data.isEdit ? 'edit' : 'add_circle_outline' }}</mat-icon>
          {{ data.isEdit ? 'Edit Account' : 'Add New Account' }}
        </h2>
        <button mat-icon-button mat-dialog-close class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="accountForm" (ngSubmit)="onSubmit()" class="account-form">
        <div mat-dialog-content class="dialog-content">
          
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Account Type</mat-label>
            <mat-select formControlName="accountType" [disabled]="!!data.isEdit">
              <mat-option value="checking">
                <span class="account-option-text">💰 Checking Account</span>
              </mat-option>
              <mat-option value="savings">
                <span class="account-option-text">💵 Savings Account</span>
              </mat-option>
              <mat-option value="retirement">
                <span class="account-option-text">🏦 Retirement Account</span>
              </mat-option>
            </mat-select>
            <mat-hint *ngIf="!data.isEdit">Choose the type of account you want to track</mat-hint>
            <mat-error *ngIf="accountForm.get('accountType')?.hasError('required')">
              Please select an account type
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Account Name</mat-label>
            <input matInput 
                   formControlName="accountName" 
                   placeholder="e.g., Chase Checking, Emergency Fund"
                   maxlength="50">
            <mat-hint>Give your account a memorable name</mat-hint>
            <mat-error *ngIf="accountForm.get('accountName')?.hasError('required')">
              Account name is required
            </mat-error>
            <mat-error *ngIf="accountForm.get('accountName')?.hasError('minlength')">
              Account name must be at least 2 characters
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Current Balance</mat-label>
            <input matInput 
                   type="number" 
                   formControlName="currentBalance" 
                   placeholder="0.00"
                   step="0.01"
                   min="0">
            <span matPrefix>&nbsp;$&nbsp;</span>
            <mat-hint>Enter the current balance in this account</mat-hint>
            <mat-error *ngIf="accountForm.get('currentBalance')?.hasError('required')">
              Current balance is required
            </mat-error>
            <mat-error *ngIf="accountForm.get('currentBalance')?.hasError('min')">
              Balance cannot be negative
            </mat-error>
          </mat-form-field>

          <div class="balance-suggestions" *ngIf="!data.isEdit">
            <p class="suggestions-label">Quick amounts:</p>
            <div class="suggestions-buttons">
              <button type="button" 
                      mat-stroked-button 
                      *ngFor="let amount of suggestedAmounts" 
                      (click)="setBalance(amount)"
                      class="suggestion-btn">
                {{ amount | currency }}
              </button>
            </div>
          </div>

        </div>

        <div mat-dialog-actions class="dialog-actions">
          <button type="button" mat-button mat-dialog-close class="cancel-btn">
            Cancel
          </button>
          <button type="submit" 
                  mat-raised-button 
                  color="primary" 
                  [disabled]="accountForm.invalid || isSubmitting"
                  class="submit-btn">
            <mat-icon *ngIf="isSubmitting">hourglass_empty</mat-icon>
            <mat-icon *ngIf="!isSubmitting">{{ data.isEdit ? 'save' : 'add' }}</mat-icon>
            {{ isSubmitting ? 'Saving...' : (data.isEdit ? 'Save Changes' : 'Add Account') }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .account-form-dialog {
      min-width: 500px;
      max-width: 600px;
      padding: var(--spacing-lg);
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin: 0;
      font-family: var(--font-secondary);
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-neutral-900);
    }

    .close-btn {
      color: var(--color-neutral-500);
    }

    .close-btn:hover {
      color: var(--color-neutral-700);
    }

    .dialog-content {
      padding: var(--spacing-md) !important;
      margin-bottom: var(--spacing-lg);
      margin-top: var(--spacing-md);
    }

    .account-form {
      display: flex;
      flex-direction: column;
    }

    .form-field {
      width: calc(100% - var(--spacing-md));
      margin-bottom: var(--spacing-md);
      margin-left: auto;
      margin-right: auto;
    }

    .account-option-text {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: 14px;
    }

    .balance-suggestions {
      margin-top: var(--spacing-sm);
      padding: var(--spacing-md);
      background: rgba(90, 155, 212, 0.05);
      border-radius: var(--border-radius-md);
      border: 1px solid rgba(90, 155, 212, 0.1);
    }

    .suggestions-label {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-neutral-600);
    }

    .suggestions-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-xs);
    }

    .suggestion-btn {
      font-size: 0.8rem;
      padding: 4px 12px;
      min-width: auto;
      height: 32px;
      border-radius: 16px;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-sm);
      padding: 0 !important;
      margin: 0;
    }

    .cancel-btn {
      color: var(--color-neutral-600);
    }

    .submit-btn {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }

    .submit-btn mat-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
    }

    @media (max-width: 600px) {
      .account-form-dialog {
        min-width: 300px;
        max-width: 90vw;
      }

      .suggestions-buttons {
        justify-content: center;
      }

      .dialog-actions {
        flex-direction: column;
      }

      .dialog-actions button {
        width: 100%;
      }
    }
  `]
})
export class AccountFormDialogComponent {
  accountForm: FormGroup;
  isSubmitting = false;
  suggestedAmounts = [100, 500, 1000, 2500, 5000, 10000];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AccountFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AccountFormData
  ) {
    this.accountForm = this.createForm();
    this.populateFormIfEdit();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      accountType: ['', [Validators.required]],
      accountName: ['', [Validators.required, Validators.minLength(2)]],
      currentBalance: [0, [Validators.required, Validators.min(0)]]
    });
  }

  private populateFormIfEdit(): void {
    if (this.data.isEdit && this.data.account) {
      this.accountForm.patchValue({
        accountType: this.data.account.accountType,
        accountName: this.data.account.accountName,
        currentBalance: this.data.account.currentBalance
      });
    }
  }

  setBalance(amount: number): void {
    this.accountForm.patchValue({ currentBalance: amount });
  }

  onSubmit(): void {
    if (this.accountForm.valid) {
      this.isSubmitting = true;
      
      const formValue = this.accountForm.value;
      
      if (this.data.isEdit) {
        const updateRequest: UpdateAccountRequest = {
          accountName: formValue.accountName,
          currentBalance: formValue.currentBalance
        };
        this.dialogRef.close({ type: 'update', data: updateRequest });
      } else {
        const createRequest: CreateAccountRequest = {
          accountType: formValue.accountType,
          accountName: formValue.accountName,
          currentBalance: formValue.currentBalance
        };
        this.dialogRef.close({ type: 'create', data: createRequest });
      }
    }
  }
}