using api.Data;
using api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class BudgetValidationService : IBudgetValidationService
{
    private readonly ApplicationDbContext _context;

    public BudgetValidationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<BudgetValidationResult> ValidateBudgetAllocationAsync(string userId, decimal additionalAmount, Guid? excludeCategoryId = null)
    {
        var userIncome = await GetUserMonthlyIncomeAsync(userId);
        var currentTotalBudget = await GetTotalBudgetAllocationAsync(userId, excludeCategoryId);
        var newTotalBudget = currentTotalBudget + additionalAmount;

        var result = new BudgetValidationResult
        {
            TotalBudget = newTotalBudget,
            UserIncome = userIncome,
            RemainingIncome = userIncome - newTotalBudget,
            IsValid = newTotalBudget <= userIncome
        };

        if (!result.IsValid)
        {
            var overBudget = newTotalBudget - userIncome;
            result.ErrorMessage = $"Budget allocation exceeds monthly income by ${overBudget:F2}. Please adjust spending limits to stay within your ${userIncome:F2} monthly income.";
        }

        return result;
    }

    public async Task<decimal> GetTotalBudgetAllocationAsync(string userId, Guid? excludeCategoryId = null)
    {
        var query = _context.BudgetCategories.Where(bc => bc.UserId == userId);
        
        if (excludeCategoryId.HasValue)
        {
            query = query.Where(bc => bc.CategoryId != excludeCategoryId.Value);
        }

        return await query.SumAsync(bc => bc.MonthlyLimit);
    }

    public async Task<decimal> GetUserMonthlyIncomeAsync(string userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        return user?.MonthlyIncome ?? 0;
    }
}