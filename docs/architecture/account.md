# Account

**Purpose:** Financial accounts for complete financial picture display (checking, savings, retirement)

**Key Attributes:**
- AccountId: Guid - Primary identifier
- UserId: Guid - Owner reference
- AccountType: enum - Checking, Savings, Retirement
- AccountName: string - User-defined account name
- CurrentBalance: decimal - Manually entered balance
- LastUpdated: DateTime - Balance update tracking

## TypeScript Interface

```typescript
export enum AccountType {
  Checking = 'checking',
  Savings = 'savings',
  Retirement = 'retirement'
}

export interface Account {
  accountId: string;
  userId: string;
  accountType: AccountType;
  accountName: string;
  currentBalance: number;
  lastUpdated: string;
}
```

## Relationships

- Many-to-one with User (account belongs to user)
