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

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}