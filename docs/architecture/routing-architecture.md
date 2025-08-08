# Routing Architecture

## Route Organization

```typescript
const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { 
    path: 'auth', 
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  { 
    path: 'dashboard', 
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'budget-setup', 
    loadChildren: () => import('./features/budget-setup/budget-setup.module').then(m => m.BudgetSetupModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'expenses', 
    loadChildren: () => import('./features/expense-tracking/expense-tracking.module').then(m => m.ExpenseTrackingModule),
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '/dashboard' }
];
```
