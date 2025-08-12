import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DashboardService } from '../services/dashboard.service';
import { User, StudentLoanSummary, DashboardResponse, Account } from '@simple-budget/shared';
import { LoanBreakdownModalComponent } from './loan-breakdown-modal.component';
import { AccountFormDialogComponent, AccountFormData } from './account-form-dialog.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
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
          
          <!-- Financial Health Hero Section - answers "Am I doing okay?" -->
          <section class="health-hero" *ngIf="user">
            <div class="health-indicator" [ngClass]="getHealthStatusClass()">
              <div class="health-icon">
                <mat-icon>{{ getHealthStatusIcon() }}</mat-icon>
              </div>
              <div class="health-content">
                <h2 class="health-title">{{ getHealthStatusTitle() }}</h2>
                <p class="health-message">{{ getHealthStatusMessage() }}</p>
              </div>
            </div>
          </section>

          <!-- Net Worth Display -->
          <section class="net-worth-section" *ngIf="dashboardData">
            <mat-card class="net-worth-card">
              <div class="net-worth-content">
                <div class="net-worth-label">Total Net Worth</div>
                <div class="net-worth-amount" [ngClass]="getNetWorthClass()">
                  {{ dashboardData.totalNetWorth | currency }}
                </div>
              </div>
              <div class="net-worth-icon">
                <mat-icon>account_balance_wallet</mat-icon>
              </div>
            </mat-card>
          </section>

          <!-- Account Balances Card -->
          <section class="accounts-section" *ngIf="user">
            <mat-card class="accounts-card">
              <div class="card-header">
                <h3>Account Balances</h3>
                <span class="last-updated" *ngIf="!isLoading">
                  {{ getLastUpdatedText() }}
                </span>
                <span class="loading" *ngIf="isLoading">Loading...</span>
              </div>
              
              <div class="accounts-grid" *ngIf="!isLoading">
                <!-- Account Balance Items -->
                <div class="account-item clickable-account" 
                     *ngFor="let account of accounts; let i = index"
                     [ngClass]="'account-type-' + account.accountType"
                     (click)="openEditAccountDialog(account)"
                     [title]="'Click to edit ' + account.accountName">
                  <div class="account-info">
                    <span class="account-label">{{ account.accountName }}</span>
                    <span class="account-type-badge">{{ getAccountTypeDisplay(account.accountType) }}</span>
                    <span class="account-balance" [ngClass]="getBalanceClass(account.currentBalance)">
                      {{ account.currentBalance | currency }}
                    </span>
                  </div>
                  <div class="account-actions">
                    <button mat-icon-button 
                            class="edit-btn"
                            (click)="$event.stopPropagation(); openEditAccountDialog(account)"
                            [title]="'Edit ' + account.accountName">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button 
                            class="delete-btn"
                            (click)="$event.stopPropagation(); deleteAccount(account)"
                            [title]="'Delete ' + account.accountName">
                      <mat-icon>delete</mat-icon>
                    </button>
                    <mat-icon class="account-icon">{{ getAccountTypeIcon(account.accountType) }}</mat-icon>
                  </div>
                </div>
                
                <!-- Add Account Button -->
                <div class="account-item add-account-item" (click)="openAddAccountDialog()">
                  <div class="account-info">
                    <span class="account-label">Add New Account</span>
                    <span class="account-subtitle">Track more balances</span>
                  </div>
                  <mat-icon class="account-icon">add_circle_outline</mat-icon>
                </div>
                
                <!-- Empty State -->
                <div class="empty-accounts" *ngIf="accounts.length === 0">
                  <div class="empty-icon">
                    <mat-icon>account_balance</mat-icon>
                  </div>
                  <h4>No accounts yet</h4>
                  <p>Add your first account to start tracking your balances</p>
                  <button mat-raised-button color="primary" (click)="openAddAccountDialog()">
                    <mat-icon>add</mat-icon>
                    Add Account
                  </button>
                </div>
              </div>
              
              <div class="loading-state" *ngIf="isLoading">
                <div class="loading-spinner">
                  <mat-icon>hourglass_empty</mat-icon>
                </div>
                <p>Loading your accounts...</p>
              </div>
            </mat-card>
          </section>

          <!-- Income and Expenses Overview -->
          <section class="overview-section" *ngIf="user">
            <mat-card class="overview-card">
              <div class="card-header">
                <h3>Monthly Overview</h3>
              </div>
              <div class="overview-grid">
                <div class="overview-item income-item">
                  <div class="overview-info">
                    <span class="overview-label">Monthly Income</span>
                    <span class="overview-amount positive">{{user.monthlyIncome | currency}}</span>
                  </div>
                  <mat-icon class="overview-icon">trending_up</mat-icon>
                </div>
                <div class="overview-item expense-item" *ngIf="getTotalLoanPayment() > 0">
                  <div class="overview-info">
                    <span class="overview-label">Student Loan Payment</span>
                    <span class="overview-amount neutral">{{getTotalLoanPayment() | currency}}</span>
                  </div>
                  <mat-icon class="overview-icon">school</mat-icon>
                </div>
                <div class="overview-item clickable-item" 
                     *ngIf="getTotalLoanBalance() > 0" 
                     (click)="openLoanBreakdown()"
                     title="Click to view loan breakdown">
                  <div class="overview-info">
                    <span class="overview-label">
                      Total Loan Balance
                      <mat-icon class="info-icon">info</mat-icon>
                    </span>
                    <span class="overview-amount warning">{{getTotalLoanBalance() | currency}}</span>
                  </div>
                  <mat-icon class="overview-icon">account_balance</mat-icon>
                </div>
              </div>
            </mat-card>
          </section>

          <!-- Monthly Budget - Primary Tool -->
          <section class="monthly-budget-section" *ngIf="user">
            <mat-card class="budget-primary-card">
              <div class="card-header">
                <h3>Monthly Budget</h3>
                <span class="budget-subtitle">Your primary budgeting tool</span>
              </div>
              <div class="budget-overview">
                <div class="budget-status-row">
                  <div class="budget-info">
                    <span class="budget-label">Monthly Income</span>
                    <span class="budget-amount income">{{user.monthlyIncome | currency}}</span>
                  </div>
                  <div class="budget-info">
                    <span class="budget-label">Budget Status</span>
                    <span class="budget-status" [ngClass]="getBudgetStatusClass()">{{ getBudgetStatusText() }}</span>
                  </div>
                </div>
                <div class="categories-preview">
                  <div class="category-item preview-item">
                    <mat-icon class="category-icon essential">star</mat-icon>
                    <div class="category-info">
                      <span class="category-label">Essential Categories</span>
                      <span class="category-desc">Groceries, utilities, housing</span>
                    </div>
                  </div>
                  <div class="category-item preview-item">
                    <mat-icon class="category-icon flexible">favorite</mat-icon>
                    <div class="category-info">
                      <span class="category-label">Flexible Categories</span>
                      <span class="category-desc">Entertainment, dining out</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="budget-actions">
                <button mat-raised-button color="primary" class="primary-action-button" (click)="navigateToBudgetCategories()">
                  <mat-icon>category</mat-icon>
                  Manage Your Budget
                </button>
              </div>
            </mat-card>
          </section>

          <!-- Savings Goals - Secondary Tool -->
          <section class="savings-goals-section" *ngIf="user">
            <mat-card class="goals-secondary-card">
              <div class="card-header">
                <h3>Savings Goals</h3>
                <span class="goals-subtitle">Plan for your future</span>
              </div>
              <div class="goals-content">
                <div class="goals-icon">
                  <mat-icon>savings</mat-icon>
                </div>
                <div class="goals-text">
                  <h4>Set your financial goals</h4>
                  <p>Create savings goals and debt payoff plans once your monthly budget is set up.</p>
                </div>
              </div>
              <div class="goals-actions">
                <button mat-button color="primary" class="secondary-action-button" (click)="navigateToBudgetWizard()">
                  <mat-icon>flag</mat-icon>
                  Set Savings Goals
                </button>
              </div>
            </mat-card>
          </section>

          <!-- Profile Summary -->
          <section class="profile-section" *ngIf="user">
            <mat-card class="profile-card">
              <div class="card-header">
                <h3>Your Profile</h3>
                <button mat-button class="edit-profile-btn">
                  <mat-icon>edit</mat-icon>
                  Edit
                </button>
              </div>
              <div class="profile-details">
                <div class="profile-item">
                  <span class="profile-label">Email</span>
                  <span class="profile-value">{{user.email}}</span>
                </div>
                <div class="profile-item">
                  <span class="profile-label">Member Since</span>
                  <span class="profile-value">{{user.createdAt | date:'MMMM yyyy'}}</span>
                </div>
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
      max-width: 1200px;
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

    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--spacing-md);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    // Financial Health Hero Section
    .health-hero {
      margin-bottom: var(--spacing-md);
    }

    .health-indicator {
      background: white;
      border-radius: var(--border-radius-lg);
      padding: var(--spacing-lg);
      box-shadow: var(--shadow-md);
      border: 1px solid var(--color-neutral-300);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      position: relative;
      overflow: hidden;
    }

    .health-indicator::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--color-success);
    }

    .health-indicator.excellent {
      border-left: 4px solid var(--color-success);
    }

    .health-icon {
      background: rgba(82, 183, 136, 0.1);
      border-radius: 50%;
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      padding: 8px;
    }

    .health-icon mat-icon {
      font-size: 32px !important;
      width: 32px !important;
      height: 32px !important;
      color: var(--color-success) !important;
      font-family: 'Material Icons' !important;
      line-height: 1 !important;
    }

    .health-content .health-title {
      font-family: var(--font-secondary);
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-neutral-900);
      margin: 0 0 var(--spacing-xs) 0;
      line-height: 1.2;
    }

    .health-content .health-message {
      font-size: 1rem;
      color: var(--color-neutral-600);
      margin: 0;
      line-height: 1.4;
    }

    // Net Worth Section
    .net-worth-card {
      background: linear-gradient(135deg, rgba(82, 183, 136, 0.1) 0%, rgba(90, 155, 212, 0.1) 100%);
      border: 1px solid rgba(82, 183, 136, 0.2);
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

    .net-worth-amount.excellent {
      color: var(--color-success);
    }

    .net-worth-amount.good {
      color: var(--color-secondary);
    }

    .net-worth-amount.attention {
      color: var(--color-warning);
    }

    .net-worth-amount.concern {
      color: var(--color-neutral-600);
    }

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

    // Cards
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
      padding-bottom: var(--spacing-sm);
      border-bottom: 1px solid var(--color-neutral-300);
    }

    .card-header h3 {
      font-family: var(--font-secondary);
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-neutral-900);
      margin: 0;
    }

    .last-updated {
      font-size: 0.875rem;
      color: var(--color-neutral-500);
      font-weight: 500;
    }

    // Account Balances
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
      position: relative;
    }

    .account-item.account-type-checking {
      background: rgba(90, 155, 212, 0.05);
      border-color: rgba(90, 155, 212, 0.2);
      border-left: 4px solid var(--color-secondary);
    }

    .account-item.account-type-savings {
      background: rgba(82, 183, 136, 0.05);
      border-color: rgba(82, 183, 136, 0.2);
      border-left: 4px solid var(--color-success);
    }

    .account-item.account-type-retirement {
      background: rgba(244, 162, 97, 0.05);
      border-color: rgba(244, 162, 97, 0.2);
      border-left: 4px solid var(--color-accent);
    }

    .add-account-item {
      border: 2px dashed var(--color-neutral-400);
      background: rgba(249, 199, 79, 0.03);
      cursor: pointer;
      justify-content: center;
      text-align: center;
    }

    .add-account-item:hover {
      border-color: var(--color-secondary);
      background: rgba(90, 155, 212, 0.05);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .account-item:hover:not(.add-account-item) {
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .clickable-item {
      cursor: pointer;
    }

    .clickable-item:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .clickable-item:active {
      transform: translateY(0px);
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
      margin-bottom: 2px;
    }

    .account-type-badge {
      font-size: 0.75rem;
      color: var(--color-neutral-500);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .account-subtitle {
      font-size: 0.8rem;
      color: var(--color-neutral-500);
      font-weight: 400;
    }

    .account-balance {
      font-family: var(--font-mono);
      font-size: 1.25rem;
      font-weight: 700;
    }

    .account-balance.positive {
      color: var(--color-success);
    }

    .account-balance.neutral {
      color: var(--color-secondary);
    }

    .account-balance.concern {
      color: var(--color-neutral-600);
    }

    .account-icon {
      opacity: 0.8;
      font-size: 28px !important;
      width: 28px !important;
      height: 28px !important;
      font-family: 'Material Icons' !important;
      line-height: 1 !important;
      flex-shrink: 0;
    }

    .account-item.account-type-checking .account-icon {
      color: var(--color-secondary);
    }

    .account-item.account-type-savings .account-icon {
      color: var(--color-success);
    }

    .account-item.account-type-retirement .account-icon {
      color: var(--color-accent);
    }

    .add-account-item .account-icon {
      color: var(--color-neutral-500);
    }

    .add-account-item:hover .account-icon {
      color: var(--color-secondary);
    }

    // Account Actions
    .clickable-account {
      cursor: pointer;
    }

    .account-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      opacity: 0;
      transition: opacity 0.2s ease-out;
    }

    .clickable-account:hover .account-actions {
      opacity: 1;
    }

    .edit-btn, .delete-btn {
      width: 32px !important;
      height: 32px !important;
      padding: 0 !important;
      min-width: auto !important;
    }

    .edit-btn {
      color: var(--color-secondary);
    }

    .edit-btn:hover {
      background-color: rgba(90, 155, 212, 0.1);
    }

    .delete-btn {
      color: var(--color-neutral-500);
    }

    .delete-btn:hover {
      color: #d32f2f;
      background-color: rgba(211, 47, 47, 0.1);
    }

    .account-actions mat-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
    }

    // Empty State and Loading
    .empty-accounts {
      text-align: center;
      padding: var(--spacing-xl);
      color: var(--color-neutral-600);
    }

    .empty-icon {
      margin-bottom: var(--spacing-md);
    }

    .empty-icon mat-icon {
      font-size: 48px !important;
      width: 48px !important;
      height: 48px !important;
      color: var(--color-neutral-400);
    }

    .empty-accounts h4 {
      font-family: var(--font-secondary);
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--color-neutral-700);
    }

    .empty-accounts p {
      margin: 0 0 var(--spacing-md) 0;
      color: var(--color-neutral-500);
    }

    .loading-state {
      text-align: center;
      padding: var(--spacing-xl);
      color: var(--color-neutral-600);
    }

    .loading-spinner mat-icon {
      font-size: 32px !important;
      width: 32px !important;
      height: 32px !important;
      color: var(--color-secondary);
      animation: spin 2s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    // Overview Section (formerly account balances)
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

    .overview-item:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .overview-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .overview-label {
      font-size: 0.875rem;
      color: var(--color-neutral-600);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .info-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      color: var(--color-secondary) !important;
      opacity: 0.7;
    }

    .overview-amount {
      font-family: var(--font-mono);
      font-size: 1.125rem;
      font-weight: 600;
    }

    .overview-amount.positive {
      color: var(--color-success);
    }

    .overview-amount.neutral {
      color: var(--color-neutral-700);
    }

    .overview-amount.warning {
      color: var(--color-warning);
    }

    .overview-icon {
      opacity: 0.8;
      font-size: 24px !important;
      width: 24px !important;
      height: 24px !important;
      font-family: 'Material Icons' !important;
      line-height: 1 !important;
    }

    .overview-item.income-item .overview-icon {
      color: var(--color-secondary);
    }

    .overview-item.expense-item .overview-icon {
      color: var(--color-accent);
    }

    .overview-item:nth-child(3) .overview-icon {
      color: var(--color-warning);
    }

    // Monthly Budget - Primary Card
    .budget-primary-card {
      background: linear-gradient(135deg, rgba(90, 155, 212, 0.12) 0%, rgba(82, 183, 136, 0.08) 100%);
      border: 2px solid rgba(90, 155, 212, 0.3);
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow-lg);
      transform: scale(1.02);
    }

    .budget-primary-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--color-secondary) 0%, var(--color-success) 100%);
    }

    .budget-subtitle {
      font-size: 0.8rem;
      color: var(--color-secondary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .budget-overview {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      margin: var(--spacing-md) 0;
    }

    .budget-status-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-md);
      flex-wrap: wrap;
    }

    .budget-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 140px;
    }

    .budget-label {
      font-size: 0.875rem;
      color: var(--color-neutral-600);
      font-weight: 500;
    }

    .budget-amount.income {
      font-family: var(--font-mono);
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-success);
    }

    .budget-status {
      font-size: 0.95rem;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: var(--border-radius-sm);
      text-align: center;
    }

    .budget-status.ready-to-start {
      background: rgba(90, 155, 212, 0.15);
      color: var(--color-secondary);
      border: 1px solid rgba(90, 155, 212, 0.3);
    }

    .primary-action-button {
      height: 56px;
      font-weight: 700;
      font-size: 1.1rem;
      border-radius: var(--border-radius-md);
      padding: 0 var(--spacing-xl);
      min-width: 180px;
      box-shadow: var(--shadow-md);
      text-transform: none;
    }

    // Savings Goals - Secondary Card
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

    .goals-subtitle {
      font-size: 0.8rem;
      color: var(--color-accent);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .goals-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      margin: var(--spacing-md) 0;
    }

    .goals-icon {
      background: rgba(244, 162, 97, 0.15);
      border-radius: 50%;
      width: 52px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .goals-icon mat-icon {
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
      color: var(--color-accent);
      font-family: 'Material Icons' !important;
      line-height: 1 !important;
    }

    .goals-text {
      flex: 1;
    }

    .goals-text h4 {
      font-family: var(--font-secondary);
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-neutral-900);
      margin: 0 0 var(--spacing-xs) 0;
    }

    .goals-text p {
      color: var(--color-neutral-600);
      margin: 0;
      line-height: 1.4;
      font-size: 0.95rem;
    }

    .secondary-action-button {
      height: 44px;
      font-weight: 500;
      border-radius: var(--border-radius-md);
      padding: 0 var(--spacing-md);
      min-width: 140px;
      font-size: 0.95rem;
    }

    // Profile Details
    .profile-details {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .profile-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm) 0;
      border-bottom: 1px solid var(--color-neutral-300);
    }

    .profile-item:last-child {
      border-bottom: none;
    }

    .profile-label {
      font-weight: 500;
      color: var(--color-neutral-600);
    }

    .profile-value {
      font-weight: 500;
      color: var(--color-neutral-900);
    }

    .edit-profile-btn {
      color: var(--color-secondary);
      font-weight: 500;
      transition: color 0.15s ease-out;
    }

    .edit-profile-btn:hover {
      color: var(--color-accent);
    }

    .profile-card {
      position: relative;
    }

    .profile-card::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 3px;
      background: linear-gradient(180deg, var(--color-secondary) 0%, var(--color-accent) 100%);
      border-radius: 0 var(--border-radius-lg) var(--border-radius-lg) 0;
    }

    // Responsive design
    @media (max-width: 768px) {
      .header-content {
        padding: var(--spacing-sm);
        gap: var(--spacing-sm);
      }
      
      .dashboard-container {
        padding: 0 var(--spacing-sm);
        gap: var(--spacing-md);
      }
      
      .health-indicator {
        flex-direction: column;
        text-align: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-md);
      }
      
      .health-content .health-title {
        font-size: 1.25rem;
      }
      
      .health-content .health-message {
        font-size: 0.9rem;
      }
      
      .setup-content {
        flex-direction: column;
        text-align: center;
        gap: var(--spacing-sm);
      }
      
      .setup-button {
        width: 100%;
        max-width: 200px;
      }
      
      .brand .app-title {
        font-size: 1.25rem;
      }
      
      .brand .app-tagline {
        font-size: 0.8rem;
      }
      
      .welcome-text {
        display: none;
      }
      
      .user-menu {
        min-width: 40px;
      }
    }

    @media (min-width: 769px) {
      .dashboard-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-lg);
        align-items: start;
      }
      
      .health-hero {
        grid-column: 1 / -1;
        margin-bottom: 0;
      }
      
      .net-worth-section {
        grid-column: 1 / -1;
      }
      
      .accounts-section {
        grid-column: 1;
      }
      
      .overview-section {
        grid-column: 2;
      }
      
      .profile-section {
        grid-column: 2;
      }
      
      .monthly-budget-section {
        grid-column: 1;
      }
      
      .savings-goals-section {
        grid-column: 2;
      }
    }

    @media (min-width: 1200px) {
      .dashboard-container {
        grid-template-columns: 2fr 1fr 1fr;
      }
      
      .health-hero {
        grid-column: 1 / -1;
      }
      
      .net-worth-section {
        grid-column: 1 / -1;
      }
      
      .accounts-section {
        grid-column: 1;
      }
      
      .overview-section {
        grid-column: 2;
      }
      
      .profile-section {
        grid-column: 3;
        grid-row: 3 / 6;
      }
      
      .monthly-budget-section {
        grid-column: 1 / 3;
      }
      
      .savings-goals-section {
        grid-column: 1 / 2;
        grid-row: 5;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  dashboardData: DashboardResponse | null = null;
  accounts: Account[] = [];
  isLoading = false;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private dialog: MatDialog,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.loadDashboardData();
      }
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

  loadDashboardData(): void {
    this.isLoading = true;
    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.accounts = data.accounts;
        this.isLoading = false;
        // Force change detection to ensure UI updates
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load dashboard data:', error);
        this.isLoading = false;
        // Still show interface even if accounts fail to load
        this.accounts = [];
        this.dashboardData = {
          overallHealthStatus: 'concern',
          totalNetWorth: 0,
          accounts: []
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
    if (this.user?.studentLoanSummary?.totalBalance) {
      return this.user.studentLoanSummary.totalBalance;
    }
    return this.user?.studentLoanBalance || 0;
  }

  getTotalLoanPayment(): number {
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
    if (this.user?.studentLoanSummary) {
      this.dialog.open(LoanBreakdownModalComponent, {
        width: '800px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        data: this.user.studentLoanSummary,
        panelClass: 'loan-breakdown-dialog'
      });
    } else {
      // If no detailed loan data, show a mock breakdown for demonstration
      const mockSummary: StudentLoanSummary = {
        totalBalance: this.getTotalLoanBalance(),
        totalMonthlyPayment: this.getTotalLoanPayment(),
        averageInterestRate: 5.5,
        totalLoans: 3,
        loans: [
          {
            id: '1',
            userId: this.user?.userId || '',
            servicerName: 'Navient',
            accountNumber: '****1234',
            balance: this.getTotalLoanBalance() * 0.4,
            interestRate: 4.5,
            monthlyPayment: this.getTotalLoanPayment() * 0.3,
            loanType: 'federal',
            status: 'active',
            createdAt: '2023-01-01',
            updatedAt: '2024-01-01'
          },
          {
            id: '2',
            userId: this.user?.userId || '',
            servicerName: 'Great Lakes',
            accountNumber: '****5678',
            balance: this.getTotalLoanBalance() * 0.35,
            interestRate: 6.0,
            monthlyPayment: this.getTotalLoanPayment() * 0.4,
            loanType: 'federal',
            status: 'active',
            createdAt: '2023-01-01',
            updatedAt: '2024-01-01'
          },
          {
            id: '3',
            userId: this.user?.userId || '',
            servicerName: 'SallieMae',
            accountNumber: '****9012',
            balance: this.getTotalLoanBalance() * 0.25,
            interestRate: 7.2,
            monthlyPayment: this.getTotalLoanPayment() * 0.3,
            loanType: 'private',
            status: 'active',
            createdAt: '2023-01-01',
            updatedAt: '2024-01-01'
          }
        ]
      };

      this.dialog.open(LoanBreakdownModalComponent, {
        width: '800px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        data: mockSummary,
        panelClass: 'loan-breakdown-dialog'
      });
    }
  }

  navigateToBudgetWizard(): void {
    this.router.navigate(['/budget-wizard']);
  }

  navigateToBudgetCategories(): void {
    this.router.navigate(['/budget-categories']);
  }

  getBudgetStatusClass(): string {
    // Mock implementation - in real app, this would be calculated from budget data
    return 'ready-to-start';
  }

  getBudgetStatusText(): string {
    // Mock implementation - in real app, this would be calculated from budget data
    return 'Ready to set up';
  }
}