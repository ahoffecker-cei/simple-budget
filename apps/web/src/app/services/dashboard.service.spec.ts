import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DashboardService } from './dashboard.service';
import { DashboardResponse, Account, CreateAccountRequest, UpdateAccountRequest, AccountType } from '@simple-budget/shared';
import { environment } from '../../environments/environment';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DashboardService]
    });
    service = TestBed.inject(DashboardService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDashboard', () => {
    it('should retrieve dashboard data', () => {
      const mockDashboard: DashboardResponse = {
        overallHealthStatus: 'excellent',
        totalNetWorth: 50000,
        accounts: []
      };

      service.getDashboard().subscribe(dashboard => {
        expect(dashboard).toEqual(mockDashboard);
        expect(dashboard.overallHealthStatus).toBe('excellent');
        expect(dashboard.totalNetWorth).toBe(50000);
      });

      const req = httpTestingController.expectOne(`${environment.apiBaseUrl}/dashboard`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDashboard);
    });
  });

  describe('getAccounts', () => {
    it('should retrieve user accounts', () => {
      const mockAccounts: Account[] = [
        {
          accountId: '1',
          userId: 'user-1',
          accountType: AccountType.Checking,
          accountName: 'Test Checking',
          currentBalance: 1000,
          lastUpdated: '2024-01-01T00:00:00Z'
        },
        {
          accountId: '2',
          userId: 'user-1',
          accountType: AccountType.Savings,
          accountName: 'Test Savings',
          currentBalance: 5000,
          lastUpdated: '2024-01-01T00:00:00Z'
        }
      ];

      service.getAccounts().subscribe(accounts => {
        expect(accounts).toEqual(mockAccounts);
        expect(accounts.length).toBe(2);
        expect(accounts[0].accountName).toBe('Test Checking');
      });

      const req = httpTestingController.expectOne(`${environment.apiBaseUrl}/accounts`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAccounts);
    });
  });

  describe('createAccount', () => {
    it('should create a new account', () => {
      const createRequest: CreateAccountRequest = {
        accountType: 'checking',
        accountName: 'New Account',
        currentBalance: 2500
      };

      const mockAccount: Account = {
        accountId: '3',
        userId: 'user-1',
        accountType: AccountType.Checking,
        accountName: 'New Account',
        currentBalance: 2500,
        lastUpdated: '2024-01-01T00:00:00Z'
      };

      service.createAccount(createRequest).subscribe(account => {
        expect(account).toEqual(mockAccount);
        expect(account.accountName).toBe('New Account');
        expect(account.currentBalance).toBe(2500);
      });

      const req = httpTestingController.expectOne(`${environment.apiBaseUrl}/accounts`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockAccount);
    });
  });

  describe('updateAccount', () => {
    it('should update an existing account', () => {
      const accountId = '1';
      const updateRequest: UpdateAccountRequest = {
        accountName: 'Updated Account',
        currentBalance: 3000
      };

      service.updateAccount(accountId, updateRequest).subscribe();

      const req = httpTestingController.expectOne(`${environment.apiBaseUrl}/accounts/${accountId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush(null);
    });
  });

  describe('deleteAccount', () => {
    it('should delete an account', () => {
      const accountId = '1';

      service.deleteAccount(accountId).subscribe();

      const req = httpTestingController.expectOne(`${environment.apiBaseUrl}/accounts/${accountId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});