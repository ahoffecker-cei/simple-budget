using Microsoft.AspNetCore.Identity;
using api.Models;

namespace api.Data;

public static class SeedData
{
    public static async Task SeedStudentLoans(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        // Only seed if there are no student loans yet
        if (context.StudentLoans.Any())
            return;

        // Get all users
        var users = userManager.Users.ToList();
        
        foreach (var user in users.Take(3)) // Just seed for first 3 users
        {
            if (user.StudentLoanBalance > 0)
            {
                // Create multiple loans that sum to the user's total balance
                var totalBalance = user.StudentLoanBalance;
                var totalPayment = user.StudentLoanPayment;
                
                var loans = new List<StudentLoan>
                {
                    new StudentLoan
                    {
                        UserId = user.Id,
                        ServicerName = "Navient",
                        AccountNumber = "****" + new Random().Next(1000, 9999).ToString(),
                        Balance = Math.Round(totalBalance * 0.4m, 2),
                        InterestRate = 4.5m,
                        MonthlyPayment = Math.Round(totalPayment * 0.3m, 2),
                        LoanType = LoanType.Federal,
                        Status = LoanStatus.Active
                    },
                    new StudentLoan
                    {
                        UserId = user.Id,
                        ServicerName = "Great Lakes",
                        AccountNumber = "****" + new Random().Next(1000, 9999).ToString(),
                        Balance = Math.Round(totalBalance * 0.35m, 2),
                        InterestRate = 6.0m,
                        MonthlyPayment = Math.Round(totalPayment * 0.4m, 2),
                        LoanType = LoanType.Federal,
                        Status = LoanStatus.Active
                    },
                    new StudentLoan
                    {
                        UserId = user.Id,
                        ServicerName = "SallieMae",
                        AccountNumber = "****" + new Random().Next(1000, 9999).ToString(),
                        Balance = Math.Round(totalBalance * 0.25m, 2),
                        InterestRate = 7.2m,
                        MonthlyPayment = Math.Round(totalPayment * 0.3m, 2),
                        LoanType = LoanType.Private,
                        Status = LoanStatus.Active
                    }
                };

                context.StudentLoans.AddRange(loans);
            }
        }

        await context.SaveChangesAsync();
    }

    public static async Task SeedDefaultBudgetCategories(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        // Get users who don't have any budget categories yet
        var usersWithoutCategories = userManager.Users
            .Where(u => !context.BudgetCategories.Any(bc => bc.UserId == u.Id))
            .Take(5) // Limit to first 5 users for development
            .ToList();

        if (!usersWithoutCategories.Any())
            return;

        foreach (var user in usersWithoutCategories)
        {
            // Calculate suggested limits based on user income
            var userIncome = user.MonthlyIncome;
            if (userIncome <= 0) continue; // Skip users without income set

            var defaultCategories = new List<BudgetCategory>
            {
                new BudgetCategory
                {
                    CategoryId = Guid.NewGuid(),
                    UserId = user.Id,
                    Name = "Groceries",
                    MonthlyLimit = Math.Round(userIncome * 0.10m, 2), // 10% of income
                    IsEssential = true,
                    Description = "Food and household essentials like cleaning supplies, personal care items",
                    CreatedAt = DateTime.UtcNow
                },
                new BudgetCategory
                {
                    CategoryId = Guid.NewGuid(),
                    UserId = user.Id,
                    Name = "Transportation",
                    MonthlyLimit = Math.Round(userIncome * 0.15m, 2), // 15% of income
                    IsEssential = true,
                    Description = "Gas, public transit, car payments, insurance, and maintenance",
                    CreatedAt = DateTime.UtcNow
                },
                new BudgetCategory
                {
                    CategoryId = Guid.NewGuid(),
                    UserId = user.Id,
                    Name = "Utilities",
                    MonthlyLimit = Math.Round(userIncome * 0.08m, 2), // 8% of income
                    IsEssential = true,
                    Description = "Electricity, water, internet, phone, and other essential services",
                    CreatedAt = DateTime.UtcNow
                },
                new BudgetCategory
                {
                    CategoryId = Guid.NewGuid(),
                    UserId = user.Id,
                    Name = "Entertainment",
                    MonthlyLimit = Math.Round(userIncome * 0.05m, 2), // 5% of income
                    IsEssential = false,
                    Description = "Movies, games, hobbies, streaming services, and recreational activities",
                    CreatedAt = DateTime.UtcNow
                },
                new BudgetCategory
                {
                    CategoryId = Guid.NewGuid(),
                    UserId = user.Id,
                    Name = "Dining Out",
                    MonthlyLimit = Math.Round(userIncome * 0.05m, 2), // 5% of income
                    IsEssential = false,
                    Description = "Restaurants, takeout, coffee shops, and other food outside the home",
                    CreatedAt = DateTime.UtcNow
                }
            };

            context.BudgetCategories.AddRange(defaultCategories);
        }

        await context.SaveChangesAsync();
    }
}