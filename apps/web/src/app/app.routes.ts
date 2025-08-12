import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/auth/login.component';
import { RegisterComponent } from './components/auth/register.component';
import { DashboardComponent } from './components/dashboard.component';
import { OnboardingComponent } from './components/onboarding/onboarding.component';
import { BudgetWizardComponent } from './features/budget-setup/budget-wizard.component';
import { BudgetCategoriesComponent } from './features/budget-setup/budget-categories.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'onboarding', component: OnboardingComponent, canActivate: [AuthGuard] },
  { path: 'budget-wizard', component: BudgetWizardComponent, canActivate: [AuthGuard] },
  { path: 'budget-categories', component: BudgetCategoriesComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/dashboard' }
];
