import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ClassificationSuggestionService } from './classification-suggestion.service';
import { environment } from '../../../../environments/environment';
import { 
  CategoryClassificationSuggestion, 
  ClassificationUpdateRequest, 
  BulkClassificationUpdateRequest,
  BudgetCategory,
  BudgetHealthByClassification 
} from '../../../../../../../shared/src/models';

describe('ClassificationSuggestionService', () => {
  let service: ClassificationSuggestionService;
  let httpMock: HttpTestingController;

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

  const mockCategory: BudgetCategory = {
    categoryId: '1',
    userId: 'user-1',
    name: 'Groceries',
    monthlyLimit: 500,
    isEssential: true,
    description: 'Food essentials',
    colorId: 'green',
    iconId: 'local_grocery_store',
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockHealth: BudgetHealthByClassification = {
    essentialSpending: 400,
    essentialLimit: 1500,
    nonEssentialSpending: 150,
    nonEssentialLimit: 500,
    essentialHealthStatus: 'good',
    nonEssentialHealthStatus: 'excellent'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClassificationSuggestionService]
    });
    
    service = TestBed.inject(ClassificationSuggestionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get classification suggestions without category name', () => {
    service.getClassificationSuggestions().subscribe(suggestions => {
      expect(suggestions).toEqual(mockSuggestions);
      expect(suggestions.length).toBe(2);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/budget-categories/classification-suggestions`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush(mockSuggestions);
  });

  it('should get classification suggestions with category name', () => {
    const categoryName = 'Groceries';
    
    service.getClassificationSuggestions(categoryName).subscribe(suggestions => {
      expect(suggestions).toEqual(mockSuggestions);
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/budget-categories/classification-suggestions?categoryName=${categoryName}`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockSuggestions);
  });

  it('should update category classification', () => {
    const categoryId = '1';
    const updateRequest: ClassificationUpdateRequest = {
      categoryId: categoryId,
      isEssential: true,
      userOverride: true
    };

    service.updateCategoryClassification(categoryId, updateRequest).subscribe(category => {
      expect(category).toEqual(mockCategory);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/budget-categories/${categoryId}/classification`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateRequest);
    req.flush(mockCategory);
  });

  it('should update bulk classifications', () => {
    const bulkRequest: BulkClassificationUpdateRequest = {
      classifications: [
        { categoryId: '1', isEssential: true, userOverride: false },
        { categoryId: '2', isEssential: false, userOverride: true }
      ]
    };

    const mockUpdatedCategories: BudgetCategory[] = [mockCategory];

    service.updateBulkClassifications(bulkRequest).subscribe(categories => {
      expect(categories).toEqual(mockUpdatedCategories);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/budget-categories/bulk-classification`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(bulkRequest);
    req.flush(mockUpdatedCategories);
  });

  it('should get classification health', () => {
    service.getClassificationHealth().subscribe(health => {
      expect(health).toEqual(mockHealth);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/dashboard/classification-health`);
    expect(req.request.method).toBe('GET');
    req.flush(mockHealth);
  });

  it('should update classification health subject when getting health', () => {
    let receivedHealth: BudgetHealthByClassification | null = null;
    
    service.classificationHealth$.subscribe(health => {
      receivedHealth = health;
    });

    service.getClassificationHealth().subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/dashboard/classification-health`);
    req.flush(mockHealth);

    expect(receivedHealth).toEqual(jasmine.objectContaining({
      essentialSpending: 400,
      essentialLimit: 1500,
      nonEssentialSpending: 150,
      nonEssentialLimit: 500,
      essentialHealthStatus: 'good',
      nonEssentialHealthStatus: 'excellent'
    }));
  });

  it('should load classification health', () => {
    spyOn(service, 'getClassificationHealth').and.returnValue(
      service.getClassificationHealth()
    );

    service.loadClassificationHealth();

    expect(service.getClassificationHealth).toHaveBeenCalled();
  });

  it('should handle HTTP errors gracefully', () => {
    service.getClassificationSuggestions().subscribe({
      next: () => fail('Should have failed'),
      error: (error) => {
        expect(error.status).toBe(500);
        expect(error.statusText).toBe('Internal Server Error');
      }
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/budget-categories/classification-suggestions`);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
  });

  it('should handle classification health update errors', () => {
    let errorOccurred = false;
    
    service.classificationHealth$.subscribe();
    
    service.getClassificationHealth().subscribe({
      next: () => fail('Should have failed'),
      error: () => {
        errorOccurred = true;
      }
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/dashboard/classification-health`);
    req.flush('Not found', { status: 404, statusText: 'Not Found' });

    expect(errorOccurred).toBe(true);
  });
});