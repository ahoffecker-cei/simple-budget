using api.Models;

namespace api.DTOs;

public class DashboardResponse
{
    public string OverallHealthStatus { get; set; } = string.Empty;
    public decimal TotalNetWorth { get; set; }
    public List<AccountDto> Accounts { get; set; } = new();
    public BudgetOverviewData? BudgetOverview { get; set; }
    public List<BudgetCategoryWithAllocation> BudgetCategories { get; set; } = new();
}

public class AccountDto
{
    public string AccountId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string AccountType { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public decimal CurrentBalance { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class CreateAccountRequest
{
    public string AccountType { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public decimal CurrentBalance { get; set; }
}

public class UpdateAccountRequest
{
    public string AccountName { get; set; } = string.Empty;
    public decimal CurrentBalance { get; set; }
}

public class BudgetCategoryWithAllocation
{
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal MonthlyLimit { get; set; }
    public decimal CurrentSpending { get; set; }
    public bool IsEssential { get; set; }
    public string? Description { get; set; }
    public string ColorId { get; set; } = "blue";
    public string IconId { get; set; } = "home";
    public decimal AllocationPercentage { get; set; }
    public decimal RemainingAmount { get; set; }
    public string HealthStatus { get; set; } = "excellent";
}

public class BudgetOverviewData
{
    public decimal TotalBudgetAllocated { get; set; }
    public decimal TotalIncome { get; set; }
    public string BudgetHealthStatus { get; set; } = "excellent";
    public bool IsSetupComplete { get; set; }
    public decimal AllocationPercentage { get; set; }
}

// Comprehensive Dashboard DTOs for Story 3.3
public class DashboardOverviewResponseDto
{
    public string OverallHealthStatus { get; set; } = string.Empty;
    public string OverallHealthMessage { get; set; } = string.Empty;
    public decimal TotalNetWorth { get; set; }
    public List<AccountDto> Accounts { get; set; } = new();
    public List<BudgetCategorySummaryDto> BudgetSummary { get; set; } = new();
    public List<ExpenseWithCategoryDto> RecentExpenses { get; set; } = new();
    public MonthlyProgressSummaryDto MonthlyProgress { get; set; } = new();
}

public class BudgetCategorySummaryDto
{
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public decimal MonthlyLimit { get; set; }
    public decimal CurrentSpent { get; set; }
    public decimal RemainingBudget { get; set; }
    public decimal PercentageUsed { get; set; }
    public string HealthStatus { get; set; } = "excellent";
    public bool IsEssential { get; set; }
    public string ColorId { get; set; } = "blue";
    public string IconId { get; set; } = "home";
    public int ExpenseCount { get; set; }
}

public class ExpenseWithCategoryDto
{
    public Guid ExpenseId { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public DateTime ExpenseDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public bool IsEssential { get; set; }
    public string ColorId { get; set; } = "blue";
    public string IconId { get; set; } = "home";
}

public class MonthlyProgressSummaryDto
{
    public decimal TotalBudgeted { get; set; }
    public decimal TotalSpent { get; set; }
    public decimal PercentageUsed { get; set; }
    public int DaysRemainingInMonth { get; set; }
    public decimal ProjectedMonthlySpending { get; set; }
    public bool OnTrackForMonth { get; set; }
}

// Enhanced Dashboard Response for Story 3.4
public class EnhancedDashboardResponseDto
{
    public List<AccountDto> Accounts { get; set; } = new();
    public List<BudgetCategorySummaryDto> BudgetSummary { get; set; } = new();
    public List<ExpenseWithCategoryDto> RecentExpenses { get; set; } = new();
    public MonthlyProgressSummaryDto MonthlyProgress { get; set; } = new();
    public IncomeManagementResponseDto IncomeManagement { get; set; } = new();
    public List<SavingsGoalProgressDto> SavingsGoals { get; set; } = new();
    public string OverallHealthStatus { get; set; } = string.Empty;
    public string OverallHealthMessage { get; set; } = string.Empty;
}