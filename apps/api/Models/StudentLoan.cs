using System.ComponentModel.DataAnnotations;

namespace api.Models;

public class StudentLoan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string ServicerName { get; set; } = string.Empty;
    
    [MaxLength(50)]
    public string AccountNumber { get; set; } = string.Empty;
    
    [Range(0, double.MaxValue)]
    public decimal Balance { get; set; }
    
    [Range(0, 100)]
    public decimal InterestRate { get; set; }
    
    [Range(0, double.MaxValue)]
    public decimal MonthlyPayment { get; set; }
    
    [Required]
    public LoanType LoanType { get; set; }
    
    public LoanStatus Status { get; set; } = LoanStatus.Active;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ApplicationUser User { get; set; } = null!;
}

public enum LoanType
{
    Federal,
    Private
}

public enum LoanStatus
{
    Active,
    PaidOff,
    Deferred,
    Forbearance
}

// DTO for API responses
public class StudentLoanDto
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string ServicerName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public decimal Balance { get; set; }
    public decimal InterestRate { get; set; }
    public decimal MonthlyPayment { get; set; }
    public string LoanType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class StudentLoanSummaryDto
{
    public decimal TotalBalance { get; set; }
    public decimal TotalMonthlyPayment { get; set; }
    public decimal AverageInterestRate { get; set; }
    public int TotalLoans { get; set; }
    public List<StudentLoanDto> Loans { get; set; } = new List<StudentLoanDto>();
}