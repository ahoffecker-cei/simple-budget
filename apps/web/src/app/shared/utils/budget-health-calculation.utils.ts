import { BudgetCategory, BudgetHealthByClassification } from '../../../../../../shared/src/models';

export class BudgetHealthCalculationUtils {
  
  static calculateClassificationHealth(
    categories: BudgetCategory[], 
    userIncome: number,
    essentialSpending: number = 0,
    nonEssentialSpending: number = 0
  ): BudgetHealthByClassification {
    
    const essentialCategories = categories.filter(cat => cat.isEssential);
    const nonEssentialCategories = categories.filter(cat => !cat.isEssential);
    
    const essentialLimit = essentialCategories.reduce((sum, cat) => sum + cat.monthlyLimit, 0);
    const nonEssentialLimit = nonEssentialCategories.reduce((sum, cat) => sum + cat.monthlyLimit, 0);
    
    return {
      essentialSpending,
      essentialLimit,
      nonEssentialSpending,
      nonEssentialLimit,
      essentialHealthStatus: this.calculateHealthStatus(essentialSpending, essentialLimit),
      nonEssentialHealthStatus: this.calculateHealthStatus(nonEssentialSpending, nonEssentialLimit)
    };
  }
  
  static calculateHealthStatus(spending: number, limit: number): 'excellent' | 'good' | 'attention' | 'concern' {
    if (limit === 0) return 'excellent';
    
    const percentage = spending / limit;
    
    if (percentage <= 0.5) return 'excellent';
    if (percentage <= 0.75) return 'good';
    if (percentage <= 0.9) return 'attention';
    return 'concern';
  }
  
  static getHealthStatusColor(status: string): string {
    switch (status) {
      case 'excellent': return 'primary';
      case 'good': return 'accent'; 
      case 'attention': return 'warn';
      case 'concern': return 'warn';
      default: return 'primary';
    }
  }
  
  static getHealthStatusIcon(status: string): string {
    switch (status) {
      case 'excellent': return 'check_circle';
      case 'good': return 'thumb_up';
      case 'attention': return 'warning';
      case 'concern': return 'error';
      default: return 'help';
    }
  }
  
  static getHealthMessage(status: string, type: 'essential' | 'non-essential'): string {
    const categoryType = type === 'essential' ? 'essential spending' : 'non-essential spending';
    
    switch (status) {
      case 'excellent': 
        return `Great job! Your ${categoryType} is well under control.`;
      case 'good': 
        return `Good work! Your ${categoryType} is within a healthy range.`;
      case 'attention': 
        return `Pay attention to your ${categoryType} - you're approaching your limits.`;
      case 'concern': 
        return `Your ${categoryType} needs immediate attention - you're over budget.`;
      default: 
        return `Review your ${categoryType} to ensure you're on track.`;
    }
  }
  
  static calculateEssentialPercentage(categories: BudgetCategory[], userIncome: number): number {
    if (userIncome <= 0) return 0;
    
    const essentialTotal = categories
      .filter(cat => cat.isEssential)
      .reduce((sum, cat) => sum + cat.monthlyLimit, 0);
      
    return Math.round((essentialTotal / userIncome) * 100);
  }
  
  static calculateNonEssentialPercentage(categories: BudgetCategory[], userIncome: number): number {
    if (userIncome <= 0) return 0;
    
    const nonEssentialTotal = categories
      .filter(cat => !cat.isEssential)
      .reduce((sum, cat) => sum + cat.monthlyLimit, 0);
      
    return Math.round((nonEssentialTotal / userIncome) * 100);
  }
  
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  
  static formatPercentage(percentage: number): string {
    return `${Math.round(percentage)}%`;
  }
}