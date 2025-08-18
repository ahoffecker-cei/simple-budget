import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../services/auth.service';
import { DashboardService } from '../services/dashboard.service';
import { DashboardResponse, User, Account, AccountType } from '@simple-budget/shared';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockDashboardService: jasmine.SpyObj<DashboardService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockUser: User = {
    userId: '1',
    email: 'test@example.com',
    firstName: 'John',
    monthlyIncome: 5000,
    studentLoanPayment: 300,
    studentLoanBalance: 25000,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-15T00:00:00Z'
  };

  const mockDashboardData: DashboardResponse = {
    overallHealthStatus: 'good',
    totalNetWorth: 15000,
    accounts: [
      {
        accountId: '1',
        userId: '1',
        accountType: AccountType.Checking,
        accountName: 'Main Checking',
        currentBalance: 5000,
        lastUpdated: '2024-01-01T00:00:00Z'
      },
      {
        accountId: '2',
        userId: '1',
        accountType: AccountType.Savings,
        accountName: 'Emergency Fund',
        currentBalance: 10000,
        lastUpdated: '2024-01-01T00:00:00Z'
      }
    ],
    budgetCategories: [
      {
        categoryId: '1',
        name: 'Housing',
        monthlyLimit: 1500,
        currentSpending: 0,
        isEssential: true,
        description: 'Rent and utilities',
        colorId: 'blue',
        iconId: 'home',
        allocationPercentage: 0,
        remainingAmount: 1500,
        healthStatus: 'excellent'
      }
    ],
    budgetOverview: {
      totalBudgetAllocated: 1500,
      totalIncome: 5000,
      budgetHealthStatus: 'excellent',
      isSetupComplete: true,
      allocationPercentage: 30
    }
  };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'refreshCurrentUser', 'logout', 'logoutLocal'], {
      currentUser$: of(mockUser)
    });
    const dashboardSpy = jasmine.createSpyObj('DashboardService', ['getDashboard', 'createAccount', 'updateAccount', 'deleteAccount']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: DashboardService, useValue: dashboardSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockDashboardService = TestBed.inject(DashboardService) as jasmine.SpyObj<DashboardService>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    // Setup default service responses
    mockAuthService.getCurrentUser.and.returnValue(mockUser);
    mockAuthService.refreshCurrentUser.and.returnValue(of(mockUser));
    mockDashboardService.getDashboard.and.returnValue(of(mockDashboardData));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard data on init when user is present', () => {
    // Act
    component.ngOnInit();

    // Assert
    expect(mockDashboardService.getDashboard).toHaveBeenCalled();
    expect(component.dashboardData).toEqual(mockDashboardData);
    expect(component.accounts).toEqual(mockDashboardData.accounts);
  });

  it('should calculate health status correctly', () => {
    // Arrange
    component.dashboardData = mockDashboardData;

    // Act & Assert
    expect(component.getHealthStatusClass()).toBe('good');
    expect(component.getHealthStatusIcon()).toBe('thumb_up');
    expect(component.getHealthStatusTitle()).toBe("You're doing good!");
  });

  it('should calculate net worth class correctly', () => {
    // Arrange
    component.dashboardData = { ...mockDashboardData, totalNetWorth: 60000 };

    // Act & Assert
    expect(component.getNetWorthClass()).toBe('excellent');

    // Test other thresholds
    component.dashboardData = { ...mockDashboardData, totalNetWorth: 15000 };
    expect(component.getNetWorthClass()).toBe('good');

    component.dashboardData = { ...mockDashboardData, totalNetWorth: 2000 };
    expect(component.getNetWorthClass()).toBe('attention');

    component.dashboardData = { ...mockDashboardData, totalNetWorth: 500 };
    expect(component.getNetWorthClass()).toBe('concern');
  });

  it('should display account types correctly', () => {
    expect(component.getAccountTypeDisplay('checking')).toBe('Checking');
    expect(component.getAccountTypeDisplay('savings')).toBe('Savings');
    expect(component.getAccountTypeDisplay('retirement')).toBe('Retirement');
  });

  it('should get correct icons for account types', () => {
    expect(component.getAccountTypeIcon('checking')).toBe('account_balance');
    expect(component.getAccountTypeIcon('savings')).toBe('savings');
    expect(component.getAccountTypeIcon('retirement')).toBe('elderly');
  });

  it('should classify balance amounts correctly', () => {
    expect(component.getBalanceClass(15000)).toBe('positive');
    expect(component.getBalanceClass(5000)).toBe('neutral');
    expect(component.getBalanceClass(500)).toBe('concern');
  });

  it('should open add account dialog', () => {
    // Arrange
    const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRef.afterClosed.and.returnValue(of(null));
    mockDialog.open.and.returnValue(dialogRef);

    // Act
    component.openAddAccountDialog();

    // Assert
    expect(mockDialog.open).toHaveBeenCalled();
  });

  it('should handle logout correctly', () => {
    // Arrange
    mockAuthService.logout.and.returnValue(of(undefined));

    // Act
    component.logout();

    // Assert
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should get total loan balance', () => {
    // Arrange
    component.user = mockUser;

    // Act & Assert
    expect(component.getTotalLoanBalance()).toBe(25000);
  });

  it('should get total loan payment', () => {
    // Arrange
    component.user = mockUser;

    // Act & Assert
    expect(component.getTotalLoanPayment()).toBe(300);
  });

  it('should handle empty accounts list', () => {
    // Arrange
    component.accounts = [];

    // Act & Assert
    expect(component.getLastUpdatedText()).toBe('No accounts');
  });

  it('should get last updated text for accounts', () => {
    // Arrange
    const recentDate = '2024-01-15T00:00:00Z';
    const olderDate = '2024-01-01T00:00:00Z';
    
    component.accounts = [
      { ...mockDashboardData.accounts[0], lastUpdated: olderDate },
      { ...mockDashboardData.accounts[1], lastUpdated: recentDate }
    ];

    // Act
    const result = component.getLastUpdatedText();

    // Assert
    expect(result).toContain('Updated');
    expect(result).toContain(new Date(recentDate).toLocaleDateString());
  });
});