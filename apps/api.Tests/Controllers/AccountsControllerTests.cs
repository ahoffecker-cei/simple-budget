using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using api.Controllers;
using api.Data;
using api.Models;
using api.DTOs;

namespace api.Tests.Controllers;

public class AccountsControllerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly AccountsController _controller;
    private readonly string _testUserId = "test-user-id";

    public AccountsControllerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new ApplicationDbContext(options);
        _controller = new AccountsController(_context);

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
    public async Task GetAccounts_ReturnsUserAccounts()
    {
        // Arrange
        var account1 = new Account
        {
            AccountId = Guid.NewGuid().ToString(),
            UserId = _testUserId,
            AccountType = AccountType.Checking,
            AccountName = "Test Checking",
            CurrentBalance = 1000.00m
        };

        var account2 = new Account
        {
            AccountId = Guid.NewGuid().ToString(),
            UserId = "other-user-id", // Different user
            AccountType = AccountType.Savings,
            AccountName = "Other User Account",
            CurrentBalance = 500.00m
        };

        _context.Accounts.AddRange(account1, account2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _controller.GetAccounts();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var accounts = Assert.IsAssignableFrom<List<AccountDto>>(okResult.Value);
        
        Assert.Single(accounts); // Should only return current user's account
        Assert.Equal("Test Checking", accounts[0].AccountName);
        Assert.Equal("checking", accounts[0].AccountType);
    }

    [Fact]
    public async Task CreateAccount_ValidRequest_CreatesAccount()
    {
        // Arrange
        var request = new CreateAccountRequest
        {
            AccountType = "savings",
            AccountName = "Emergency Fund",
            CurrentBalance = 2500.00m
        };

        // Act
        var result = await _controller.CreateAccount(request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var accountDto = Assert.IsAssignableFrom<AccountDto>(createdResult.Value);
        
        Assert.Equal("Emergency Fund", accountDto.AccountName);
        Assert.Equal("savings", accountDto.AccountType);
        Assert.Equal(2500.00m, accountDto.CurrentBalance);

        // Verify account was saved to database
        var savedAccount = await _context.Accounts.FirstOrDefaultAsync(a => a.UserId == _testUserId);
        Assert.NotNull(savedAccount);
        Assert.Equal("Emergency Fund", savedAccount.AccountName);
    }

    [Fact]
    public async Task CreateAccount_InvalidAccountType_ReturnsBadRequest()
    {
        // Arrange
        var request = new CreateAccountRequest
        {
            AccountType = "invalid-type",
            AccountName = "Test Account",
            CurrentBalance = 1000.00m
        };

        // Act
        var result = await _controller.CreateAccount(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Contains("Invalid account type", badRequestResult.Value.ToString());
    }

    [Fact]
    public async Task UpdateAccount_ValidRequest_UpdatesAccount()
    {
        // Arrange
        var account = new Account
        {
            AccountId = Guid.NewGuid().ToString(),
            UserId = _testUserId,
            AccountType = AccountType.Checking,
            AccountName = "Old Name",
            CurrentBalance = 500.00m
        };

        _context.Accounts.Add(account);
        await _context.SaveChangesAsync();

        var updateRequest = new UpdateAccountRequest
        {
            AccountName = "New Name",
            CurrentBalance = 1500.00m
        };

        // Act
        var result = await _controller.UpdateAccount(account.AccountId, updateRequest);

        // Assert
        Assert.IsType<NoContentResult>(result);

        // Verify account was updated
        var updatedAccount = await _context.Accounts.FindAsync(account.AccountId);
        Assert.NotNull(updatedAccount);
        Assert.Equal("New Name", updatedAccount.AccountName);
        Assert.Equal(1500.00m, updatedAccount.CurrentBalance);
    }

    [Fact]
    public async Task UpdateAccount_NonexistentAccount_ReturnsNotFound()
    {
        // Arrange
        var updateRequest = new UpdateAccountRequest
        {
            AccountName = "New Name",
            CurrentBalance = 1500.00m
        };

        // Act
        var result = await _controller.UpdateAccount("nonexistent-id", updateRequest);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task DeleteAccount_ValidAccount_DeletesAccount()
    {
        // Arrange
        var account = new Account
        {
            AccountId = Guid.NewGuid().ToString(),
            UserId = _testUserId,
            AccountType = AccountType.Checking,
            AccountName = "Test Account",
            CurrentBalance = 1000.00m
        };

        _context.Accounts.Add(account);
        await _context.SaveChangesAsync();

        // Act
        var result = await _controller.DeleteAccount(account.AccountId);

        // Assert
        Assert.IsType<NoContentResult>(result);

        // Verify account was deleted
        var deletedAccount = await _context.Accounts.FindAsync(account.AccountId);
        Assert.Null(deletedAccount);
    }

    [Fact]
    public async Task DeleteAccount_NonexistentAccount_ReturnsNotFound()
    {
        // Act
        var result = await _controller.DeleteAccount("nonexistent-id");

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}