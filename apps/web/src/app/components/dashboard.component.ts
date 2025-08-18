import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { DashboardService } from '../services/dashboard.service';
import { ClassificationSuggestionService } from '../features/budget-setup/services/classification-suggestion.service';
import { StudentLoansService } from '../services/student-loans.service';
import { User, StudentLoanSummary, DashboardResponse, Account, BudgetHealthByClassification, DashboardOverviewResponse } from '@simple-budget/shared';
import { LoanBreakdownModalComponent } from './loan-breakdown-modal.component';
import { AccountFormDialogComponent, AccountFormData } from './account-form-dialog.component';
import { SmartSavingsGoalDialogComponent, SavingsGoalData, SavingsGoalResult } from './smart-savings-goal-dialog.component';
import { FinancialHealthAnswerComponent } from '../features/dashboard/components/financial-health-answer.component';
import { BudgetCategorySummaryComponent } from '../features/dashboard/components/budget-category-summary.component';
import { MonthlyProgressOverviewComponent } from '../features/dashboard/components/monthly-progress-overview.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    FinancialHealthAnswerComponent,
    BudgetCategorySummaryComponent,
    MonthlyProgressOverviewComponent
  ],
  template: `
    <div class="dashboard-layout">
      <!-- Header with calming design -->
      <header class="dashboard-header">
        <div class="header-content">
          <div class="brand">
            <h1 class="app-title">Simple Budget</h1>
            <p class="app-tagline">Your calming financial companion</p>
          </div>
          <div class="user-menu" *ngIf="user">
            <span class="welcome-text">Hi, {{user.firstName}}! 👋</span>
            <button mat-icon-button class="logout-btn" (click)="logout()" title="Sign Out">
              <mat-icon>logout</mat-icon>
            </button>
          </div>
        </div>
      </header>

      <!-- Main dashboard content -->
      <main class="dashboard-main">
        <div class="dashboard-container">
          
          <!-- Enhanced Financial Health Answer -->
          <section class="hero-section">
            <app-financial-health-answer [dashboardData]="dashboardOverview">
            </app-financial-health-answer>
          </section>

          <!-- NEW: Combined Financial Overview Left Column -->
          <section class="financial-overview-left">
            <div class="financial-overview-stack">
              <!-- Net Worth (Compact Version) -->
              <mat-card class="net-worth-card-compact card-primary">
                <div class="net-worth-content-compact">
                  <div class="net-worth-header">
                    <span class="net-worth-label">Total Net Worth</span>
                    <mat-icon class="net-worth-icon-small">account_balance_wallet</mat-icon>
                  </div>
                  <div class="net-worth-amount excellent">
                    {{ (dashboardData?.totalNetWorth || 45000) | currency }}
                  </div>
                </div>
              </mat-card>

              <!-- Account Balances (Integrated) -->
              <mat-card class="accounts-card-integrated card-secondary">
                <div class="card-header-compact">
                  <h3>Account Balances</h3>
                  <span class="last-updated">Sample Data</span>
                </div>
                
                <div class="accounts-grid-compact">
                  <!-- Sample Account Items with compact styling -->
                  <div class="account-item account-type-checking">
                    <div class="account-info">
                      <span class="account-label">Primary Checking</span>
                      <span class="account-balance positive">$5,240.50</span>
                    </div>
                    <mat-icon class="account-icon-small">account_balance</mat-icon>
                  </div>
                  
                  <div class="account-item account-type-savings">
                    <div class="account-info">
                      <span class="account-label">Emergency Fund</span>
                      <span class="account-balance positive">$12,500.00</span>
                    </div>
                    <mat-icon class="account-icon-small">savings</mat-icon>
                  </div>
                  
                  <div class="account-item account-type-retirement">
                    <div class="account-info">
                      <span class="account-label">401(k)</span>
                      <span class="account-balance positive">$27,260.00</span>
                    </div>
                    <mat-icon class="account-icon-small">elderly</mat-icon>
                  </div>
                </div>
                
                <div class="loading-state" *ngIf="isLoading">
                  <div class="loading-spinner">
                    <mat-icon>hourglass_empty</mat-icon>
                  </div>
                  <p>Loading your accounts...</p>
                </div>
              </mat-card>
            </div>
          </section>

          <!-- Monthly Overview (Right Column) -->
          <section class="monthly-overview-right">
            <mat-card class="overview-card card-secondary">
              <div class="card-header">
                <h3>Monthly Overview</h3>
              </div>
              <div class="overview-grid">
                <div class="overview-item income-item">
                  <div class="overview-info">
                    <span class="overview-label">Monthly Income</span>
                    <span class="overview-amount positive">$6,500.00</span>
                  </div>
                  <mat-icon class="overview-icon">trending_up</mat-icon>
                </div>
                <div class="overview-item expense-item">
                  <div class="overview-info">
                    <span class="overview-label">Monthly Expenses</span>
                    <span class="overview-amount neutral">$4,200.00</span>
                  </div>
                  <mat-icon class="overview-icon">receipt</mat-icon>
                </div>
                <div class="overview-item">
                  <div class="overview-info">
                    <span class="overview-label">Monthly Savings</span>
                    <span class="overview-amount positive">$2,300.00</span>
                  </div>
                  <mat-icon class="overview-icon">savings</mat-icon>
                </div>
              </div>
            </mat-card>
          </section>

          <!-- Budget Categories Section -->
          <section class="budget-categories-section">
            <app-budget-category-summary [categories]="dashboardOverview?.budgetSummary || []">
            </app-budget-category-summary>
          </section>

          <!-- Monthly Progress -->
          <section class="monthly-progress-section">
            <app-monthly-progress-overview [monthlyProgress]="dashboardOverview?.monthlyProgress">
            </app-monthly-progress-overview>
          </section>

          <!-- Recent Expenses (Compact - 4 columns) -->
          <section class="recent-expenses-section">
            <mat-card class="expenses-compact-card card-subtle">
              <div class="card-header-compact">
                <h3>Recent Expenses</h3>
                <button mat-button class="view-all-prominent" color="primary">
                  <mat-icon>arrow_forward</mat-icon>
                  View All
                </button>
              </div>
              <div class="expenses-compact-list">
                <!-- Show only 3-4 most recent with category colors -->
                <div class="expense-item-compact grocery-category">
                  <mat-icon class="expense-icon">shopping_cart</mat-icon>
                  <span class="expense-desc">Grocery Store</span>
                  <span class="expense-amount">-$67.45</span>
                </div>
                <div class="expense-item-compact transportation-category">
                  <mat-icon class="expense-icon">local_gas_station</mat-icon>
                  <span class="expense-desc">Gas Station</span>
                  <span class="expense-amount">-$45.20</span>
                </div>
                <div class="expense-item-compact dining-category">
                  <mat-icon class="expense-icon">restaurant</mat-icon>
                  <span class="expense-desc">Restaurant</span>
                  <span class="expense-amount">-$23.75</span>
                </div>
                <div class="expense-item-compact shopping-category">
                  <mat-icon class="expense-icon">shopping_bag</mat-icon>
                  <span class="expense-desc">Online Purchase</span>
                  <span class="expense-amount">-$89.99</span>
                </div>
              </div>
            </mat-card>
          </section>

          <!-- Student Loans Section -->
          <section class="student-loans-section">
            <mat-card class="loans-card card-warning" [class.empty-state]="getTotalLoanBalance() === 0">
              <div class="card-header">
                <h3>Student Loans</h3>
                <button mat-icon-button class="manage-loans-btn" (click)="openLoanBreakdown()">
                  <mat-icon>settings</mat-icon>
                </button>
              </div>
              <div class="loans-content">
                <div class="loans-summary" *ngIf="getTotalLoanBalance() > 0; else emptyLoansState">
                  <div class="loan-stat">
                    <div class="stat-info">
                      <span class="stat-label">Total Balance</span>
                      <span class="stat-value balance-amount">{{getTotalLoanBalance() | currency}}</span>
                    </div>
                    <mat-icon class="stat-icon">account_balance</mat-icon>
                  </div>
                  
                  <div class="loan-stat">
                    <div class="stat-info">
                      <span class="stat-label">Monthly Payment</span>
                      <span class="stat-value payment-amount">{{getTotalLoanPayment() | currency}}</span>
                    </div>
                    <mat-icon class="stat-icon">payment</mat-icon>
                  </div>
                  
                  <button class="view-details-btn" mat-stroked-button (click)="openLoanBreakdown()">
                    <mat-icon>visibility</mat-icon>
                    View Details
                  </button>
                </div>

                <ng-template #emptyLoansState>
                  <div class="empty-loans-state">
                    <mat-icon class="empty-icon">school</mat-icon>
                    <p class="empty-message">No student loans added yet</p>
                    <button class="add-first-loan-btn" mat-raised-button color="primary" (click)="openLoanBreakdown()">
                      <mat-icon>add</mat-icon>
                      Add Student Loan
                    </button>
                  </div>
                </ng-template>
              </div>
            </mat-card>
          </section>

          <!-- Enhanced Savings Goals (4 columns) -->
          <section class="savings-goals-section">
            <mat-card class="goals-enhanced-card card-secondary">
              <div class="card-header">
                <h3>Savings Goals</h3>
                <button mat-icon-button class="add-goal-btn" (click)="openSavingsGoalDialog()">
                  <mat-icon>add</mat-icon>
                </button>
              </div>
              <div class="savings-goals-content">
                <!-- Dynamic goals display -->
                <div class="goal-item" *ngFor="let goal of savingsGoals">
                  <div class="goal-info">
                    <span class="goal-name">{{goal.goalName}}</span>
                    <span class="goal-progress">\${{(goal.currentProgress || 0) | number:'1.0-0'}} / \${{goal.targetAmount | number:'1.0-0'}}</span>
                  </div>
                  <div class="goal-monthly">
                    <span class="monthly-target">\${{goal.monthlyContribution | number:'1.0-0'}}/month</span>
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width.%]="getGoalProgressPercentage(goal)"></div>
                    </div>
                  </div>
                </div>

                <!-- Empty state when no goals -->
                <div class="empty-goals-state" *ngIf="savingsGoals.length === 0">
                  <mat-icon class="empty-icon">flag</mat-icon>
                  <p>No savings goals yet</p>
                  <p class="empty-subtitle">Create your first goal to start tracking your progress!</p>
                </div>

                <!-- Add new goal option -->
                <button class="add-goal-button" mat-stroked-button (click)="openSavingsGoalDialog()">
                  <mat-icon>add</mat-icon>
                  Add New Goal
                </button>
              </div>
            </mat-card>
          </section>


        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      min-height: 100vh;
      background: var(--color-neutral-100);
      font-family: var(--font-primary);
    }

    .dashboard-header {
      background: white;
      border-bottom: 1px solid var(--color-neutral-300);
      box-shadow: var(--shadow-sm);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: var(--spacing-md) var(--spacing-md);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .brand .app-title {
      font-family: var(--font-secondary);
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-primary);
      margin: 0;
      line-height: 1.2;
    }

    .brand .app-tagline {
      font-size: 0.9rem;
      color: var(--color-neutral-600);
      margin: 0;
      font-weight: 500;
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      flex-shrink: 0;
      min-width: 200px;
    }

    .welcome-text {
      font-family: var(--font-primary);
      font-weight: 500;
      color: var(--color-neutral-700);
      font-size: 0.95rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 150px;
    }

    .logout-btn {
      color: var(--color-neutral-600);
      transition: color 0.15s ease-out;
      flex-shrink: 0;
      width: 40px;
      height: 40px;
    }

    .logout-btn:hover {
      color: var(--color-primary);
    }

    .dashboard-main {
      padding: var(--spacing-lg) 0;
    }

    // Force proper grid layout
    .dashboard-container {
      display: grid !important;
      grid-template-columns: repeat(12, 1fr) !important;
      gap: var(--spacing-lg) !important;
      max-width: 1400px !important;
      margin: 0 auto !important;
      padding: 0 var(--spacing-md) !important;
    }

    // Ensure sections use proper grid positioning
    .hero-section {
      grid-column: 1 / -1 !important;
    }

    // NEW: Grid positioning for new layout
    .financial-overview-left {
      grid-column: span 6 !important;
    }

    .monthly-overview-right {
      grid-column: span 6 !important;
      display: flex;
      flex-direction: column;
    }

    .monthly-overview-right .overview-card {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .monthly-overview-right .overview-grid {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .budget-categories-section {
      grid-column: span 8 !important;
    }

    .monthly-progress-section {
      grid-column: span 4 !important;
    }

    .recent-expenses-section {
      grid-column: span 4 !important;
    }

    .student-loans-section {
      grid-column: span 4 !important;
    }

    .savings-goals-section {
      grid-column: span 4 !important;
    }

    // Responsive grid adjustments
    @media (max-width: 1199px) {
      .budget-categories-section,
      .monthly-progress-section {
        grid-column: 1 / -1 !important;
      }
      
      .financial-overview-left,
      .monthly-overview-right {
        grid-column: 1 / -1 !important;
      }
    }

    @media (max-width: 767px) {
      .dashboard-container {
        grid-template-columns: 1fr !important;
        gap: var(--spacing-md) !important;
      }
      
      .financial-overview-left,
      .monthly-overview-right,
      .recent-expenses-section,
      .student-loans-section,
      .savings-goals-section {
        grid-column: 1 / -1 !important;
      }
    }

    // Net Worth Card Enhancement
    .net-worth-card {
      background: linear-gradient(135deg, rgba(82, 183, 136, 0.1) 0%, rgba(90, 155, 212, 0.1) 100%);
      position: relative;
      overflow: hidden;
    }

    .net-worth-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--color-success) 0%, var(--color-secondary) 100%);
    }

    .net-worth-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .net-worth-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-neutral-600);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .net-worth-amount {
      font-family: var(--font-mono);
      font-size: 2rem;
      font-weight: 700;
      line-height: 1.1;
    }

    .net-worth-amount.excellent { color: var(--color-success); }
    .net-worth-amount.good { color: var(--color-secondary); }
    .net-worth-amount.attention { color: var(--color-warning); }
    .net-worth-amount.concern { color: var(--color-neutral-600); }

    .net-worth-icon {
      position: absolute;
      top: var(--spacing-md);
      right: var(--spacing-md);
      opacity: 0.3;
    }

    .net-worth-icon mat-icon {
      font-size: 40px !important;
      width: 40px !important;
      height: 40px !important;
      color: var(--color-success);
    }

    .last-updated {
      font-size: 0.875rem;
      color: var(--color-neutral-500);
      font-weight: 500;
    }

    // Account-specific styles
    .accounts-grid {
      display: grid;
      gap: var(--spacing-md);
    }

    .account-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md);
      border-radius: var(--border-radius-md);
      border: 1px solid var(--color-neutral-300);
      background: white;
      transition: all 0.2s ease-out;
    }

    .account-item.account-type-checking {
      background: rgba(90, 155, 212, 0.05);
      border-left: 4px solid var(--color-secondary);
    }

    .account-item.account-type-savings {
      background: rgba(82, 183, 136, 0.05);
      border-left: 4px solid var(--color-success);
    }

    .account-item.account-type-retirement {
      background: rgba(244, 162, 97, 0.05);
      border-left: 4px solid var(--color-accent);
    }

    .account-item:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .account-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex-grow: 1;
    }

    .account-label {
      font-size: 0.95rem;
      color: var(--color-neutral-700);
      font-weight: 600;
    }

    .account-balance {
      font-family: var(--font-mono);
      font-size: 1.25rem;
      font-weight: 700;
    }

    .account-balance.positive { color: var(--color-success); }
    .account-balance.neutral { color: var(--color-secondary); }
    .account-balance.concern { color: var(--color-neutral-600); }

    .account-actions {
      display: flex;
      gap: var(--spacing-xs);
      opacity: 0;
      transition: opacity 0.2s ease-out;
    }

    .account-item:hover .account-actions {
      opacity: 1;
    }

    // Overview Section styles
    .overview-grid {
      display: grid;
      gap: var(--spacing-md);
    }

    .overview-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm);
      border-radius: var(--border-radius-md);
      border: 1px solid;
      transition: all 0.2s ease-out;
    }

    .overview-item.income-item {
      background: rgba(90, 155, 212, 0.08);
      border-color: rgba(90, 155, 212, 0.2);
    }

    .overview-item.expense-item {
      background: rgba(244, 162, 97, 0.08);
      border-color: rgba(244, 162, 97, 0.2);
    }

    .overview-item:not(.income-item):not(.expense-item) {
      background: rgba(82, 183, 136, 0.08);
      border-color: rgba(82, 183, 136, 0.2);
    }

    .overview-item:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .overview-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .overview-amount {
      font-family: var(--font-mono);
      font-size: 1.125rem;
      font-weight: 600;
    }

    .overview-amount.positive { color: var(--color-success); }
    .overview-amount.neutral { color: var(--color-neutral-700); }
    .overview-amount.warning { color: var(--color-warning); }

    // Mobile responsive adjustments
    @media (max-width: 768px) {
      .header-content {
        padding: var(--spacing-sm);
        gap: var(--spacing-sm);
      }
      
      .welcome-text {
        display: none;
      }
      
      .user-menu {
        min-width: 40px;
      }
      
      .brand .app-title {
        font-size: 1.25rem;
      }
      
      .brand .app-tagline {
        font-size: 0.8rem;
      }
    }



    // Special card styling overrides
    .goals-secondary-card {
      background: rgba(244, 162, 97, 0.06);
      border: 1px solid rgba(244, 162, 97, 0.25);
      position: relative;
      overflow: hidden;
    }

    .goals-secondary-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--color-accent) 0%, rgba(244, 162, 97, 0.8) 100%);
    }

    // NEW: Financial Overview Stack Layout
    .financial-overview-stack {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      height: 100%;
    }

    // NEW: Compact Net Worth Card
    .net-worth-card-compact {
      background: linear-gradient(135deg, rgba(82, 183, 136, 0.1) 0%, rgba(90, 155, 212, 0.1) 100%);
      border-left: 4px solid var(--color-success);
      padding: var(--spacing-md) !important;
      flex: 0 0 auto;
    }

    .net-worth-content-compact {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .net-worth-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .net-worth-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-neutral-600);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .net-worth-icon-small {
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
      color: var(--color-success);
      opacity: 0.7;
    }

    .net-worth-amount {
      font-family: var(--font-mono);
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1.1;
      color: var(--color-success);
    }

    // NEW: Integrated Account Balances
    .accounts-card-integrated {
      flex: 1 1 auto;
      padding: var(--spacing-md) !important;
    }

    .card-header-compact {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-sm);
      
      h3 {
        font-size: 1rem;
        margin: 0;
        font-weight: 600;
      }
    }

    .accounts-grid-compact {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .accounts-grid-compact .account-item {
      padding: var(--spacing-sm);
      border-radius: var(--border-radius-sm);
    }

    .account-icon-small {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
    }

    .accounts-grid-compact .account-balance {
      font-size: 1rem;
    }

    .accounts-grid-compact .account-type-badge {
      display: none; // Hide type badges in compact view
    }

    // NEW: Enhanced Savings Goals
    .goals-enhanced-card {
      background: rgba(244, 162, 97, 0.06);
      border: 1px solid rgba(244, 162, 97, 0.25);
      border-left: 4px solid var(--color-accent);
    }

    .savings-goals-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .goal-item {
      padding: var(--spacing-sm);
      background: white;
      border-radius: var(--border-radius-sm);
      border: 1px solid var(--color-neutral-200);
    }

    .goal-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xs);
    }

    .goal-name {
      font-weight: 600;
      color: var(--color-neutral-700);
      font-size: 0.9rem;
    }

    .goal-progress {
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--color-neutral-600);
    }

    .goal-monthly {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .monthly-target {
      font-size: 0.75rem;
      color: var(--color-accent);
      font-weight: 500;
      white-space: nowrap;
    }

    .progress-bar {
      flex: 1;
      height: 6px;
      background: var(--color-neutral-200);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-success) 100%);
      transition: width 0.3s ease-out;
    }

    .add-goal-button {
      width: 100%;
      padding: var(--spacing-sm);
      border: 2px dashed var(--color-neutral-300);
      color: var(--color-neutral-600);
      background: transparent;
      
      &:hover {
        border-color: var(--color-accent);
        color: var(--color-accent);
      }
    }

    .empty-goals-state {
      text-align: center;
      padding: var(--spacing-lg);
      color: var(--color-neutral-600);
    }

    .empty-icon {
      font-size: 48px !important;
      width: 48px !important;
      height: 48px !important;
      color: var(--color-neutral-400);
      margin-bottom: var(--spacing-sm);
    }

    .empty-subtitle {
      font-size: 0.85rem;
      margin: 0;
      opacity: 0.7;
    }

    .add-goal-btn {
      width: 32px;
      height: 32px;
      
      mat-icon {
        font-size: 18px !important;
        width: 18px !important;
        height: 18px !important;
      }
    }

    // NEW: Compact Recent Expenses
    .expenses-compact-card {
      padding: var(--spacing-md) !important;
    }

    .expenses-compact-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .expense-item-compact {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm);
      border-radius: var(--border-radius-sm);
      border: 1px solid transparent;
      margin-bottom: var(--spacing-xs);
      transition: all 0.2s ease-out;
      
      .expense-icon {
        font-size: 16px !important;
        width: 16px !important;
        height: 16px !important;
        color: white;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        padding: 6px;
        box-sizing: content-box;
      }
      
      .expense-desc {
        flex: 1;
        font-size: 0.85rem;
        color: var(--color-neutral-800);
        font-weight: 500;
      }
      
      .expense-amount {
        font-family: var(--font-mono);
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--color-neutral-800);
      }
    }

    // Category-specific colors for expenses
    .expense-item-compact.grocery-category {
      background: rgba(76, 175, 80, 0.12);
      border-color: rgba(76, 175, 80, 0.3);
      
      .expense-icon {
        background: rgba(76, 175, 80, 0.8);
      }
    }

    .expense-item-compact.transportation-category {
      background: rgba(33, 150, 243, 0.12);
      border-color: rgba(33, 150, 243, 0.3);
      
      .expense-icon {
        background: rgba(33, 150, 243, 0.8);
      }
    }

    .expense-item-compact.dining-category {
      background: rgba(255, 152, 0, 0.12);
      border-color: rgba(255, 152, 0, 0.3);
      
      .expense-icon {
        background: rgba(255, 152, 0, 0.8);
      }
    }

    .expense-item-compact.shopping-category {
      background: rgba(156, 39, 176, 0.12);
      border-color: rgba(156, 39, 176, 0.3);
      
      .expense-icon {
        background: rgba(156, 39, 176, 0.8);
      }
    }

    .expense-item-compact:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    .view-all-prominent {
      font-weight: 600;
      font-size: 0.8rem;
      
      mat-icon {
        font-size: 16px !important;
        width: 16px !important;
        height: 16px !important;
      }
    }

    // Responsive adjustments for new layout
    @media (max-width: 1199px) {
      .financial-overview-stack {
        flex-direction: row;
        gap: var(--spacing-lg);
      }
      
      .net-worth-card-compact,
      .accounts-card-integrated {
        flex: 1;
      }
    }

    @media (max-width: 767px) {
      .financial-overview-stack {
        flex-direction: column;
      }
    }

    // Student Loans Section Styles
    .loans-card {
      background: rgba(249, 199, 79, 0.06);
      border: 1px solid rgba(249, 199, 79, 0.25);
      border-left: 4px solid var(--color-warning);
    }

    .loans-card.empty-state {
      background: rgba(244, 244, 244, 0.06);
      border-color: rgba(200, 200, 200, 0.25);
      border-left: 4px solid var(--color-neutral-400);
    }

    .loans-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .loans-summary {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .loan-stat {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm);
      background: white;
      border-radius: var(--border-radius-sm);
      border: 1px solid var(--color-neutral-200);
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-label {
      font-size: 0.8rem;
      color: var(--color-neutral-600);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-family: var(--font-mono);
      font-weight: 600;
      font-size: 1rem;
    }

    .stat-value.balance-amount {
      color: var(--color-warning);
    }

    .stat-value.payment-amount {
      color: var(--color-accent);
    }

    .stat-icon {
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
      color: var(--color-neutral-500);
    }

    .view-details-btn {
      width: 100%;
      border-color: var(--color-warning);
      color: var(--color-warning);
      
      &:hover {
        background-color: rgba(249, 199, 79, 0.1);
      }
    }

    .manage-loans-btn {
      width: 32px;
      height: 32px;
      color: var(--color-warning);
      
      &:hover {
        background-color: rgba(249, 199, 79, 0.1);
      }
      
      mat-icon {
        font-size: 18px !important;
        width: 18px !important;
        height: 18px !important;
      }
    }

    // Empty State Styles
    .empty-loans-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--spacing-md);
      padding: var(--spacing-lg) var(--spacing-sm);
    }

    .empty-icon {
      font-size: 48px !important;
      width: 48px !important;
      height: 48px !important;
      color: var(--color-neutral-400);
    }

    .empty-message {
      font-size: 0.9rem;
      color: var(--color-neutral-600);
      margin: 0;
    }

    .add-first-loan-btn {
      background-color: var(--color-primary);
      
      mat-icon {
        font-size: 16px !important;
        width: 16px !important;
        height: 16px !important;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: User | null = null;
  dashboardData: DashboardResponse | null = null;
  dashboardOverview: DashboardOverviewResponse | null = null;
  accounts: Account[] = [];
  studentLoanSummary: StudentLoanSummary | null = null;
  classificationHealth: BudgetHealthByClassification | null = null;
  savingsGoals: any[] = [];
  isLoading = false;
  private destroy$ = new Subject<void>();
  
  // Make Math available in template
  Math = Math;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private classificationService: ClassificationSuggestionService,
    private studentLoansService: StudentLoansService,
    private dialog: MatDialog,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.user = user;
      if (user) {
        this.loadDashboardData();
        this.loadClassificationHealth();
        this.loadStudentLoanData();
        this.loadSavingsGoals();
      }
    });

    // Listen for route changes to refresh data when returning to dashboard
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      filter((event: NavigationEnd) => event.url === '/dashboard'),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      // Add small delay to ensure any backend updates are complete
      setTimeout(() => {
        // Refresh all dashboard data when returning to dashboard
        this.refreshAllData();
      }, 100);
    });

    // Refresh user data to get latest loan information
    if (this.authService.getCurrentUser()) {
      this.authService.refreshCurrentUser().subscribe({
        next: () => {
          // User data will be updated through the subscription above
        },
        error: (error) => {
          console.error('Failed to refresh user data:', error);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshAllData(): void {
    if (this.user) {
      console.log('Refreshing all dashboard data...');
      this.loadDashboardData();
      this.loadClassificationHealth();
      this.loadStudentLoanData();
    }
  }

  loadDashboardData(): void {
    this.isLoading = true;
    console.log('Loading dashboard data...');
    
    // Load both the old dashboard data and the new complete overview
    const dashboardData$ = this.dashboardService.getDashboard();
    const completeOverview$ = this.dashboardService.getCompleteOverview();
    
    dashboardData$.subscribe({
      next: (data) => {
        console.log('Dashboard data received:', data);
        console.log('Budget categories:', data.budgetCategories);
        this.dashboardData = data;
        this.accounts = data.accounts;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load dashboard data:', error);
        // Still show interface even if accounts fail to load
        this.accounts = [];
        this.dashboardData = {
          overallHealthStatus: 'concern',
          totalNetWorth: 0,
          accounts: [],
          budgetCategories: []
        };
        this.cdr.detectChanges();
      }
    });

    completeOverview$.subscribe({
      next: (overview) => {
        console.log('Complete overview received:', overview);
        this.dashboardOverview = overview;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load complete overview:', error);
        this.isLoading = false;
        this.dashboardOverview = null;
        this.cdr.detectChanges();
      }
    });
  }

  loadClassificationHealth(): void {
    this.classificationService.getClassificationHealth().pipe(takeUntil(this.destroy$)).subscribe({
      next: (health) => {
        this.classificationHealth = health;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load classification health:', error);
        this.classificationHealth = null;
        this.cdr.detectChanges();
      }
    });
  }

  loadStudentLoanData(): void {
    this.studentLoansService.getStudentLoans().pipe(takeUntil(this.destroy$)).subscribe({
      next: (summary) => {
        console.log('Student loan summary received:', summary);
        this.studentLoanSummary = summary;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load student loan data:', error);
        // Set empty summary to allow adding loans
        this.studentLoanSummary = {
          totalBalance: 0,
          totalMonthlyPayment: 0,
          averageInterestRate: 0,
          totalLoans: 0,
          loans: []
        };
        this.cdr.detectChanges();
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // Logout successful - navigation handled by AuthService
      },
      error: () => {
        // If server logout fails, still clear local session
        this.authService.logoutLocal();
      }
    });
  }

  getTotalLoanBalance(): number {
    if (this.studentLoanSummary?.totalBalance) {
      return this.studentLoanSummary.totalBalance;
    }
    if (this.user?.studentLoanSummary?.totalBalance) {
      return this.user.studentLoanSummary.totalBalance;
    }
    return this.user?.studentLoanBalance || 0;
  }

  getTotalLoanPayment(): number {
    if (this.studentLoanSummary?.totalMonthlyPayment) {
      return this.studentLoanSummary.totalMonthlyPayment;
    }
    if (this.user?.studentLoanSummary?.totalMonthlyPayment) {
      return this.user.studentLoanSummary.totalMonthlyPayment;
    }
    return this.user?.studentLoanPayment || 0;
  }

  getHealthStatusClass(): string {
    if (!this.dashboardData) return 'concern';
    return this.dashboardData.overallHealthStatus;
  }

  getHealthStatusIcon(): string {
    const status = this.dashboardData?.overallHealthStatus || 'concern';
    switch (status) {
      case 'excellent': return 'check_circle';
      case 'good': return 'thumb_up';
      case 'attention': return 'warning';
      case 'concern': return 'error_outline';
      default: return 'help_outline';
    }
  }

  getHealthStatusTitle(): string {
    const status = this.dashboardData?.overallHealthStatus || 'concern';
    switch (status) {
      case 'excellent': return "You're doing excellent!";
      case 'good': return "You're doing good!";
      case 'attention': return 'Needs some attention';
      case 'concern': return 'Let\'s work on this together';
      default: return 'Getting started';
    }
  }

  getHealthStatusMessage(): string {
    const status = this.dashboardData?.overallHealthStatus || 'concern';
    switch (status) {
      case 'excellent': return 'Your finances are in great shape. Keep up the excellent work!';
      case 'good': return 'Your finances are on a good track. Nice progress!';
      case 'attention': return 'Your finances could use some attention. Small steps make big changes.';
      case 'concern': return 'Don\'t worry, everyone starts somewhere. Let\'s build your financial strength together.';
      default: return 'Add your account balances to see your financial health.';
    }
  }

  getNetWorthClass(): string {
    const netWorth = this.dashboardData?.totalNetWorth || 0;
    if (netWorth >= 50000) return 'excellent';
    if (netWorth >= 10000) return 'good';
    if (netWorth >= 1000) return 'attention';
    return 'concern';
  }

  getAccountTypeDisplay(type: string): string {
    switch (type.toLowerCase()) {
      case 'checking': return 'Checking';
      case 'savings': return 'Savings';
      case 'retirement': return 'Retirement';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }

  getAccountTypeIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'checking': return 'account_balance';
      case 'savings': return 'savings';
      case 'retirement': return 'elderly';
      default: return 'account_balance_wallet';
    }
  }

  getBalanceClass(balance: number): string {
    if (balance >= 10000) return 'positive';
    if (balance >= 1000) return 'neutral';
    return 'concern';
  }

  getLastUpdatedText(): string {
    if (this.accounts.length === 0) return 'No accounts';
    const mostRecent = this.accounts.reduce((latest, account) => {
      return new Date(account.lastUpdated) > new Date(latest.lastUpdated) ? account : latest;
    });
    return `Updated ${new Date(mostRecent.lastUpdated).toLocaleDateString()}`;
  }

  openAddAccountDialog(): void {
    const dialogData: AccountFormData = {
      isEdit: false
    };

    const dialogRef = this.dialog.open(AccountFormDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: dialogData,
      panelClass: 'account-form-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.type === 'create') {
        this.dashboardService.createAccount(result.data).subscribe({
          next: () => {
            // Add small delay to ensure backend has processed the creation
            setTimeout(() => {
              // Reload dashboard data after creating account
              this.loadDashboardData();
            }, 100);
          },
          error: (error) => {
            console.error('Failed to create account:', error);
            // TODO: Show error message to user
          }
        });
      }
    });
  }

  openEditAccountDialog(account: Account): void {
    const dialogData: AccountFormData = {
      account: account,
      isEdit: true
    };

    const dialogRef = this.dialog.open(AccountFormDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: dialogData,
      panelClass: 'account-form-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.type === 'update') {
        this.dashboardService.updateAccount(account.accountId, result.data).subscribe({
          next: () => {
            // Add small delay to ensure backend has processed the update
            setTimeout(() => {
              // Reload dashboard data after updating account
              this.loadDashboardData();
            }, 100);
          },
          error: (error) => {
            console.error('Failed to update account:', error);
            // TODO: Show error message to user
          }
        });
      }
    });
  }

  deleteAccount(account: Account): void {
    if (confirm(`Are you sure you want to delete "${account.accountName}"?`)) {
      this.dashboardService.deleteAccount(account.accountId).subscribe({
        next: () => {
          // Add small delay to ensure backend has processed the deletion
          setTimeout(() => {
            // Reload dashboard data after deleting account
            this.loadDashboardData();
          }, 100);
        },
        error: (error) => {
          console.error('Failed to delete account:', error);
          // TODO: Show error message to user
        }
      });
    }
  }

  openLoanBreakdown(): void {
    // Use already loaded data if available, otherwise fetch fresh data
    if (this.studentLoanSummary) {
      this.showLoanBreakdownModal(this.studentLoanSummary);
    } else {
      // Fallback to API call if no data is loaded yet
      this.studentLoansService.getStudentLoans().subscribe({
        next: (loanSummary) => {
          this.showLoanBreakdownModal(loanSummary);
        },
        error: (error) => {
          console.error('Failed to load loan data:', error);
          // Fall back to user profile data or create empty summary
          if (this.user?.studentLoanSummary) {
            this.showLoanBreakdownModal(this.user.studentLoanSummary);
          } else {
            // Create empty summary to allow adding loans
            const emptySummary: StudentLoanSummary = {
              totalBalance: 0,
              totalMonthlyPayment: 0,
              averageInterestRate: 0,
              totalLoans: 0,
              loans: []
            };
            this.showLoanBreakdownModal(emptySummary);
          }
        }
      });
    }
  }

  private showLoanBreakdownModal(loanSummary: StudentLoanSummary): void {
    const dialogRef = this.dialog.open(LoanBreakdownModalComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: loanSummary,
      panelClass: 'loan-breakdown-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'refresh') {
        // Refresh student loan data first
        this.loadStudentLoanData();
        
        // Also refresh all dashboard data when loans are modified
        this.refreshAllData();
        
        // Also refresh the user data to update loan summary
        this.authService.refreshCurrentUser().subscribe({
          error: (error) => {
            console.error('Failed to refresh user data:', error);
          }
        });
      }
    });
  }

  navigateToBudgetWizard(): void {
    this.router.navigate(['/budget-wizard']);
  }

  navigateToBudgetCategories(): void {
    this.router.navigate(['/budget-categories']);
  }

  navigateToExpenseLogging(): void {
    this.router.navigate(['/expense-logging']);
  }

  openSavingsGoalDialog(): void {
    // Calculate financial data for smart savings dialog
    const monthlyIncome = this.user?.monthlyIncome || 6500; // Sample data or user income
    
    // Calculate total from budget categories (when available)
    const totalBudgetCategories = this.dashboardOverview?.budgetSummary?.reduce((sum, category) => 
      sum + (category.monthlyLimit || 0), 0) || 4200; // Sample data
    
    // Get student loan payments
    const totalStudentLoans = this.getTotalLoanPayment();
    
    // Calculate available money for savings
    const availableForSavings = monthlyIncome - totalBudgetCategories - totalStudentLoans;

    const dialogData: SavingsGoalData = {
      monthlyIncome,
      totalBudgetCategories,
      totalStudentLoans,
      availableForSavings
    };

    const dialogRef = this.dialog.open(SmartSavingsGoalDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: dialogData,
      panelClass: 'smart-savings-dialog'
    });

    dialogRef.afterClosed().subscribe((result: SavingsGoalResult | string) => {
      if (result === 'navigate-budget') {
        this.navigateToBudgetCategories();
      } else if (result && typeof result === 'object') {
        // Handle successful goal creation
        console.log('Savings goal created:', result);
        this.saveSavingsGoal(result);
        this.loadSavingsGoals();
      }
    });
  }

  getBudgetStatusClass(): string {
    // Mock implementation - in real app, this would be calculated from budget data
    return 'ready-to-start';
  }

  getBudgetStatusText(): string {
    // Mock implementation - in real app, this would be calculated from budget data
    return 'Ready to set up';
  }

  getHealthStatusText(status: string): string {
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'attention': return 'Needs Attention';
      case 'concern': return 'Needs Help';
      default: return 'Unknown';
    }
  }

  getProgressPercentage(spending: number, limit: number): number {
    if (limit === 0) return 0;
    return Math.min((spending / limit) * 100, 100);
  }

  private saveSavingsGoal(goal: SavingsGoalResult): void {
    const existingGoals = this.getSavingsGoalsFromStorage();
    const goalWithId = {
      ...goal,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      currentProgress: 0 // Start with 0 progress
    };
    existingGoals.push(goalWithId);
    localStorage.setItem('savingsGoals', JSON.stringify(existingGoals));
  }

  private getSavingsGoalsFromStorage(): any[] {
    const stored = localStorage.getItem('savingsGoals');
    return stored ? JSON.parse(stored) : [];
  }

  private loadSavingsGoals(): void {
    this.savingsGoals = this.getSavingsGoalsFromStorage();
    console.log('Loaded savings goals:', this.savingsGoals);
    this.cdr.detectChanges(); // Force change detection
  }

  getGoalProgressPercentage(goal: any): number {
    if (!goal.targetAmount) return 0;
    return Math.min((goal.currentProgress || 0) / goal.targetAmount * 100, 100);
  }
}