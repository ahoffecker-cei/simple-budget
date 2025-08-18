using api.DTOs;

namespace api.Services;

public interface IBudgetCalculationService
{
    Task<BudgetImpactPreviewDto> GetBudgetImpactPreviewAsync(string userId, Guid categoryId, decimal amount, DateTime? expenseDate = null);
    Task<OverallBudgetHealthDto> GetOverallBudgetHealthAsync(string userId);
    Task<MonthlyProgressDataDto[]> GetMonthlyProgressDataAsync(string userId);
    Task<BudgetHealthStatusEnum> CalculateCategoryHealthStatusAsync(string userId, Guid categoryId, decimal currentSpent, decimal monthlyLimit);
    Task InvalidateBudgetCacheAsync(string userId, Guid? categoryId = null);
}