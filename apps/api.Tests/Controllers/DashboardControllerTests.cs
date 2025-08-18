using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Moq;
using api.Controllers;
using api.Data;
using api.Models;
using api.DTOs;
using api.Services;

namespace api.Tests.Controllers;

public class DashboardControllerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ICategoryClassificationService> _mockClassificationService;
    private readonly Mock<IBudgetCalculationService> _mockBudgetCalculationService;
    private readonly Mock<IDashboardService> _mockDashboardService;
    private readonly DashboardController _controller;
    private readonly string _testUserId = "test-user-id";

    public DashboardControllerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new ApplicationDbContext(options);
        _mockClassificationService = new Mock<ICategoryClassificationService>();
        _mockBudgetCalculationService = new Mock<IBudgetCalculationService>();
        _mockDashboardService = new Mock<IDashboardService>();
        _controller = new DashboardController(_context, _mockClassificationService.Object, _mockBudgetCalculationService.Object, _mockDashboardService.Object);

        // Set up test user context
        var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
        {
            new Claim(ClaimTypes.NameIdentifier, _testUserId)
        }, "mock"));

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = user }
        };
    }

    [Fact]
    public async Task GetDashboard_NoAccounts_ReturnsEmptyDashboard()
    {
        // Act
        var result = await _controller.GetDashboard();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var dashboard = Assert.IsAssignableFrom<DashboardResponse>(okResult.Value);
        
        Assert.Equal("concern", dashboard.OverallHealthStatus);
        Assert.Equal(0m, dashboard.TotalNetWorth);
        Assert.Empty(dashboard.Accounts);
    }

    [Fact]
    public async Task GetDashboard_WithAccounts_CalculatesCorrectNetWorth()
    {
        // Arrange
        var accounts = new List<Account>
        {
            new Account
            {
                AccountId = Guid.NewGuid().ToString(),
                UserId = _testUserId,
                AccountType = AccountType.Checking,
                AccountName = "Checking",
                CurrentBalance = 1000.00m
            },
            new Account
            {
                AccountId = Guid.NewGuid().ToString(),
                UserId = _testUserId,
                AccountType = AccountType.Savings,
                AccountName = "Savings",
                CurrentBalance = 15000.00m
            },
            new Account
            {
                AccountId = Guid.NewGuid().ToString(),
                UserId = _testUserId,
                AccountType = AccountType.Retirement,
                AccountName = "401k",
                CurrentBalance = 75000.00m
            }
        };

        _context.Accounts.AddRange(accounts);
        await _context.SaveChangesAsync();

        // Act
        var result = await _controller.GetDashboard();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var dashboard = Assert.IsAssignableFrom<DashboardResponse>(okResult.Value);
        
        Assert.Equal("excellent", dashboard.OverallHealthStatus); // Total is 91,000 which is >= 50,000
        Assert.Equal(91000.00m, dashboard.TotalNetWorth);
        Assert.Equal(3, dashboard.Accounts.Count);
    }

    [Fact]
    public async Task GetDashboard_HealthStatusCalculation_ReturnsCorrectStatus()
    {
        // Test different health status thresholds
        var testCases = new[]
        {
            new { Balance = 75000.00m, ExpectedStatus = "excellent" },
            new { Balance = 25000.00m, ExpectedStatus = "good" },
            new { Balance = 5000.00m, ExpectedStatus = "attention" },
            new { Balance = 500.00m, ExpectedStatus = "concern" }
        };

        foreach (var testCase in testCases)
        {
            // Arrange - Clear any existing accounts
            _context.Accounts.RemoveRange(_context.Accounts);
            await _context.SaveChangesAsync();

            var account = new Account
            {
                AccountId = Guid.NewGuid().ToString(),
                UserId = _testUserId,
                AccountType = AccountType.Checking,
                AccountName = "Test Account",
                CurrentBalance = testCase.Balance
            };

            _context.Accounts.Add(account);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetDashboard();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var dashboard = Assert.IsAssignableFrom<DashboardResponse>(okResult.Value);
            
            Assert.Equal(testCase.ExpectedStatus, dashboard.OverallHealthStatus);
            Assert.Equal(testCase.Balance, dashboard.TotalNetWorth);
        }
    }

    [Fact]
    public async Task GetDashboard_OnlyReturnsCurrentUserAccounts()
    {
        // Arrange
        var currentUserAccount = new Account
        {
            AccountId = Guid.NewGuid().ToString(),
            UserId = _testUserId,
            AccountType = AccountType.Checking,
            AccountName = "My Account",
            CurrentBalance = 1000.00m
        };

        var otherUserAccount = new Account
        {
            AccountId = Guid.NewGuid().ToString(),
            UserId = "other-user-id",
            AccountType = AccountType.Savings,
            AccountName = "Other User Account",
            CurrentBalance = 5000.00m
        };

        _context.Accounts.AddRange(currentUserAccount, otherUserAccount);
        await _context.SaveChangesAsync();

        // Act
        var result = await _controller.GetDashboard();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var dashboard = Assert.IsAssignableFrom<DashboardResponse>(okResult.Value);
        
        Assert.Single(dashboard.Accounts);
        Assert.Equal("My Account", dashboard.Accounts[0].AccountName);
        Assert.Equal(1000.00m, dashboard.TotalNetWorth); // Only current user's account
    }

    [Fact]
    public async Task GetDashboard_UnauthorizedUser_ReturnsUnauthorized()
    {
        // Arrange - Create controller without user context
        var controller = new DashboardController(_context, _mockClassificationService.Object, _mockBudgetCalculationService.Object, _mockDashboardService.Object);
        controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext()
        };

        // Act
        var result = await controller.GetDashboard();

        // Assert
        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    [Fact]
    public async Task GetCompleteOverview_ValidUser_ReturnsCompleteOverview()
    {
        // Arrange
        var expectedOverview = new DashboardOverviewResponseDto
        {
            OverallHealthStatus = "excellent",
            OverallHealthMessage = "You're doing fantastic!",
            TotalNetWorth = 50000m,
            Accounts = new List<AccountDto>(),
            BudgetSummary = new List<BudgetCategorySummaryDto>(),
            RecentExpenses = new List<ExpenseWithCategoryDto>(),
            MonthlyProgress = new MonthlyProgressSummaryDto()
        };

        _mockDashboardService
            .Setup(s => s.GetCompleteOverviewAsync(_testUserId))
            .ReturnsAsync(expectedOverview);

        // Act
        var result = await _controller.GetCompleteOverview();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var overview = Assert.IsAssignableFrom<DashboardOverviewResponseDto>(okResult.Value);
        
        Assert.Equal("excellent", overview.OverallHealthStatus);
        Assert.Equal("You're doing fantastic!", overview.OverallHealthMessage);
        Assert.Equal(50000m, overview.TotalNetWorth);
        
        _mockDashboardService.Verify(s => s.GetCompleteOverviewAsync(_testUserId), Times.Once);
    }

    [Fact]
    public async Task GetCompleteOverview_UnauthorizedUser_ReturnsUnauthorized()
    {
        // Arrange - Create controller without user context
        var controller = new DashboardController(_context, _mockClassificationService.Object, _mockBudgetCalculationService.Object, _mockDashboardService.Object);
        controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext()
        };

        // Act
        var result = await controller.GetCompleteOverview();

        // Assert
        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    [Fact]
    public async Task GetCategoryExpenses_ValidRequest_ReturnsCategoryExpenses()
    {
        // Arrange
        var categoryId = Guid.NewGuid();
        var expectedExpenses = new ExpenseWithCategoryDto[]
        {
            new ExpenseWithCategoryDto
            {
                ExpenseId = Guid.NewGuid(),
                Amount = 50.00m,
                Description = "Test expense",
                CategoryName = "Test Category",
                CategoryId = categoryId,
                IsEssential = true
            }
        };

        _mockDashboardService
            .Setup(s => s.GetCategoryExpensesAsync(_testUserId, categoryId, null, null))
            .ReturnsAsync(expectedExpenses);

        // Act
        var result = await _controller.GetCategoryExpenses(categoryId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var expenses = Assert.IsAssignableFrom<ExpenseWithCategoryDto[]>(okResult.Value);
        
        Assert.Single(expenses);
        Assert.Equal(categoryId, expenses[0].CategoryId);
        Assert.Equal("Test Category", expenses[0].CategoryName);
        Assert.Equal(50.00m, expenses[0].Amount);
        
        _mockDashboardService.Verify(s => s.GetCategoryExpensesAsync(_testUserId, categoryId, null, null), Times.Once);
    }

    [Fact]
    public async Task GetCategoryExpenses_UnauthorizedUser_ReturnsUnauthorized()
    {
        // Arrange - Create controller without user context
        var controller = new DashboardController(_context, _mockClassificationService.Object, _mockBudgetCalculationService.Object, _mockDashboardService.Object);
        controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext()
        };

        // Act
        var result = await controller.GetCategoryExpenses(Guid.NewGuid());

        // Assert
        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}