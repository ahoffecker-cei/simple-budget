import { BudgetCategory, BudgetValidationResult } from '../../../../../../../shared/src/models';

export class BudgetCalculationUtils {
  
  static calculateTotalBudget(categories: BudgetCategory[]): number {
    return categories.reduce((total, category) => total + category.monthlyLimit, 0);
  }

  static calculateRemainingIncome(userIncome: number, categories: BudgetCategory[]): number {
    const totalBudget = this.calculateTotalBudget(categories);
    return userIncome - totalBudget;
  }

  static calculateBudgetPercentage(categoryLimit: number, userIncome: number): number {
    if (userIncome === 0) return 0;
    return (categoryLimit / userIncome) * 100;
  }

  static calculateTotalBudgetPercentage(categories: BudgetCategory[], userIncome: number): number {
    const totalBudget = this.calculateTotalBudget(categories);
    if (userIncome === 0) return 0;
    return (totalBudget / userIncome) * 100;
  }

  static isOverBudget(categories: BudgetCategory[], userIncome: number): boolean {
    const totalBudget = this.calculateTotalBudget(categories);
    return totalBudget > userIncome;
  }

  static getBudgetHealthStatus(categories: BudgetCategory[], userIncome: number): {
    status: 'excellent' | 'good' | 'fair' | 'over-budget';
    percentage: number;
    message: string;
  } {
    const percentage = this.calculateTotalBudgetPercentage(categories, userIncome);
    
    if (percentage > 100) {
      return {
        status: 'over-budget',
        percentage,
        message: 'Your budget exceeds your income. Consider reducing some categories.'
      };
    } else if (percentage <= 60) {
      return {
        status: 'excellent',
        percentage,
        message: 'Excellent! You have plenty of room for savings and unexpected expenses.'
      };
    } else if (percentage <= 80) {
      return {
        status: 'good',
        percentage,
        message: 'Good budget allocation. You still have some flexibility for savings.'
      };
    } else if (percentage < 100) {  // Changed to handle exactly 100%
      return {
        status: 'fair',
        percentage,
        message: 'Your budget is quite tight. Consider reviewing expenses for potential savings.'
      };
    } else {  // percentage === 100
      return {
        status: 'fair',
        percentage,
        message: 'You\'re using 100% of your income. Consider building an emergency fund.'
      };
    }
  }

  static getRecommendedLimit(
    categoryName: string, 
    userIncome: number, 
    isEssential: boolean
  ): number {
    // Simplified recommendation logic based on common budgeting guidelines
    const recommendations: Record<string, number> = {
      'housing': 0.30,
      'groceries': 0.10,
      'transportation': 0.15,
      'utilities': 0.05,
      'health & fitness': 0.05,
      'entertainment': 0.05,
      'dining out': 0.05,
      'shopping': 0.05
    };

    const categoryKey = categoryName.toLowerCase();
    const recommendedPercentage = recommendations[categoryKey] || (isEssential ? 0.08 : 0.03);
    
    return Math.round(userIncome * recommendedPercentage);
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  static formatPercentage(percentage: number): string {
    return `${Math.round(percentage)}%`;
  }

  static validateCategoryName(name: string, existingCategories: BudgetCategory[], excludeId?: string): {
    isValid: boolean;
    errorMessage?: string;
  } {
    if (!name || name.trim().length === 0) {
      return {
        isValid: false,
        errorMessage: 'Category name is required'
      };
    }

    if (name.trim().length > 100) {
      return {
        isValid: false,
        errorMessage: 'Category name must be 100 characters or less'
      };
    }

    const isDuplicate = existingCategories.some(cat => 
      cat.name.toLowerCase() === name.trim().toLowerCase() && 
      cat.categoryId !== excludeId
    );

    if (isDuplicate) {
      return {
        isValid: false,
        errorMessage: 'A category with this name already exists'
      };
    }

    return { isValid: true };
  }

  static validateMonthlyLimit(limit: number, userIncome: number): {
    isValid: boolean;
    errorMessage?: string;
  } {
    if (limit <= 0) {
      return {
        isValid: false,
        errorMessage: 'Monthly limit must be greater than $0'
      };
    }

    if (limit > userIncome) {
      return {
        isValid: false,
        errorMessage: 'Monthly limit cannot exceed your total income'
      };
    }

    return { isValid: true };
  }
}