using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using api.Controllers;
using api.Models;
using api.DTOs;

namespace api.Tests.Controllers;

public class BudgetWizardControllerTests
{
    private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
    private readonly BudgetWizardController _controller;
    private readonly ApplicationUser _testUser;

    public BudgetWizardControllerTests()
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        _mockUserManager = new Mock<UserManager<ApplicationUser>>(store.Object, null, null, null, null, null, null, null, null);
        
        _controller = new BudgetWizardController(_mockUserManager.Object);
        
        _testUser = new ApplicationUser
        {
            Id = "test-user-id",
            Email = "test@example.com",
            FirstName = "Test User"
        };
    }

    [Fact]
    public async Task CompleteBudgetWizard_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var request = new BudgetWizardRequest
        {
            MonthlyIncome = 5000,
            StudentLoanPayment = 300,
            StudentLoanBalance = 25000,
            MajorExpenses = new Dictionary<string, decimal>
            {
                { "rent", 1200 },
                { "utilities", 150 },
                { "transportation", 400 }
            },
            SavingsGoal = 10000
        };

        _mockUserManager.Setup(x => x.GetUserId(It.IsAny<System.Security.Claims.ClaimsPrincipal>()))
            .Returns(_testUser.Id);
        
        _mockUserManager.Setup(x => x.FindByIdAsync(_testUser.Id))
            .ReturnsAsync(_testUser);
        
        _mockUserManager.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _controller.CompleteBudgetWizard(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<BudgetWizardResponse>(okResult.Value);
        
        Assert.Equal(5000, response.BudgetHealth.TotalIncome);
        Assert.Equal(1750, response.BudgetHealth.TotalExpenses); // rent + utilities + transportation
        Assert.Equal(300, response.BudgetHealth.StudentLoanPayments);
        Assert.Equal(2950, response.BudgetHealth.AvailableForSavings); // 5000 - 1750 - 300
        Assert.Equal("Excellent", response.BudgetHealth.HealthRating);
    }

    [Fact]
    public async Task CompleteBudgetWizard_IncomeOutOfRange_ReturnsBadRequest()
    {
        // Arrange
        var request = new BudgetWizardRequest
        {
            MonthlyIncome = 500, // Below minimum of 1000
            MajorExpenses = new Dictionary<string, decimal>()
        };

        // Act
        _controller.ModelState.AddModelError("MonthlyIncome", "Monthly income must be between $1,000 and $200,000");
        var result = await _controller.CompleteBudgetWizard(request);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task CompleteBudgetWizard_UserNotFound_ReturnsNotFound()
    {
        // Arrange
        var request = new BudgetWizardRequest
        {
            MonthlyIncome = 5000,
            MajorExpenses = new Dictionary<string, decimal>()
        };

        _mockUserManager.Setup(x => x.GetUserId(It.IsAny<System.Security.Claims.ClaimsPrincipal>()))
            .Returns(_testUser.Id);
        
        _mockUserManager.Setup(x => x.FindByIdAsync(_testUser.Id))
            .ReturnsAsync((ApplicationUser)null!);

        // Act
        var result = await _controller.CompleteBudgetWizard(request);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task CompleteBudgetWizard_HighExpenseRatio_ReturnsFairRating()
    {
        // Arrange
        var request = new BudgetWizardRequest
        {
            MonthlyIncome = 3000,
            StudentLoanPayment = 500,
            MajorExpenses = new Dictionary<string, decimal>
            {
                { "rent", 1800 }, // High rent
                { "utilities", 200 },
                { "transportation", 300 }
            }
        };

        _mockUserManager.Setup(x => x.GetUserId(It.IsAny<System.Security.Claims.ClaimsPrincipal>()))
            .Returns(_testUser.Id);
        
        _mockUserManager.Setup(x => x.FindByIdAsync(_testUser.Id))
            .ReturnsAsync(_testUser);
        
        _mockUserManager.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _controller.CompleteBudgetWizard(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<BudgetWizardResponse>(okResult.Value);
        
        // Expense ratio is (2300 + 500) / 3000 = 0.93, which should be "Needs Improvement"
        Assert.Equal("Needs Improvement", response.BudgetHealth.HealthRating);
        Assert.True(response.BudgetHealth.Recommendations.Count > 0);
    }
}