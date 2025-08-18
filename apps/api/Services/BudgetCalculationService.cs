using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using api.Data;
using api.DTOs;
using api.Models;

namespace api.Services;

public class BudgetCalculationService : IBudgetCalculationService
{
    private readonly ApplicationDbContext _context;
    private readonly IMemoryCache _cache;
    private static readonly TimeSpan BudgetImpactPreviewCacheDuration = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan OverallBudgetHealthCacheDuration = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan MonthlyProgressCacheDuration = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan CategoryTotalsCacheDuration = TimeSpan.FromMinutes(15);

    public BudgetCalculationService(ApplicationDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<BudgetImpactPreviewDto> GetBudgetImpactPreviewAsync(string userId, Guid categoryId, decimal amount, DateTime? expenseDate = null)
    {
        var targetDate = expenseDate ?? DateTime.Now;
        var cacheKey = $"budget_impact_{userId}_{categoryId}_{amount}_{targetDate:yyyy-MM}";

        if (_cache.TryGetValue(cacheKey, out BudgetImpactPreviewDto? cached))
            return cached!;

        var category = await _context.BudgetCategories
            .Where(c => c.CategoryId == categoryId && c.UserId == userId)
            .FirstOrDefaultAsync();

        if (category == null)
            throw new ArgumentException("Category not found or does not belong to user");

        var currentSpent = await GetCategorySpentAmountAsync(userId, categoryId, targetDate);
        var newSpentAmount = currentSpent + amount;
        var remainingAfterExpense = category.MonthlyLimit - newSpentAmount;
        var percentageUsed = category.MonthlyLimit > 0 ? (newSpentAmount / category.MonthlyLimit) * 100 : 0;

        var healthStatus = CalculateHealthStatus(newSpentAmount, category.MonthlyLimit);
        var encouragementLevel = CalculateEncouragementLevel(healthStatus, category.IsEssential);
        var impactMessage = GenerateImpactMessage(healthStatus, encouragementLevel, category.IsEssential, remainingAfterExpense);

        var result = new BudgetImpactPreviewDto
        {
            CategoryId = categoryId,
            CategoryName = category.Name,
            CurrentSpent = currentSpent,
            MonthlyLimit = category.MonthlyLimit,
            RemainingAfterExpense = remainingAfterExpense,
            PercentageUsed = Math.Round(percentageUsed, 2),
            HealthStatus = healthStatus.ToString().ToLower(),
            IsEssential = category.IsEssential,
            ImpactMessage = impactMessage,
            EncouragementLevel = encouragementLevel.ToString().ToLower()
        };

        _cache.Set(cacheKey, result, BudgetImpactPreviewCacheDuration);
        return result;
    }

    public async Task<OverallBudgetHealthDto> GetOverallBudgetHealthAsync(string userId)
    {
        var currentMonth = DateTime.Now.ToString("yyyy-MM");
        var cacheKey = $"budget_health_{userId}_{currentMonth}";

        if (_cache.TryGetValue(cacheKey, out OverallBudgetHealthDto? cached))
            return cached!;

        var categories = await _context.BudgetCategories
            .Where(c => c.UserId == userId)
            .ToListAsync();

        var totalBudgeted = categories.Sum(c => c.MonthlyLimit);
        var totalSpent = 0m;

        foreach (var category in categories)
        {
            totalSpent += await GetCategorySpentAmountAsync(userId, category.CategoryId, DateTime.Now);
        }

        var percentageUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
        var overallStatus = CalculateHealthStatus(totalSpent, totalBudgeted);

        var essentialCategories = categories.Where(c => c.IsEssential).ToList();
        var nonEssentialCategories = categories.Where(c => !c.IsEssential).ToList();

        var essentialSpent = 0m;
        var nonEssentialSpent = 0m;

        foreach (var category in essentialCategories)
        {
            essentialSpent += await GetCategorySpentAmountAsync(userId, category.CategoryId, DateTime.Now);
        }

        foreach (var category in nonEssentialCategories)
        {
            nonEssentialSpent += await GetCategorySpentAmountAsync(userId, category.CategoryId, DateTime.Now);
        }

        var essentialBudgeted = essentialCategories.Sum(c => c.MonthlyLimit);
        var nonEssentialBudgeted = nonEssentialCategories.Sum(c => c.MonthlyLimit);

        var essentialHealth = CalculateHealthStatus(essentialSpent, essentialBudgeted);
        var nonEssentialHealth = CalculateHealthStatus(nonEssentialSpent, nonEssentialBudgeted);

        var result = new OverallBudgetHealthDto
        {
            OverallStatus = overallStatus.ToString().ToLower(),
            TotalBudgeted = totalBudgeted,
            TotalSpent = totalSpent,
            PercentageUsed = Math.Round(percentageUsed, 2),
            EssentialCategoriesHealth = essentialHealth.ToString().ToLower(),
            NonEssentialCategoriesHealth = nonEssentialHealth.ToString().ToLower(),
            HealthMessage = GenerateHealthMessage(overallStatus, percentageUsed),
            EncouragementMessage = GenerateEncouragementMessage(overallStatus, essentialHealth, nonEssentialHealth)
        };

        _cache.Set(cacheKey, result, OverallBudgetHealthCacheDuration);
        return result;
    }

    public async Task<MonthlyProgressDataDto[]> GetMonthlyProgressDataAsync(string userId)
    {
        var currentMonth = DateTime.Now.ToString("yyyy-MM");
        var cacheKey = $"monthly_progress_{userId}_{currentMonth}";

        if (_cache.TryGetValue(cacheKey, out MonthlyProgressDataDto[]? cached))
            return cached!;

        var categories = await _context.BudgetCategories
            .Where(c => c.UserId == userId)
            .ToListAsync();

        var progressData = new List<MonthlyProgressDataDto>();
        var daysRemainingInMonth = DateTime.DaysInMonth(DateTime.Now.Year, DateTime.Now.Month) - DateTime.Now.Day;

        foreach (var category in categories)
        {
            var currentSpent = await GetCategorySpentAmountAsync(userId, category.CategoryId, DateTime.Now);
            var percentageUsed = category.MonthlyLimit > 0 ? (currentSpent / category.MonthlyLimit) * 100 : 0;
            var healthStatus = CalculateHealthStatus(currentSpent, category.MonthlyLimit);
            
            var dailyAverage = DateTime.Now.Day > 0 ? currentSpent / DateTime.Now.Day : 0;
            var projectedSpending = dailyAverage * DateTime.DaysInMonth(DateTime.Now.Year, DateTime.Now.Month);

            progressData.Add(new MonthlyProgressDataDto
            {
                CategoryId = category.CategoryId,
                CategoryName = category.Name,
                CurrentSpent = currentSpent,
                MonthlyLimit = category.MonthlyLimit,
                PercentageUsed = Math.Round(percentageUsed, 2),
                IsEssential = category.IsEssential,
                HealthStatus = healthStatus.ToString().ToLower(),
                DaysRemainingInMonth = daysRemainingInMonth,
                ProjectedSpending = Math.Round(projectedSpending, 2)
            });
        }

        var result = progressData.ToArray();
        _cache.Set(cacheKey, result, MonthlyProgressCacheDuration);
        return result;
    }

    public async Task<BudgetHealthStatusEnum> CalculateCategoryHealthStatusAsync(string userId, Guid categoryId, decimal currentSpent, decimal monthlyLimit)
    {
        return CalculateHealthStatus(currentSpent, monthlyLimit);
    }

    public async Task InvalidateBudgetCacheAsync(string userId, Guid? categoryId = null)
    {
        var keysToRemove = new List<string>();
        var currentMonth = DateTime.Now.ToString("yyyy-MM");

        // Remove user-specific cache entries
        keysToRemove.Add($"budget_health_{userId}_{currentMonth}");
        keysToRemove.Add($"monthly_progress_{userId}_{currentMonth}");

        if (categoryId.HasValue)
        {
            // Remove category-specific entries - we need to check common amounts
            var commonAmounts = new[] { 5, 10, 15, 20, 25, 50, 100, 200, 500, 1000 };
            foreach (var amount in commonAmounts)
            {
                keysToRemove.Add($"budget_impact_{userId}_{categoryId}_{amount}_{currentMonth}");
                keysToRemove.Add($"category_spent_{userId}_{categoryId}_{currentMonth}");
            }
        }

        foreach (var key in keysToRemove)
        {
            _cache.Remove(key);
        }
    }

    private async Task<decimal> GetCategorySpentAmountAsync(string userId, Guid categoryId, DateTime targetDate)
    {
        var cacheKey = $"category_spent_{userId}_{categoryId}_{targetDate:yyyy-MM}";

        if (_cache.TryGetValue(cacheKey, out decimal cached))
            return cached;

        var startOfMonth = new DateTime(targetDate.Year, targetDate.Month, 1);
        var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);

        var spent = await _context.Expenses
            .Where(e => e.UserId == userId && 
                       e.CategoryId == categoryId && 
                       e.ExpenseDate >= startOfMonth && 
                       e.ExpenseDate <= endOfMonth)
            .SumAsync(e => e.Amount);

        _cache.Set(cacheKey, spent, CategoryTotalsCacheDuration);
        return spent;
    }

    private static BudgetHealthStatusEnum CalculateHealthStatus(decimal spent, decimal limit)
    {
        if (limit <= 0) return BudgetHealthStatusEnum.Excellent;

        var percentage = spent / limit;
        
        return percentage switch
        {
            <= 0.5m => BudgetHealthStatusEnum.Excellent,
            <= 0.75m => BudgetHealthStatusEnum.Good,
            <= 0.9m => BudgetHealthStatusEnum.Attention,
            _ => BudgetHealthStatusEnum.Concern
        };
    }

    private static string CalculateEncouragementLevel(BudgetHealthStatusEnum healthStatus, bool isEssential)
    {
        return healthStatus switch
        {
            BudgetHealthStatusEnum.Excellent => "celebration",
            BudgetHealthStatusEnum.Good => "encouragement",
            BudgetHealthStatusEnum.Attention => "guidance",
            BudgetHealthStatusEnum.Concern => "support",
            _ => "encouragement"
        };
    }

    private static string GenerateImpactMessage(BudgetHealthStatusEnum healthStatus, string encouragementLevel, bool isEssential, decimal remaining)
    {
        var categoryType = isEssential ? "essential" : "nice-to-have";
        
        return healthStatus switch
        {
            BudgetHealthStatusEnum.Excellent => $"Great choice! You're staying well within your {categoryType} budget!",
            BudgetHealthStatusEnum.Good => $"Looking good! You have ${Math.Abs(remaining):N2} left in this {categoryType} category.",
            BudgetHealthStatusEnum.Attention => $"This will put you close to your {categoryType} limit. You've got this!",
            BudgetHealthStatusEnum.Concern => remaining >= 0 
                ? $"This maxes out your {categoryType} budget, but you're right on track!"
                : $"This goes ${Math.Abs(remaining):N2} over your {categoryType} budget, but that's okay! Let's adjust together.",
            _ => "Budget impact calculated successfully."
        };
    }

    private static string GenerateHealthMessage(BudgetHealthStatusEnum status, decimal percentageUsed)
    {
        return status switch
        {
            BudgetHealthStatusEnum.Excellent => $"Excellent! You've used {percentageUsed:N1}% of your budget - you're doing great!",
            BudgetHealthStatusEnum.Good => $"Good progress! You've used {percentageUsed:N1}% of your budget - keep it up!",
            BudgetHealthStatusEnum.Attention => $"Pay attention - you've used {percentageUsed:N1}% of your budget. Time to be mindful!",
            BudgetHealthStatusEnum.Concern => $"Your budget needs attention - you've used {percentageUsed:N1}%. Let's work together!",
            _ => "Budget status calculated successfully."
        };
    }

    private static string GenerateEncouragementMessage(BudgetHealthStatusEnum overall, BudgetHealthStatusEnum essential, BudgetHealthStatusEnum nonEssential)
    {
        if (essential == BudgetHealthStatusEnum.Excellent && nonEssential == BudgetHealthStatusEnum.Excellent)
            return "Amazing work! Both your essential and discretionary spending are in excellent shape!";
        
        if (essential == BudgetHealthStatusEnum.Excellent)
            return "Great job keeping your essentials under control! Consider adjusting your discretionary spending.";
        
        if (essential == BudgetHealthStatusEnum.Concern)
            return "Let's focus on your essential spending first - that's the foundation of good budgeting!";
        
        return overall switch
        {
            BudgetHealthStatusEnum.Excellent => "You're doing fantastic with your overall budget management!",
            BudgetHealthStatusEnum.Good => "Good work! You're maintaining healthy spending habits.",
            BudgetHealthStatusEnum.Attention => "You're doing well - just keep an eye on your spending patterns.",
            BudgetHealthStatusEnum.Concern => "Every budget journey has challenges - you've got this!",
            _ => "Keep up the good work with your budgeting!"
        };
    }
}