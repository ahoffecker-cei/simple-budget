using System.ComponentModel.DataAnnotations;
using api.Models;

namespace api.DTOs;

public class BudgetWizardRequest
{
    [Required]
    [Range(1000, 200000, ErrorMessage = "Monthly income must be between $1,000 and $200,000")]
    public decimal MonthlyIncome { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Student loan payment cannot be negative")]
    public decimal? StudentLoanPayment { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Student loan balance cannot be negative")]
    public decimal? StudentLoanBalance { get; set; }

    public Dictionary<string, decimal> MajorExpenses { get; set; } = new();

    [Range(0, double.MaxValue, ErrorMessage = "Savings goal cannot be negative")]
    public decimal? SavingsGoal { get; set; }
}

public class BudgetWizardResponse
{
    public User UserProfile { get; set; } = null!;
    public BudgetHealthStatus BudgetHealth { get; set; } = null!;
    public string Message { get; set; } = string.Empty;
}

public class BudgetHealthStatus
{
    public decimal TotalIncome { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal StudentLoanPayments { get; set; }
    public decimal AvailableForSavings { get; set; }
    public decimal SavingsGoal { get; set; }
    public string HealthRating { get; set; } = string.Empty;
    public List<string> Recommendations { get; set; } = new();
}