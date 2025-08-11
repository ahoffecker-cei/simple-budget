using System.ComponentModel.DataAnnotations;
using api.Models;

namespace api.DTOs;

public class RegisterRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [MinLength(8)]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$", 
        ErrorMessage = "Password must contain at least 8 characters with uppercase, lowercase, and numbers")]
    public string Password { get; set; } = string.Empty;
    
    [Required]
    [MinLength(1)]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;
    
    [Range(1000, 200000)]
    public decimal MonthlyIncome { get; set; }
    
    public decimal StudentLoanPayment { get; set; } = 0;
    
    public decimal StudentLoanBalance { get; set; } = 0;
}

public class LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public User User { get; set; } = new();
    public DateTime ExpiresAt { get; set; }
}

public class ErrorResponse
{
    public ErrorDetails Error { get; set; } = new();
}

public class ErrorDetails
{
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string RequestId { get; set; } = string.Empty;
}