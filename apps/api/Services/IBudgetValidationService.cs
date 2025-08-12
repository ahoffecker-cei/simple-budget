using api.DTOs;

namespace api.Services;

public interface IBudgetValidationService
{
    Task<BudgetValidationResult> ValidateBudgetAllocationAsync(string userId, decimal additionalAmount, Guid? excludeCategoryId = null);
    Task<decimal> GetTotalBudgetAllocationAsync(string userId, Guid? excludeCategoryId = null);
    Task<decimal> GetUserMonthlyIncomeAsync(string userId);
}