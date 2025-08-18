using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

public record BudgetImpactPreviewRequest
{
    [Required]
    public Guid CategoryId { get; init; }
    
    [Required]
    [Range(0.01, 999999.99, ErrorMessage = "Amount must be between $0.01 and $999,999.99")]
    public decimal Amount { get; init; }
    
    public DateTime? ExpenseDate { get; init; }
}

public record BudgetImpactPreviewDto
{
    public Guid CategoryId { get; init; }
    public string CategoryName { get; init; } = string.Empty;
    public decimal CurrentSpent { get; init; }
    public decimal MonthlyLimit { get; init; }
    public decimal RemainingAfterExpense { get; init; }
    public decimal PercentageUsed { get; init; }
    public string HealthStatus { get; init; } = string.Empty;
    public bool IsEssential { get; init; }
    public string ImpactMessage { get; init; } = string.Empty;
    public string EncouragementLevel { get; init; } = string.Empty;
}

public record MonthlyProgressDataDto
{
    public Guid CategoryId { get; init; }
    public string CategoryName { get; init; } = string.Empty;
    public decimal CurrentSpent { get; init; }
    public decimal MonthlyLimit { get; init; }
    public decimal PercentageUsed { get; init; }
    public bool IsEssential { get; init; }
    public string HealthStatus { get; init; } = string.Empty;
    public int DaysRemainingInMonth { get; init; }
    public decimal ProjectedSpending { get; init; }
}

public record OverallBudgetHealthDto
{
    public string OverallStatus { get; init; } = string.Empty;
    public decimal TotalBudgeted { get; init; }
    public decimal TotalSpent { get; init; }
    public decimal PercentageUsed { get; init; }
    public string EssentialCategoriesHealth { get; init; } = string.Empty;
    public string NonEssentialCategoriesHealth { get; init; } = string.Empty;
    public string HealthMessage { get; init; } = string.Empty;
    public string EncouragementMessage { get; init; } = string.Empty;
}

public enum BudgetHealthStatusEnum
{
    Excellent,  // < 50% of budget used
    Good,       // 50-75% of budget used  
    Attention,  // 75-90% of budget used
    Concern     // > 90% of budget used
}