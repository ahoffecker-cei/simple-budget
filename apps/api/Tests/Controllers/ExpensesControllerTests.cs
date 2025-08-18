using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Moq;
using System.Security.Claims;
using Xunit;
using api.Controllers;
using api.Data;
using api.DTOs;
using api.Models;
using api.Services;

namespace api.Tests.Controllers
{
    public class ExpensesControllerTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
        private readonly Mock<IBudgetCalculationService> _mockBudgetCalculationService;
        private readonly ExpensesController _controller;
        private readonly string _testUserId = "test-user-id-123";

        public ExpensesControllerTests()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            
            _context = new ApplicationDbContext(options);
            
            // Mock UserManager
            var store = new Mock<IUserStore<ApplicationUser>>();
            _mockUserManager = new Mock<UserManager<ApplicationUser>>(
                store.Object, null, null, null, null, null, null, null, null);
            
            // Mock BudgetCalculationService
            _mockBudgetCalculationService = new Mock<IBudgetCalculationService>();
            
            _controller = new ExpensesController(_context, _mockUserManager.Object, _mockBudgetCalculationService.Object);
            
            // Setup UserManager mock to return test user ID
            _mockUserManager.Setup(x => x.GetUserId(It.IsAny<ClaimsPrincipal>()))
                           .Returns(_testUserId);
            
            // Setup mock user claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, _testUserId)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = principal
                }
            };

            // Seed test data
            SeedTestData();
        }

        private void SeedTestData()
        {
            var testUser = new ApplicationUser
            {
                Id = _testUserId,
                UserName = "test@example.com",
                Email = "test@example.com",
                FirstName = "Test"
            };

            var testCategory = new BudgetCategory
            {
                CategoryId = Guid.NewGuid(),
                UserId = _testUserId,
                Name = "Groceries",
                MonthlyLimit = 500m,
                IsEssential = true
            };

            _context.Users.Add(testUser);
            _context.BudgetCategories.Add(testCategory);
            _context.SaveChanges();
        }

        [Fact]
        public async Task CreateExpense_ValidRequest_ReturnsOkWithExpenseData()
        {
            // Arrange
            var category = await _context.BudgetCategories.FirstAsync(c => c.UserId == _testUserId);
            var request = new CreateExpenseRequest
            {
                CategoryId = category.CategoryId,
                Amount = 25.50m,
                Description = "Weekly grocery shopping",
                ExpenseDate = DateTime.Today
            };

            // Act
            var result = await _controller.CreateExpense(request);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var response = Assert.IsType<ExpenseWithBudgetImpact>(createdResult.Value);
            
            Assert.Equal(request.Amount, response.Expense.Amount);
            Assert.Equal(request.CategoryId, response.Expense.CategoryId);
            Assert.Equal(request.Description, response.Expense.Description);
            Assert.Equal("Groceries", response.Expense.CategoryName);
            Assert.True(response.Expense.IsEssential);
            Assert.Equal(474.50m, response.CategoryRemainingBudget); // 500 - 25.50
        }

        [Fact]
        public async Task CreateExpense_InvalidCategoryId_ReturnsNotFound()
        {
            // Arrange
            var request = new CreateExpenseRequest
            {
                CategoryId = Guid.NewGuid(), // Non-existent category
                Amount = 25.50m,
                Description = "Invalid category test"
            };

            // Act
            var result = await _controller.CreateExpense(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Invalid category ID or category does not belong to user.", badRequestResult.Value);
        }

        [Fact]
        public async Task CreateExpense_NegativeAmount_ReturnsBadRequest()
        {
            // Arrange
            var category = await _context.BudgetCategories.FirstAsync(c => c.UserId == _testUserId);
            var request = new CreateExpenseRequest
            {
                CategoryId = category.CategoryId,
                Amount = -10.00m, // Negative amount
                Description = "Invalid negative amount"
            };

            // Act
            var result = await _controller.CreateExpense(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            var errors = badRequestResult.Value as Dictionary<string, string[]>;
            Assert.NotNull(errors);
            Assert.Contains("Amount", errors.Keys);
        }

        [Fact]
        public async Task CreateExpense_ZeroAmount_ReturnsBadRequest()
        {
            // Arrange
            var category = await _context.BudgetCategories.FirstAsync(c => c.UserId == _testUserId);
            var request = new CreateExpenseRequest
            {
                CategoryId = category.CategoryId,
                Amount = 0m, // Zero amount
                Description = "Invalid zero amount"
            };

            // Act
            var result = await _controller.CreateExpense(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            var errors = badRequestResult.Value as Dictionary<string, string[]>;
            Assert.NotNull(errors);
            Assert.Contains("Amount", errors.Keys);
        }

        [Fact]
        public async Task CreateExpense_FutureDate_ReturnsBadRequest()
        {
            // Arrange
            var category = await _context.BudgetCategories.FirstAsync(c => c.UserId == _testUserId);
            var request = new CreateExpenseRequest
            {
                CategoryId = category.CategoryId,
                Amount = 25.50m,
                Description = "Future date test",
                ExpenseDate = DateTime.Today.AddDays(1) // Future date
            };

            // Act
            var result = await _controller.CreateExpense(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            var errors = badRequestResult.Value as Dictionary<string, string[]>;
            Assert.NotNull(errors);
            Assert.Contains("ExpenseDate", errors.Keys);
        }

        [Fact]
        public async Task CreateExpense_OldDate_ReturnsBadRequest()
        {
            // Arrange
            var category = await _context.BudgetCategories.FirstAsync(c => c.UserId == _testUserId);
            var request = new CreateExpenseRequest
            {
                CategoryId = category.CategoryId,
                Amount = 25.50m,
                Description = "Old date test",
                ExpenseDate = DateTime.Today.AddDays(-31) // More than 30 days ago
            };

            // Act
            var result = await _controller.CreateExpense(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            var errors = badRequestResult.Value as Dictionary<string, string[]>;
            Assert.NotNull(errors);
            Assert.Contains("ExpenseDate", errors.Keys);
        }

        [Fact]
        public async Task GetExpenses_NoParameters_ReturnsRecentExpenses()
        {
            // Arrange - Create some test expenses
            var category = await _context.BudgetCategories.FirstAsync(c => c.UserId == _testUserId);
            var expenses = new List<Expense>
            {
                new Expense
                {
                    ExpenseId = Guid.NewGuid(),
                    UserId = _testUserId,
                    CategoryId = category.CategoryId,
                    Amount = 10.00m,
                    Description = "Test expense 1",
                    ExpenseDate = DateTime.Today.AddDays(-1),
                    CreatedAt = DateTime.UtcNow.AddDays(-1)
                },
                new Expense
                {
                    ExpenseId = Guid.NewGuid(),
                    UserId = _testUserId,
                    CategoryId = category.CategoryId,
                    Amount = 15.00m,
                    Description = "Test expense 2",
                    ExpenseDate = DateTime.Today,
                    CreatedAt = DateTime.UtcNow
                }
            };

            _context.Expenses.AddRange(expenses);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetExpenses();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<RecentExpensesResponse>(okResult.Value);
            
            Assert.Equal(2, response.TotalCount);
            Assert.Equal(2, response.Expenses.Count);
            Assert.Equal(1, response.Page);
            Assert.Equal(20, response.PageSize);
            
            // Check that expenses are ordered by most recent first
            Assert.Equal(15.00m, response.Expenses.First().Expense.Amount);
            Assert.Equal(10.00m, response.Expenses.Last().Expense.Amount);
        }

        [Fact]
        public async Task GetExpenses_WithPagination_ReturnsCorrectPage()
        {
            // Arrange - Create 25 test expenses
            var category = await _context.BudgetCategories.FirstAsync(c => c.UserId == _testUserId);
            var expenses = new List<Expense>();
            
            for (int i = 0; i < 25; i++)
            {
                expenses.Add(new Expense
                {
                    ExpenseId = Guid.NewGuid(),
                    UserId = _testUserId,
                    CategoryId = category.CategoryId,
                    Amount = 10.00m + i,
                    Description = $"Test expense {i}",
                    ExpenseDate = DateTime.Today.AddDays(-i),
                    CreatedAt = DateTime.UtcNow.AddDays(-i)
                });
            }

            _context.Expenses.AddRange(expenses);
            await _context.SaveChangesAsync();

            // Act - Request page 2 with page size 10
            var result = await _controller.GetExpenses(page: 2, pageSize: 10);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<RecentExpensesResponse>(okResult.Value);
            
            Assert.Equal(25, response.TotalCount);
            Assert.Equal(10, response.Expenses.Count);
            Assert.Equal(2, response.Page);
            Assert.Equal(10, response.PageSize);
        }

        [Fact]
        public async Task GetExpenses_WithCategoryFilter_ReturnsFilteredResults()
        {
            // Arrange - Create categories and expenses
            var category1 = await _context.BudgetCategories.FirstAsync(c => c.UserId == _testUserId);
            var category2 = new BudgetCategory
            {
                CategoryId = Guid.NewGuid(),
                UserId = _testUserId,
                Name = "Transportation",
                MonthlyLimit = 200m,
                IsEssential = true
            };
            _context.BudgetCategories.Add(category2);

            var expenses = new List<Expense>
            {
                new Expense
                {
                    ExpenseId = Guid.NewGuid(),
                    UserId = _testUserId,
                    CategoryId = category1.CategoryId,
                    Amount = 10.00m,
                    Description = "Groceries",
                    ExpenseDate = DateTime.Today,
                    CreatedAt = DateTime.UtcNow
                },
                new Expense
                {
                    ExpenseId = Guid.NewGuid(),
                    UserId = _testUserId,
                    CategoryId = category2.CategoryId,
                    Amount = 25.00m,
                    Description = "Gas",
                    ExpenseDate = DateTime.Today,
                    CreatedAt = DateTime.UtcNow
                }
            };

            _context.Expenses.AddRange(expenses);
            await _context.SaveChangesAsync();

            // Act - Filter by category1
            var result = await _controller.GetExpenses(categoryId: category1.CategoryId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<RecentExpensesResponse>(okResult.Value);
            
            Assert.Equal(1, response.TotalCount);
            Assert.Equal(1, response.Expenses.Count);
            Assert.Equal("Groceries", response.Expenses.First().Expense.Description);
        }

        [Fact]
        public async Task GetExpenses_UserIsolation_OnlyReturnsUserExpenses()
        {
            // Arrange - Create another user and their expense
            var otherUserId = "other-user-id-456";
            var otherUser = new User
            {
                Id = otherUserId,
                Email = "other@example.com",
                FirstName = "Other",
                LastName = "User"
            };
            var otherCategory = new BudgetCategory
            {
                CategoryId = Guid.NewGuid(),
                UserId = otherUserId,
                Name = "Other Category",
                MonthlyLimit = 300m,
                IsEssential = false
            };

            _context.Users.Add(otherUser);
            _context.BudgetCategories.Add(otherCategory);

            var otherExpense = new Expense
            {
                ExpenseId = Guid.NewGuid(),
                UserId = otherUserId,
                CategoryId = otherCategory.CategoryId,
                Amount = 50.00m,
                Description = "Other user expense",
                ExpenseDate = DateTime.Today,
                CreatedAt = DateTime.UtcNow
            };

            _context.Expenses.Add(otherExpense);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetExpenses();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<RecentExpensesResponse>(okResult.Value);
            
            // Should not include other user's expense
            Assert.Equal(0, response.TotalCount);
            Assert.Empty(response.Expenses);
        }

        [Fact]
        public async Task CreateExpense_CalculatesBudgetRemainingCorrectly()
        {
            // Arrange - Create existing expenses for the category
            var category = await _context.BudgetCategories.FirstAsync(c => c.UserId == _testUserId);
            
            var existingExpense = new Expense
            {
                ExpenseId = Guid.NewGuid(),
                UserId = _testUserId,
                CategoryId = category.CategoryId,
                Amount = 200.00m,
                Description = "Existing expense",
                ExpenseDate = DateTime.Today.AddDays(-5),
                CreatedAt = DateTime.UtcNow.AddDays(-5)
            };

            _context.Expenses.Add(existingExpense);
            await _context.SaveChangesAsync();

            var request = new CreateExpenseRequest
            {
                CategoryId = category.CategoryId,
                Amount = 50.00m,
                Description = "New expense",
                ExpenseDate = DateTime.Today
            };

            // Act
            var result = await _controller.CreateExpense(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<ExpenseWithBudgetImpactResponse>(okResult.Value);
            
            // Budget remaining should be: 500 (monthly limit) - 200 (existing) - 50 (new) = 250
            Assert.Equal(250.00m, response.BudgetRemaining);
        }

        [Theory]
        [InlineData(450.00, "excellent")] // 10% or less spent
        [InlineData(300.00, "good")]      // 40% spent
        [InlineData(150.00, "attention")] // 70% spent
        [InlineData(50.00, "concern")]    // 90% spent
        public async Task CreateExpense_CalculatesBudgetHealthStatusCorrectly(decimal budgetRemaining, string expectedStatus)
        {
            // Arrange
            var category = await _context.BudgetCategories.FirstAsync(c => c.UserId == _testUserId);
            decimal spentAmount = 500m - budgetRemaining; // Total spent to achieve the remaining amount
            
            var request = new CreateExpenseRequest
            {
                CategoryId = category.CategoryId,
                Amount = spentAmount,
                Description = "Budget health test",
                ExpenseDate = DateTime.Today
            };

            // Act
            var result = await _controller.CreateExpense(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<ExpenseWithBudgetImpactResponse>(okResult.Value);
            
            Assert.Equal(expectedStatus, response.BudgetHealthStatus);
        }

        [Fact]
        public async Task CreateExpense_Performance_RespondsWithin500ms()
        {
            // Arrange
            var category = await _context.BudgetCategories.FirstAsync(c => c.UserId == _testUserId);
            var request = new CreateExpenseRequest
            {
                CategoryId = category.CategoryId,
                Amount = 25.50m,
                Description = "Performance test expense"
            };

            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            // Act
            var result = await _controller.CreateExpense(request);

            // Assert
            stopwatch.Stop();
            Assert.True(stopwatch.ElapsedMilliseconds < 500, 
                $"Response time was {stopwatch.ElapsedMilliseconds}ms, expected < 500ms");
            
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task GetBudgetImpactPreview_ValidInputs_ReturnsOk()
        {
            // Arrange
            var category = await _context.BudgetCategories.FirstAsync(c => c.UserId == _testUserId);
            var amount = 50m;
            var expectedPreview = new BudgetImpactPreviewDto
            {
                CategoryId = category.CategoryId,
                CategoryName = "Groceries",
                CurrentSpent = 100m,
                MonthlyLimit = 500m,
                RemainingAfterExpense = 350m,
                PercentageUsed = 30m,
                HealthStatus = "excellent",
                IsEssential = true,
                ImpactMessage = "Great choice! You're staying well within your essential budget!",
                EncouragementLevel = "celebration"
            };

            _mockBudgetCalculationService
                .Setup(x => x.GetBudgetImpactPreviewAsync(_testUserId, category.CategoryId, amount, null))
                .ReturnsAsync(expectedPreview);

            // Act
            var result = await _controller.GetBudgetImpactPreview(category.CategoryId, amount);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<BudgetImpactPreviewDto>(okResult.Value);
            Assert.Equal(expectedPreview.CategoryId, returnValue.CategoryId);
            Assert.Equal(expectedPreview.CategoryName, returnValue.CategoryName);
            Assert.Equal(expectedPreview.HealthStatus, returnValue.HealthStatus);
            Assert.Equal(expectedPreview.ImpactMessage, returnValue.ImpactMessage);
        }

        [Fact]
        public async Task GetBudgetImpactPreview_InvalidAmount_ReturnsBadRequest()
        {
            // Arrange
            var category = await _context.BudgetCategories.FirstAsync(c => c.UserId == _testUserId);
            var amount = 0m; // Invalid amount

            // Act
            var result = await _controller.GetBudgetImpactPreview(category.CategoryId, amount);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Amount must be between $0.01 and $999,999.99", badRequestResult.Value);
        }

        [Fact]
        public async Task GetBudgetImpactPreview_EmptyCategoryId_ReturnsBadRequest()
        {
            // Arrange
            var categoryId = Guid.Empty;
            var amount = 50m;

            // Act
            var result = await _controller.GetBudgetImpactPreview(categoryId, amount);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("CategoryId is required.", badRequestResult.Value);
        }

        [Fact]
        public async Task CreateExpense_CallsInvalidateBudgetCache()
        {
            // Arrange
            var category = await _context.BudgetCategories.FirstAsync(c => c.UserId == _testUserId);
            var request = new CreateExpenseRequest
            {
                CategoryId = category.CategoryId,
                Amount = 25.50m,
                Description = "Test expense with cache invalidation"
            };

            var mockBudgetImpact = new BudgetImpactPreviewDto
            {
                CategoryId = category.CategoryId,
                CurrentSpent = 25.50m,
                MonthlyLimit = 500m,
                RemainingAfterExpense = 474.50m,
                HealthStatus = "excellent"
            };

            _mockBudgetCalculationService
                .Setup(x => x.GetBudgetImpactPreviewAsync(_testUserId, category.CategoryId, 0, It.IsAny<DateTime?>()))
                .ReturnsAsync(mockBudgetImpact);

            // Act
            var result = await _controller.CreateExpense(request);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            
            // Verify cache invalidation was called
            _mockBudgetCalculationService.Verify(
                x => x.InvalidateBudgetCacheAsync(_testUserId, category.CategoryId),
                Times.Once);
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}