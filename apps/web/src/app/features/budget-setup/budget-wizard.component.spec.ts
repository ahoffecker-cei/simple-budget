import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BudgetWizardComponent } from './budget-wizard.component';
import { BudgetWizardService } from './services/budget-wizard.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('BudgetWizardComponent', () => {
  let component: BudgetWizardComponent;
  let fixture: ComponentFixture<BudgetWizardComponent>;
  let mockBudgetWizardService: jasmine.SpyObj<BudgetWizardService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockSteps = [
    { stepIndex: 0, isValid: true, data: { monthlyIncome: 5000 } },
    { stepIndex: 1, isValid: true, data: { studentLoanPayment: 300 } },
    { stepIndex: 2, isValid: true, data: { majorExpenses: { rent: 1200 } } },
    { stepIndex: 3, isValid: true, data: { savingsGoal: 10000 } }
  ];

  beforeEach(async () => {
    const budgetWizardServiceSpy = jasmine.createSpyObj('BudgetWizardService', [
      'isStepValid',
      'canProceedToStep',
      'completeWizard',
      'updateStepData'
    ], {
      steps$: of(mockSteps)
    });

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [BudgetWizardComponent, BrowserAnimationsModule],
      providers: [
        { provide: BudgetWizardService, useValue: budgetWizardServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetWizardComponent);
    component = fixture.componentInstance;
    mockBudgetWizardService = TestBed.inject(BudgetWizardService) as jasmine.SpyObj<BudgetWizardService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct default values', () => {
    expect(component.currentStep).toBe(0);
    expect(component.totalSteps).toBe(4);
    expect(component.isLoading).toBeFalse();
  });

  it('should calculate progress percentage correctly', () => {
    component.currentStep = 0;
    expect(component.progressPercentage).toBe(25);
    
    component.currentStep = 2;
    expect(component.progressPercentage).toBe(75);
  });

  it('should return correct step messages', () => {
    component.currentStep = 0;
    expect(component.stepMessage).toBe("Step 1 of 4 - Let's start with your income!");
    
    component.currentStep = 3;
    expect(component.stepMessage).toBe("Step 4 of 4 - Set your savings goals!");
  });

  it('should enable next button when step is valid', () => {
    mockBudgetWizardService.isStepValid.and.returnValue(true);
    expect(component.canGoNext()).toBeTrue();
  });

  it('should disable next button when step is invalid', () => {
    mockBudgetWizardService.isStepValid.and.returnValue(false);
    expect(component.canGoNext()).toBeFalse();
  });

  it('should enable previous button when not on first step', () => {
    component.currentStep = 1;
    expect(component.canGoPrevious()).toBeTrue();
  });

  it('should disable previous button on first step', () => {
    component.currentStep = 0;
    expect(component.canGoPrevious()).toBeFalse();
  });

  it('should advance to next step when nextStep is called', () => {
    mockBudgetWizardService.isStepValid.and.returnValue(true);
    component.currentStep = 0;
    
    component.nextStep();
    
    expect(component.currentStep).toBe(1);
  });

  it('should go to previous step when previousStep is called', () => {
    component.currentStep = 2;
    
    component.previousStep();
    
    expect(component.currentStep).toBe(1);
  });

  it('should complete wizard on final step', () => {
    const mockResponse = {
      userProfile: { userId: 'test', email: 'test@example.com', firstName: 'Test', monthlyIncome: 5000, studentLoanPayment: 300, studentLoanBalance: 25000, createdAt: '2025-01-01', lastLoginAt: '2025-01-01' },
      budgetHealth: { totalIncome: 5000, totalExpenses: 1200, studentLoanPayments: 300, availableForSavings: 3500, savingsGoal: 10000, healthRating: 'Excellent', recommendations: [] },
      message: 'Budget setup completed!'
    };
    
    mockBudgetWizardService.isStepValid.and.returnValue(true);
    mockBudgetWizardService.completeWizard.and.returnValue(of(mockResponse));
    component.currentStep = 3; // Final step
    
    component.nextStep();
    
    expect(mockBudgetWizardService.completeWizard).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard'], {
      state: { 
        message: 'Budget Setup Complete! You\'re on your way to financial wellness.',
        showAchievement: true 
      }
    });
  });

  it('should handle wizard completion error', () => {
    mockBudgetWizardService.isStepValid.and.returnValue(true);
    mockBudgetWizardService.completeWizard.and.returnValue(throwError('Error'));
    component.currentStep = 3;
    
    spyOn(console, 'error');
    
    component.nextStep();
    
    expect(console.error).toHaveBeenCalledWith('Error completing wizard:', 'Error');
    expect(component.isLoading).toBeFalse();
  });

  it('should allow navigation to available steps', () => {
    mockBudgetWizardService.canProceedToStep.and.returnValue(true);
    
    component.goToStep(2);
    
    expect(component.currentStep).toBe(2);
  });

  it('should prevent navigation to unavailable steps', () => {
    mockBudgetWizardService.canProceedToStep.and.returnValue(false);
    const initialStep = component.currentStep;
    
    component.goToStep(3);
    
    expect(component.currentStep).toBe(initialStep);
  });
});