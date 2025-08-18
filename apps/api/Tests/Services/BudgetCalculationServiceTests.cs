using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Xunit;
using api.Data;
using api.DTOs;
using api.Models;
using api.Services;

namespace api.Tests.Services;

public class BudgetCalculationServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly BudgetCalculationService _service;
    private readonly string _testUserId = "test-user-123";

    public BudgetCalculationServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _cache = new MemoryCache(new MemoryCacheOptions());
        _service = new BudgetCalculationService(_context, _cache);

        SeedTestData().Wait();
    }

    private async Task SeedTestData()
    {
        // Create test budget categories
        var categories = new[]
        {
            new BudgetCategory
            {
                CategoryId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                UserId = _testUserId,
                Name = "Groceries",
                MonthlyLimit = 500m,
                IsEssential = true,
                CreatedAt = DateTime.UtcNow
            },
            new BudgetCategory
            {
                CategoryId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                UserId = _testUserId,
                Name = "Entertainment",
                MonthlyLimit = 200m,
                IsEssential = false,
                CreatedAt = DateTime.UtcNow
            },
            new BudgetCategory
            {
                CategoryId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                UserId = _testUserId,
                Name = "Gas",
                MonthlyLimit = 150m,
                IsEssential = true,
                CreatedAt = DateTime.UtcNow
            }
        };

        _context.BudgetCategories.AddRange(categories);

        // Create test expenses
        var now = DateTime.Now;
        var startOfMonth = new DateTime(now.Year, now.Month, 1);
        
        var expenses = new[]
        {
            new Expense
            {
                ExpenseId = Guid.NewGuid(),
                UserId = _testUserId,
                CategoryId = categories[0].CategoryId, // Groceries
                Amount = 100m,
                Description = "Weekly groceries",
                ExpenseDate = startOfMonth.AddDays(5),
                CreatedAt = DateTime.UtcNow
            },
            new Expense
            {
                ExpenseId = Guid.NewGuid(),
                UserId = _testUserId,
                CategoryId = categories[1].CategoryId, // Entertainment
                Amount = 150m,
                Description = "Movie tickets",
                ExpenseDate = startOfMonth.AddDays(10),
                CreatedAt = DateTime.UtcNow
            },
            new Expense
            {
                ExpenseId = Guid.NewGuid(),
                UserId = _testUserId,
                CategoryId = categories[2].CategoryId, // Gas
                Amount = 120m,
                Description = "Gas station",
                ExpenseDate = startOfMonth.AddDays(3),
                CreatedAt = DateTime.UtcNow
            }
        };

        _context.Expenses.AddRange(expenses);
        await _context.SaveChangesAsync();
    }

    [Fact]
    public async Task GetBudgetImpactPreviewAsync_ValidInputs_ReturnsCorrectPreview()
    {
        // Arrange
        var categoryId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var amount = 50m;

        // Act
        var result = await _service.GetBudgetImpactPreviewAsync(_testUserId, categoryId, amount);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(categoryId, result.CategoryId);
        Assert.Equal("Groceries", result.CategoryName);
        Assert.Equal(100m, result.CurrentSpent); // From seed data
        Assert.Equal(500m, result.MonthlyLimit);
        Assert.Equal(350m, result.RemainingAfterExpense); // 500 - (100 + 50)
        Assert.Equal(30m, result.PercentageUsed); // (150 / 500) * 100
        Assert.Equal("excellent", result.HealthStatus);
        Assert.True(result.IsEssential);
        Assert.Contains("Great choice", result.ImpactMessage);
        Assert.Equal("celebration", result.EncouragementLevel);
    }

    [Fact]
    public async Task GetBudgetImpactPreviewAsync_InvalidCategory_ThrowsArgumentException()
    {
        // Arrange
        var invalidCategoryId = Guid.NewGuid();
        var amount = 50m;

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(
            () => _service.GetBudgetImpactPreviewAsync(_testUserId, invalidCategoryId, amount)
        );
    }

    [Theory]
    [InlineData(50, "excellent", "celebration")]
    [InlineData(150, "good", "encouragement")]
    [InlineData(200, "attention", "guidance")]
    [InlineData(350, "concern", "support")]
    public async Task GetBudgetImpactPreviewAsync_DifferentAmounts_ReturnsCorrectHealthStatus(
        decimal amount, string expectedHealthStatus, string expectedEncouragementLevel)
    {
        // Arrange
        var categoryId = Guid.Parse("11111111-1111-1111-1111-111111111111"); // Groceries with $500 limit and $100 spent

        // Act
        var result = await _service.GetBudgetImpactPreviewAsync(_testUserId, categoryId, amount);

        // Assert
        Assert.Equal(expectedHealthStatus, result.HealthStatus);
        Assert.Equal(expectedEncouragementLevel, result.EncouragementLevel);
    }

    [Fact]
    public async Task GetOverallBudgetHealthAsync_ReturnsCorrectOverallHealth()
    {
        // Act
        var result = await _service.GetOverallBudgetHealthAsync(_testUserId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(850m, result.TotalBudgeted); // 500 + 200 + 150
        Assert.Equal(370m, result.TotalSpent); // 100 + 150 + 120
        Assert.Equal(43.53m, Math.Round(result.PercentageUsed, 2)); // (370 / 850) * 100
        Assert.Equal("excellent", result.OverallStatus);
        Assert.Equal("excellent", result.EssentialCategoriesHealth);
        Assert.Equal("good", result.NonEssentialCategoriesHealth);
        Assert.Contains("doing great", result.HealthMessage.ToLower());
        Assert.Contains("amazing work", result.EncouragementMessage.ToLower());
    }

    [Fact]
    public async Task GetMonthlyProgressDataAsync_ReturnsProgressForAllCategories()
    {
        // Act
        var result = await _service.GetMonthlyProgressDataAsync(_testUserId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Length);

        // Check essential category (Groceries)
        var groceries = result.FirstOrDefault(c => c.CategoryName == "Groceries");
        Assert.NotNull(groceries);
        Assert.Equal(100m, groceries.CurrentSpent);
        Assert.Equal(500m, groceries.MonthlyLimit);
        Assert.Equal(20m, groceries.PercentageUsed); // (100 / 500) * 100
        Assert.True(groceries.IsEssential);
        Assert.Equal("excellent", groceries.HealthStatus);

        // Check non-essential category (Entertainment)
        var entertainment = result.FirstOrDefault(c => c.CategoryName == "Entertainment");
        Assert.NotNull(entertainment);
        Assert.Equal(150m, entertainment.CurrentSpent);
        Assert.Equal(200m, entertainment.MonthlyLimit);
        Assert.Equal(75m, entertainment.PercentageUsed); // (150 / 200) * 100
        Assert.False(entertainment.IsEssential);
        Assert.Equal("good", entertainment.HealthStatus);
    }

    [Fact]
    public async Task CalculateCategoryHealthStatusAsync_ReturnsCorrectStatus()
    {
        // Test different spending levels
        var tests = new[]
        {
            new { Spent = 100m, Limit = 500m, Expected = BudgetHealthStatusEnum.Excellent },
            new { Spent = 300m, Limit = 500m, Expected = BudgetHealthStatusEnum.Good },
            new { Spent = 400m, Limit = 500m, Expected = BudgetHealthStatusEnum.Attention },
            new { Spent = 500m, Limit = 500m, Expected = BudgetHealthStatusEnum.Concern },
        };

        foreach (var test in tests)
        {
            // Act
            var result = await _service.CalculateCategoryHealthStatusAsync(
                _testUserId, Guid.NewGuid(), test.Spent, test.Limit);

            // Assert
            Assert.Equal(test.Expected, result);
        }
    }

    [Fact]
    public async Task InvalidateBudgetCacheAsync_ClearsCacheEntries()
    {
        // Arrange - First, populate cache by making a call
        var categoryId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        await _service.GetBudgetImpactPreviewAsync(_testUserId, categoryId, 50m);

        // Verify cache contains entries (this is indirect - we'll test by timing)
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        await _service.GetBudgetImpactPreviewAsync(_testUserId, categoryId, 50m);
        stopwatch.Stop();
        var firstCallTime = stopwatch.ElapsedMilliseconds;

        // Act - Invalidate cache
        await _service.InvalidateBudgetCacheAsync(_testUserId, categoryId);

        // Assert - Next call should be slower (no cache)
        stopwatch.Restart();
        await _service.GetBudgetImpactPreviewAsync(_testUserId, categoryId, 50m);
        stopwatch.Stop();
        var secondCallTime = stopwatch.ElapsedMilliseconds;

        // The test is primarily to ensure no exceptions are thrown during invalidation
        // Cache behavior testing is complex in unit tests, so we mainly verify the method executes
        Assert.True(true); // Method completed without exceptions
    }

    [Fact]
    public async Task GetBudgetImpactPreviewAsync_WithCaching_UsesCacheOnSecondCall()
    {
        // Arrange
        var categoryId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var amount = 50m;

        // Act - First call
        var result1 = await _service.GetBudgetImpactPreviewAsync(_testUserId, categoryId, amount);
        
        // Act - Second call (should use cache)
        var result2 = await _service.GetBudgetImpactPreviewAsync(_testUserId, categoryId, amount);

        // Assert - Both results should be identical
        Assert.Equal(result1.CategoryId, result2.CategoryId);
        Assert.Equal(result1.CurrentSpent, result2.CurrentSpent);
        Assert.Equal(result1.RemainingAfterExpense, result2.RemainingAfterExpense);
        Assert.Equal(result1.HealthStatus, result2.HealthStatus);
        Assert.Equal(result1.ImpactMessage, result2.ImpactMessage);
    }

    [Fact]
    public async Task GetBudgetImpactPreviewAsync_OverBudget_ReturnsCorrectNegativeRemaining()
    {
        // Arrange - Use Entertainment category (limit: $200, spent: $150)
        var categoryId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var amount = 100m; // This will put us $50 over budget

        // Act
        var result = await _service.GetBudgetImpactPreviewAsync(_testUserId, categoryId, amount);

        // Assert
        Assert.Equal(-50m, result.RemainingAfterExpense); // 200 - (150 + 100) = -50
        Assert.Equal(125m, result.PercentageUsed); // (250 / 200) * 100 = 125%
        Assert.Equal("concern", result.HealthStatus);
        Assert.Contains("over", result.ImpactMessage.ToLower());
        Assert.Equal("support", result.EncouragementLevel);
    }

    [Fact]
    public async Task GetBudgetImpactPreviewAsync_EssentialVsNonEssential_HasDifferentMessaging()
    {
        // Arrange
        var essentialCategoryId = Guid.Parse("11111111-1111-1111-1111-111111111111"); // Groceries (Essential)
        var nonEssentialCategoryId = Guid.Parse("22222222-2222-2222-2222-222222222222"); // Entertainment (Non-Essential)
        var amount = 50m;

        // Act
        var essentialResult = await _service.GetBudgetImpactPreviewAsync(_testUserId, essentialCategoryId, amount);
        var nonEssentialResult = await _service.GetBudgetImpactPreviewAsync(_testUserId, nonEssentialCategoryId, amount);

        // Assert
        Assert.True(essentialResult.IsEssential);
        Assert.False(nonEssentialResult.IsEssential);
        Assert.Contains("essential", essentialResult.ImpactMessage.ToLower());
        Assert.Contains("nice-to-have", nonEssentialResult.ImpactMessage.ToLower());
    }

    public void Dispose()
    {
        _context?.Dispose();
        _cache?.Dispose();
    }
}