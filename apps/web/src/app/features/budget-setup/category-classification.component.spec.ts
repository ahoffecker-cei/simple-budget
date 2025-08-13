import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { CategoryClassificationComponent } from './category-classification.component';
import { BudgetCategoriesService } from './services/budget-categories.service';
import { ClassificationSuggestionService } from './services/classification-suggestion.service';
import { 
  BudgetCategory, 
  CategoryClassificationSuggestion,
  BulkClassificationUpdateRequest 
} from '../../../../../../shared/src/models';

describe('CategoryClassificationComponent', () => {
  let component: CategoryClassificationComponent;
  let fixture: ComponentFixture<CategoryClassificationComponent>;
  let budgetCategoriesService: jasmine.SpyObj<BudgetCategoriesService>;
  let classificationService: jasmine.SpyObj<ClassificationSuggestionService>;

  const mockCategories: BudgetCategory[] = [
    {
      categoryId: '1',
      userId: 'user-1',
      name: 'Groceries',
      monthlyLimit: 500,
      isEssential: true,
      description: 'Food and household essentials',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      categoryId: '2',
      userId: 'user-1',
      name: 'Entertainment',
      monthlyLimit: 200,
      isEssential: false,
      description: 'Movies, games, and recreational activities',
      createdAt: '2024-01-01T00:00:00Z'
    }
  ];

  const mockSuggestions: CategoryClassificationSuggestion[] = [
    {
      categoryName: 'Groceries',
      suggestedIsEssential: true,
      confidence: 0.9,
      reasoning: 'Contains essential keyword: groceries'
    },
    {
      categoryName: 'Entertainment',
      suggestedIsEssential: false,
      confidence: 0.9,
      reasoning: 'Contains non-essential keyword: entertainment'
    }
  ];

  beforeEach(async () => {
    const budgetSpy = jasmine.createSpyObj('BudgetCategoriesService', ['getBudgetCategories', 'loadBudgetCategories']);
    const classificationSpy = jasmine.createSpyObj('ClassificationSuggestionService', [
      'getClassificationSuggestions', 
      'updateBulkClassifications'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        CategoryClassificationComponent,
        MatSnackBarModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: BudgetCategoriesService, useValue: budgetSpy },
        { provide: ClassificationSuggestionService, useValue: classificationSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryClassificationComponent);
    component = fixture.componentInstance;
    budgetCategoriesService = TestBed.inject(BudgetCategoriesService) as jasmine.SpyObj<BudgetCategoriesService>;
    classificationService = TestBed.inject(ClassificationSuggestionService) as jasmine.SpyObj<ClassificationSuggestionService>;

    // Setup default spy returns
    budgetCategoriesService.getBudgetCategories.and.returnValue(of(mockCategories));
    classificationService.getClassificationSuggestions.and.returnValue(of(mockSuggestions));
    budgetCategoriesService.loadBudgetCategories.and.returnValue(of(mockCategories));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load categories and suggestions on init', () => {
    component.ngOnInit();

    expect(budgetCategoriesService.getBudgetCategories).toHaveBeenCalled();
    expect(classificationService.getClassificationSuggestions).toHaveBeenCalled();
    expect(component.categories.length).toBe(2);
    expect(component.essentialCategories.length).toBe(1);
    expect(component.nonEssentialCategories.length).toBe(1);
  });

  it('should process categories with suggestions correctly', () => {
    component.ngOnInit();

    const groceriesCategory = component.categories.find(c => c.name === 'Groceries');
    const entertainmentCategory = component.categories.find(c => c.name === 'Entertainment');

    expect(groceriesCategory?.suggestion).toBeDefined();
    expect(groceriesCategory?.suggestion?.suggestedIsEssential).toBe(true);
    expect(entertainmentCategory?.suggestion).toBeDefined();
    expect(entertainmentCategory?.suggestion?.suggestedIsEssential).toBe(false);
  });

  it('should mark category as dirty when classification changes', () => {
    component.ngOnInit();
    const category = component.categories[0];
    
    // Change classification
    category.isEssential = !category.originalIsEssential;
    component.onClassificationChange(category);

    expect(category.isDirty).toBe(true);
    expect(component.hasDirtyCategories).toBe(true);
  });

  it('should accept suggestion correctly', () => {
    component.ngOnInit();
    const category = component.categories.find(c => c.name === 'Entertainment');
    
    if (category && category.suggestion) {
      const originalClassification = category.isEssential;
      component.acceptSuggestion(category);

      expect(category.isEssential).toBe(category.suggestion.suggestedIsEssential);
      expect(category.isDirty).toBe(originalClassification !== category.suggestion.suggestedIsEssential);
    }
  });

  it('should apply all suggestions', () => {
    component.ngOnInit();
    
    // Manually change one category to test the accept all functionality
    const entertainmentCategory = component.categories.find(c => c.name === 'Entertainment');
    if (entertainmentCategory) {
      entertainmentCategory.isEssential = true; // Change from original false
    }

    spyOn(component['snackBar'], 'open');
    
    component.acceptAllSuggestions();

    // Should apply suggestions where current classification differs from suggested
    expect(component['snackBar'].open).toHaveBeenCalledWith(
      jasmine.stringMatching(/Applied .* classification suggestions/),
      'Close',
      { duration: 3000 }
    );
  });

  it('should save bulk changes successfully', () => {
    const updatedCategories = [...mockCategories];
    classificationService.updateBulkClassifications.and.returnValue(of(updatedCategories));
    
    component.ngOnInit();
    
    // Mark a category as dirty
    component.categories[0].isEssential = !component.categories[0].originalIsEssential;
    component.categories[0].isDirty = true;

    spyOn(component['snackBar'], 'open');

    component.saveAllChanges();

    expect(classificationService.updateBulkClassifications).toHaveBeenCalled();
    expect(budgetCategoriesService.loadBudgetCategories).toHaveBeenCalled();
    expect(component['snackBar'].open).toHaveBeenCalledWith(
      jasmine.stringMatching(/Updated .* category classifications/),
      'Close',
      jasmine.objectContaining({ panelClass: 'success-snackbar' })
    );
  });

  it('should handle save error', () => {
    classificationService.updateBulkClassifications.and.returnValue(
      throwError(() => new Error('Save failed'))
    );
    
    component.ngOnInit();
    
    // Mark a category as dirty
    component.categories[0].isDirty = true;

    spyOn(component['snackBar'], 'open');
    spyOn(console, 'error');

    component.saveAllChanges();

    expect(component['snackBar'].open).toHaveBeenCalledWith(
      'Failed to save classifications',
      'Close',
      jasmine.objectContaining({ panelClass: 'error-snackbar' })
    );
    expect(console.error).toHaveBeenCalled();
  });

  it('should reset changes correctly', () => {
    component.ngOnInit();
    
    // Make changes
    component.categories[0].isEssential = !component.categories[0].originalIsEssential;
    component.categories[0].isDirty = true;

    spyOn(component['snackBar'], 'open');

    component.resetChanges();

    expect(component.categories[0].isEssential).toBe(component.categories[0].originalIsEssential);
    expect(component.categories[0].isDirty).toBe(false);
    expect(component['snackBar'].open).toHaveBeenCalledWith('Changes reset', 'Close', { duration: 2000 });
  });

  it('should calculate confidence color correctly', () => {
    expect(component.getConfidenceColor(0.9)).toBe('primary');
    expect(component.getConfidenceColor(0.7)).toBe('accent');
    expect(component.getConfidenceColor(0.5)).toBe('warn');
  });

  it('should format confidence percentage', () => {
    expect(component.formatConfidence(0.85)).toBe('85%');
    expect(component.formatConfidence(0.9)).toBe('90%');
  });

  it('should toggle suggestions visibility', () => {
    expect(component.showSuggestions).toBe(false);
    
    component.toggleSuggestions();
    expect(component.showSuggestions).toBe(true);
    
    component.toggleSuggestions();
    expect(component.showSuggestions).toBe(false);
  });

  it('should handle loading error', () => {
    budgetCategoriesService.getBudgetCategories.and.returnValue(
      throwError(() => new Error('Load failed'))
    );
    
    spyOn(component['snackBar'], 'open');
    spyOn(console, 'error');

    component.ngOnInit();

    expect(component.isLoading).toBe(false);
    expect(component['snackBar'].open).toHaveBeenCalledWith(
      'Failed to load categories and suggestions',
      'Close',
      { duration: 3000 }
    );
    expect(console.error).toHaveBeenCalled();
  });

  it('should not save when no dirty categories exist', () => {
    component.ngOnInit();
    
    spyOn(component['snackBar'], 'open');

    component.saveAllChanges();

    expect(classificationService.updateBulkClassifications).not.toHaveBeenCalled();
    expect(component['snackBar'].open).toHaveBeenCalledWith('No changes to save', 'Close', { duration: 2000 });
  });

  it('should correctly identify if there are suggestions', () => {
    component.ngOnInit();
    
    expect(component.hasSuggestions).toBe(true);
    
    // Remove suggestions
    component.categories.forEach(cat => cat.suggestion = undefined);
    expect(component.hasSuggestions).toBe(false);
  });
});