using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

public class SavingsGoalDto
{
    public Guid SavingsGoalId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public decimal CurrentProgress { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class CreateSavingsGoalRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [Range(0.01, 9999999.99, ErrorMessage = "Target amount must be greater than 0")]
    public decimal TargetAmount { get; set; }
}

public class UpdateSavingsGoalRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [Range(0.01, 9999999.99, ErrorMessage = "Target amount must be greater than 0")]
    public decimal TargetAmount { get; set; }
}

public class SavingsGoalProgressDto
{
    public Guid SavingsGoalId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public decimal CurrentProgress { get; set; }
    public decimal PercentageComplete { get; set; }
    public decimal MonthlyContributions { get; set; }
}

public class ContributeToSavingsGoalRequest
{
    [Required]
    [Range(0.01, 999999.99, ErrorMessage = "Contribution amount must be greater than 0")]
    public decimal Amount { get; set; }
    
    [StringLength(500)]
    public string? Description { get; set; }
}