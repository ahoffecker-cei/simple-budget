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

interface ExpenseCategory {
  key: string;
  label: string;
  icon: string;
  placeholder: string;
  hint: string;
}

@Component({
  selector: 'app-major-expenses-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './major-expenses-step.component.html',
  styleUrls: ['./major-expenses-step.component.scss']
})
export class MajorExpensesStepComponent implements OnInit, OnDestroy {
  @Output() stepValidChange = new EventEmitter<{data: any, isValid: boolean}>();
  
  expensesForm: FormGroup;
  monthlyIncome = 0;
  private destroy$ = new Subject<void>();

  expenseCategories: ExpenseCategory[] = [
    {
      key: 'rent',
      label: 'Rent/Mortgage',
      icon: 'home',
      placeholder: 'Monthly rent or mortgage',
      hint: 'Your biggest housing expense'
    },
    {
      key: 'utilities',
      label: 'Utilities',
      icon: 'flash_on',
      placeholder: 'Electric, gas, water, internet',
      hint: 'Average monthly utility bills'
    },
    {
      key: 'transportation',
      label: 'Transportation',
      icon: 'directions_car',
      placeholder: 'Car payment, gas, public transit',
      hint: 'Monthly transportation costs'
    },
    {
      key: 'groceries',
      label: 'Groceries',
      icon: 'shopping_cart',
      placeholder: 'Monthly grocery budget',
      hint: 'Food and household essentials'
    },
    {
      key: 'insurance',
      label: 'Insurance',
      icon: 'security',
      placeholder: 'Health, auto, renters insurance',
      hint: 'Monthly insurance premiums'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private budgetWizardService: BudgetWizardService
  ) {
    this.expensesForm = this.createForm();
  }

  ngOnInit(): void {
    // Get income from previous step
    const incomeData = this.budgetWizardService.getStepData(0);
    this.monthlyIncome = incomeData.monthlyIncome || 0;

    // Load existing data if any
    const existingData = this.budgetWizardService.getStepData(2);
    if (existingData.majorExpenses) {
      this.expensesForm.patchValue(existingData.majorExpenses);
    }

    // Watch form changes
    this.expensesForm.valueChanges
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

  private createForm(): FormGroup {
    const formGroup: any = {};
    
    this.expenseCategories.forEach(category => {
      formGroup[category.key] = [0, [Validators.min(0)]];
    });
    
    return this.fb.group(formGroup);
  }

  private emitStepChange(): void {
    const formData = this.expensesForm.value;
    const totalExpenses = this.getTotalExpenses();
    const isValid = this.expensesForm.valid && totalExpenses < this.monthlyIncome;
    
    this.stepValidChange.emit({
      data: {
        majorExpenses: formData
      },
      isValid: isValid
    });
  }

  getTotalExpenses(): number {
    return Object.values(this.expensesForm.value)
      .reduce((sum: number, value: any) => sum + (value || 0), 0);
  }

  getRemainingIncome(): number {
    return this.monthlyIncome - this.getTotalExpenses();
  }

  getExpensePercentage(): number {
    if (this.monthlyIncome === 0) return 0;
    return (this.getTotalExpenses() / this.monthlyIncome) * 100;
  }

  isOverBudget(): boolean {
    return this.getTotalExpenses() > this.monthlyIncome;
  }

  getHealthStatus(): string {
    const percentage = this.getExpensePercentage();
    if (percentage <= 50) return 'excellent';
    if (percentage <= 70) return 'good';
    if (percentage <= 90) return 'fair';
    return 'over';
  }

  getHealthColor(): string {
    const status = this.getHealthStatus();
    switch (status) {
      case 'excellent': return '#4caf50';
      case 'good': return '#8bc34a';
      case 'fair': return '#ff9800';
      case 'over': return '#f44336';
      default: return '#666';
    }
  }

  getHealthMessage(): string {
    const status = this.getHealthStatus();
    switch (status) {
      case 'excellent': return 'Excellent! You have plenty of room for savings.';
      case 'good': return 'Good work! You\'re managing expenses well.';
      case 'fair': return 'Fair - consider reviewing some expenses.';
      case 'over': return 'Your expenses exceed your income. Let\'s adjust.';
      default: return '';
    }
  }
}