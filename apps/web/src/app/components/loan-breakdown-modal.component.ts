import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { StudentLoanSummary, StudentLoan } from '@simple-budget/shared';

@Component({
  selector: 'app-loan-breakdown-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule
  ],
  template: `
    <div class="loan-breakdown-modal">
      <div class="modal-header">
        <h2 mat-dialog-title>Student Loan Breakdown</h2>
        <button mat-icon-button (click)="close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="modal-content">
        <!-- Summary Section -->
        <div class="summary-section">
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">Total Balance</span>
              <span class="summary-value total">{{data.totalBalance | currency}}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Monthly Payment</span>
              <span class="summary-value payment">{{data.totalMonthlyPayment | currency}}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Average Rate</span>
              <span class="summary-value rate">{{data.averageInterestRate | number:'1.2-2'}}%</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Total Loans</span>
              <span class="summary-value count">{{data.totalLoans}}</span>
            </div>
          </div>
        </div>

        <!-- Individual Loans Section -->
        <div class="loans-section">
          <h3>Loan Details</h3>
          <div class="loans-grid">
            <mat-card *ngFor="let loan of data.loans; let i = index" class="loan-card">
              <div class="loan-header">
                <div class="loan-servicer">
                  <h4>{{loan.servicerName}}</h4>
                  <span class="account-number" *ngIf="loan.accountNumber">{{loan.accountNumber}}</span>
                </div>
                <mat-chip-set>
                  <mat-chip [class]="'chip-' + loan.loanType">{{loan.loanType | titlecase}}</mat-chip>
                  <mat-chip [class]="'chip-' + loan.status">{{loan.status | titlecase}}</mat-chip>
                </mat-chip-set>
              </div>
              
              <div class="loan-details">
                <div class="detail-row">
                  <span class="detail-label">Balance</span>
                  <span class="detail-value balance">{{loan.balance | currency}}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Interest Rate</span>
                  <span class="detail-value rate">{{loan.interestRate | number:'1.2-2'}}%</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Monthly Payment</span>
                  <span class="detail-value payment">{{loan.monthlyPayment | currency}}</span>
                </div>
              </div>
            </mat-card>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="modal-actions">
        <button mat-button (click)="close()">Close</button>
        <button mat-raised-button color="primary">Manage Loans</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .loan-breakdown-modal {
      max-width: 800px;
      width: 100%;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md);
      border-bottom: 1px solid var(--color-neutral-300);
    }

    .modal-header h2 {
      margin: 0;
      font-family: var(--font-secondary);
      color: var(--color-neutral-900);
      font-size: 1.5rem;
      font-weight: 600;
    }

    .close-btn {
      color: var(--color-neutral-600);
    }

    .modal-content {
      padding: var(--spacing-md);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      max-height: 70vh;
      overflow-y: auto;
    }

    /* Summary Section */
    .summary-section {
      background: linear-gradient(135deg, rgba(249, 199, 79, 0.08) 0%, rgba(244, 162, 97, 0.08) 100%);
      border-radius: var(--border-radius-lg);
      padding: var(--spacing-md);
      border: 1px solid rgba(249, 199, 79, 0.2);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: var(--spacing-md);
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--spacing-xs);
    }

    .summary-label {
      font-size: 0.875rem;
      color: var(--color-neutral-600);
      font-weight: 500;
    }

    .summary-value {
      font-family: var(--font-mono);
      font-size: 1.25rem;
      font-weight: 600;
    }

    .summary-value.total {
      color: var(--color-warning);
    }

    .summary-value.payment {
      color: var(--color-accent);
    }

    .summary-value.rate {
      color: var(--color-secondary);
    }

    .summary-value.count {
      color: var(--color-primary);
    }

    /* Loans Section */
    .loans-section h3 {
      margin: 0 0 var(--spacing-sm) 0;
      font-family: var(--font-secondary);
      color: var(--color-neutral-900);
      font-size: 1.25rem;
      font-weight: 600;
    }

    .loans-grid {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .loan-card {
      border-radius: var(--border-radius-md) !important;
      border: 1px solid var(--color-neutral-300) !important;
      padding: var(--spacing-md) !important;
    }

    .loan-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-sm);
      gap: var(--spacing-sm);
    }

    .loan-servicer h4 {
      margin: 0 0 4px 0;
      font-family: var(--font-secondary);
      color: var(--color-neutral-900);
      font-size: 1.1rem;
      font-weight: 600;
    }

    .account-number {
      font-size: 0.8rem;
      color: var(--color-neutral-500);
      font-family: var(--font-mono);
    }

    .loan-details {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-xs) 0;
      border-bottom: 1px solid var(--color-neutral-300);
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-size: 0.9rem;
      color: var(--color-neutral-600);
      font-weight: 500;
    }

    .detail-value {
      font-family: var(--font-mono);
      font-weight: 600;
      font-size: 0.95rem;
    }

    .detail-value.balance {
      color: var(--color-warning);
    }

    .detail-value.rate {
      color: var(--color-secondary);
    }

    .detail-value.payment {
      color: var(--color-accent);
    }

    /* Chip Styles */
    mat-chip-set {
      display: flex;
      gap: var(--spacing-xs);
      flex-wrap: wrap;
    }

    .chip-federal {
      background-color: rgba(90, 155, 212, 0.1) !important;
      color: var(--color-secondary) !important;
    }

    .chip-private {
      background-color: rgba(244, 162, 97, 0.1) !important;
      color: var(--color-accent) !important;
    }

    .chip-active {
      background-color: rgba(82, 183, 136, 0.1) !important;
      color: var(--color-success) !important;
    }

    .chip-deferred,
    .chip-forbearance {
      background-color: rgba(249, 199, 79, 0.1) !important;
      color: var(--color-warning) !important;
    }

    .chip-paid_off {
      background-color: rgba(108, 117, 125, 0.1) !important;
      color: var(--color-neutral-600) !important;
    }

    /* Modal Actions */
    .modal-actions {
      padding: var(--spacing-md);
      border-top: 1px solid var(--color-neutral-300);
      justify-content: flex-end;
      gap: var(--spacing-sm);
    }

    /* Responsive */
    @media (max-width: 600px) {
      .loan-breakdown-modal {
        max-width: 100vw;
        height: 100vh;
        max-height: 100vh;
      }

      .modal-content {
        max-height: calc(100vh - 150px);
      }

      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .loan-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-xs);
      }
    }
  `]
})
export class LoanBreakdownModalComponent {
  constructor(
    public dialogRef: MatDialogRef<LoanBreakdownModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StudentLoanSummary
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}