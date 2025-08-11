using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace api.Models;

public class ApplicationUser : IdentityUser
{
    [Required]
    public string FirstName { get; set; } = string.Empty;
    
    public decimal MonthlyIncome { get; set; }
    
    public decimal StudentLoanPayment { get; set; }
    
    public decimal StudentLoanBalance { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime LastLoginAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ICollection<Account> Accounts { get; set; } = new List<Account>();
    public ICollection<StudentLoan> StudentLoans { get; set; } = new List<StudentLoan>();
}

// Keep original User class for API responses and shared models
public class User
{
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public decimal MonthlyIncome { get; set; }
    public decimal StudentLoanPayment { get; set; }
    public decimal StudentLoanBalance { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime LastLoginAt { get; set; }
    public StudentLoanSummaryDto? StudentLoanSummary { get; set; }
}