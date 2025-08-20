using Microsoft.Extensions.Caching.Memory;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.DTOs;

namespace api.Services;

public class SavingsGoalService : ISavingsGoalService
{
    private readonly ApplicationDbContext _context;
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<SavingsGoalService> _logger;

    public SavingsGoalService(
        ApplicationDbContext context,
        IMemoryCache memoryCache,
        ILogger<SavingsGoalService> logger)
    {
        _context = context;
        _memoryCache = memoryCache;
        _logger = logger;
    }

    public async Task<List<SavingsGoalProgressDto>> GetSavingsGoalProgressAsync(string userId)
    {
        var cacheKey = $"savings_goals_{userId}";

        if (_memoryCache.TryGetValue(cacheKey, out List<SavingsGoalProgressDto>? cachedProgress))
        {
            return cachedProgress!;
        }

        var savingsGoals = await _context.SavingsGoals
            .Where(sg => sg.UserId == userId)
            .OrderBy(sg => sg.Name)
            .ToListAsync();

        var progressList = new List<SavingsGoalProgressDto>();

        foreach (var goal in savingsGoals)
        {
            var monthlyContributions = await CalculateMonthlyContributionsAsync(userId, goal.SavingsGoalId);
            var percentageComplete = goal.TargetAmount > 0 ? (goal.CurrentProgress / goal.TargetAmount) * 100 : 0;

            progressList.Add(new SavingsGoalProgressDto
            {
                SavingsGoalId = goal.SavingsGoalId,
                Name = goal.Name,
                TargetAmount = goal.TargetAmount,
                CurrentProgress = goal.CurrentProgress,
                PercentageComplete = Math.Min(percentageComplete, 100),
                MonthlyContributions = monthlyContributions
            });
        }

        _memoryCache.Set(cacheKey, progressList, TimeSpan.FromMinutes(10));

        return progressList;
    }

    public async Task<decimal> CalculateMonthlyContributionsAsync(string userId, Guid savingsGoalId)
    {
        var startOfMonth = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);
        var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);

        var monthlyContributions = await _context.Expenses
            .Where(e => e.UserId == userId && 
                       e.SavingsGoalId == savingsGoalId && 
                       e.ExpenseDate >= startOfMonth && 
                       e.ExpenseDate <= endOfMonth)
            .SumAsync(e => e.Amount);

        return monthlyContributions;
    }

    public async Task UpdateSavingsGoalProgressAsync(string userId, Guid savingsGoalId, decimal contributionAmount)
    {
        var savingsGoal = await _context.SavingsGoals
            .FirstOrDefaultAsync(sg => sg.SavingsGoalId == savingsGoalId && sg.UserId == userId);

        if (savingsGoal != null)
        {
            savingsGoal.CurrentProgress += contributionAmount;
            savingsGoal.LastUpdated = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            await InvalidateSavingsGoalCacheAsync(userId);
        }
    }

    public async Task InvalidateSavingsGoalCacheAsync(string userId)
    {
        var currentMonth = DateTime.Now.ToString("yyyy-MM");
        var savingsGoalsCacheKey = $"savings_goals_{userId}";
        var enhancedDashboardCacheKey = $"enhanced_dashboard_{userId}_{currentMonth}";

        _memoryCache.Remove(savingsGoalsCacheKey);
        _memoryCache.Remove(enhancedDashboardCacheKey);

        await Task.CompletedTask;
    }
}