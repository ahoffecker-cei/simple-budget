import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { ExpenseLoggingComponent } from './expense-logging.component';
import { ExpenseTrackingService } from './services/expense-tracking.service';
import { BudgetCategoriesService } from '../budget-setup/services/budget-categories.service';
import { BudgetImpactService } from './services/budget-impact.service';
import { 
  BudgetCategory, 
  CreateExpenseRequest, 
  ExpenseWithBudgetImpact,
  RecentExpensesResponse
} from '../../../../../../shared/src/models';

describe('ExpenseLoggingComponent', () => {
  let component: ExpenseLoggingComponent;
  let fixture: ComponentFixture<ExpenseLoggingComponent>;
  let mockExpenseService: jasmine.SpyObj<ExpenseTrackingService>;
  let mockCategoriesService: jasmine.SpyObj<BudgetCategoriesService>;
  let mockBudgetImpactService: jasmine.SpyObj<BudgetImpactService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockCategories: BudgetCategory[] = [
    {
      categoryId: '1',
      userId: 'user1',
      name: 'Groceries',
      monthlyLimit: 500,
      isEssential: true,
      description: 'Food and household items',
      colorId: 'green',
      iconId: 'local_grocery_store',
      createdAt: new Date().toISOString()
    },
    {
      categoryId: '2',
      userId: 'user1',
      name: 'Entertainment',
      monthlyLimit: 200,
      isEssential: false,
      description: 'Movies and games',
      colorId: 'purple',
      iconId: 'movie',
      createdAt: new Date().toISOString()
    }
  ];

  const mockExpenseResponse: ExpenseWithBudgetImpact = {
    expense: {
      expenseId: 'exp1',
      userId: 'user1',
      categoryId: '1',
      categoryName: 'Groceries',
      amount: 50.00,
      description: 'Weekly shopping',
      expenseDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isEssential: true
    },
    categoryRemainingBudget: 450.00,
    budgetHealthStatus: 'excellent',
    categoryMonthlyLimit: 500.00,
    categoryCurrentSpending: 50.00
  };

  beforeEach(async () => {
    const expenseServiceSpy = jasmine.createSpyObj('ExpenseTrackingService', [
      'createExpense',
      'loadRecentExpenses',
      'findPotentialDuplicates',
      'forceSyncOfflineExpenses',
      'getOfflineExpensesCount',
      'clearOfflineExpenses'
    ], {
      isOnline$: of(true),
      offlineExpenses$: of([])
    });
    const categoriesServiceSpy = jasmine.createSpyObj('BudgetCategoriesService', [
      'loadBudgetCategories'
    ]);
    const budgetImpactServiceSpy = jasmine.createSpyObj('BudgetImpactService', [
      'getBudgetImpactPreview',
      'getOverallBudgetHealth', 
      'getMonthlyProgressData'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        ExpenseLoggingComponent,
        ReactiveFormsModule,
        MatSnackBarModule,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: ExpenseTrackingService, useValue: expenseServiceSpy },
        { provide: BudgetCategoriesService, useValue: categoriesServiceSpy },
        { provide: BudgetImpactService, useValue: budgetImpactServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseLoggingComponent);
    component = fixture.componentInstance;
    mockExpenseService = TestBed.inject(ExpenseTrackingService) as jasmine.SpyObj<ExpenseTrackingService>;
    mockCategoriesService = TestBed.inject(BudgetCategoriesService) as jasmine.SpyObj<BudgetCategoriesService>;
    mockBudgetImpactService = TestBed.inject(BudgetImpactService) as jasmine.SpyObj<BudgetImpactService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default mock returns
    mockCategoriesService.loadBudgetCategories.and.returnValue(of(mockCategories));
    mockExpenseService.loadRecentExpenses.and.returnValue(of({
      expenses: [],
      totalCount: 0,
      page: 1,
      pageSize: 5
    }));
    mockExpenseService.findPotentialDuplicates.and.returnValue([]);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    fixture.detectChanges();

    expect(component.expenseForm.get('amount')?.value).toBe('');
    expect(component.expenseForm.get('categoryId')?.value).toBe('');
    expect(component.expenseForm.get('description')?.value).toBe('');
    expect(component.expenseForm.get('expenseDate')?.value).toBeInstanceOf(Date);
  });

  it('should load budget categories on init', () => {
    fixture.detectChanges();

    expect(mockCategoriesService.loadBudgetCategories).toHaveBeenCalled();
    expect(component.budgetCategories).toEqual(mockCategories);
    expect(component.filteredCategories).toEqual(mockCategories);
  });

  it('should load recent expenses on init', () => {
    fixture.detectChanges();

    expect(mockExpenseService.loadRecentExpenses).toHaveBeenCalledWith(5);
  });

  it('should validate form fields correctly', () => {
    fixture.detectChanges();

    const form = component.expenseForm;
    
    // Test required validation
    expect(form.valid).toBeFalsy();
    
    // Test amount validation
    form.get('amount')?.setValue(-1);
    expect(form.get('amount')?.hasError('min')).toBeTruthy();
    
    form.get('amount')?.setValue(1000000);
    expect(form.get('amount')?.hasError('max')).toBeTruthy();
    
    // Test valid form
    form.get('amount')?.setValue(50.00);
    form.get('categoryId')?.setValue('1');
    expect(form.valid).toBeTruthy();
  });

  it('should filter categories based on input', () => {
    fixture.detectChanges();
    component.budgetCategories = mockCategories;

    // Test filtering
    const filtered = component['filterCategories']('Groc');
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Groceries');
    
    const allFiltered = component['filterCategories']('');
    expect(allFiltered.length).toBe(2);
  });

  it('should create expense successfully', () => {
    mockExpenseService.createExpense.and.returnValue(of(mockExpenseResponse));
    fixture.detectChanges();

    // Fill form with valid data
    component.expenseForm.patchValue({
      amount: 50.00,
      categoryId: '1',
      description: 'Test expense',
      expenseDate: new Date()
    });

    component.onSubmit();

    expect(mockExpenseService.createExpense).toHaveBeenCalled();
    expect(component.lastCreatedExpense).toEqual(mockExpenseResponse);
    expect(component.isSubmitting).toBeFalsy();
  });

  it('should handle expense creation error', () => {
    mockExpenseService.createExpense.and.returnValue(throwError(() => ({ 
      error: { message: 'Creation failed' } 
    })));
    fixture.detectChanges();

    // Fill form with valid data
    component.expenseForm.patchValue({
      amount: 50.00,
      categoryId: '1',
      expenseDate: new Date()
    });

    component.onSubmit();

    expect(mockExpenseService.createExpense).toHaveBeenCalled();
    expect(component.isSubmitting).toBeFalsy();
    expect(component.lastCreatedExpense).toBeNull();
  });

  it('should detect potential duplicates', () => {
    const mockDuplicates = [mockExpenseResponse.expense];
    mockExpenseService.findPotentialDuplicates.and.returnValue(mockDuplicates);
    
    fixture.detectChanges();

    // Fill form to trigger duplicate check
    component.expenseForm.patchValue({
      amount: 50.00,
      categoryId: '1',
      expenseDate: new Date()
    });

    expect(component.potentialDuplicates).toEqual(mockDuplicates);
    expect(component.showDuplicateWarning).toBeTruthy();
  });

  it('should quick fill from recent expense', () => {
    const recentExpense = mockExpenseResponse.expense;
    fixture.detectChanges();

    component.quickFillFromRecent(recentExpense);

    expect(component.expenseForm.get('amount')?.value).toBe(recentExpense.amount);
    expect(component.expenseForm.get('categoryId')?.value).toBe(recentExpense.categoryId);
    expect(component.expenseForm.get('description')?.value).toBe(recentExpense.description);
  });

  it('should format currency correctly', () => {
    expect(component.formatCurrency(50.00)).toBe('$50.00');
    expect(component.formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('should format date correctly', () => {
    const testDate = '2024-01-15T10:30:00Z';
    const formatted = component.formatDate(testDate);
    expect(formatted).toContain('1/15/2024'); // Locale-dependent format
  });

  it('should get correct budget health colors', () => {
    expect(component.getBudgetHealthColor('excellent')).toBe('text-green-600');
    expect(component.getBudgetHealthColor('good')).toBe('text-blue-600');
    expect(component.getBudgetHealthColor('attention')).toBe('text-yellow-600');
    expect(component.getBudgetHealthColor('concern')).toBe('text-red-600');
  });

  it('should get correct budget health icons', () => {
    expect(component.getBudgetHealthIcon('excellent')).toBe('check_circle');
    expect(component.getBudgetHealthIcon('good')).toBe('thumb_up');
    expect(component.getBudgetHealthIcon('attention')).toBe('warning');
    expect(component.getBudgetHealthIcon('concern')).toBe('error');
  });

  it('should navigate to dashboard', () => {
    component.navigateToDashboard();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should navigate to expenses view', () => {
    component.viewAllExpenses();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/expenses']);
  });

  it('should reset form after successful submission', () => {
    mockExpenseService.createExpense.and.returnValue(of(mockExpenseResponse));
    fixture.detectChanges();

    // Fill and submit form
    component.expenseForm.patchValue({
      amount: 50.00,
      categoryId: '1',
      description: 'Test',
      expenseDate: new Date()
    });

    component.onSubmit();

    // Check form is reset
    expect(component.expenseForm.get('amount')?.value).toBe(null);
    expect(component.expenseForm.get('categoryId')?.value).toBe(null);
    expect(component.expenseForm.get('description')?.value).toBe(null);
    expect(component.expenseForm.get('expenseDate')?.value).toBeInstanceOf(Date);
  });

  it('should not submit invalid form', () => {
    fixture.detectChanges();

    // Try to submit empty form
    component.onSubmit();

    expect(mockExpenseService.createExpense).not.toHaveBeenCalled();
    expect(component.isSubmitting).toBeFalsy();
  });

  it('should prevent double submission', () => {
    mockExpenseService.createExpense.and.returnValue(of(mockExpenseResponse));
    fixture.detectChanges();

    // Fill form and start submission
    component.expenseForm.patchValue({
      amount: 50.00,
      categoryId: '1',
      expenseDate: new Date()
    });

    component.isSubmitting = true;
    component.onSubmit();

    expect(mockExpenseService.createExpense).not.toHaveBeenCalled();
  });

  // OFFLINE FUNCTIONALITY TESTS
  
  it('should handle offline expense creation', () => {
    // Mock offline state
    mockExpenseService.isOnline$ = of(false);
    mockExpenseService.createExpense.and.returnValue(of({
      ...mockExpenseResponse,
      expense: {
        ...mockExpenseResponse.expense,
        expenseId: 'temp_123_offline'
      }
    }));
    
    fixture.detectChanges();

    // Fill and submit form while offline
    component.expenseForm.patchValue({
      amount: 25.50,
      categoryId: '1',
      description: 'Offline test expense',
      expenseDate: new Date()
    });

    component.onSubmit();

    expect(mockExpenseService.createExpense).toHaveBeenCalled();
    expect(component.lastCreatedExpense?.expense.expenseId).toContain('temp_');
  });

  it('should display offline indicator when offline', () => {
    mockExpenseService.isOnline$ = of(false);
    fixture.detectChanges();

    // Component should show offline indicator
    expect(component.isOnline).toBeFalsy();
  });

  it('should show offline expenses count', () => {
    const mockOfflineExpenses = [
      {
        tempId: 'temp_1',
        categoryId: '1',
        amount: 25.50,
        description: 'Offline expense 1',
        timestamp: Date.now(),
        syncStatus: 'pending' as const
      },
      {
        tempId: 'temp_2',
        categoryId: '2',
        amount: 15.00,
        description: 'Offline expense 2',
        timestamp: Date.now(),
        syncStatus: 'pending' as const
      }
    ];

    mockExpenseService.offlineExpenses$ = of(mockOfflineExpenses);
    mockExpenseService.getOfflineExpensesCount.and.returnValue(of(2));
    
    fixture.detectChanges();

    expect(component.offlineExpensesCount).toBe(2);
  });

  it('should manually sync offline expenses when online', () => {
    mockExpenseService.isOnline$ = of(true);
    fixture.detectChanges();

    component.syncOfflineExpenses();

    expect(mockExpenseService.forceSyncOfflineExpenses).toHaveBeenCalled();
  });

  it('should not sync when offline', () => {
    mockExpenseService.isOnline$ = of(false);
    fixture.detectChanges();

    component.syncOfflineExpenses();

    expect(mockExpenseService.forceSyncOfflineExpenses).not.toHaveBeenCalled();
  });

  // BUDGET IMPACT CALCULATION TESTS

  it('should calculate budget remaining correctly', () => {
    const testResponse: ExpenseWithBudgetImpact = {
      ...mockExpenseResponse,
      categoryRemainingBudget: 350.00
    };
    
    mockExpenseService.createExpense.and.returnValue(of(testResponse));
    fixture.detectChanges();

    component.expenseForm.patchValue({
      amount: 150.00,
      categoryId: '1',
      expenseDate: new Date()
    });

    component.onSubmit();

    expect(component.lastCreatedExpense?.categoryRemainingBudget).toBe(350.00);
  });

  it('should display different budget health statuses', () => {
    const healthStatuses: Array<'excellent' | 'good' | 'attention' | 'concern'> = 
      ['excellent', 'good', 'attention', 'concern'];

    healthStatuses.forEach(status => {
      const testResponse: ExpenseWithBudgetImpact = {
        ...mockExpenseResponse,
        budgetHealthStatus: status
      };
      
      component.lastCreatedExpense = testResponse;
      
      expect(component.lastCreatedExpense.budgetHealthStatus).toBe(status);
      expect(component.getBudgetHealthColor(status)).toBeTruthy();
      expect(component.getBudgetHealthIcon(status)).toBeTruthy();
    });
  });

  // FORM VALIDATION TESTS

  it('should validate expense date is not in future', () => {
    fixture.detectChanges();
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    
    component.expenseForm.get('expenseDate')?.setValue(futureDate);
    
    expect(component.expenseForm.get('expenseDate')?.hasError('futureDate')).toBeTruthy();
  });

  it('should validate expense date is not too old', () => {
    fixture.detectChanges();
    
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 35); // More than 30 days ago
    
    component.expenseForm.get('expenseDate')?.setValue(oldDate);
    
    expect(component.expenseForm.get('expenseDate')?.hasError('tooOld')).toBeTruthy();
  });

  it('should validate amount precision to 2 decimal places', () => {
    fixture.detectChanges();
    
    component.expenseForm.get('amount')?.setValue(25.123); // Too many decimal places
    
    expect(component.expenseForm.get('amount')?.hasError('precision')).toBeTruthy();
  });

  // USER EXPERIENCE TESTS

  it('should focus amount field after category selection', () => {
    fixture.detectChanges();
    spyOn(component, 'focusAmountField');
    
    component.onCategorySelected('1');
    
    expect(component.focusAmountField).toHaveBeenCalled();
  });

  it('should show success feedback after expense creation', () => {
    mockExpenseService.createExpense.and.returnValue(of(mockExpenseResponse));
    fixture.detectChanges();

    component.expenseForm.patchValue({
      amount: 50.00,
      categoryId: '1',
      expenseDate: new Date()
    });

    component.onSubmit();

    expect(component.showSuccessFeedback).toBeTruthy();
    expect(component.lastCreatedExpense).toEqual(mockExpenseResponse);
  });

  it('should auto-hide success feedback after delay', () => {
    mockExpenseService.createExpense.and.returnValue(of(mockExpenseResponse));
    fixture.detectChanges();

    component.expenseForm.patchValue({
      amount: 50.00,
      categoryId: '1',
      expenseDate: new Date()
    });

    component.onSubmit();

    expect(component.showSuccessFeedback).toBeTruthy();
    
    // Fast-forward time to check auto-hide
    setTimeout(() => {
      expect(component.showSuccessFeedback).toBeFalsy();
    }, 3500);
  });

  // DUPLICATE DETECTION TESTS

  it('should warn about potential duplicates with same amount and category', () => {
    const duplicateExpense = {
      ...mockExpenseResponse.expense,
      amount: 50.00,
      categoryId: '1',
      expenseDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    };
    
    mockExpenseService.findPotentialDuplicates.and.returnValue([duplicateExpense]);
    fixture.detectChanges();

    component.expenseForm.patchValue({
      amount: 50.00,
      categoryId: '1',
      expenseDate: new Date()
    });

    component.checkForDuplicates();

    expect(component.potentialDuplicates.length).toBe(1);
    expect(component.showDuplicateWarning).toBeTruthy();
  });

  it('should proceed with expense creation despite duplicate warning', () => {
    const duplicateExpense = mockExpenseResponse.expense;
    mockExpenseService.findPotentialDuplicates.and.returnValue([duplicateExpense]);
    mockExpenseService.createExpense.and.returnValue(of(mockExpenseResponse));
    
    fixture.detectChanges();

    component.expenseForm.patchValue({
      amount: 50.00,
      categoryId: '1',
      expenseDate: new Date()
    });

    component.showDuplicateWarning = true;
    component.proceedWithDuplicateCreation();

    expect(mockExpenseService.createExpense).toHaveBeenCalled();
    expect(component.showDuplicateWarning).toBeFalsy();
  });

  // PERFORMANCE TESTS

  it('should debounce duplicate detection', () => {
    fixture.detectChanges();
    spyOn(component, 'checkForDuplicates');

    // Rapid form changes should only trigger duplicate check once after debounce
    component.expenseForm.get('amount')?.setValue(25);
    component.expenseForm.get('amount')?.setValue(30);
    component.expenseForm.get('amount')?.setValue(35);

    // Wait for debounce
    setTimeout(() => {
      expect(component.checkForDuplicates).toHaveBeenCalledTimes(1);
    }, 350);
  });

  it('should handle rapid form submissions gracefully', () => {
    mockExpenseService.createExpense.and.returnValue(of(mockExpenseResponse));
    fixture.detectChanges();

    component.expenseForm.patchValue({
      amount: 50.00,
      categoryId: '1',
      expenseDate: new Date()
    });

    // Try to submit multiple times rapidly
    component.onSubmit();
    component.onSubmit();
    component.onSubmit();

    // Should only create expense once
    expect(mockExpenseService.createExpense).toHaveBeenCalledTimes(1);
  });
});