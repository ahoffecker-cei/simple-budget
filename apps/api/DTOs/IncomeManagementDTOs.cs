using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

public class IncomeSourceDto
{
    public Guid IncomeSourceId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Frequency { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateIncomeSourceRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [Range(0.01, 9999999.99, ErrorMessage = "Amount must be greater than 0")]
    public decimal Amount { get; set; }
    
    [Required]
    public string Frequency { get; set; } = string.Empty; // 'weekly', 'bi-weekly', 'monthly'
}

public class UpdateIncomeSourceRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [Range(0.01, 9999999.99, ErrorMessage = "Amount must be greater than 0")]
    public decimal Amount { get; set; }
    
    [Required]
    public string Frequency { get; set; } = string.Empty;
}

public class IncomeManagementResponseDto
{
    public List<IncomeSourceDto> IncomeSources { get; set; } = new();
    public decimal TotalMonthlyIncome { get; set; }
    public DateTime LastUpdated { get; set; }
}