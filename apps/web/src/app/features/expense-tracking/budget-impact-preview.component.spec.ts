import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, BehaviorSubject, Observable } from 'rxjs';
import { BudgetImpactPreviewComponent } from './budget-impact-preview.component';
import { BudgetImpactService } from './services/budget-impact.service';
import { BudgetImpactPreview } from '../../../../../../shared/src/models';

describe('BudgetImpactPreviewComponent', () => {
  let component: BudgetImpactPreviewComponent;
  let fixture: ComponentFixture<BudgetImpactPreviewComponent>;
  let mockBudgetImpactService: jasmine.SpyObj<BudgetImpactService>;
  let mockPreviewSubject: BehaviorSubject<BudgetImpactPreview | null>;

  const mockBudgetImpact: BudgetImpactPreview = {
    categoryId: '11111111-1111-1111-1111-111111111111',
    categoryName: 'Groceries',
    currentSpent: 100,
    monthlyLimit: 500,
    remainingAfterExpense: 350,
    percentageUsed: 30,
    healthStatus: 'excellent',
    isEssential: true,
    impactMessage: 'Great choice! You\'re staying well within your essential budget!',
    encouragementLevel: 'celebration'
  };

  const mockBudgetImpactConcern: BudgetImpactPreview = {
    categoryId: '22222222-2222-2222-2222-222222222222',
    categoryName: 'Entertainment',
    currentSpent: 180,
    monthlyLimit: 200,
    remainingAfterExpense: -30,
    percentageUsed: 115,
    healthStatus: 'concern',
    isEssential: false,
    impactMessage: 'This goes $30.00 over your nice-to-have budget, but that\'s okay! Let\'s adjust together.',
    encouragementLevel: 'support'
  };

  beforeEach(async () => {
    const budgetImpactServiceSpy = jasmine.createSpyObj('BudgetImpactService', [
      'getBudgetImpactPreview',
      'getOverallBudgetHealth',
      'getMonthlyProgressData'
    ]);
    
    mockBudgetImpactService = budgetImpactServiceSpy;

    await TestBed.configureTestingModule({
      imports: [
        BudgetImpactPreviewComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: BudgetImpactService, useValue: mockBudgetImpactService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetImpactPreviewComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Jasmine automatically cleans up spies
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Budget Impact Display', () => {
    it('should display budget impact when valid inputs are provided', fakeAsync(() => {
      // Arrange
      mockBudgetImpactService.getBudgetImpactPreview.and.returnValue(of(mockBudgetImpact));
      component.categoryId = '11111111-1111-1111-1111-111111111111';
      component.amount = 50;

      // Act
      component.ngOnChanges({
        categoryId: { currentValue: component.categoryId, previousValue: null, firstChange: true, isFirstChange: () => true },
        amount: { currentValue: component.amount, previousValue: 0, firstChange: false, isFirstChange: () => false }
      });
      tick(300); // Wait for debounce
      fixture.detectChanges();

      // Assert
      expect(component.budgetImpact).toEqual(mockBudgetImpact);
      expect(component.isLoading).toBeFalsy();
      expect(component.hasError).toBeFalsy();
      
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.category-name')?.textContent?.trim()).toBe('Groceries');
      expect(compiled.querySelector('.impact-message')?.textContent?.trim()).toContain('Great choice');
    }));

    it('should show loading state during API call', fakeAsync(() => {
      // Arrange
      let resolveObservable: (value: BudgetImpactPreview) => void;
      const delayedObservable = new Observable<BudgetImpactPreview>((subscriber) => {
        resolveObservable = (value: BudgetImpactPreview) => subscriber.next(value);
      });
      
      mockBudgetImpactService.getBudgetImpactPreview.and.returnValue(delayedObservable);
      component.categoryId = '11111111-1111-1111-1111-111111111111';
      component.amount = 50;

      // Act
      component.ngOnChanges({
        categoryId: { currentValue: component.categoryId, previousValue: null, firstChange: true, isFirstChange: () => true },
        amount: { currentValue: component.amount, previousValue: 0, firstChange: false, isFirstChange: () => false }
      });
      tick(300); // Wait for debounce to complete
      
      // Assert - should be in loading state before API response
      expect(component.isLoading).toBeTruthy();
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.loading-preview')).toBeTruthy();
      expect(compiled.querySelector('.loading-content')).toBeTruthy();
    }));

    it('should show error state when API call fails', fakeAsync(() => {
      // Arrange
      mockBudgetImpactService.getBudgetImpactPreview.and.returnValue(throwError(() => new Error('API Error')));
      component.categoryId = '11111111-1111-1111-1111-111111111111';
      component.amount = 50;

      // Act
      component.ngOnChanges({
        categoryId: { currentValue: component.categoryId, previousValue: null, firstChange: true, isFirstChange: () => true },
        amount: { currentValue: component.amount, previousValue: 0, firstChange: false, isFirstChange: () => false }
      });
      tick(300); // Wait for debounce
      fixture.detectChanges();

      // Assert
      expect(component.isLoading).toBeFalsy();
      expect(component.hasError).toBeTruthy();
      expect(component.budgetImpact).toBeNull();
      
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.error-preview')).toBeTruthy();
      expect(compiled.querySelector('.error-content')).toBeTruthy();
    }));

    it('should not make API call when categoryId is null or amount is 0', () => {
      // Arrange & Act
      component.categoryId = null;
      component.amount = 0;
      component.ngOnChanges({});

      // Assert
      expect(mockBudgetImpactService.getBudgetImpactPreview).not.toHaveBeenCalled();
      expect(component.budgetImpact).toBeNull();
    });
  });

  describe('Visual Health Indicators', () => {
    beforeEach(() => {
      mockBudgetImpactService.getBudgetImpactPreview.and.returnValue(of(mockBudgetImpact));
    });

    it('should return correct health status class', () => {
      // Arrange
      component.budgetImpact = mockBudgetImpact;

      // Act & Assert
      expect(component.getHealthStatusClass()).toBe('excellent');
    });

    it('should return correct health status icon for different statuses', () => {
      const testCases = [
        { status: 'excellent', expectedIcon: 'check_circle' },
        { status: 'good', expectedIcon: 'thumb_up' },
        { status: 'attention', expectedIcon: 'warning' },
        { status: 'concern', expectedIcon: 'error' }
      ];

      testCases.forEach(({ status, expectedIcon }) => {
        component.budgetImpact = { ...mockBudgetImpact, healthStatus: status as any };
        expect(component.getHealthStatusIcon()).toBe(expectedIcon);
      });
    });

    it('should return correct progress bar class', () => {
      // Arrange
      component.budgetImpact = mockBudgetImpact;

      // Act & Assert
      expect(component.getProgressBarClass()).toBe('progress-bar-excellent');
    });

    it('should return correct encouragement class and icon', () => {
      const testCases = [
        { level: 'celebration', expectedIcon: 'celebration' },
        { level: 'encouragement', expectedIcon: 'thumb_up' },
        { level: 'guidance', expectedIcon: 'lightbulb' },
        { level: 'support', expectedIcon: 'favorite' }
      ];

      testCases.forEach(({ level, expectedIcon }) => {
        component.budgetImpact = { ...mockBudgetImpact, encouragementLevel: level as any };
        expect(component.getEncouragementClass()).toBe(level);
        expect(component.getEncouragementIcon()).toBe(expectedIcon);
      });
    });
  });

  describe('Essential vs Non-Essential Categories', () => {
    it('should display essential category with shield icon', fakeAsync(() => {
      // Arrange
      mockBudgetImpactService.getBudgetImpactPreview.and.returnValue(of(mockBudgetImpact));
      component.categoryId = '11111111-1111-1111-1111-111111111111';
      component.amount = 50;

      // Act
      component.ngOnChanges({
        categoryId: { currentValue: component.categoryId, previousValue: null, firstChange: true, isFirstChange: () => true },
        amount: { currentValue: component.amount, previousValue: 0, firstChange: false, isFirstChange: () => false }
      });
      tick(300);
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement as HTMLElement;
      const icon = compiled.querySelector('.category-info mat-icon');
      expect(icon?.textContent?.trim()).toBe('shield');
      expect(icon?.classList.contains('essential-icon')).toBeTruthy();
    }));

    it('should display non-essential category with star icon', fakeAsync(() => {
      // Arrange
      const nonEssentialImpact = { ...mockBudgetImpact, isEssential: false };
      mockBudgetImpactService.getBudgetImpactPreview.and.returnValue(of(nonEssentialImpact));
      component.categoryId = '22222222-2222-2222-2222-222222222222';
      component.amount = 50;

      // Act
      component.ngOnChanges({
        categoryId: { currentValue: component.categoryId, previousValue: null, firstChange: true, isFirstChange: () => true },
        amount: { currentValue: component.amount, previousValue: 0, firstChange: false, isFirstChange: () => false }
      });
      tick(300);
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement as HTMLElement;
      const icon = compiled.querySelector('.category-info mat-icon');
      expect(icon?.textContent?.trim()).toBe('star');
      expect(icon?.classList.contains('essential-icon')).toBeFalsy();
    }));
  });

  describe('Over Budget Scenarios', () => {
    it('should display negative remaining amount correctly when over budget', fakeAsync(() => {
      // Arrange
      mockBudgetImpactService.getBudgetImpactPreview.and.returnValue(of(mockBudgetImpactConcern));
      component.categoryId = '22222222-2222-2222-2222-222222222222';
      component.amount = 50;

      // Act
      component.ngOnChanges({
        categoryId: { currentValue: component.categoryId, previousValue: null, firstChange: true, isFirstChange: () => true },
        amount: { currentValue: component.amount, previousValue: 0, firstChange: false, isFirstChange: () => false }
      });
      tick(300);
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement as HTMLElement;
      const amountRow = compiled.querySelector('.amount-row.negative');
      expect(amountRow).toBeTruthy();
      expect(amountRow?.textContent).toContain('Over Budget:');
      expect(amountRow?.textContent).toContain('$30.00');
    }));

    it('should display concern health status for over budget', fakeAsync(() => {
      // Arrange
      mockBudgetImpactService.getBudgetImpactPreview.and.returnValue(of(mockBudgetImpactConcern));
      component.categoryId = '22222222-2222-2222-2222-222222222222';
      component.amount = 50;

      // Act
      component.ngOnChanges({
        categoryId: { currentValue: component.categoryId, previousValue: null, firstChange: true, isFirstChange: () => true },
        amount: { currentValue: component.amount, previousValue: 0, firstChange: false, isFirstChange: () => false }
      });
      tick(300);
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.concern')).toBeTruthy();
      expect(compiled.querySelector('.support')).toBeTruthy(); // encouragement level
    }));
  });

  describe('Debounced API Calls', () => {
    it('should debounce rapid input changes', fakeAsync(() => {
      // Arrange
      mockBudgetImpactService.getBudgetImpactPreview.and.returnValue(of(mockBudgetImpact));
      component.categoryId = '11111111-1111-1111-1111-111111111111';

      // Act - Rapid changes
      component.amount = 25;
      component.ngOnChanges({
        amount: { currentValue: 25, previousValue: 0, firstChange: false, isFirstChange: () => false }
      });

      component.amount = 50;
      component.ngOnChanges({
        amount: { currentValue: 50, previousValue: 25, firstChange: false, isFirstChange: () => false }
      });

      component.amount = 75;
      component.ngOnChanges({
        amount: { currentValue: 75, previousValue: 50, firstChange: false, isFirstChange: () => false }
      });

      tick(300); // Wait for debounce

      // Assert - Only one API call should be made
      expect(mockBudgetImpactService.getBudgetImpactPreview).toHaveBeenCalledTimes(1);
      expect(mockBudgetImpactService.getBudgetImpactPreview).toHaveBeenCalledWith(
        '11111111-1111-1111-1111-111111111111',
        75,
        undefined
      );
    }));

    it('should make distinct calls for different inputs', fakeAsync(() => {
      // Arrange
      mockBudgetImpactService.getBudgetImpactPreview.and.returnValue(of(mockBudgetImpact));
      component.categoryId = '11111111-1111-1111-1111-111111111111';

      // Act - First call
      component.amount = 50;
      component.ngOnChanges({
        amount: { currentValue: 50, previousValue: 0, firstChange: false, isFirstChange: () => false }
      });
      tick(300);

      // Act - Second call with different amount
      component.amount = 100;
      component.ngOnChanges({
        amount: { currentValue: 100, previousValue: 50, firstChange: false, isFirstChange: () => false }
      });
      tick(300);

      // Assert
      expect(mockBudgetImpactService.getBudgetImpactPreview).toHaveBeenCalledTimes(2);
    }));
  });

  describe('Component Lifecycle', () => {
    it('should clean up subscriptions on destroy', () => {
      // Arrange
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      // Act
      component.ngOnDestroy();

      // Assert
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should handle null inputs gracefully', () => {
      // Act
      component.categoryId = null;
      component.amount = 0;
      component.ngOnChanges({});

      // Assert
      expect(component.budgetImpact).toBeNull();
      expect(component.isLoading).toBeFalsy();
      expect(component.hasError).toBeFalsy();
    });
  });

  describe('Math Helper', () => {
    it('should make Math object available in template', () => {
      expect(component.Math).toBe(Math);
    });
  });
});