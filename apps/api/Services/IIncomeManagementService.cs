using api.DTOs;

namespace api.Services;

public interface IIncomeManagementService
{
    Task<decimal> CalculateMonthlyIncomeAsync(string userId);
    Task<IncomeManagementResponseDto> GetIncomeManagementAsync(string userId);
    Task InvalidateIncomeCacheAsync(string userId);
}