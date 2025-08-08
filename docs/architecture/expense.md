# Expense

**Purpose:** Individual expense entries that drive real-time budget monitoring and "Am I doing okay?" calculations

**Key Attributes:**
- ExpenseId: Guid - Primary identifier
- UserId: Guid - Owner reference
- CategoryId: Guid - Budget category assignment
- Amount: decimal - Expense amount
- Description: string - Optional expense details
- ExpenseDate: DateTime - When expense occurred (supports backdating)
- CreatedAt: DateTime - When expense was logged

## TypeScript Interface

```typescript
export interface Expense {
  expenseId: string;
  userId: string;
  categoryId: string;
  amount: number;
  description?: string;
  expenseDate: string;
  createdAt: string;
}
```

## Relationships

- Many-to-one with User (expense belongs to user)
- Many-to-one with BudgetCategory (expense assigned to category)
