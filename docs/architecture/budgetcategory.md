# BudgetCategory

**Purpose:** Represents spending categories with essential/non-essential classification for smart financial decisions

**Key Attributes:**
- CategoryId: Guid - Primary identifier
- UserId: Guid - Owner reference
- Name: string - Category display name (e.g., "Groceries", "Entertainment")
- MonthlyLimit: decimal - Planned spending amount
- IsEssential: boolean - Essential vs non-essential classification
- Description: string - Helpful guidance text
- CreatedAt: DateTime - Setup tracking

## TypeScript Interface

```typescript
export interface BudgetCategory {
  categoryId: string;
  userId: string;
  name: string;
  monthlyLimit: number;
  isEssential: boolean;
  description?: string;
  createdAt: string;
}
```

## Relationships

- Many-to-one with User (category belongs to user)
- One-to-many with Expense (category contains multiple expenses)
