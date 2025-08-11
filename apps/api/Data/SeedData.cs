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
}