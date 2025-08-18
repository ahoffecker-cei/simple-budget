import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { BudgetCategoriesService } from '../services/budget-categories.service';
import { BudgetCalculationUtils } from '../services/budget-calculation.utils';
import { CategoryColorIconPickerComponent } from '../components/category-color-icon-picker.component';
// import { AuthService } from '../../../services/auth.service'; // Not needed in dialog
import { CreateBudgetCategoryRequest, BudgetValidationResult } from '../../../../../../../shared/src/models';

export interface AddCategoryDialogData {
  userIncome: number;
  existingCategories: string[];
}

@Component({
  selector: 'app-add-category-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    CategoryColorIconPickerComponent
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>
        <mat-icon>add_circle</mat-icon>
        Add Budget Category
      </h2>
      
      <mat-dialog-content>
        <form [formGroup]="categoryForm" class="category-form">
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Category Name</mat-label>
            <input matInput 
                   formControlName="name" 
                   placeholder="e.g., Groceries, Entertainment"
                   maxlength="100">
            <mat-hint>Choose a descriptive name for your category</mat-hint>
            <mat-error *ngIf="categoryForm.get('name')?.hasError('required')">
              Category name is required
            </mat-error>
            <mat-error *ngIf="categoryForm.get('name')?.hasError('duplicate')">
              A category with this name already exists
            </mat-error>
          </mat-form-field>

          <div class="form-row">
            <mat-form-field appearance="outline" class="amount-field">
              <mat-label>Monthly Budget</mat-label>
              <span matPrefix>$</span>
              <input matInput 
                     type="number" 
                     formControlName="monthlyLimit"
                     placeholder="0"
                     min="0.01"
                     step="0.01">
              <mat-error *ngIf="categoryForm.get('monthlyLimit')?.hasError('required')">
                Monthly budget is required
              </mat-error>
              <mat-error *ngIf="categoryForm.get('monthlyLimit')?.hasError('min')">
                Amount must be greater than $0
              </mat-error>
              <mat-error *ngIf="categoryForm.get('monthlyLimit')?.hasError('max')">
                Amount cannot exceed your total income
              </mat-error>
            </mat-form-field>
            
            <div class="percentage-display">
              <span class="percentage-label">of income</span>
              <span class="percentage-value">{{ getPercentageDisplay() }}</span>
            </div>
          </div>

          <div class="essential-toggle">
            <mat-slide-toggle formControlName="isEssential" color="primary">
              <span class="toggle-label">Essential Category</span>
            </mat-slide-toggle>
            <p class="toggle-hint">
              Essential categories are for must-have expenses like rent, groceries, and utilities.
              Non-essential categories are for flexible spending like entertainment and dining out.
            </p>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description (Optional)</mat-label>
            <textarea matInput 
                      formControlName="description"
                      placeholder="Add a helpful description or examples of what this category includes..."
                      rows="3"
                      maxlength="500"></textarea>
            <mat-hint>{{ categoryForm.get('description')?.value?.length || 0 }}/500</mat-hint>
          </mat-form-field>

          <!-- Color and Icon Picker -->
          <div class="customization-section">
            <h4>Appearance</h4>
            <app-category-color-icon-picker 
              formControlName="customization"
              [categoryName]="categoryForm.get('name')?.value">
            </app-category-color-icon-picker>
          </div>

          <!-- Budget Validation Feedback -->
          <div *ngIf="validationResult" class="validation-feedback" 
               [class]="validationResult.isValid ? 'valid' : 'invalid'">
            <mat-icon>{{ validationResult.isValid ? 'check_circle' : 'warning' }}</mat-icon>
            <div class="validation-text">
              <p *ngIf="validationResult.isValid" class="success-message">
                Great! This fits well within your budget.
              </p>
              <p *ngIf="!validationResult.isValid" class="error-message">
                {{ validationResult.errorMessage }}
              </p>
              <div class="budget-summary">
                <small>
                  Total budget would be {{ formatCurrency(validationResult.totalBudget) }} 
                  of {{ formatCurrency(validationResult.userIncome) }} 
                  ({{ formatPercentage((validationResult.totalBudget / validationResult.userIncome) * 100) }})
                </small>
              </div>
            </div>
          </div>

        </form>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button 
                color="primary" 
                (click)="onSave()" 
                [disabled]="!canSave()"
                class="save-button">
          <mat-spinner *ngIf="isSaving" diameter="20"></mat-spinner>
          <mat-icon *ngIf="!isSaving">add</mat-icon>
          {{ isSaving ? 'Creating...' : 'Create Category' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./category-dialog.scss']
})
export class AddCategoryDialogComponent implements OnInit, OnDestroy {
  categoryForm: FormGroup;
  validationResult: BudgetValidationResult | null = null;
  isSaving = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private budgetCategoriesService: BudgetCategoriesService,
    private dialogRef: MatDialogRef<AddCategoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddCategoryDialogData
  ) {
    this.categoryForm = this.createForm();
  }

  ngOnInit(): void {
    this.setupValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      monthlyLimit: [0, [Validators.required, Validators.min(0.01), Validators.max(this.data.userIncome)]],
      isEssential: [false],
      description: ['', [Validators.maxLength(500)]],
      customization: [{
        colorId: 'blue',
        iconId: 'home'
      }]
    });
  }

  private setupValidation(): void {
    // Real-time name validation
    this.categoryForm.get('name')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(name => {
        this.validateCategoryName(name);
      });

    // Real-time budget validation
    this.categoryForm.get('monthlyLimit')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(amount => {
        if (amount > 0) {
          this.validateBudgetAllocation(amount);
        }
      });
  }

  private validateCategoryName(name: string): void {
    if (!name || name.trim().length === 0) return;
    
    const isDuplicate = this.data.existingCategories.some(
      existing => existing.toLowerCase() === name.trim().toLowerCase()
    );
    
    const nameControl = this.categoryForm.get('name');
    if (isDuplicate) {
      nameControl?.setErrors({ ...nameControl.errors, duplicate: true });
    } else {
      const errors = nameControl?.errors;
      if (errors) {
        delete errors['duplicate'];
        nameControl?.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
    }
  }

  private validateBudgetAllocation(amount: number): void {
    this.budgetCategoriesService.validateBudgetAllocation(amount)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.validationResult = result;
        },
        error: (error) => {
          console.error('Validation error:', error);
          this.validationResult = null;
        }
      });
  }

  getPercentageDisplay(): string {
    const amount = this.categoryForm.get('monthlyLimit')?.value || 0;
    if (amount <= 0 || this.data.userIncome <= 0) return '0%';
    
    const percentage = (amount / this.data.userIncome) * 100;
    return BudgetCalculationUtils.formatPercentage(percentage);
  }

  formatCurrency(amount: number): string {
    return BudgetCalculationUtils.formatCurrency(amount);
  }

  formatPercentage(percentage: number): string {
    return BudgetCalculationUtils.formatPercentage(percentage);
  }

  canSave(): boolean {
    return this.categoryForm.valid && 
           (this.validationResult?.isValid ?? true) && 
           !this.isSaving;
  }

  onSave(): void {
    if (!this.canSave()) return;

    this.isSaving = true;
    const formValue = this.categoryForm.value;
    
    const request: CreateBudgetCategoryRequest = {
      name: formValue.name.trim(),
      monthlyLimit: formValue.monthlyLimit,
      isEssential: formValue.isEssential,
      description: formValue.description?.trim() || undefined,
      colorId: formValue.customization?.colorId,
      iconId: formValue.customization?.iconId
    };

    this.budgetCategoriesService.createBudgetCategory(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (category) => {
          this.isSaving = false;
          this.dialogRef.close(category);
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Error creating category:', error);
          // The parent component will handle the error display
          this.dialogRef.close({ error });
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}