using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

public class BudgetCategoryDto
{
    public Guid CategoryId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal MonthlyLimit { get; set; }
    public bool IsEssential { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateBudgetCategoryRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [Range(0.01, 999999.99, ErrorMessage = "Monthly limit must be greater than 0")]
    public decimal MonthlyLimit { get; set; }
    
    [Required]
    public bool IsEssential { get; set; }
    
    [StringLength(500)]
    public string? Description { get; set; }
}

public class UpdateBudgetCategoryRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [Range(0.01, 999999.99, ErrorMessage = "Monthly limit must be greater than 0")]
    public decimal MonthlyLimit { get; set; }
    
    [Required]
    public bool IsEssential { get; set; }
    
    [StringLength(500)]
    public string? Description { get; set; }
}

public class BudgetCategoryWithSpendingDto
{
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal MonthlyLimit { get; set; }
    public bool IsEssential { get; set; }
    public string? Description { get; set; }
    public decimal CurrentSpending { get; set; }
    public decimal RemainingBudget { get; set; }
}

public class BudgetValidationResult
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public decimal TotalBudget { get; set; }
    public decimal UserIncome { get; set; }
    public decimal RemainingIncome { get; set; }
}

public class CategoryClassificationSuggestion
{
    public string CategoryName { get; set; } = string.Empty;
    public bool SuggestedIsEssential { get; set; }
    public double Confidence { get; set; }
    public string Reasoning { get; set; } = string.Empty;
}

public class ClassificationUpdateRequest
{
    [Required]
    public Guid CategoryId { get; set; }
    
    [Required]
    public bool IsEssential { get; set; }
    
    public bool UserOverride { get; set; } = false;
}

public class BulkClassificationUpdateRequest
{
    [Required]
    public List<ClassificationUpdateRequest> Classifications { get; set; } = new();
}

public class BudgetHealthByClassification
{
    public decimal EssentialSpending { get; set; }
    public decimal EssentialLimit { get; set; }
    public decimal NonEssentialSpending { get; set; }
    public decimal NonEssentialLimit { get; set; }
    public string EssentialHealthStatus { get; set; } = "excellent";
    public string NonEssentialHealthStatus { get; set; } = "excellent";
}