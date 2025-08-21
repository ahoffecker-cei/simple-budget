import { Component, OnInit, OnDestroy, ViewChild, Input, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BaseChartDirective } from 'ng2-charts';
import { 
  Chart, 
  ChartConfiguration, 
  ChartData, 
  ChartEvent, 
  ChartType, 
  TooltipItem,
  registerables
} from 'chart.js';
import { 
  Expense, 
  BudgetCategory, 
  CATEGORY_COLORS 
} from '@simple-budget/shared';
import { ExpenseTrackingService } from '../services/expense-tracking.service';
import { BudgetCategoriesService } from '../../budget-setup/services/budget-categories.service';
import { ExpenseGraphsDetailsDialogComponent } from './expense-graphs-details-dialog.component';

export type TimeViewPeriod = 'day' | 'week' | 'month' | 'year';

interface ChartDataPoint {
  date: string;
  dateLabel: string;
  totalAmount: number;
  expenses: Expense[];
  categoryBreakdown: { [categoryId: string]: { amount: number; expenses: Expense[] } };
}

interface CategoryData {
  categoryId: string;
  name: string;
  color: string;
  totalAmount: number;
  expenseCount: number;
}

@Component({
  selector: 'app-expense-graphs',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatTooltipModule,
    BaseChartDirective
  ],
  templateUrl: './expense-graphs.component.html',
  styleUrls: ['./expense-graphs.component.scss']
})
export class ExpenseGraphsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  @Input() set expenses(value: Expense[]) {
    this._expenses = value;
    this.processExpenseData();
  }
  get expenses(): Expense[] {
    return this._expenses;
  }
  private _expenses: Expense[] = [];
  
  currentPeriod: TimeViewPeriod = 'week';
  chartData: ChartDataPoint[] = [];
  budgetCategories: BudgetCategory[] = [];
  
  // Navigation properties
  currentDate = new Date();
  navigationStartDate = new Date();
  
  // Chart configuration
  public chartType: ChartType = 'bar';
  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems: TooltipItem<'bar'>[]) => {
            const index = tooltipItems[0]?.dataIndex;
            return index !== undefined ? this.chartData[index]?.dateLabel || '' : '';
          },
          beforeLabel: (tooltipItem: TooltipItem<'bar'>) => {
            // Only show total on the first dataset to avoid duplication
            if (tooltipItem.datasetIndex === 0) {
              const index = tooltipItem.dataIndex;
              const dataPoint = this.chartData[index];
              if (dataPoint) {
                return `Total: ${this.formatCurrency(dataPoint.totalAmount)}`;
              }
            }
            return '';
          },
          label: (tooltipItem: TooltipItem<'bar'>) => {
            // Show individual category amounts
            const value = tooltipItem.parsed.y;
            const datasetLabel = tooltipItem.dataset.label;
            return value > 0 ? `${datasetLabel}: ${this.formatCurrency(value)}` : '';
          },
          afterLabel: () => {
            // Don't use afterLabel since we're handling everything in label
            return [];
          }
        },
        displayColors: false,
        filter: (tooltipItem: TooltipItem<'bar'>) => {
          // Only show tooltip items that have a value greater than 0
          return tooltipItem.parsed.y > 0;
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => this.formatCurrency(Number(value))
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    onClick: (event: ChartEvent, elements: any[]) => {
      if (elements.length > 0) {
        const elementIndex = elements[0].index;
        this.showChartDetails(elementIndex);
      }
    }
  };
  
  public chartDatasets: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  private destroy$ = new Subject<void>();

  constructor(
    private expenseService: ExpenseTrackingService,
    private categoriesService: BudgetCategoriesService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    // Register all Chart.js components
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadBudgetCategories();
    
    // Watch for expense changes when they're updated from parent
    setTimeout(() => {
      this.processExpenseData();
    }, 0);
  }

  ngAfterViewInit(): void {
    console.log('AfterViewInit - Chart reference:', this.chart);
    // Process data again after view init to ensure chart is available
    setTimeout(() => {
      if (this.chartData.length > 0) {
        this.updateChartData();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBudgetCategories(): void {
    this.categoriesService.loadBudgetCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.budgetCategories = categories;
          this.processExpenseData();
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        }
      });
  }

  onPeriodChange(period: TimeViewPeriod): void {
    this.currentPeriod = period;
    this.processExpenseData();
  }

  private processExpenseData(): void {
    console.log('Processing expense data:', {
      expensesCount: this.expenses.length,
      categoriesCount: this.budgetCategories.length,
      currentPeriod: this.currentPeriod
    });

    if (!this.expenses.length || !this.budgetCategories.length) {
      console.log('No expenses or categories, setting empty chart data');
      this.chartData = [];
      this.updateChartData();
      return;
    }

    this.chartData = this.groupExpensesByPeriod(this.expenses, this.currentPeriod);
    console.log('Generated chart data:', this.chartData);
    this.updateChartData();
  }

  private groupExpensesByPeriod(expenses: Expense[], period: TimeViewPeriod): ChartDataPoint[] {
    const grouped = new Map<string, ChartDataPoint>();
    
    // Use navigation date as reference instead of always using current date
    const referenceDate = new Date(this.navigationStartDate);
    
    // Determine the date range based on period
    const startDate = this.getStartDateForPeriod(referenceDate, period);
    const endDate = this.getEndDateForPeriod(referenceDate, period);
    
    expenses
      .filter(expense => new Date(expense.expenseDate) >= startDate)
      .forEach(expense => {
        const expenseDate = new Date(expense.expenseDate);
        const key = this.getGroupingKey(expenseDate, period);
        const label = this.getDateLabel(expenseDate, period);

        if (!grouped.has(key)) {
          grouped.set(key, {
            date: key,
            dateLabel: label,
            totalAmount: 0,
            expenses: [],
            categoryBreakdown: {}
          });
        }

        const dataPoint = grouped.get(key)!;
        dataPoint.totalAmount += expense.amount;
        dataPoint.expenses.push(expense);

        if (!dataPoint.categoryBreakdown[expense.categoryId]) {
          dataPoint.categoryBreakdown[expense.categoryId] = {
            amount: 0,
            expenses: []
          };
        }
        
        dataPoint.categoryBreakdown[expense.categoryId].amount += expense.amount;
        dataPoint.categoryBreakdown[expense.categoryId].expenses.push(expense);
      });

    // Fill in missing periods with zero amounts
    const result = this.fillMissingPeriods(Array.from(grouped.values()), period, startDate, endDate);
    
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  private getStartDateForPeriod(referenceDate: Date, period: TimeViewPeriod): Date {
    const start = new Date(referenceDate);
    
    switch (period) {
      case 'day':
        start.setDate(start.getDate() - 6); // Last 7 days from reference
        break;
      case 'week':
        // Get start of reference month
        start.setDate(1); // First day of reference month
        break;
      case 'month':
        start.setMonth(start.getMonth() - 11); // Last 12 months from reference
        start.setDate(1);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 4); // Last 5 years from reference
        start.setMonth(0, 1);
        break;
    }
    
    return start;
  }

  private getGroupingKey(date: Date, period: TimeViewPeriod): string {
    switch (period) {
      case 'day':
        return date.toISOString().split('T')[0];
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      case 'year':
        return date.getFullYear().toString();
    }
  }

  private getDateLabel(date: Date, period: TimeViewPeriod): string {
    switch (period) {
      case 'day':
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${weekStart.getDate()}-${weekEnd.getDate()} ${weekStart.toLocaleDateString('en-US', { month: 'short' })}`;
        } else {
          return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        }
      case 'month':
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      case 'year':
        return date.getFullYear().toString();
    }
  }

  private fillMissingPeriods(data: ChartDataPoint[], period: TimeViewPeriod, startDate: Date, endDate: Date): ChartDataPoint[] {
    const result: ChartDataPoint[] = [...data];
    const existingKeys = new Set(data.map(d => d.date));
    
    if (period === 'week') {
      // For weeks, create weekly periods within the current month
      const currentMonth = endDate.getMonth();
      const currentYear = endDate.getFullYear();
      
      // Find all the Monday dates in the current month
      const mondaysInMonth: Date[] = [];
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
      
      // Find the first Monday of the month (or the Monday of the week containing the 1st)
      let currentDate = new Date(firstDayOfMonth);
      currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Move to Monday
      
      // If this Monday is before the 1st of the month, move to the next Monday
      if (currentDate < firstDayOfMonth) {
        currentDate.setDate(currentDate.getDate() + 7);
      }
      
      // Add all Mondays that fall within or overlap with the current month
      while (currentDate.getMonth() === currentMonth || 
             (currentDate <= lastDayOfMonth && mondaysInMonth.length < 6)) {
        mondaysInMonth.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 7);
      }
      
      // Create entries for each week
      mondaysInMonth.forEach(monday => {
        const key = this.getGroupingKey(monday, period);
        if (!existingKeys.has(key)) {
          result.push({
            date: key,
            dateLabel: this.getDateLabel(monday, period),
            totalAmount: 0,
            expenses: [],
            categoryBreakdown: {}
          });
        }
      });
    } else {
      // Original logic for other periods
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const key = this.getGroupingKey(currentDate, period);
        
        if (!existingKeys.has(key)) {
          result.push({
            date: key,
            dateLabel: this.getDateLabel(currentDate, period),
            totalAmount: 0,
            expenses: [],
            categoryBreakdown: {}
          });
        }
        
        // Move to next period
        switch (period) {
          case 'day':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'month':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'year':
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
        }
      }
    }
    
    return result;
  }

  private updateChartData(): void {
    console.log('Updating chart data:', this.chartData.length, 'data points');
    
    if (!this.chartData.length) {
      console.log('No chart data, setting empty datasets');
      this.chartDatasets = {
        labels: [],
        datasets: []
      };
      this.chart?.update();
      return;
    }

    // Create stacked datasets for each category
    const categoryDatasets = new Map<string, number[]>();
    const labels = this.chartData.map(d => d.dateLabel);
    
    // Initialize all category datasets
    this.budgetCategories.forEach(category => {
      categoryDatasets.set(category.categoryId, new Array(this.chartData.length).fill(0));
    });

    // Fill in the actual data
    this.chartData.forEach((dataPoint, index) => {
      Object.entries(dataPoint.categoryBreakdown).forEach(([categoryId, data]) => {
        const dataset = categoryDatasets.get(categoryId);
        if (dataset) {
          dataset[index] = data.amount;
        }
      });
    });

    // Convert to Chart.js datasets format with gradients per category (stacked)
    const datasets = Array.from(categoryDatasets.entries())
      .filter(([, data]) => data.some(value => value > 0)) // Only include categories with data
      .map(([categoryId, data], index, array) => {
        const category = this.getCategoryById(categoryId);
        const baseColor = this.getCategoryColor(categoryId);
        const gradientColor = this.createCategoryGradient(baseColor);
        
        return {
          label: category?.name || 'Unknown',
          data: data,
          backgroundColor: gradientColor,
          borderColor: baseColor,
          borderWidth: 0,
          borderRadius: 6,
          categoryId: categoryId
        };
      });

    this.chartDatasets = {
      labels,
      datasets
    };

    // Update chart options for stacked bars
    if (this.chartOptions && this.chartOptions.scales) {
      this.chartOptions.scales['x'] = {
        ...this.chartOptions.scales['x'],
        stacked: true
      };
      this.chartOptions.scales['y'] = {
        ...this.chartOptions.scales['y'],
        stacked: true
      };
    }

    // Trigger change detection
    this.cdr.detectChanges();
    
    setTimeout(() => {
      console.log('Final chartDatasets:', JSON.stringify(this.chartDatasets, null, 2));
      console.log('Chart reference:', this.chart);
      if (this.chart) {
        console.log('Calling chart update...');
        this.chart.update();
      } else {
        console.error('Chart reference is undefined! Trying to detect changes...');
        this.cdr.detectChanges();
        setTimeout(() => {
          if (this.chart) {
            console.log('Chart found after change detection, updating...');
            this.chart.update();
          }
        }, 50);
      }
    }, 100);
  }

  private createCategoryGradient(baseColor: string): any {
    // Return a function that creates a simple gradient for the category color
    return (ctx: any) => {
      if (!ctx || !ctx.canvas) return baseColor;
      
      const chart = ctx.chart;
      const {chartArea} = chart;
      
      if (!chartArea) return baseColor;
      
      // Create a vertical gradient from top to bottom
      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      
      // Convert hex color to rgba for transparency effects
      const rgb = this.hexToRgb(baseColor);
      if (!rgb) return baseColor;

      // Create a simple gradient: solid color at top, slightly transparent at bottom
      gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.95)`);
      gradient.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`);
      gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`);

      return gradient;
    };
  }

  private hexToRgb(hex: string): {r: number, g: number, b: number} | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private getCategoryById(categoryId: string): BudgetCategory | undefined {
    return this.budgetCategories.find(cat => cat.categoryId === categoryId);
  }

  private getCategoryColor(categoryId: string): string {
    const category = this.getCategoryById(categoryId);
    if (!category) return '#6B7280'; // Default gray
    
    const color = CATEGORY_COLORS.find(c => c.id === category.colorId);
    return color?.value || '#6B7280';
  }

  private showChartDetails(index: number): void {
    const dataPoint = this.chartData[index];
    if (!dataPoint || dataPoint.expenses.length === 0) return;

    const categoryData: CategoryData[] = Object.entries(dataPoint.categoryBreakdown)
      .map(([categoryId, data]) => {
        const category = this.getCategoryById(categoryId);
        return {
          categoryId,
          name: category?.name || 'Unknown',
          color: this.getCategoryColor(categoryId),
          totalAmount: data.amount,
          expenseCount: data.expenses.length
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);

    this.dialog.open(ExpenseGraphsDetailsDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        period: dataPoint.dateLabel,
        totalAmount: dataPoint.totalAmount,
        expenseCount: dataPoint.expenses.length,
        categories: categoryData,
        expenses: dataPoint.expenses
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getTotalSpent(): number {
    return this.chartData.reduce((total, point) => total + point.totalAmount, 0);
  }

  getAverageSpending(): number {
    if (!this.chartData.length) return 0;
    const nonZeroData = this.chartData.filter(point => point.totalAmount > 0);
    if (!nonZeroData.length) return 0;
    return nonZeroData.reduce((total, point) => total + point.totalAmount, 0) / nonZeroData.length;
  }

  getHighestSpendingPeriod(): { period: string; amount: number } | null {
    if (!this.chartData.length) return null;
    
    const highest = this.chartData.reduce((max, current) => 
      current.totalAmount > max.totalAmount ? current : max
    );
    
    return {
      period: highest.dateLabel,
      amount: highest.totalAmount
    };
  }

  private getEndDateForPeriod(referenceDate: Date, period: TimeViewPeriod): Date {
    const end = new Date(referenceDate);
    
    switch (period) {
      case 'day':
        // End date is the reference date itself
        break;
      case 'week':
        // End of reference month
        end.setMonth(end.getMonth() + 1, 0);
        break;
      case 'month':
        // End of reference month
        end.setDate(1);
        end.setMonth(end.getMonth() + 1, 0);
        break;
      case 'year':
        // End of reference year
        end.setMonth(11, 31);
        break;
    }
    
    return end;
  }

  // Navigation methods
  goToPrevious(): void {
    switch (this.currentPeriod) {
      case 'day':
        this.navigationStartDate.setDate(this.navigationStartDate.getDate() - 7);
        break;
      case 'week':
        this.navigationStartDate.setMonth(this.navigationStartDate.getMonth() - 1);
        break;
      case 'month':
        this.navigationStartDate.setFullYear(this.navigationStartDate.getFullYear() - 1);
        break;
      case 'year':
        this.navigationStartDate.setFullYear(this.navigationStartDate.getFullYear() - 5);
        break;
    }
    this.processExpenseData();
  }

  goToNext(): void {
    const now = new Date();
    const futureCheck = new Date(this.navigationStartDate);
    
    switch (this.currentPeriod) {
      case 'day':
        futureCheck.setDate(futureCheck.getDate() + 7);
        if (futureCheck <= now) {
          this.navigationStartDate.setDate(this.navigationStartDate.getDate() + 7);
        }
        break;
      case 'week':
        futureCheck.setMonth(futureCheck.getMonth() + 1);
        if (futureCheck <= now) {
          this.navigationStartDate.setMonth(this.navigationStartDate.getMonth() + 1);
        }
        break;
      case 'month':
        futureCheck.setFullYear(futureCheck.getFullYear() + 1);
        if (futureCheck <= now) {
          this.navigationStartDate.setFullYear(this.navigationStartDate.getFullYear() + 1);
        }
        break;
      case 'year':
        futureCheck.setFullYear(futureCheck.getFullYear() + 5);
        if (futureCheck <= now) {
          this.navigationStartDate.setFullYear(this.navigationStartDate.getFullYear() + 5);
        }
        break;
    }
    this.processExpenseData();
  }

  goToCurrent(): void {
    this.navigationStartDate = new Date();
    this.processExpenseData();
  }

  canGoNext(): boolean {
    const now = new Date();
    const futureCheck = new Date(this.navigationStartDate);
    
    switch (this.currentPeriod) {
      case 'day':
        futureCheck.setDate(futureCheck.getDate() + 7);
        break;
      case 'week':
        futureCheck.setMonth(futureCheck.getMonth() + 1);
        break;
      case 'month':
        futureCheck.setFullYear(futureCheck.getFullYear() + 1);
        break;
      case 'year':
        futureCheck.setFullYear(futureCheck.getFullYear() + 5);
        break;
    }
    
    return futureCheck <= now;
  }

  getCurrentPeriodDisplay(): string {
    const date = this.navigationStartDate;
    
    switch (this.currentPeriod) {
      case 'day':
        const endDay = new Date(date);
        endDay.setDate(endDay.getDate() + 6);
        return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'week':
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      case 'month':
        const endMonth = new Date(date);
        endMonth.setFullYear(endMonth.getFullYear() + 1);
        endMonth.setMonth(endMonth.getMonth() - 1);
        return `${date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} - ${endMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}`;
      case 'year':
        const endYear = new Date(date);
        endYear.setFullYear(endYear.getFullYear() + 4);
        return `${date.getFullYear()} - ${endYear.getFullYear()}`;
    }
  }

  getPeriodLabel(): string {
    switch (this.currentPeriod) {
      case 'day': return 'Daily View';
      case 'week': return 'Weekly View';
      case 'month': return 'Monthly View';
      case 'year': return 'Yearly View';
    }
  }
}