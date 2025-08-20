using api.Data;
using api.DTOs;
using api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace api.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly IBudgetCalculationService _budgetCalculationService;
    private readonly IIncomeManagementService _incomeManagementService;
    private readonly ISavingsGoalService _savingsGoalService;
    private readonly TimeSpan _cacheExpiry = TimeSpan.FromMinutes(15);
    
    public DashboardService(ApplicationDbContext context, IMemoryCache cache, IBudgetCalculationService budgetCalculationService, IIncomeManagementService incomeManagementService, ISavingsGoalService savingsGoalService)
    {
        _context = context;
        _cache = cache;
        _budgetCalculationService = budgetCalculationService;
        _incomeManagementService = incomeManagementService;
        _savingsGoalService = savingsGoalService;
    }

    public async Task<DashboardOverviewResponseDto> GetCompleteOverviewAsync(string userId)
    {
        var cacheKey = $"dashboard_overview_{userId}_{DateTime.Now:yyyy-MM}";
        
        if (_cache.TryGetValue(cacheKey, out DashboardOverviewResponseDto? cachedOverview) && cachedOverview != null)
        {
            return cachedOverview;
        }

        // Fetch all data sequentially to avoid DbContext threading issues
        var accounts = await GetAccountsAsync(userId);
        var budgetSummaries = await GetBudgetCategorySummariesAsync(userId);
        var recentExpenses = await GetRecentExpensesAsync(userId, 10);
        var monthlyProgress = await GetMonthlyProgressSummaryAsync(userId);

        var totalNetWorth = accounts.Sum(a => a.CurrentBalance);
        var overallHealth = CalculateOverallHealthStatus(totalNetWorth, monthlyProgress.PercentageUsed);
        var healthMessage = GetHealthMessage(overallHealth);

        var overview = new DashboardOverviewResponseDto
        {
            OverallHealthStatus = overallHealth,
            OverallHealthMessage = healthMessage,
            TotalNetWorth = totalNetWorth,
            Accounts = accounts.ToList(),
            BudgetSummary = budgetSummaries.ToList(),
            RecentExpenses = recentExpenses.ToList(),
            MonthlyProgress = monthlyProgress
        };

        _cache.Set(cacheKey, overview, _cacheExpiry);
        return overview;
    }

    public async Task<EnhancedDashboardResponseDto> GetEnhancedOverviewAsync(string userId)
    {
        var currentMonth = DateTime.Now.ToString("yyyy-MM");
        var cacheKey = $"enhanced_dashboard_{userId}_{currentMonth}";

        if (_cache.TryGetValue(cacheKey, out EnhancedDashboardResponseDto? cachedEnhancedOverview) && cachedEnhancedOverview != null)
        {
            return cachedEnhancedOverview;
        }

        // Fetch all data sequentially to avoid DbContext concurrency issues
        var accounts = await GetAccountsAsync(userId);
        var budgetSummaries = await GetBudgetCategorySummariesAsync(userId);
        var recentExpenses = await GetRecentExpensesAsync(userId, 10);
        var monthlyProgress = await GetMonthlyProgressSummaryAsync(userId);
        var incomeManagement = await _incomeManagementService.GetIncomeManagementAsync(userId);
        var savingsGoals = await _savingsGoalService.GetSavingsGoalProgressAsync(userId);

        var totalNetWorth = accounts.Sum(a => a.CurrentBalance);
        var overallHealth = CalculateEnhancedOverallHealthStatus(totalNetWorth, monthlyProgress.PercentageUsed, savingsGoals);
        var healthMessage = GetHealthMessage(overallHealth);

        var enhancedOverview = new EnhancedDashboardResponseDto
        {
            Accounts = accounts.ToList(),
            BudgetSummary = budgetSummaries.ToList(),
            RecentExpenses = recentExpenses.ToList(),
            MonthlyProgress = monthlyProgress,
            IncomeManagement = incomeManagement,
            SavingsGoals = savingsGoals,
            OverallHealthStatus = overallHealth,
            OverallHealthMessage = healthMessage
        };

        _cache.Set(cacheKey, enhancedOverview, _cacheExpiry);
        return enhancedOverview;
    }

    public async Task<BudgetCategorySummaryDto[]> GetBudgetCategorySummariesAsync(string userId)
    {
        var cacheKey = $"budget_summaries_{userId}_{DateTime.Now:yyyy-MM}";
        
        if (_cache.TryGetValue(cacheKey, out BudgetCategorySummaryDto[]? cachedSummaries) && cachedSummaries != null)
        {
            return cachedSummaries;
        }

        var categories = await _context.BudgetCategories
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.IsEssential ? 0 : 1)
            .ThenBy(c => c.Name)
            .ToListAsync();

        var currentMonth = DateTime.Today;
        var startOfMonth = new DateTime(currentMonth.Year, currentMonth.Month, 1);
        var endOfMonth = startOfMonth.AddMonths(1);

        var categorySpending = await _context.Expenses
            .Where(e => e.UserId == userId && 
                       e.ExpenseDate >= startOfMonth && 
                       e.ExpenseDate < endOfMonth)
            .GroupBy(e => e.CategoryId)
            .Select(g => new { 
                CategoryId = g.Key, 
                TotalSpending = g.Sum(e => e.Amount),
                ExpenseCount = g.Count()
            })
            .ToDictionaryAsync(x => x.CategoryId, x => new { x.TotalSpending, x.ExpenseCount });

        var summaries = categories.Select(category =>
        {
            var spendingInfo = categorySpending.GetValueOrDefault(category.CategoryId, new { TotalSpending = 0m, ExpenseCount = 0 });
            var currentSpent = spendingInfo.TotalSpending;
            var remainingBudget = category.MonthlyLimit - currentSpent;
            var percentageUsed = category.MonthlyLimit > 0 ? (currentSpent / category.MonthlyLimit) * 100 : 0;
            var healthStatus = CalculateCategoryHealthStatus(percentageUsed);

            return new BudgetCategorySummaryDto
            {
                CategoryId = category.CategoryId,
                CategoryName = category.Name,
                MonthlyLimit = category.MonthlyLimit,
                CurrentSpent = currentSpent,
                RemainingBudget = remainingBudget,
                PercentageUsed = Math.Min(percentageUsed, 100),
                HealthStatus = healthStatus,
                IsEssential = category.IsEssential,
                ColorId = category.ColorId,
                IconId = category.IconId,
                ExpenseCount = spendingInfo.ExpenseCount
            };
        }).ToArray();

        _cache.Set(cacheKey, summaries, TimeSpan.FromMinutes(10));
        return summaries;
    }

    public async Task<ExpenseWithCategoryDto[]> GetRecentExpensesAsync(string userId, int count = 10)
    {
        var cacheKey = $"recent_expenses_{userId}_{count}";
        
        if (_cache.TryGetValue(cacheKey, out ExpenseWithCategoryDto[]? cachedExpenses) && cachedExpenses != null)
        {
            return cachedExpenses;
        }

        var expenses = await _context.Expenses
            .Where(e => e.UserId == userId)
            .Include(e => e.BudgetCategory)
            .Include(e => e.SavingsGoal)
            .OrderByDescending(e => e.CreatedAt)
            .Take(count)
            .Select(expense => new ExpenseWithCategoryDto
            {
                ExpenseId = expense.ExpenseId,
                Amount = expense.Amount,
                Description = expense.Description,
                ExpenseDate = expense.ExpenseDate,
                CreatedAt = expense.CreatedAt,
                CategoryName = expense.BudgetCategory.Name,
                CategoryId = expense.CategoryId,
                IsEssential = expense.BudgetCategory.IsEssential,
                ColorId = expense.BudgetCategory.ColorId,
                IconId = expense.BudgetCategory.IconId
            })
            .ToArrayAsync();

        _cache.Set(cacheKey, expenses, TimeSpan.FromMinutes(5));
        return expenses;
    }

    public async Task<MonthlyProgressSummaryDto> GetMonthlyProgressSummaryAsync(string userId)
    {
        var cacheKey = $"monthly_progress_{userId}_{DateTime.Now:yyyy-MM}";
        
        if (_cache.TryGetValue(cacheKey, out MonthlyProgressSummaryDto? cachedProgress) && cachedProgress != null)
        {
            return cachedProgress;
        }

        var categories = await _context.BudgetCategories
            .Where(c => c.UserId == userId)
            .ToListAsync();

        var totalBudgeted = categories.Sum(c => c.MonthlyLimit);

        var currentMonth = DateTime.Today;
        var startOfMonth = new DateTime(currentMonth.Year, currentMonth.Month, 1);
        var endOfMonth = startOfMonth.AddMonths(1);

        var totalSpent = await _context.Expenses
            .Where(e => e.UserId == userId && 
                       e.ExpenseDate >= startOfMonth && 
                       e.ExpenseDate < endOfMonth)
            .SumAsync(e => e.Amount);

        var percentageUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
        var daysInMonth = DateTime.DaysInMonth(currentMonth.Year, currentMonth.Month);
        var daysElapsed = currentMonth.Day;
        var daysRemaining = daysInMonth - daysElapsed;

        // Project spending based on current rate
        var dailySpendingRate = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
        var projectedMonthlySpending = dailySpendingRate * daysInMonth;

        // Determine if on track (projected spending should not exceed budget significantly)
        var onTrack = projectedMonthlySpending <= totalBudgeted * 1.1m; // Allow 10% buffer

        var progress = new MonthlyProgressSummaryDto
        {
            TotalBudgeted = totalBudgeted,
            TotalSpent = totalSpent,
            PercentageUsed = Math.Min(percentageUsed, 100),
            DaysRemainingInMonth = daysRemaining,
            ProjectedMonthlySpending = projectedMonthlySpending,
            OnTrackForMonth = onTrack
        };

        _cache.Set(cacheKey, progress, _cacheExpiry);
        return progress;
    }

    public async Task<ExpenseWithCategoryDto[]> GetCategoryExpensesAsync(string userId, Guid categoryId, int? year = null, int? month = null)
    {
        var targetDate = year.HasValue && month.HasValue 
            ? new DateTime(year.Value, month.Value, 1)
            : DateTime.Today;
        var startOfMonth = new DateTime(targetDate.Year, targetDate.Month, 1);
        var endOfMonth = startOfMonth.AddMonths(1);

        var cacheKey = $"category_expenses_{userId}_{categoryId}_{startOfMonth:yyyy-MM}";
        
        if (_cache.TryGetValue(cacheKey, out ExpenseWithCategoryDto[]? cachedExpenses) && cachedExpenses != null)
        {
            return cachedExpenses;
        }

        var expenses = await _context.Expenses
            .Where(e => e.UserId == userId && 
                       e.CategoryId == categoryId &&
                       e.ExpenseDate >= startOfMonth && 
                       e.ExpenseDate < endOfMonth)
            .Join(_context.BudgetCategories,
                expense => expense.CategoryId,
                category => category.CategoryId,
                (expense, category) => new ExpenseWithCategoryDto
                {
                    ExpenseId = expense.ExpenseId,
                    Amount = expense.Amount,
                    Description = expense.Description,
                    ExpenseDate = expense.ExpenseDate,
                    CreatedAt = expense.CreatedAt,
                    CategoryName = category.Name,
                    CategoryId = category.CategoryId,
                    IsEssential = category.IsEssential,
                    ColorId = category.ColorId,
                    IconId = category.IconId
                })
            .OrderByDescending(e => e.ExpenseDate)
            .ThenByDescending(e => e.CreatedAt)
            .ToArrayAsync();

        _cache.Set(cacheKey, expenses, TimeSpan.FromMinutes(10));
        return expenses;
    }

    public async Task InvalidateDashboardCacheAsync(string userId)
    {
        var currentMonth = DateTime.Now.ToString("yyyy-MM");
        var keysToRemove = new[]
        {
            $"dashboard_overview_{userId}_{currentMonth}",
            $"enhanced_dashboard_{userId}_{currentMonth}",
            $"budget_summaries_{userId}_{currentMonth}",
            $"recent_expenses_{userId}_10",
            $"monthly_progress_{userId}_{currentMonth}"
        };

        foreach (var key in keysToRemove)
        {
            _cache.Remove(key);
        }

        await Task.CompletedTask;
    }

    private async Task<AccountDto[]> GetAccountsAsync(string userId)
    {
        return await _context.Accounts
            .Where(a => a.UserId == userId)
            .Select(a => new AccountDto
            {
                AccountId = a.AccountId,
                UserId = a.UserId,
                AccountType = a.AccountType.ToString().ToLower(),
                AccountName = a.AccountName,
                CurrentBalance = a.CurrentBalance,
                LastUpdated = a.LastUpdated
            })
            .ToArrayAsync();
    }

    private static string CalculateOverallHealthStatus(decimal totalNetWorth, decimal budgetPercentageUsed)
    {
        // Consider both net worth and budget usage
        var netWorthHealth = totalNetWorth switch
        {
            >= 50000 => 4, // excellent
            >= 10000 => 3, // good  
            >= 1000 => 2,  // attention
            _ => 1         // concern
        };

        var budgetHealth = budgetPercentageUsed switch
        {
            <= 50 => 4,   // excellent
            <= 75 => 3,   // good
            <= 90 => 2,   // attention
            _ => 1        // concern
        };

        // Weight budget health more heavily as it's more actionable
        var overallScore = (budgetHealth * 0.7) + (netWorthHealth * 0.3);

        return overallScore switch
        {
            >= 3.5 => "excellent",
            >= 2.5 => "good", 
            >= 1.5 => "attention",
            _ => "concern"
        };
    }

    private static string CalculateCategoryHealthStatus(decimal percentageUsed)
    {
        return percentageUsed switch
        {
            <= 50 => "excellent",
            <= 75 => "good",
            <= 100 => "attention",
            _ => "concern"
        };
    }

    private static string CalculateEnhancedOverallHealthStatus(decimal totalNetWorth, decimal budgetPercentageUsed, List<SavingsGoalProgressDto> savingsGoals)
    {
        // Consider net worth, budget usage, and savings progress
        var netWorthHealth = totalNetWorth switch
        {
            >= 50000 => 4, // excellent
            >= 10000 => 3, // good  
            >= 1000 => 2,  // attention
            _ => 1         // concern
        };

        var budgetHealth = budgetPercentageUsed switch
        {
            <= 50 => 4,   // excellent
            <= 75 => 3,   // good
            <= 90 => 2,   // attention
            _ => 1        // concern
        };

        // Calculate savings goal health
        var savingsHealth = 4; // Default excellent if no goals
        if (savingsGoals.Any())
        {
            var avgProgress = savingsGoals.Average(sg => sg.PercentageComplete);
            savingsHealth = avgProgress switch
            {
                >= 75 => 4,   // excellent
                >= 50 => 3,   // good
                >= 25 => 2,   // attention
                _ => 1        // concern
            };
        }

        // Weight budget health most heavily, then savings, then net worth
        var overallScore = (budgetHealth * 0.5) + (savingsHealth * 0.3) + (netWorthHealth * 0.2);

        return overallScore switch
        {
            >= 3.5 => "excellent",
            >= 2.5 => "good", 
            >= 1.5 => "attention",
            _ => "concern"
        };
    }

    private static string GetHealthMessage(string healthStatus)
    {
        return healthStatus switch
        {
            "excellent" => "You're doing fantastic! Your budget is on track and you're building strong financial habits.",
            "good" => "You're doing well! Your spending is under control with room for small treats.",
            "attention" => "You're mostly on track! A few categories need attention, but you've got this.",
            "concern" => "Let's make some adjustments together. Your financial goals are still achievable.",
            _ => "Your financial status is being calculated..."
        };
    }
}