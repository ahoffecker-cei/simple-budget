using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models;

public class BudgetCategory
{
    [Key]
    public Guid CategoryId { get; set; }
    
    [Required]
    [ForeignKey(nameof(User))]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    [Range(0.01, 999999.99, ErrorMessage = "Monthly limit must be greater than 0")]
    public decimal MonthlyLimit { get; set; }
    
    [Required]
    public bool IsEssential { get; set; }
    
    [StringLength(500)]
    public string? Description { get; set; }
    
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation property
    public ApplicationUser User { get; set; } = null!;
}