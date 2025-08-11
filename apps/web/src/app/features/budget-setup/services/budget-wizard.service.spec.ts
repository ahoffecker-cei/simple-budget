import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BudgetWizardService } from './budget-wizard.service';
import { BudgetWizardRequest, BudgetWizardResponse } from '../../../../../../../shared/src/models';
import { environment } from '../../../../environments/environment';

describe('BudgetWizardService', () => {
  let service: BudgetWizardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BudgetWizardService]
    });
    service = TestBed.inject(BudgetWizardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty wizard data', (done) => {
    service.wizardData$.subscribe(data => {
      expect(data).toEqual({ majorExpenses: {} });
      done();
    });
  });

  it('should initialize with default steps', (done) => {
    service.steps$.subscribe(steps => {
      expect(steps).toHaveSize(4);
      expect(steps[0]).toEqual({ stepIndex: 0, isValid: false, data: {} });
      expect(steps[1]).toEqual({ stepIndex: 1, isValid: false, data: {} });
      expect(steps[2]).toEqual({ stepIndex: 2, isValid: false, data: {} });
      expect(steps[3]).toEqual({ stepIndex: 3, isValid: false, data: {} });
      done();
    });
  });

  it('should update step data correctly', () => {
    const testData = { monthlyIncome: 5000 };
    
    service.updateStepData(0, testData, true);
    
    expect(service.isStepValid(0)).toBeTrue();
    expect(service.getStepData(0)).toEqual(testData);
  });

  it('should update wizard data when step data changes', (done) => {
    const testData = { monthlyIncome: 5000 };
    
    service.updateStepData(0, testData, true);
    
    service.wizardData$.subscribe(data => {
      expect(data.monthlyIncome).toBe(5000);
      done();
    });
  });

  it('should allow proceeding to first step', () => {
    expect(service.canProceedToStep(0)).toBeTrue();
  });

  it('should prevent proceeding to later steps when earlier steps are invalid', () => {
    expect(service.canProceedToStep(2)).toBeFalse();
  });

  it('should allow proceeding to later steps when earlier steps are valid', () => {
    service.updateStepData(0, { monthlyIncome: 5000 }, true);
    service.updateStepData(1, { studentLoanPayment: 300 }, true);
    
    expect(service.canProceedToStep(2)).toBeTrue();
  });

  it('should complete wizard and make HTTP request', () => {
    const mockRequest: BudgetWizardRequest = {
      monthlyIncome: 5000,
      studentLoanPayment: 300,
      studentLoanBalance: 25000,
      majorExpenses: { rent: 1200, utilities: 150 },
      savingsGoal: 10000
    };

    const mockResponse: BudgetWizardResponse = {
      userProfile: {
        userId: 'test-user',
        email: 'test@example.com',
        firstName: 'Test User',
        monthlyIncome: 5000,
        studentLoanPayment: 300,
        studentLoanBalance: 25000,
        createdAt: '2025-01-01',
        lastLoginAt: '2025-01-01'
      },
      budgetHealth: {
        totalIncome: 5000,
        totalExpenses: 1350,
        studentLoanPayments: 300,
        availableForSavings: 3350,
        savingsGoal: 10000,
        healthRating: 'Excellent',
        recommendations: ['Great job! You have plenty of room for savings.']
      },
      message: 'Budget setup completed successfully!'
    };

    // Set up wizard data
    service['wizardDataSubject'].next(mockRequest);

    service.completeWizard().subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/budget/wizard/complete`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);
    req.flush(mockResponse);
  });

  it('should reset wizard data and steps', () => {
    // Set up some data first
    service.updateStepData(0, { monthlyIncome: 5000 }, true);
    service.updateStepData(1, { studentLoanPayment: 300 }, true);

    service.resetWizard();

    expect(service.isStepValid(0)).toBeFalse();
    expect(service.isStepValid(1)).toBeFalse();
    expect(service.getStepData(0)).toEqual({});
    expect(service.getStepData(1)).toEqual({});
  });

  it('should return empty object for non-existent step data', () => {
    expect(service.getStepData(0)).toEqual({});
  });

  it('should return false for invalid step validity check', () => {
    expect(service.isStepValid(0)).toBeFalse();
  });
});