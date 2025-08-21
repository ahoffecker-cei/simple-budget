import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/auth/login.component';
import { RegisterComponent } from './components/auth/register.component';
import { DashboardComponent } from './components/dashboard.component';
import { OnboardingComponent } from './components/onboarding/onboarding.component';
import { BudgetWizardComponent } from './features/budget-setup/budget-wizard.component';
import { BudgetCategoriesComponent } from './features/budget-setup/budget-categories.component';
import { CategoryClassificationComponent } from './features/budget-setup/category-classification.component';
import { ExpenseLoggingComponent } from './features/expense-tracking/expense-logging.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'onboarding', component: OnboardingComponent, canActivate: [AuthGuard] },
  { path: 'budget-wizard', component: BudgetWizardComponent, canActivate: [AuthGuard] },
  { path: 'budget-categories', component: BudgetCategoriesComponent, canActivate: [AuthGuard] },
  { path: 'budget-setup/classification', component: CategoryClassificationComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'expense-logging', component: ExpenseLoggingComponent, canActivate: [AuthGuard] },
  { path: 'expenses', component: ExpenseLoggingComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/dashboard' }
];
