using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using api.Models;

namespace api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }
    
    public DbSet<Account> Accounts { get; set; }
    public DbSet<StudentLoan> StudentLoans { get; set; }
    public DbSet<BudgetCategory> BudgetCategories { get; set; }
    public DbSet<Expense> Expenses { get; set; }
    public DbSet<IncomeSource> IncomeSources { get; set; }
    public DbSet<SavingsGoal> SavingsGoals { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Configure ApplicationUser entity
        modelBuilder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(e => e.FirstName).HasMaxLength(100);
            entity.Property(e => e.MonthlyIncome).HasColumnType("decimal(18,2)");
            entity.Property(e => e.StudentLoanPayment).HasColumnType("decimal(18,2)");
            entity.Property(e => e.StudentLoanBalance).HasColumnType("decimal(18,2)");
        });
        
        // Configure Account entity
        modelBuilder.Entity<Account>(entity =>
        {
            entity.HasKey(e => e.AccountId);
            entity.Property(e => e.AccountId).ValueGeneratedNever();
            entity.Property(e => e.CurrentBalance).HasColumnType("decimal(18,2)");
            entity.HasOne(e => e.User)
                .WithMany(u => u.Accounts)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        // Configure StudentLoan entity
        modelBuilder.Entity<StudentLoan>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Balance).HasColumnType("decimal(18,2)");
            entity.Property(e => e.InterestRate).HasColumnType("decimal(5,2)");
            entity.Property(e => e.MonthlyPayment).HasColumnType("decimal(18,2)");
            entity.Property(e => e.ServicerName).HasMaxLength(100);
            entity.Property(e => e.AccountNumber).HasMaxLength(50);
            entity.Property(e => e.LoanType).HasConversion<string>();
            entity.Property(e => e.Status).HasConversion<string>();
            entity.HasOne(e => e.User)
                .WithMany(u => u.StudentLoans)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        // Configure BudgetCategory entity
        modelBuilder.Entity<BudgetCategory>(entity =>
        {
            entity.HasKey(e => e.CategoryId);
            entity.Property(e => e.CategoryId).ValueGeneratedOnAdd();
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.MonthlyLimit).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.HasOne(e => e.User)
                .WithMany(u => u.BudgetCategories)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Add unique constraint for Name per User
            entity.HasIndex(e => new { e.UserId, e.Name }).IsUnique();
        });
        
        // Configure Expense entity
        modelBuilder.Entity<Expense>(entity =>
        {
            entity.HasKey(e => e.ExpenseId);
            entity.Property(e => e.ExpenseId).ValueGeneratedOnAdd();
            entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.BudgetCategory)
                .WithMany()
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.SavingsGoal)
                .WithMany()
                .HasForeignKey(e => e.SavingsGoalId)
                .OnDelete(DeleteBehavior.NoAction);
        });
        
        // Configure IncomeSource entity
        modelBuilder.Entity<IncomeSource>(entity =>
        {
            entity.HasKey(e => e.IncomeSourceId);
            entity.Property(e => e.IncomeSourceId).ValueGeneratedOnAdd();
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Frequency).HasMaxLength(20);
            entity.HasOne(e => e.User)
                .WithMany(u => u.IncomeSources)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Add unique constraint for Name per User
            entity.HasIndex(e => new { e.UserId, e.Name }).IsUnique();
        });
        
        // Configure SavingsGoal entity
        modelBuilder.Entity<SavingsGoal>(entity =>
        {
            entity.HasKey(e => e.SavingsGoalId);
            entity.Property(e => e.SavingsGoalId).ValueGeneratedOnAdd();
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.TargetAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CurrentProgress).HasColumnType("decimal(18,2)");
            entity.HasOne(e => e.User)
                .WithMany(u => u.SavingsGoals)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Add unique constraint for Name per User
            entity.HasIndex(e => new { e.UserId, e.Name }).IsUnique();
        });
    }
}