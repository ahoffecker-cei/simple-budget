using Xunit;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;
using api.Controllers;
using api.DTOs;
using api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace api.Tests.Features;

public class CategoryColorIconTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly BudgetCategoriesController _controller;
    private readonly UserManager<ApplicationUser> _userManager;
    
    public CategoryColorIconTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
            
        _context = new ApplicationDbContext(options);
        
        // Mock UserManager
        var store = new Mock<IUserStore<ApplicationUser>>();
        var optionsMock = new Mock<IOptions<IdentityOptions>>();
        var passwordHasher = new Mock<IPasswordHasher<ApplicationUser>>();
        var userValidators = new List<IUserValidator<ApplicationUser>>();
        var passwordValidators = new List<IPasswordValidator<ApplicationUser>>();
        var keyNormalizer = new Mock<ILookupNormalizer>();
        var errors = new Mock<IdentityErrorDescriber>();
        var services = new Mock<IServiceProvider>();
        var logger = new Mock<ILogger<UserManager<ApplicationUser>>>();
        
        optionsMock.Setup(o => o.Value).Returns(new IdentityOptions());
        
        _userManager = new UserManager<ApplicationUser>(
            store.Object, optionsMock.Object, passwordHasher.Object,
            userValidators, passwordValidators, keyNormalizer.Object,
            errors.Object, services.Object, logger.Object);
            
        // Mock services
        var budgetValidationService = new Mock<IBudgetValidationService>();
        var classificationService = new Mock<ICategoryClassificationService>();
        
        budgetValidationService.Setup(x => x.ValidateBudgetAllocationAsync(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<Guid?>()))
            .ReturnsAsync(new BudgetValidationResult { IsValid = true, TotalBudget = 1000, UserIncome = 5000, RemainingIncome = 4000 });
        
        _controller = new BudgetCategoriesController(_context, _userManager, budgetValidationService.Object, classificationService.Object);
        
        // Setup user context
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "test-user-id")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var principal = new ClaimsPrincipal(identity);
        
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }
    
    [Fact]
    public async Task CreateBudgetCategory_WithColorAndIcon_SavesCorrectly()
    {
        // Arrange
        var request = new CreateBudgetCategoryRequest
        {
            Name = "Test Category",
            MonthlyLimit = 500,
            IsEssential = true,
            Description = "Test description",
            ColorId = "red",
            IconId = "restaurant"
        };
        
        // Act
        var result = await _controller.CreateBudgetCategory(request);
        
        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var categoryDto = Assert.IsType<BudgetCategoryDto>(createdResult.Value);
        
        Assert.Equal("red", categoryDto.ColorId);
        Assert.Equal("restaurant", categoryDto.IconId);
        Assert.Equal("Test Category", categoryDto.Name);
        Assert.Equal(500, categoryDto.MonthlyLimit);
        
        // Verify in database
        var savedCategory = await _context.BudgetCategories.FirstOrDefaultAsync();
        Assert.NotNull(savedCategory);
        Assert.Equal("red", savedCategory.ColorId);
        Assert.Equal("restaurant", savedCategory.IconId);
    }
    
    [Fact]
    public async Task CreateBudgetCategory_WithoutColorAndIcon_UsesDefaults()
    {
        // Arrange
        var request = new CreateBudgetCategoryRequest
        {
            Name = "Test Category Default",
            MonthlyLimit = 300,
            IsEssential = false,
            Description = "Test description"
            // ColorId and IconId not provided
        };
        
        // Act
        var result = await _controller.CreateBudgetCategory(request);
        
        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var categoryDto = Assert.IsType<BudgetCategoryDto>(createdResult.Value);
        
        Assert.Equal("blue", categoryDto.ColorId); // Default color
        Assert.Equal("home", categoryDto.IconId);  // Default icon
    }
    
    [Fact]
    public async Task UpdateBudgetCategory_WithNewColorAndIcon_UpdatesCorrectly()
    {
        // Arrange
        var category = new BudgetCategory
        {
            CategoryId = Guid.NewGuid(),
            UserId = "test-user-id",
            Name = "Original Category",
            MonthlyLimit = 400,
            IsEssential = true,
            ColorId = "blue",
            IconId = "home",
            CreatedAt = DateTime.UtcNow
        };
        
        _context.BudgetCategories.Add(category);
        await _context.SaveChangesAsync();
        
        var updateRequest = new UpdateBudgetCategoryRequest
        {
            Name = "Updated Category",
            MonthlyLimit = 450,
            IsEssential = true,
            ColorId = "green",
            IconId = "local_grocery_store"
        };
        
        // Act
        var result = await _controller.UpdateBudgetCategory(category.CategoryId, updateRequest);
        
        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var categoryDto = Assert.IsType<BudgetCategoryDto>(okResult.Value);
        
        Assert.Equal("green", categoryDto.ColorId);
        Assert.Equal("local_grocery_store", categoryDto.IconId);
        Assert.Equal("Updated Category", categoryDto.Name);
        
        // Verify in database
        var updatedCategory = await _context.BudgetCategories.FindAsync(category.CategoryId);
        Assert.NotNull(updatedCategory);
        Assert.Equal("green", updatedCategory.ColorId);
        Assert.Equal("local_grocery_store", updatedCategory.IconId);
    }
    
    public void Dispose()
    {
        _context.Dispose();
    }
}