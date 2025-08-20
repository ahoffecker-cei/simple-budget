import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { IncomeManagementService } from '../../../services/income-management.service';
import { IncomeSource, IncomeManagementResponse } from '@simple-budget/shared';

export interface IncomeManagementDialogData {
  incomeManagement?: IncomeManagementResponse;
}

export interface IncomeManagementDialogResult {
  type: 'save' | 'cancel';
}

@Component({
  selector: 'app-income-management-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="income-management-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>attach_money</mat-icon>
          Manage Income Sources
        </h2>
        <button mat-icon-button mat-dialog-close class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="incomeForm" (ngSubmit)="onSave()" class="income-form">
        <mat-dialog-content class="dialog-content">
          
          <!-- Current Total Display -->
          <div class="total-income-display">
            <div class="total-label">Total Monthly Income</div>
            <div class="total-amount">{{ getTotalMonthlyIncome() | currency }}</div>
          </div>

          <!-- Income Sources List -->
          <div class="income-sources-section">
            <div class="section-header">
              <h3>Income Sources</h3>
              <button type="button" mat-raised-button color="primary" 
                      (click)="addIncomeSource()" class="add-source-btn">
                <mat-icon>add</mat-icon>
                Add Source
              </button>
            </div>

            <div formArrayName="incomeSources" class="sources-list">
              <div *ngFor="let source of incomeSourcesArray.controls; let i = index" 
                   [formGroupName]="i" class="income-source-item">
                <mat-card class="source-card">
                  <div class="source-form">
                    <div class="form-row">
                      <mat-form-field class="name-field">
                        <mat-label>Source Name</mat-label>
                        <input matInput formControlName="name" placeholder="e.g., Primary Job, Freelance">
                        <mat-error *ngIf="source.get('name')?.hasError('required')">
                          Source name is required
                        </mat-error>
                        <mat-error *ngIf="source.get('name')?.hasError('maxlength')">
                          Source name must be 100 characters or less
                        </mat-error>
                      </mat-form-field>

                      <mat-form-field class="amount-field">
                        <mat-label>Amount</mat-label>
                        <input matInput type="number" formControlName="amount" 
                               placeholder="0.00" min="0.01" step="0.01">
                        <span matPrefix>$</span>
                        <mat-error *ngIf="source.get('amount')?.hasError('required')">
                          Amount is required
                        </mat-error>
                        <mat-error *ngIf="source.get('amount')?.hasError('min')">
                          Amount must be greater than 0
                        </mat-error>
                      </mat-form-field>

                      <mat-form-field class="frequency-field">
                        <mat-label>Frequency</mat-label>
                        <mat-select formControlName="frequency">
                          <mat-option value="weekly">Weekly</mat-option>
                          <mat-option value="bi-weekly">Bi-weekly</mat-option>
                          <mat-option value="monthly">Monthly</mat-option>
                        </mat-select>
                        <mat-error *ngIf="source.get('frequency')?.hasError('required')">
                          Frequency is required
                        </mat-error>
                      </mat-form-field>

                      <button type="button" mat-icon-button color="warn" 
                              (click)="removeIncomeSource(i)" class="remove-btn"
                              [disabled]="incomeSourcesArray.length === 1">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>

                    <div class="monthly-equivalent" *ngIf="getMonthlyEquivalent(source.value) > 0">
                      Monthly equivalent: {{ getMonthlyEquivalent(source.value) | currency }}
                    </div>
                  </div>
                </mat-card>
              </div>
            </div>

            <!-- Empty State -->
            <div *ngIf="incomeSourcesArray.length === 0" class="empty-state">
              <mat-icon>attach_money</mat-icon>
              <h3>No income sources added</h3>
              <p>Add your first income source to get started.</p>
              <button mat-raised-button color="primary" (click)="addIncomeSource()">
                <mat-icon>add</mat-icon>
                Add Income Source
              </button>
            </div>
          </div>
        </mat-dialog-content>

        <mat-dialog-actions class="dialog-actions">
          <button type="button" mat-button mat-dialog-close>Cancel</button>
          <button type="submit" mat-raised-button color="primary" 
                  [disabled]="!incomeForm.valid || isLoading">
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
    .income-management-dialog {
      width: 100%;
      max-width: 800px;
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
      color: var(--color-primary);
      font-weight: 600;
    }

    .close-btn {
      color: var(--color-neutral-500);
    }

    .dialog-content {
      padding: 24px !important;
      max-height: 60vh;
      overflow-y: auto;
    }

    .total-income-display {
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, rgba(82, 183, 136, 0.1) 0%, rgba(90, 155, 212, 0.1) 100%);
      border-radius: 12px;
      border-left: 4px solid var(--color-success);
      margin-bottom: 24px;
    }

    .total-label {
      font-size: 14px;
      color: var(--color-neutral-600);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .total-amount {
      font-family: var(--font-mono, monospace);
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-success);
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

    .sources-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .source-card {
      position: relative;
      transition: all 0.2s ease-out;
    }

    .source-card:hover {
      box-shadow: var(--shadow-md);
    }

    .source-form {
      padding: 16px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .name-field {
      flex: 2;
    }

    .amount-field,
    .frequency-field {
      flex: 1;
    }

    .remove-btn {
      margin-top: 8px;
      flex-shrink: 0;
    }

    .monthly-equivalent {
      margin-top: 12px;
      padding: 8px 12px;
      background: rgba(90, 155, 212, 0.08);
      border-radius: 6px;
      font-size: 14px;
      color: var(--color-secondary);
      font-weight: 500;
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

      .name-field,
      .amount-field,
      .frequency-field {
        flex: none;
        width: 100%;
      }

      .remove-btn {
        align-self: flex-end;
        margin-top: 0;
      }

      .total-amount {
        font-size: 1.5rem;
      }
    }

    // Angular Material field adjustments
    ::ng-deep .mat-mdc-form-field {
      .mdc-text-field--filled {
        background-color: rgba(0, 0, 0, 0.04);
      }
    }

    // Loading spinner adjustments
    ::ng-deep .mat-progress-spinner {
      margin-right: 8px;
    }
  `]
})
export class IncomeManagementModalComponent implements OnInit, OnDestroy {
  incomeForm: FormGroup;
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<IncomeManagementModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IncomeManagementDialogData,
    private incomeManagementService: IncomeManagementService
  ) {
    this.incomeForm = this.fb.group({
      incomeSources: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get incomeSourcesArray(): FormArray {
    return this.incomeForm.get('incomeSources') as FormArray;
  }

  private initializeForm(): void {
    const sources = this.data.incomeManagement?.incomeSources || [];
    
    if (sources.length === 0) {
      // Add one empty income source by default
      this.addIncomeSource();
    } else {
      // Load existing income sources
      sources.forEach(source => {
        this.addIncomeSource(source);
      });
    }
  }

  addIncomeSource(existingSource?: IncomeSource): void {
    const sourceGroup = this.fb.group({
      incomeSourceId: [existingSource?.incomeSourceId || ''],
      name: [existingSource?.name || '', [Validators.required, Validators.maxLength(100)]],
      amount: [existingSource?.amount || '', [Validators.required, Validators.min(0.01)]],
      frequency: [existingSource?.frequency || 'monthly', [Validators.required]]
    });

    this.incomeSourcesArray.push(sourceGroup);
  }

  removeIncomeSource(index: number): void {
    if (this.incomeSourcesArray.length > 1) {
      const sourceControl = this.incomeSourcesArray.at(index);
      const incomeSourceId = sourceControl.get('incomeSourceId')?.value;
      
      // If this is an existing income source (has an ID), delete it from the server
      if (incomeSourceId) {
        console.log('IncomeManagementModal: Deleting income source with ID:', incomeSourceId);
        this.incomeManagementService.deleteIncomeSource(incomeSourceId).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            console.log('IncomeManagementModal: Successfully deleted income source');
            this.incomeSourcesArray.removeAt(index);
          },
          error: (error) => {
            console.error('IncomeManagementModal: Failed to delete income source:', error);
            // Still remove from form even if API fails, user can try again
            this.incomeSourcesArray.removeAt(index);
          }
        });
      } else {
        // This is a new income source that hasn't been saved yet, just remove from form
        console.log('IncomeManagementModal: Removing unsaved income source from form');
        this.incomeSourcesArray.removeAt(index);
      }
    }
  }

  getMonthlyEquivalent(sourceValue: any): number {
    if (!sourceValue.amount || !sourceValue.frequency) {
      return 0;
    }

    const amount = parseFloat(sourceValue.amount);
    switch (sourceValue.frequency) {
      case 'weekly':
        return amount * 4.33; // 52/12
      case 'bi-weekly':
        return amount * 2.17; // 26/12
      case 'monthly':
        return amount;
      default:
        return 0;
    }
  }

  getTotalMonthlyIncome(): number {
    return this.incomeSourcesArray.controls.reduce((total, control) => {
      return total + this.getMonthlyEquivalent(control.value);
    }, 0);
  }

  onSave(): void {
    if (this.incomeForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      const sources = this.incomeSourcesArray.value;
      const requests: any[] = [];

      console.log('IncomeManagementModal: Saving income sources:', sources);

      // Process each income source
      sources.forEach((source: any) => {
        const parsedAmount = parseFloat(source.amount);
        const request = {
          name: source.name,
          amount: isNaN(parsedAmount) ? 0 : parsedAmount,
          frequency: source.frequency
        };

        console.log('IncomeManagementModal: Processing source:', source);
        console.log('IncomeManagementModal: Request payload:', request);
        console.log('IncomeManagementModal: Amount type:', typeof request.amount, 'Value:', request.amount);
        console.log('IncomeManagementModal: Name:', request.name, 'Frequency:', request.frequency);

        if (source.incomeSourceId) {
          console.log('IncomeManagementModal: Updating existing source with ID:', source.incomeSourceId);
          // Update existing source
          requests.push(this.incomeManagementService.updateIncomeSource(source.incomeSourceId, request));
        } else {
          console.log('IncomeManagementModal: Creating new source');
          // Create new source
          requests.push(this.incomeManagementService.createIncomeSource(request));
        }
      });

      // Execute all requests in parallel
      if (requests.length > 0) {
        forkJoin(requests).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (results) => {
            console.log('IncomeManagementModal: Save successful, results:', results);
            this.isLoading = false;
            this.dialogRef.close({ type: 'save' } as IncomeManagementDialogResult);
          },
          error: (error) => {
            console.error('Failed to save income sources:', error);
            console.error('Error details:', error.error);
            console.error('Error status:', error.status);
            console.error('Error message:', error.message);
            this.isLoading = false;
            // TODO: Show error message to user
          }
        });
      } else {
        this.isLoading = false;
        this.dialogRef.close({ type: 'save' } as IncomeManagementDialogResult);
      }
    }
  }
}