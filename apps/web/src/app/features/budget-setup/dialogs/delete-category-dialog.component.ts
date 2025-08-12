import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BudgetCategory } from '../../../../../../../shared/src/models';
import { BudgetCalculationUtils } from '../services/budget-calculation.utils';

export interface DeleteCategoryDialogData {
  category: BudgetCategory;
}

@Component({
  selector: 'app-delete-category-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>
        <mat-icon color="warn">warning</mat-icon>
        Delete Category
      </h2>
      
      <mat-dialog-content>
        <div class="warning-content">
          <div class="category-preview">
            <div class="category-info">
              <h3>{{ data.category.name }}</h3>
              <p class="category-description">{{ data.category.description }}</p>
              <div class="category-budget">
                <span class="budget-amount">{{ formatCurrency(data.category.monthlyLimit) }}</span>
                <span class="category-type" [class]="data.category.isEssential ? 'essential' : 'flexible'">
                  {{ data.category.isEssential ? 'Essential' : 'Flexible' }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="warning-message">
            <mat-icon color="warn">info</mat-icon>
            <div class="message-text">
              <p><strong>Are you sure you want to delete this category?</strong></p>
              <p>This action cannot be undone. If this category has any recorded expenses, they will also be removed from your budget tracking.</p>
            </div>
          </div>
          
          <div class="impact-summary">
            <h4>Impact on your budget:</h4>
            <ul>
              <li>Your total budget allocation will decrease by {{ formatCurrency(data.category.monthlyLimit) }}</li>
              <li>This will free up budget space for other categories or savings</li>
              <li>Any historical data for this category will be preserved for reporting</li>
            </ul>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()">
          <mat-icon>close</mat-icon>
          Cancel
        </button>
        <button mat-raised-button 
                color="warn" 
                (click)="onConfirm()"
                class="delete-button">
          <mat-icon>delete</mat-icon>
          Delete Category
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 100%;
      max-width: 500px;
      
      h2[mat-dialog-title] {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 0 1rem 0;
        color: #d32f2f;
        font-size: 1.4rem;
        font-weight: 600;
      }
    }

    mat-dialog-content {
      padding: 0 1rem;
    }

    .warning-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .category-preview {
      padding: 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background-color: #f8f9fa;
      
      .category-info {
        h3 {
          margin: 0 0 0.5rem 0;
          color: #333;
          font-size: 1.2rem;
        }
        
        .category-description {
          color: #666;
          margin: 0 0 1rem 0;
          line-height: 1.4;
        }
        
        .category-budget {
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .budget-amount {
            font-size: 1.3rem;
            font-weight: 600;
            color: #2e7d32;
          }
          
          .category-type {
            padding: 0.25rem 0.75rem;
            border-radius: 16px;
            font-size: 0.85rem;
            font-weight: 500;
            
            &.essential {
              background-color: #e8f5e8;
              color: #2e7d32;
            }
            
            &.flexible {
              background-color: #fff3e0;
              color: #f57c00;
            }
          }
        }
      }
    }

    .warning-message {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      
      mat-icon {
        color: #e65100;
        margin-top: 0.1rem;
      }
      
      .message-text {
        flex: 1;
        
        p {
          margin: 0 0 0.75rem 0;
          line-height: 1.4;
          
          &:last-child {
            margin-bottom: 0;
          }
          
          strong {
            color: #d84315;
          }
        }
      }
    }

    .impact-summary {
      h4 {
        margin: 0 0 0.75rem 0;
        color: #333;
        font-size: 1rem;
      }
      
      ul {
        margin: 0;
        padding-left: 1.5rem;
        
        li {
          color: #666;
          line-height: 1.5;
          margin-bottom: 0.5rem;
          
          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 1rem;
      border-top: 1px solid #e0e0e0;
      margin-top: 1rem;
      
      button {
        min-width: 120px;
        
        mat-icon {
          margin-right: 4px;
        }
      }
      
      .delete-button {
        background: linear-gradient(135deg, #f44336, #d32f2f);
      }
    }

    // Responsive design
    @media (max-width: 600px) {
      .dialog-container {
        max-width: 100vw;
        width: 100vw;
      }
      
      .dialog-actions {
        flex-direction: column-reverse;
        gap: 0.5rem;
        
        button {
          width: 100%;
        }
      }
    }
  `]
})
export class DeleteCategoryDialogComponent {

  constructor(
    private dialogRef: MatDialogRef<DeleteCategoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteCategoryDialogData
  ) {}

  formatCurrency(amount: number): string {
    return BudgetCalculationUtils.formatCurrency(amount);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}