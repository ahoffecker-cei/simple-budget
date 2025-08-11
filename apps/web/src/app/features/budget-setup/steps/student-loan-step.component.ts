import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BudgetWizardService } from '../services/budget-wizard.service';

@Component({
  selector: 'app-student-loan-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule
  ],
  templateUrl: './student-loan-step.component.html',
  styleUrls: ['./student-loan-step.component.scss']
})
export class StudentLoanStepComponent implements OnInit, OnDestroy {
  @Output() stepValidChange = new EventEmitter<{data: any, isValid: boolean}>();
  
  studentLoanForm: FormGroup;
  hasStudentLoans = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private budgetWizardService: BudgetWizardService
  ) {
    this.studentLoanForm = this.fb.group({
      studentLoanPayment: [0, [Validators.min(0)]],
      studentLoanBalance: [0, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    // Load existing data if any
    const existingData = this.budgetWizardService.getStepData(1);
    if (existingData.studentLoanPayment || existingData.studentLoanBalance) {
      this.hasStudentLoans = true;
      this.studentLoanForm.patchValue(existingData);
      this.updateValidators();
    }

    // Watch form changes
    this.studentLoanForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.emitStepChange();
      });

    // Initial emit (student loan step is always valid since it's optional)
    this.emitStepChange();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onHasStudentLoansChange(): void {
    if (!this.hasStudentLoans) {
      this.studentLoanForm.patchValue({
        studentLoanPayment: 0,
        studentLoanBalance: 0
      });
    }
    this.updateValidators();
    this.emitStepChange();
  }

  private updateValidators(): void {
    const paymentControl = this.studentLoanForm.get('studentLoanPayment');
    const balanceControl = this.studentLoanForm.get('studentLoanBalance');

    if (this.hasStudentLoans) {
      paymentControl?.setValidators([Validators.required, Validators.min(0)]);
      balanceControl?.setValidators([Validators.required, Validators.min(0)]);
    } else {
      paymentControl?.setValidators([Validators.min(0)]);
      balanceControl?.setValidators([Validators.min(0)]);
    }

    paymentControl?.updateValueAndValidity();
    balanceControl?.updateValueAndValidity();
  }

  private emitStepChange(): void {
    const formData = this.studentLoanForm.value;
    const isValid = this.studentLoanForm.valid;
    
    this.stepValidChange.emit({
      data: {
        studentLoanPayment: formData.studentLoanPayment || 0,
        studentLoanBalance: formData.studentLoanBalance || 0
      },
      isValid: isValid
    });
  }

  getPaymentErrorMessage(): string {
    const control = this.studentLoanForm.get('studentLoanPayment');
    if (control?.hasError('required')) {
      return 'Monthly payment is required when you have student loans';
    }
    if (control?.hasError('min')) {
      return 'Payment cannot be negative';
    }
    return '';
  }

  getBalanceErrorMessage(): string {
    const control = this.studentLoanForm.get('studentLoanBalance');
    if (control?.hasError('required')) {
      return 'Total balance is required when you have student loans';
    }
    if (control?.hasError('min')) {
      return 'Balance cannot be negative';
    }
    return '';
  }
}