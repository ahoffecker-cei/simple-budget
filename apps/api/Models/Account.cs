using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models;

public enum AccountType
{
    Checking,
    Savings,
    Retirement
}

public class Account
{
    [Key]
    public string AccountId { get; set; } = string.Empty;
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    public AccountType AccountType { get; set; }
    
    [Required]
    public string AccountName { get; set; } = string.Empty;
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal CurrentBalance { get; set; }
    
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("UserId")]
    public User? User { get; set; }
}