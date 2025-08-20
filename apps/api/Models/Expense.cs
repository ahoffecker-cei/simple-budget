using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models;

public class Expense
{
    [Key]
    public Guid ExpenseId { get; set; }
    
    [Required]
    [ForeignKey(nameof(User))]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    [ForeignKey(nameof(BudgetCategory))]
    public Guid CategoryId { get; set; }
    
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    [Range(0.01, 999999.99, ErrorMessage = "Amount must be greater than 0")]
    public decimal Amount { get; set; }
    
    [StringLength(500)]
    public string? Description { get; set; }
    
    [Required]
    public DateTime ExpenseDate { get; set; }
    
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Optional foreign key for savings goal tagging
    [ForeignKey(nameof(SavingsGoal))]
    public Guid? SavingsGoalId { get; set; }
    
    // Navigation properties
    public ApplicationUser User { get; set; } = null!;
    public BudgetCategory BudgetCategory { get; set; } = null!;
    public SavingsGoal? SavingsGoal { get; set; }
}