using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.DTOs;
using api.Services;
using System.Security.Claims;
using api.Models;

namespace api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICategoryClassificationService _classificationService;

    public DashboardController(ApplicationDbContext context, ICategoryClassificationService classificationService)
    {
        _context = context;
        _classificationService = classificationService;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardResponse>> GetDashboard()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Fetch accounts
        var accounts = await _context.Accounts
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
            .ToListAsync();

        var totalNetWorth = accounts.Sum(a => a.CurrentBalance);
        var healthStatus = CalculateHealthStatus(totalNetWorth);

        // Fetch user income and budget data
        var user = await _context.Users.FindAsync(userId);
        var budgetCategories = await _context.BudgetCategories
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.IsEssential ? 0 : 1)
            .ThenBy(c => c.Name)
            .ToListAsync();

        // Calculate budget overview and allocation data
        var budgetOverview = CalculateBudgetOverview(user, budgetCategories);
        var budgetCategoriesWithAllocation = CalculateBudgetAllocations(budgetCategories);

        var dashboardResponse = new DashboardResponse
        {
            OverallHealthStatus = healthStatus,
            TotalNetWorth = totalNetWorth,
            Accounts = accounts,
            BudgetOverview = budgetOverview,
            BudgetCategories = budgetCategoriesWithAllocation
        };

        return Ok(dashboardResponse);
    }

    [HttpGet("classification-health")]
    public async Task<ActionResult<BudgetHealthByClassification>> GetClassificationHealth()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var healthData = await _classificationService.CalculateBudgetHealthByClassificationAsync(userId);
        return Ok(healthData);
    }

    private static string CalculateHealthStatus(decimal totalNetWorth)
    {
        return totalNetWorth switch
        {
            >= 50000 => "excellent",
            >= 10000 => "good",
            >= 1000 => "attention",
            _ => "concern"
        };
    }

    private BudgetOverviewData? CalculateBudgetOverview(ApplicationUser? user, List<BudgetCategory> budgetCategories)
    {
        if (user == null || !budgetCategories.Any())
        {
            return null;
        }

        var totalBudgetAllocated = budgetCategories.Sum(c => c.MonthlyLimit);
        var userIncome = user.MonthlyIncome;
        var allocationPercentage = userIncome > 0 ? (totalBudgetAllocated / userIncome) * 100 : 0;
        var budgetHealthStatus = CalculateBudgetHealthStatus(allocationPercentage);

        return new BudgetOverviewData
        {
            TotalBudgetAllocated = totalBudgetAllocated,
            TotalIncome = userIncome,
            BudgetHealthStatus = budgetHealthStatus,
            IsSetupComplete = budgetCategories.Count >= 3, // Minimum 3 categories considered complete
            AllocationPercentage = allocationPercentage
        };
    }

    private List<BudgetCategoryWithAllocation> CalculateBudgetAllocations(List<BudgetCategory> budgetCategories)
    {
        return budgetCategories.Select(category =>
        {
            // For now, CurrentSpending is 0 since we don't have spending tracking yet
            var currentSpending = 0m;
            var remainingAmount = category.MonthlyLimit - currentSpending;
            var allocationPercentage = category.MonthlyLimit > 0 
                ? Math.Min((currentSpending / category.MonthlyLimit) * 100, 100)
                : 0;
            var healthStatus = CalculateCategoryHealthStatus(currentSpending, category.MonthlyLimit);

            return new BudgetCategoryWithAllocation
            {
                CategoryId = category.CategoryId,
                Name = category.Name,
                MonthlyLimit = category.MonthlyLimit,
                CurrentSpending = currentSpending,
                IsEssential = category.IsEssential,
                Description = category.Description,
                AllocationPercentage = allocationPercentage,
                RemainingAmount = remainingAmount,
                HealthStatus = healthStatus
            };
        }).ToList();
    }

    private static string CalculateBudgetHealthStatus(decimal allocationPercentage)
    {
        return allocationPercentage switch
        {
            <= 70 => "excellent",
            <= 85 => "good",
            <= 100 => "attention",
            _ => "concern"
        };
    }

    private static string CalculateCategoryHealthStatus(decimal currentSpending, decimal monthlyLimit)
    {
        if (monthlyLimit <= 0) return "excellent";

        var usagePercentage = (currentSpending / monthlyLimit) * 100;
        return usagePercentage switch
        {
            <= 70 => "excellent",
            <= 85 => "good",
            <= 100 => "attention",
            _ => "concern"
        };
    }
}