using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models;

public class SavingsGoal
{
    [Key]
    public Guid SavingsGoalId { get; set; }
    
    [Required]
    [ForeignKey(nameof(User))]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    [Range(0.01, 9999999.99, ErrorMessage = "Target amount must be greater than 0")]
    public decimal TargetAmount { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal CurrentProgress { get; set; } = 0;
    
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ApplicationUser User { get; set; } = null!;
}