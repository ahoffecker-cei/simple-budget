using System.ComponentModel.DataAnnotations;

namespace api.Models;

public class User
{
    [Key]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string FirstName { get; set; } = string.Empty;
    
    public decimal MonthlyIncome { get; set; }
    
    public decimal StudentLoanPayment { get; set; }
    
    public decimal StudentLoanBalance { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime LastLoginAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ICollection<Account> Accounts { get; set; } = new List<Account>();
}