using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

public class ExpenseDto
{
    public Guid ExpenseId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public DateTime ExpenseDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsEssential { get; set; }
    public Guid? SavingsGoalId { get; set; }
    public string? SavingsGoalName { get; set; }
}

public class CreateExpenseRequest
{
    [Required]
    public Guid CategoryId { get; set; }
    
    [Required]
    [Range(0.01, 999999.99, ErrorMessage = "Amount must be greater than 0")]
    public decimal Amount { get; set; }
    
    [StringLength(500)]
    public string? Description { get; set; }
    
    public DateTime? ExpenseDate { get; set; }
    
    // Optional savings goal tagging
    public Guid? SavingsGoalId { get; set; }
}

public class ExpenseWithBudgetImpact
{
    public ExpenseDto Expense { get; set; } = null!;
    public decimal CategoryRemainingBudget { get; set; }
    public string BudgetHealthStatus { get; set; } = "excellent";
    public decimal CategoryMonthlyLimit { get; set; }
    public decimal CategoryCurrentSpending { get; set; }
}

public class RecentExpensesResponse
{
    public List<ExpenseDto> Expenses { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class ExpenseListQueryParameters
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public Guid? CategoryId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}