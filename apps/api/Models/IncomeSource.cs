using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models;

public class IncomeSource
{
    [Key]
    public Guid IncomeSourceId { get; set; }
    
    [Required]
    [ForeignKey(nameof(User))]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    [Range(0.01, 9999999.99, ErrorMessage = "Amount must be greater than 0")]
    public decimal Amount { get; set; }
    
    [Required]
    public string Frequency { get; set; } = string.Empty; // 'weekly', 'bi-weekly', 'monthly'
    
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ApplicationUser User { get; set; } = null!;
}