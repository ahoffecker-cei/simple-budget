using api.DTOs;

namespace api.Services;

public interface IDashboardService
{
    Task<DashboardOverviewResponseDto> GetCompleteOverviewAsync(string userId);
    Task<EnhancedDashboardResponseDto> GetEnhancedOverviewAsync(string userId);
    Task<BudgetCategorySummaryDto[]> GetBudgetCategorySummariesAsync(string userId);
    Task<ExpenseWithCategoryDto[]> GetRecentExpensesAsync(string userId, int count = 10);
    Task<MonthlyProgressSummaryDto> GetMonthlyProgressSummaryAsync(string userId);
    Task<ExpenseWithCategoryDto[]> GetCategoryExpensesAsync(string userId, Guid categoryId, int? year = null, int? month = null);
    Task InvalidateDashboardCacheAsync(string userId);
}