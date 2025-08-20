using Microsoft.Extensions.Caching.Memory;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.DTOs;

namespace api.Services;

public class IncomeManagementService : IIncomeManagementService
{
    private readonly ApplicationDbContext _context;
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<IncomeManagementService> _logger;

    public IncomeManagementService(
        ApplicationDbContext context,
        IMemoryCache memoryCache,
        ILogger<IncomeManagementService> logger)
    {
        _context = context;
        _memoryCache = memoryCache;
        _logger = logger;
    }

    public async Task<decimal> CalculateMonthlyIncomeAsync(string userId)
    {
        var currentMonth = DateTime.Now.ToString("yyyy-MM");
        var cacheKey = $"monthly_income_{userId}_{currentMonth}";

        if (_memoryCache.TryGetValue(cacheKey, out decimal cachedIncome))
        {
            return cachedIncome;
        }

        var incomeSources = await _context.IncomeSources
            .Where(i => i.UserId == userId)
            .ToListAsync();

        decimal totalMonthlyIncome = 0;

        foreach (var source in incomeSources)
        {
            var monthlyAmount = source.Frequency.ToLower() switch
            {
                "weekly" => source.Amount * 4.33m, // 52/12
                "bi-weekly" => source.Amount * 2.17m, // 26/12
                "monthly" => source.Amount,
                _ => 0
            };
            totalMonthlyIncome += monthlyAmount;
        }

        _memoryCache.Set(cacheKey, totalMonthlyIncome, TimeSpan.FromMinutes(30));
        
        return totalMonthlyIncome;
    }

    public async Task<IncomeManagementResponseDto> GetIncomeManagementAsync(string userId)
    {
        var cacheKey = $"income_sources_{userId}";

        if (_memoryCache.TryGetValue(cacheKey, out IncomeManagementResponseDto? cachedResponse))
        {
            return cachedResponse!;
        }

        var incomeSources = await _context.IncomeSources
            .Where(i => i.UserId == userId)
            .OrderBy(i => i.Name)
            .Select(i => new IncomeSourceDto
            {
                IncomeSourceId = i.IncomeSourceId,
                UserId = i.UserId,
                Name = i.Name,
                Amount = i.Amount,
                Frequency = i.Frequency,
                CreatedAt = i.CreatedAt
            })
            .ToListAsync();

        var totalMonthlyIncome = await CalculateMonthlyIncomeAsync(userId);

        var response = new IncomeManagementResponseDto
        {
            IncomeSources = incomeSources,
            TotalMonthlyIncome = totalMonthlyIncome,
            LastUpdated = DateTime.UtcNow
        };

        _memoryCache.Set(cacheKey, response, TimeSpan.FromMinutes(15));

        return response;
    }

    public async Task InvalidateIncomeCacheAsync(string userId)
    {
        var currentMonth = DateTime.Now.ToString("yyyy-MM");
        var incomeSourcesCacheKey = $"income_sources_{userId}";
        var monthlyIncomeCacheKey = $"monthly_income_{userId}_{currentMonth}";
        var enhancedDashboardCacheKey = $"enhanced_dashboard_{userId}_{currentMonth}";
        var dashboardOverviewCacheKey = $"dashboard_overview_{userId}_{currentMonth}";

        _memoryCache.Remove(incomeSourcesCacheKey);
        _memoryCache.Remove(monthlyIncomeCacheKey);
        _memoryCache.Remove(enhancedDashboardCacheKey);
        _memoryCache.Remove(dashboardOverviewCacheKey);

        _logger.LogInformation("Invalidated income and dashboard cache for user {UserId}", userId);

        await Task.CompletedTask;
    }
}