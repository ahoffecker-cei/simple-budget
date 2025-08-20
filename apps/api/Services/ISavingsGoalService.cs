using api.DTOs;

namespace api.Services;

public interface ISavingsGoalService
{
    Task<List<SavingsGoalProgressDto>> GetSavingsGoalProgressAsync(string userId);
    Task<decimal> CalculateMonthlyContributionsAsync(string userId, Guid savingsGoalId);
    Task UpdateSavingsGoalProgressAsync(string userId, Guid savingsGoalId, decimal contributionAmount);
    Task InvalidateSavingsGoalCacheAsync(string userId);
}