using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using api.Models;
using api.DTOs;

namespace api.Controllers;

[ApiController]
[Route("api/v1/budget/wizard")]
[Authorize]
public class BudgetWizardController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;

    public BudgetWizardController(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    [HttpPost("complete")]
    public async Task<ActionResult<BudgetWizardResponse>> CompleteBudgetWizard(BudgetWizardRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var applicationUser = await _userManager.FindByIdAsync(userId);
        if (applicationUser == null)
        {
            return NotFound();
        }

        // Update user profile with wizard data
        applicationUser.MonthlyIncome = request.MonthlyIncome;
        applicationUser.StudentLoanPayment = request.StudentLoanPayment ?? 0;
        applicationUser.StudentLoanBalance = request.StudentLoanBalance ?? 0;

        var result = await _userManager.UpdateAsync(applicationUser);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        // Calculate budget health
        var budgetHealth = CalculateBudgetHealth(request);

        var response = new BudgetWizardResponse
        {
            UserProfile = MapToUser(applicationUser),
            BudgetHealth = budgetHealth,
            Message = "Budget setup completed successfully! You're on your way to financial wellness."
        };

        return Ok(response);
    }

    private BudgetHealthStatus CalculateBudgetHealth(BudgetWizardRequest request)
    {
        var totalExpenses = request.MajorExpenses.Values.Sum();
        var studentLoanPayments = request.StudentLoanPayment ?? 0;
        var availableForSavings = request.MonthlyIncome - totalExpenses - studentLoanPayments;
        var savingsGoal = request.SavingsGoal ?? 0;

        // Calculate health rating
        var expenseRatio = (totalExpenses + studentLoanPayments) / request.MonthlyIncome;
        string healthRating;
        var recommendations = new List<string>();

        if (expenseRatio <= 0.5m)
        {
            healthRating = "Excellent";
            recommendations.Add("Great job! You have plenty of room for savings and emergency funds.");
        }
        else if (expenseRatio <= 0.7m)
        {
            healthRating = "Good";
            recommendations.Add("You're doing well! Consider increasing your emergency fund.");
        }
        else if (expenseRatio <= 0.9m)
        {
            healthRating = "Fair";
            recommendations.Add("Look for ways to reduce expenses or increase income.");
            recommendations.Add("Focus on building a small emergency fund first.");
        }
        else
        {
            healthRating = "Needs Improvement";
            recommendations.Add("Your expenses are very high relative to income.");
            recommendations.Add("Consider reviewing your budget to identify areas to cut costs.");
        }

        if (availableForSavings > 0 && savingsGoal > 0)
        {
            var monthsToGoal = savingsGoal / availableForSavings;
            if (monthsToGoal <= 12)
            {
                recommendations.Add($"You can reach your savings goal in about {Math.Ceiling(monthsToGoal)} months!");
            }
        }

        return new BudgetHealthStatus
        {
            TotalIncome = request.MonthlyIncome,
            TotalExpenses = totalExpenses,
            StudentLoanPayments = studentLoanPayments,
            AvailableForSavings = availableForSavings,
            SavingsGoal = savingsGoal,
            HealthRating = healthRating,
            Recommendations = recommendations
        };
    }

    private static User MapToUser(ApplicationUser applicationUser)
    {
        return new User
        {
            UserId = applicationUser.Id,
            Email = applicationUser.Email ?? string.Empty,
            FirstName = applicationUser.FirstName,
            MonthlyIncome = applicationUser.MonthlyIncome,
            StudentLoanPayment = applicationUser.StudentLoanPayment,
            StudentLoanBalance = applicationUser.StudentLoanBalance,
            CreatedAt = applicationUser.CreatedAt,
            LastLoginAt = applicationUser.LastLoginAt
        };
    }
}