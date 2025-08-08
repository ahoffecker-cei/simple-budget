# User

**Purpose:** Represents the young adult user (22-28) managing their financial transition to independence

**Key Attributes:**
- UserId: Guid - Primary identifier
- Email: string - Authentication and communication
- PasswordHash: string - Secure credential storage
- FirstName: string - Personalization for confidence-building messaging
- MonthlyIncome: decimal - Foundation for budget calculations
- StudentLoanPayment: decimal - Critical expense for target demographic
- StudentLoanBalance: decimal - Total remaining debt tracking
- CreatedAt: DateTime - Account creation timestamp
- LastLoginAt: DateTime - Engagement tracking

## TypeScript Interface

```typescript
export interface User {
  userId: string;
  email: string;
  firstName: string;
  monthlyIncome: number;
  studentLoanPayment: number;
  studentLoanBalance: number;
  createdAt: string;
  lastLoginAt: string;
}
```

## Relationships

- One-to-many with BudgetCategory (user owns multiple budget categories)
- One-to-many with Account (user has multiple financial accounts)
- One-to-many with Expense (user logs multiple expenses)
