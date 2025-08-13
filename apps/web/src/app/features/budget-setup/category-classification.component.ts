import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';

import { BudgetCategoriesService } from './services/budget-categories.service';
import { ClassificationSuggestionService } from './services/classification-suggestion.service';
import { 
  BudgetCategory, 
  CategoryClassificationSuggestion, 
  ClassificationUpdateRequest,
  BulkClassificationUpdateRequest 
} from '../../../../../../shared/src/models';

interface CategoryWithSuggestion extends BudgetCategory {
  suggestion?: CategoryClassificationSuggestion;
  originalIsEssential: boolean;
  isDirty: boolean;
}

@Component({
  selector: 'app-category-classification',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
    FormsModule
  ],
  templateUrl: './category-classification.component.html',
  styleUrls: ['./category-classification.component.scss']
})
export class CategoryClassificationComponent implements OnInit, OnDestroy {
  categories: CategoryWithSuggestion[] = [];
  essentialCategories: CategoryWithSuggestion[] = [];
  nonEssentialCategories: CategoryWithSuggestion[] = [];
  isLoading = false;
  isSaving = false;
  showSuggestions = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private budgetCategoriesService: BudgetCategoriesService,
    private classificationService: ClassificationSuggestionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCategoriesWithSuggestions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategoriesWithSuggestions(): void {
    this.isLoading = true;
    
    forkJoin({
      categories: this.budgetCategoriesService.loadBudgetCategories(),
      suggestions: this.classificationService.getClassificationSuggestions()
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ categories, suggestions }) => {
          this.processCategories(categories, suggestions);
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open('Failed to load categories and suggestions', 'Close', { duration: 3000 });
          console.error('Error loading data:', error);
        }
      });
  }

  private processCategories(categories: BudgetCategory[], suggestions: CategoryClassificationSuggestion[]): void {
    this.categories = categories.map(category => {
      const suggestion = suggestions.find(s => s.categoryName.toLowerCase() === category.name.toLowerCase());
      return {
        ...category,
        suggestion,
        originalIsEssential: category.isEssential,
        isDirty: false
      };
    });

    this.updateCategoryLists();
  }

  private updateCategoryLists(): void {
    this.essentialCategories = this.categories.filter(cat => cat.isEssential);
    this.nonEssentialCategories = this.categories.filter(cat => !cat.isEssential);
  }

  onClassificationChange(category: CategoryWithSuggestion): void {
    category.isDirty = category.isEssential !== category.originalIsEssential;
    this.updateCategoryLists();
  }

  acceptSuggestion(category: CategoryWithSuggestion): void {
    if (category.suggestion) {
      category.isEssential = category.suggestion.suggestedIsEssential;
      this.onClassificationChange(category);
    }
  }

  acceptAllSuggestions(): void {
    let changedCount = 0;
    this.categories.forEach(category => {
      if (category.suggestion && category.isEssential !== category.suggestion.suggestedIsEssential) {
        category.isEssential = category.suggestion.suggestedIsEssential;
        this.onClassificationChange(category);
        changedCount++;
      }
    });
    
    if (changedCount > 0) {
      this.snackBar.open(`Applied ${changedCount} classification suggestions`, 'Close', { duration: 3000 });
    } else {
      this.snackBar.open('No suggestions to apply', 'Close', { duration: 2000 });
    }
  }

  saveAllChanges(): void {
    const dirtyCategories = this.categories.filter(cat => cat.isDirty);
    
    if (dirtyCategories.length === 0) {
      this.snackBar.open('No changes to save', 'Close', { duration: 2000 });
      return;
    }

    const updates: ClassificationUpdateRequest[] = dirtyCategories.map(category => ({
      categoryId: category.categoryId,
      isEssential: category.isEssential,
      userOverride: category.suggestion && category.isEssential !== category.suggestion.suggestedIsEssential
    }));

    const request: BulkClassificationUpdateRequest = {
      classifications: updates
    };

    this.isSaving = true;
    this.classificationService.updateBulkClassifications(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedCategories) => {
          this.isSaving = false;
          // Update original values and clear dirty flags
          this.categories.forEach(category => {
            const updated = updatedCategories.find(u => u.categoryId === category.categoryId);
            if (updated) {
              category.originalIsEssential = updated.isEssential;
              category.isDirty = false;
            }
          });
          
          // Refresh budget categories service
          this.budgetCategoriesService.loadBudgetCategories().subscribe();
          
          this.snackBar.open(`Updated ${updatedCategories.length} category classifications`, 'Close', { 
            duration: 3000,
            panelClass: 'success-snackbar'
          });
        },
        error: (error) => {
          this.isSaving = false;
          this.snackBar.open('Failed to save classifications', 'Close', { 
            duration: 3000,
            panelClass: 'error-snackbar'
          });
          console.error('Error saving classifications:', error);
        }
      });
  }

  resetChanges(): void {
    this.categories.forEach(category => {
      category.isEssential = category.originalIsEssential;
      category.isDirty = false;
    });
    this.updateCategoryLists();
    this.snackBar.open('Changes reset', 'Close', { duration: 2000 });
  }

  toggleSuggestions(): void {
    this.showSuggestions = !this.showSuggestions;
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return 'primary';
    if (confidence >= 0.6) return 'accent';
    return 'warn';
  }

  formatConfidence(confidence: number): string {
    return `${Math.round(confidence * 100)}%`;
  }

  get hasDirtyCategories(): boolean {
    return this.categories.some(cat => cat.isDirty);
  }

  get hasSuggestions(): boolean {
    return this.categories.some(cat => cat.suggestion);
  }
}