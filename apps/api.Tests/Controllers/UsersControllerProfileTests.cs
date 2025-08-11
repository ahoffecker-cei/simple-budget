using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using api.Controllers;
using api.Models;
using api.DTOs;
using api.Data;

namespace api.Tests.Controllers;

public class UsersControllerProfileTests
{
    private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
    private readonly Mock<ApplicationDbContext> _mockContext;
    private readonly UsersController _controller;
    private readonly ApplicationUser _testUser;

    public UsersControllerProfileTests()
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        _mockUserManager = new Mock<UserManager<ApplicationUser>>(store.Object, null, null, null, null, null, null, null, null);
        
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _mockContext = new Mock<ApplicationDbContext>(options);
        
        _controller = new UsersController(_mockUserManager.Object, _mockContext.Object);
        
        _testUser = new ApplicationUser
        {
            Id = "test-user-id",
            Email = "test@example.com",
            FirstName = "Test User",
            MonthlyIncome = 0,
            StudentLoanPayment = 0,
            StudentLoanBalance = 0
        };
    }

    [Fact]
    public async Task UpdateUserProfile_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var request = new UpdateUserProfileRequest
        {
            MonthlyIncome = 5000,
            StudentLoanPayment = 300,
            StudentLoanBalance = 25000
        };

        _mockUserManager.Setup(x => x.GetUserId(It.IsAny<System.Security.Claims.ClaimsPrincipal>()))
            .Returns(_testUser.Id);
        
        _mockUserManager.Setup(x => x.FindByIdAsync(_testUser.Id))
            .ReturnsAsync(_testUser);
        
        _mockUserManager.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _controller.UpdateUserProfile(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var user = Assert.IsType<User>(okResult.Value);
        
        Assert.Equal(5000, user.MonthlyIncome);
        Assert.Equal(300, user.StudentLoanPayment);
        Assert.Equal(25000, user.StudentLoanBalance);
        
        // Verify user was updated
        _mockUserManager.Verify(x => x.UpdateAsync(It.Is<ApplicationUser>(u => 
            u.MonthlyIncome == 5000 && 
            u.StudentLoanPayment == 300 && 
            u.StudentLoanBalance == 25000)), Times.Once);
    }

    [Fact]
    public async Task UpdateUserProfile_IncomeOutOfRange_ReturnsBadRequest()
    {
        // Arrange
        var request = new UpdateUserProfileRequest
        {
            MonthlyIncome = 500, // Below minimum
            StudentLoanPayment = 0,
            StudentLoanBalance = 0
        };

        // Act
        _controller.ModelState.AddModelError("MonthlyIncome", "Monthly income must be between $1,000 and $200,000");
        var result = await _controller.UpdateUserProfile(request);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateUserProfile_NegativeStudentLoanPayment_ReturnsBadRequest()
    {
        // Arrange
        var request = new UpdateUserProfileRequest
        {
            MonthlyIncome = 5000,
            StudentLoanPayment = -100, // Negative value
            StudentLoanBalance = 0
        };

        // Act
        _controller.ModelState.AddModelError("StudentLoanPayment", "Student loan payment cannot be negative");
        var result = await _controller.UpdateUserProfile(request);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateUserProfile_UserNotFound_ReturnsNotFound()
    {
        // Arrange
        var request = new UpdateUserProfileRequest
        {
            MonthlyIncome = 5000,
            StudentLoanPayment = 300,
            StudentLoanBalance = 25000
        };

        _mockUserManager.Setup(x => x.GetUserId(It.IsAny<System.Security.Claims.ClaimsPrincipal>()))
            .Returns(_testUser.Id);
        
        _mockUserManager.Setup(x => x.FindByIdAsync(_testUser.Id))
            .ReturnsAsync((ApplicationUser)null!);

        // Act
        var result = await _controller.UpdateUserProfile(request);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task UpdateUserProfile_UpdateFails_ReturnsBadRequest()
    {
        // Arrange
        var request = new UpdateUserProfileRequest
        {
            MonthlyIncome = 5000,
            StudentLoanPayment = 300,
            StudentLoanBalance = 25000
        };

        var errors = new IdentityError[] 
        { 
            new IdentityError { Code = "UpdateFailed", Description = "User update failed" }
        };

        _mockUserManager.Setup(x => x.GetUserId(It.IsAny<System.Security.Claims.ClaimsPrincipal>()))
            .Returns(_testUser.Id);
        
        _mockUserManager.Setup(x => x.FindByIdAsync(_testUser.Id))
            .ReturnsAsync(_testUser);
        
        _mockUserManager.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(IdentityResult.Failed(errors));

        // Act
        var result = await _controller.UpdateUserProfile(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal(errors, badRequestResult.Value);
    }
}