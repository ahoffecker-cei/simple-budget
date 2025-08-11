import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { BudgetWizardService } from '../services/budget-wizard.service';

@Component({
  selector: 'app-income-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './income-step.component.html',
  styleUrls: ['./income-step.component.scss']
})
export class IncomeStepComponent implements OnInit, OnDestroy {
  @Output() stepValidChange = new EventEmitter<{data: any, isValid: boolean}>();
  
  incomeForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private budgetWizardService: BudgetWizardService
  ) {
    this.incomeForm = this.fb.group({
      monthlyIncome: [null, [
        Validators.required,
        Validators.min(1000),
        Validators.max(200000)
      ]]
    });
  }

  ngOnInit(): void {
    // Load existing data if any
    const existingData = this.budgetWizardService.getStepData(0);
    if (existingData.monthlyIncome) {
      this.incomeForm.patchValue(existingData);
    }

    // Watch form changes
    this.incomeForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.emitStepChange();
      });

    // Initial emit
    this.emitStepChange();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private emitStepChange(): void {
    const formData = this.incomeForm.value;
    const isValid = this.incomeForm.valid;
    
    this.stepValidChange.emit({
      data: formData,
      isValid: isValid
    });
  }

  getIncomeErrorMessage(): string {
    const control = this.incomeForm.get('monthlyIncome');
    if (control?.hasError('required')) {
      return 'Monthly income is required';
    }
    if (control?.hasError('min')) {
      return 'Income must be at least $1,000';
    }
    if (control?.hasError('max')) {
      return 'Income must be less than $200,000';
    }
    return '';
  }

  formatCurrency(event: any): void {
    let value = event.target.value.replace(/[^0-9]/g, '');
    if (value) {
      const numValue = parseInt(value);
      this.incomeForm.patchValue({
        monthlyIncome: numValue
      });
    }
  }
}