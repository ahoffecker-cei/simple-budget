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