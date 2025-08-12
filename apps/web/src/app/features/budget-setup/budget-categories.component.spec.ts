import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { BudgetCategoriesComponent } from './budget-categories.component';
import { BudgetCategoriesService } from './services/budget-categories.service';
import { AuthService } from '../../services/auth.service';

describe('BudgetCategoriesComponent', () => {
  let component: BudgetCategoriesComponent;
  let fixture: ComponentFixture<BudgetCategoriesComponent>;
  let mockBudgetCategoriesService: jasmine.SpyObj<BudgetCategoriesService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const budgetCategoriesServiceSpy = jasmine.createSpyObj('BudgetCategoriesService', [
      'loadBudgetCategories',
      'getCategorySuggestions',
      'createBudgetCategory',
      'createCategoriesFromSuggestions'
    ], {
      budgetCategories$: of([]),
      totalBudget$: of(0)
    });

    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser$: of({ monthlyIncome: 5000, userId: '1', email: 'test@test.com', firstName: 'Test' })
    });

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        BudgetCategoriesComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: BudgetCategoriesService, useValue: budgetCategoriesServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetCategoriesComponent);
    component = fixture.componentInstance;
    mockBudgetCategoriesService = TestBed.inject(BudgetCategoriesService) as jasmine.SpyObj<BudgetCategoriesService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    mockBudgetCategoriesService.loadBudgetCategories.and.returnValue(of([]));
    mockBudgetCategoriesService.getCategorySuggestions.and.returnValue(of([]));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load budget categories on init', () => {
    fixture.detectChanges();
    
    expect(mockBudgetCategoriesService.loadBudgetCategories).toHaveBeenCalled();
  });

  it('should calculate budget percentage correctly', () => {
    component.userIncome = 1000;
    const result = component.calculateBudgetPercentage(100);
    expect(result).toBe('10%');
  });

  it('should format currency correctly', () => {
    const result = component.formatCurrency(1234.56);
    expect(result).toBe('$1,235');
  });

  it('should navigate to dashboard', () => {
    component.navigateBackToDashboard();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});