import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CATEGORY_COLORS, CATEGORY_ICONS, CategoryColor, CategoryIcon } from '@simple-budget/shared';

interface CategoryCustomization {
  colorId: string;
  iconId: string;
}

@Component({
  selector: 'app-category-color-icon-picker',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CategoryColorIconPickerComponent),
      multi: true
    }
  ],
  template: `
    <div class="color-icon-picker">
      <div class="preview-section">
        <h4>Preview</h4>
        <div class="category-preview" [style.background-color]="selectedColor?.value" [style.color]="selectedColor?.textColor">
          <mat-icon class="preview-icon">{{ selectedIcon?.materialIcon }}</mat-icon>
          <span class="preview-text">{{ categoryName || 'Category Name' }}</span>
        </div>
      </div>

      <div class="color-section">
        <h4>Choose Color</h4>
        <div class="color-grid">
          <button
            *ngFor="let color of colors"
            type="button"
            mat-mini-fab
            class="color-button"
            [class.selected]="value.colorId === color.id"
            [style.background-color]="color.value"
            [attr.aria-label]="color.name"
            [title]="color.name"
            (click)="selectColor(color.id)">
            <mat-icon *ngIf="value.colorId === color.id" [style.color]="color.textColor">check</mat-icon>
          </button>
        </div>
      </div>

      <div class="icon-section">
        <h4>Choose Icon</h4>
        <div class="icon-grid">
          <button
            *ngFor="let icon of icons"
            type="button"
            mat-icon-button
            class="icon-button"
            [class.selected]="value.iconId === icon.id"
            [attr.aria-label]="icon.name"
            [title]="icon.name"
            (click)="selectIcon(icon.id)">
            <mat-icon>{{ icon.materialIcon }}</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .color-icon-picker {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      padding: var(--spacing-md);
    }

    .preview-section h4,
    .color-section h4,
    .icon-section h4 {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--color-neutral-700);
    }

    .category-preview {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      border-radius: var(--border-radius-md);
      font-weight: 500;
      box-shadow: var(--shadow-sm);
      min-height: 48px;
      transition: all 0.2s ease;
    }

    .preview-icon {
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
    }

    .preview-text {
      font-size: 1rem;
    }

    .color-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
      gap: var(--spacing-sm);
      max-width: 400px;
    }

    .color-button {
      width: 36px !important;
      height: 36px !important;
      min-height: 36px !important;
      border: 2px solid transparent;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-sm);
    }

    .color-button:hover {
      transform: scale(1.1);
      box-shadow: var(--shadow-md);
    }

    .color-button.selected {
      border-color: var(--color-neutral-800);
      transform: scale(1.1);
      box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.2);
    }

    .color-button mat-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
    }

    .icon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
      gap: var(--spacing-xs);
      max-width: 500px;
    }

    .icon-button {
      width: 48px !important;
      height: 48px !important;
      border: 1px solid var(--color-neutral-300);
      border-radius: var(--border-radius-sm);
      transition: all 0.2s ease;
    }

    .icon-button:hover {
      background-color: var(--color-neutral-100);
      border-color: var(--color-primary);
    }

    .icon-button.selected {
      background-color: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }

    .icon-button mat-icon {
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
    }

    @media (max-width: 768px) {
      .color-grid {
        grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
      }
      
      .color-button {
        width: 32px !important;
        height: 32px !important;
        min-height: 32px !important;
      }
      
      .icon-grid {
        grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
      }
      
      .icon-button {
        width: 44px !important;
        height: 44px !important;
      }
    }
  `]
})
export class CategoryColorIconPickerComponent implements ControlValueAccessor {
  @Input() categoryName: string = '';
  
  colors = CATEGORY_COLORS;
  icons = CATEGORY_ICONS;
  
  value: CategoryCustomization = {
    colorId: 'blue',
    iconId: 'home'
  };

  private onChange = (value: CategoryCustomization) => {};
  private onTouched = () => {};

  get selectedColor(): CategoryColor | undefined {
    return this.colors.find(c => c.id === this.value.colorId);
  }

  get selectedIcon(): CategoryIcon | undefined {
    return this.icons.find(i => i.id === this.value.iconId);
  }

  selectColor(colorId: string): void {
    this.value = { ...this.value, colorId };
    this.onChange(this.value);
    this.onTouched();
  }

  selectIcon(iconId: string): void {
    this.value = { ...this.value, iconId };
    this.onChange(this.value);
    this.onTouched();
  }

  // ControlValueAccessor implementation
  writeValue(value: CategoryCustomization): void {
    if (value) {
      this.value = value;
    }
  }

  registerOnChange(fn: (value: CategoryCustomization) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handle disabled state if needed
  }
}