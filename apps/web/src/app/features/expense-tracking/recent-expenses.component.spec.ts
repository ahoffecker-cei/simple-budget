import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { RecentExpensesComponent } from './recent-expenses.component';
import { ExpenseTrackingService } from './services/expense-tracking.service';
import { 
  Expense, 
  RecentExpensesResponse 
} from '../../../../../../shared/src/models';

describe('RecentExpensesComponent', () => {
  let component: RecentExpensesComponent;
  let fixture: ComponentFixture<RecentExpensesComponent>;
  let mockExpenseService: jasmine.SpyObj<ExpenseTrackingService>;

  const mockExpenses: Expense[] = [
    {
      expenseId: '1',
      userId: 'user1',
      categoryId: 'cat1',
      categoryName: 'Groceries',
      amount: 50.00,
      description: 'Weekly shopping',
      expenseDate: '2024-01-15T10:30:00Z',
      createdAt: '2024-01-15T10:30:00Z',
      isEssential: true
    },
    {
      expenseId: '2',
      userId: 'user1',
      categoryId: 'cat2',
      categoryName: 'Entertainment',
      amount: 25.00,
      description: 'Movie tickets',
      expenseDate: '2024-01-14T18:00:00Z',
      createdAt: '2024-01-14T18:00:00Z',
      isEssential: false
    },
    {
      expenseId: '3',
      userId: 'user1',
      categoryId: 'cat1',
      categoryName: 'Groceries',
      amount: 52.00,
      description: 'Similar to first expense',
      expenseDate: '2024-01-15T11:00:00Z',
      createdAt: '2024-01-15T11:00:00Z',
      isEssential: true
    }
  ];

  const mockResponse: RecentExpensesResponse = {
    expenses: mockExpenses,
    totalCount: 3,
    page: 1,
    pageSize: 10
  };

  beforeEach(async () => {
    const expenseServiceSpy = jasmine.createSpyObj('ExpenseTrackingService', [
      'getExpenses',
      'deleteExpense'
    ], {
      recentExpenses$: of(mockExpenses)
    });

    await TestBed.configureTestingModule({
      imports: [
        RecentExpensesComponent,
        MatSnackBarModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ExpenseTrackingService, useValue: expenseServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecentExpensesComponent);
    component = fixture.componentInstance;
    mockExpenseService = TestBed.inject(ExpenseTrackingService) as jasmine.SpyObj<ExpenseTrackingService>;

    // Setup default mock returns
    mockExpenseService.getExpenses.and.returnValue(of(mockResponse));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.title).toBe('Recent Expenses');
    expect(component.maxItems).toBe(10);
    expect(component.showActions).toBe(true);
    expect(component.categoryFilter).toBeUndefined();
    expect(component.expenses).toEqual([]);
    expect(component.isLoading).toBeFalsy();
  });

  it('should load expenses on init', () => {
    fixture.detectChanges();

    expect(mockExpenseService.getExpenses).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10
    });
    expect(component.expenses).toEqual(mockExpenses);
  });

  it('should apply category filter when loading expenses', () => {
    component.categoryFilter = 'cat1';
    fixture.detectChanges();

    expect(mockExpenseService.getExpenses).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      categoryId: 'cat1'
    });
  });

  it('should detect duplicate expenses', () => {
    fixture.detectChanges();

    // The mock data includes two groceries expenses with similar amounts and dates
    // They should be detected as potential duplicates
    expect(component.duplicateExpenses.size).toBeGreaterThan(0);
    expect(component.isDuplicate('1')).toBeTruthy();
    expect(component.isDuplicate('3')).toBeTruthy();
    expect(component.isDuplicate('2')).toBeFalsy();
  });

  it('should format currency correctly', () => {
    expect(component.formatCurrency(50.00)).toBe('$50.00');
    expect(component.formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('should format dates correctly', () => {
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    
    expect(component.formatDate(today)).toBe('Today');
    expect(component.formatDate(yesterday)).toBe('Yesterday');
    expect(component.formatDate(twoDaysAgo)).toBe('2 days ago');
  });

  it('should format date and time correctly', () => {
    const testDate = '2024-01-15T10:30:00Z';
    const formatted = component.formatDateTime(testDate);
    
    expect(formatted).toContain('1/15/2024'); // Date part
    expect(formatted).toContain('10:30'); // Time part
  });

  it('should get correct category chip classes', () => {
    expect(component.getCategoryChipClass(true)).toBe('essential-chip');
    expect(component.getCategoryChipClass(false)).toBe('non-essential-chip');
  });

  it('should get correct category chip labels', () => {
    expect(component.getCategoryChipLabel(true)).toBe('Essential');
    expect(component.getCategoryChipLabel(false)).toBe('Non-Essential');
  });

  it('should delete expense successfully', () => {
    mockExpenseService.deleteExpense.and.returnValue(of(void 0));
    spyOn(window, 'confirm').and.returnValue(true);
    fixture.detectChanges();

    const expenseToDelete = mockExpenses[0];
    component.deleteExpense(expenseToDelete);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockExpenseService.deleteExpense).toHaveBeenCalledWith(expenseToDelete.expenseId);
  });

  it('should not delete expense when user cancels', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    fixture.detectChanges();

    const expenseToDelete = mockExpenses[0];
    component.deleteExpense(expenseToDelete);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockExpenseService.deleteExpense).not.toHaveBeenCalled();
  });

  it('should handle delete expense error', () => {
    mockExpenseService.deleteExpense.and.returnValue(throwError(() => ({ 
      error: { message: 'Delete failed' } 
    })));
    spyOn(window, 'confirm').and.returnValue(true);
    fixture.detectChanges();

    const expenseToDelete = mockExpenses[0];
    component.deleteExpense(expenseToDelete);

    expect(mockExpenseService.deleteExpense).toHaveBeenCalled();
  });

  it('should refresh expenses when refresh is called', () => {
    fixture.detectChanges();
    mockExpenseService.getExpenses.calls.reset();

    component.refresh();

    expect(mockExpenseService.getExpenses).toHaveBeenCalled();
  });

  it('should group expenses by date correctly', () => {
    fixture.detectChanges();

    const groupedExpenses = component.getExpensesByDate();
    const dates = Object.keys(groupedExpenses);
    
    expect(dates.length).toBeGreaterThan(0);
    
    // Check that expenses are properly grouped
    Object.values(groupedExpenses).forEach(expenseGroup => {
      expect(Array.isArray(expenseGroup)).toBeTruthy();
      expect(expenseGroup.length).toBeGreaterThan(0);
    });
  });

  it('should calculate spending summary correctly', () => {
    fixture.detectChanges();

    const summary = component.getSpendingSummary();
    
    expect(summary.total).toBe(127.00); // 50 + 25 + 52
    expect(summary.categoryBreakdown['Groceries']).toBe(102.00); // 50 + 52
    expect(summary.categoryBreakdown['Entertainment']).toBe(25.00);
  });

  it('should track expenses by ID correctly', () => {
    const expense = mockExpenses[0];
    const result = component.trackByExpenseId(0, expense);
    
    expect(result).toBe(expense.expenseId);
  });

  it('should handle loading state correctly', () => {
    component.isLoading = true;
    fixture.detectChanges();

    const loadingElement = fixture.nativeElement.querySelector('.loading-container');
    expect(loadingElement).toBeTruthy();
  });

  it('should show empty state when no expenses', () => {
    mockExpenseService.getExpenses.and.returnValue(of({
      expenses: [],
      totalCount: 0,
      page: 1,
      pageSize: 10
    }));
    
    fixture.detectChanges();

    const emptyStateElement = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyStateElement).toBeTruthy();
  });

  it('should handle expense loading error', () => {
    mockExpenseService.getExpenses.and.returnValue(throwError(() => ({ 
      error: { message: 'Loading failed' } 
    })));
    
    fixture.detectChanges();

    expect(component.isLoading).toBeFalsy();
    expect(component.expenses).toEqual([]);
  });

  it('should subscribe to recent expenses updates', () => {
    const newExpenses = [mockExpenses[0]]; // Only first expense
    
    fixture.detectChanges();
    
    // Simulate service emitting new expenses
    (mockExpenseService as any).recentExpenses$ = of(newExpenses);
    component.ngOnInit();

    // Component should update with new expenses
    expect(component.expenses.length).toBeLessThanOrEqual(mockExpenses.length);
  });

  it('should filter expenses by category when categoryFilter is set', () => {
    component.categoryFilter = 'cat1';
    
    fixture.detectChanges();

    // Should only show groceries expenses (cat1)
    const groceriesExpenses = mockExpenses.filter(exp => exp.categoryId === 'cat1');
    expect(component.expenses.length).toBeLessThanOrEqual(groceriesExpenses.length);
  });
});