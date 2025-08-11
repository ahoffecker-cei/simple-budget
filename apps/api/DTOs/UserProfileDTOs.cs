using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

public class UpdateUserProfileRequest
{
    [Required]
    [Range(1000, 200000, ErrorMessage = "Monthly income must be between $1,000 and $200,000")]
    public decimal MonthlyIncome { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Student loan payment cannot be negative")]
    public decimal StudentLoanPayment { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Student loan balance cannot be negative")]
    public decimal StudentLoanBalance { get; set; }
}