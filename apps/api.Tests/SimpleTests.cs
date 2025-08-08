using api.Models;

namespace api.Tests;

public class SimpleTests
{
    [Fact]
    public void User_Model_Properties_ShouldBeSetCorrectly()
    {
        // Arrange
        var user = new User
        {
            UserId = "test-123",
            Email = "test@example.com",
            FirstName = "John",
            MonthlyIncome = 5000,
            StudentLoanPayment = 300,
            StudentLoanBalance = 25000
        };

        // Act & Assert
        Assert.Equal("test-123", user.UserId);
        Assert.Equal("test@example.com", user.Email);
        Assert.Equal("John", user.FirstName);
        Assert.Equal(5000, user.MonthlyIncome);
        Assert.Equal(300, user.StudentLoanPayment);
        Assert.Equal(25000, user.StudentLoanBalance);
    }

    [Fact]
    public void Account_Model_Properties_ShouldBeSetCorrectly()
    {
        // Arrange
        var account = new Account
        {
            AccountId = "acc-123",
            UserId = "user-123",
            AccountType = AccountType.Checking,
            AccountName = "Main Checking",
            CurrentBalance = 1500.50m
        };

        // Act & Assert
        Assert.Equal("acc-123", account.AccountId);
        Assert.Equal("user-123", account.UserId);
        Assert.Equal(AccountType.Checking, account.AccountType);
        Assert.Equal("Main Checking", account.AccountName);
        Assert.Equal(1500.50m, account.CurrentBalance);
    }
}