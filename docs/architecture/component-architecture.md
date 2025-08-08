# Component Architecture

## Component Organization

```
src/
├── app/
│   ├── core/                          # Singleton services and guards
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.guard.ts
│   │   │   └── jwt.interceptor.ts
│   │   ├── api/
│   │   │   ├── api.service.ts
│   │   │   └── http-error.interceptor.ts
│   │   └── services/
│   │       ├── budget-calculation.service.ts
│   │       └── offline-sync.service.ts
│   ├── shared/                        # Reusable components and utilities
│   │   ├── components/
│   │   │   ├── financial-health-indicator/
│   │   │   ├── budget-category-card/
│   │   │   ├── expense-entry-form/
│   │   │   ├── progress-indicator/
│   │   │   └── action-button/
│   │   ├── models/                    # TypeScript interfaces
│   │   └── utils/
│   ├── features/                      # Feature modules
│   │   ├── dashboard/
│   │   ├── budget-setup/
│   │   ├── expense-tracking/
│   │   └── auth/
│   └── layout/                        # App shell components
```

## Component Template Example

```typescript
@Component({
  selector: 'sb-financial-health-indicator',
  template: `
    <div class="health-indicator" [ngClass]="'health-' + healthStatus">
      <div class="health-icon">
        <mat-icon [attr.aria-label]="healthMessage">{{ healthIcon }}</mat-icon>
      </div>
      <div class="health-content">
        <h2 class="health-title">{{ healthTitle }}</h2>
        <p class="health-message">{{ healthMessage }}</p>
        <div class="health-actions" *ngIf="showActions">
          <sb-action-button 
            [label]="actionLabel" 
            [variant]="actionVariant"
            (click)="onAction()">
          </sb-action-button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./financial-health-indicator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinancialHealthIndicatorComponent implements OnInit {
  @Input() healthStatus: 'excellent' | 'good' | 'attention' | 'concern' = 'excellent';
  @Input() showActions = true;
  @Output() actionClicked = new EventEmitter<void>();

  healthIcon: string = '';
  healthTitle: string = '';
  healthMessage: string = '';
  actionLabel: string = '';
  actionVariant: 'primary' | 'secondary' | 'warning' = 'primary';

  ngOnInit() {
    this.updateHealthDisplay();
  }

  private updateHealthDisplay() {
    const healthConfig = {
      excellent: {
        icon: 'sentiment_very_satisfied',
        title: 'You\'re doing great!',
        message: 'Your budget is on track and you\'re building great financial habits.',
        actionLabel: 'Keep it up!',
        variant: 'primary' as const
      },
      good: {
        icon: 'sentiment_satisfied',
        title: 'Looking good!',
        message: 'You\'re managing your budget well with room for small improvements.',
        actionLabel: 'View details',
        variant: 'primary' as const
      },
      attention: {
        icon: 'sentiment_neutral',
        title: 'Small adjustment needed',
        message: 'A few categories need attention, but you\'ve got this!',
        actionLabel: 'Let\'s adjust',
        variant: 'secondary' as const
      },
      concern: {
        icon: 'sentiment_dissatisfied',
        title: 'Let\'s make a plan',
        message: 'Your budget needs some adjustments. We\'re here to help you get back on track.',
        actionLabel: 'Get guidance',
        variant: 'warning' as const
      }
    };

    const config = healthConfig[this.healthStatus];
    this.healthIcon = config.icon;
    this.healthTitle = config.title;
    this.healthMessage = config.message;
    this.actionLabel = config.actionLabel;
    this.actionVariant = config.variant;
  }

  onAction() {
    this.actionClicked.emit();
  }
}
```
