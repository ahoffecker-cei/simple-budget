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
    private readonly IBudgetCalculationService _budgetCalculationService;
    private readonly IDashboardService _dashboardService;

    public DashboardController(ApplicationDbContext context, ICategoryClassificationService classificationService, IBudgetCalculationService budgetCalculationService, IDashboardService dashboardService)
    {
        _context = context;
        _classificationService = classificationService;
        _budgetCalculationService = budgetCalculationService;
        _dashboardService = dashboardService;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardResponse>> GetDashboard()
    {
        Console.WriteLine("DEBUG: Dashboard endpoint called");
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        Console.WriteLine($"DEBUG: Dashboard for user {userId}");
        Console.WriteLine($"DEBUG: Current time: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");

        // Clear any cached entities to ensure we get fresh data from database
        _context.ChangeTracker.Clear();

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
        var budgetCategoriesWithAllocation = await CalculateBudgetAllocationsAsync(budgetCategories);

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

    [HttpGet("complete-overview")]
    public async Task<ActionResult<DashboardOverviewResponseDto>> GetCompleteOverview()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var overview = await _dashboardService.GetCompleteOverviewAsync(userId);
        return Ok(overview);
    }

    [HttpGet("category/{categoryId}/expenses")]
    public async Task<ActionResult<ExpenseWithCategoryDto[]>> GetCategoryExpenses(
        Guid categoryId, 
        [FromQuery] int? year = null, 
        [FromQuery] int? month = null)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var expenses = await _dashboardService.GetCategoryExpensesAsync(userId, categoryId, year, month);
        return Ok(expenses);
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

    [HttpGet("budget-health")]
    public async Task<ActionResult<OverallBudgetHealthDto>> GetBudgetHealth()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var budgetHealth = await _budgetCalculationService.GetOverallBudgetHealthAsync(userId);
        return Ok(budgetHealth);
    }

    [HttpGet("monthly-progress")]
    public async Task<ActionResult<MonthlyProgressDataDto[]>> GetMonthlyProgress()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var progressData = await _budgetCalculationService.GetMonthlyProgressDataAsync(userId);
        return Ok(progressData);
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

    private async Task<List<BudgetCategoryWithAllocation>> CalculateBudgetAllocationsAsync(List<BudgetCategory> budgetCategories)
    {
        var userId = budgetCategories.FirstOrDefault()?.UserId;
        if (string.IsNullOrEmpty(userId))
        {
            return budgetCategories.Select(category => new BudgetCategoryWithAllocation
            {
                CategoryId = category.CategoryId,
                Name = category.Name,
                MonthlyLimit = category.MonthlyLimit,
                CurrentSpending = 0m,
                IsEssential = category.IsEssential,
                Description = category.Description,
                ColorId = category.ColorId,
                IconId = category.IconId,
                AllocationPercentage = 0,
                RemainingAmount = category.MonthlyLimit,
                HealthStatus = "excellent"
            }).ToList();
        }

        // Calculate spending for current month for all categories at once
        var now = DateTime.Today; // Use Today to avoid time component issues
        var startOfMonth = new DateTime(now.Year, now.Month, 1);
        var endOfMonth = startOfMonth.AddMonths(1); // First day of next month
        
        Console.WriteLine($"Debug: Calculating spending for userId: {userId}, from {startOfMonth:yyyy-MM-dd} to {endOfMonth:yyyy-MM-dd}");
        Console.WriteLine($"Debug: Total budget categories: {budgetCategories.Count}");
        
        // First, get all expenses for debugging
        var allUserExpenses = await _context.Expenses
            .Where(e => e.UserId == userId)
            .Select(e => new { e.CategoryId, e.Amount, e.ExpenseDate })
            .ToListAsync();
            
        Console.WriteLine($"Debug: Total expenses for user: {allUserExpenses.Count}");
        foreach (var exp in allUserExpenses)
        {
            Console.WriteLine($"Debug: Expense - CategoryId: {exp.CategoryId}, Amount: {exp.Amount}, Date: {exp.ExpenseDate:yyyy-MM-dd}");
        }
        
        var categorySpending = await _context.Expenses
            .Where(e => e.UserId == userId && 
                       e.ExpenseDate >= startOfMonth && 
                       e.ExpenseDate < endOfMonth)
            .GroupBy(e => e.CategoryId)
            .Select(g => new { CategoryId = g.Key, TotalSpending = g.Sum(e => e.Amount) })
            .ToDictionaryAsync(x => x.CategoryId, x => x.TotalSpending);
            
        Console.WriteLine($"Debug: Found spending data for {categorySpending.Count} categories");
        foreach (var spending in categorySpending)
        {
            Console.WriteLine($"Debug: Category {spending.Key}: ${spending.Value}");
        }

        return budgetCategories.Select(category =>
        {
            var currentSpending = categorySpending.GetValueOrDefault(category.CategoryId, 0m);
            var remainingAmount = category.MonthlyLimit - currentSpending;
            var allocationPercentage = category.MonthlyLimit > 0 
                ? Math.Min((currentSpending / category.MonthlyLimit) * 100, 100)
                : 0;
            var healthStatus = CalculateCategoryHealthStatus(currentSpending, category.MonthlyLimit);

            Console.WriteLine($"Debug: Category '{category.Name}' (ID: {category.CategoryId}):");
            Console.WriteLine($"  - Monthly Limit: ${category.MonthlyLimit}");
            Console.WriteLine($"  - Current Spending: ${currentSpending}");
            Console.WriteLine($"  - Remaining: ${remainingAmount}");
            Console.WriteLine($"  - Health Status: {healthStatus}");

            return new BudgetCategoryWithAllocation
            {
                CategoryId = category.CategoryId,
                Name = category.Name,
                MonthlyLimit = category.MonthlyLimit,
                CurrentSpending = currentSpending,
                IsEssential = category.IsEssential,
                Description = category.Description,
                ColorId = category.ColorId,
                IconId = category.IconId,
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