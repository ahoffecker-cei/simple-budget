using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using api.Data;
using api.DTOs;
using Microsoft.AspNetCore.Identity;
using api.Models;

namespace api.Tests.Controllers;

public class AuthControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public AuthControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("ConnectionStrings:DefaultConnection", "");
            builder.ConfigureServices(services =>
            {
                // Remove the app's ApplicationDbContext registration
                var descriptors = services.Where(d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>)).ToList();
                foreach (var descriptor in descriptors)
                {
                    services.Remove(descriptor);
                }

                // Add ApplicationDbContext using an in-memory database for testing
                services.AddDbContext<ApplicationDbContext>(options =>
                {
                    options.UseInMemoryDatabase($"InMemoryDbForTesting_{Guid.NewGuid()}");
                });
            });
        });

        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task Register_ValidUser_ReturnsAuthResponse()
    {
        // Arrange
        var registerRequest = new RegisterRequest
        {
            Email = "test@example.com",
            Password = "TestPassword123",
            FirstName = "Test",
            MonthlyIncome = 5000,
            StudentLoanPayment = 300,
            StudentLoanBalance = 15000
        };

        var json = JsonSerializer.Serialize(registerRequest);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/v1/auth/register", content);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseString = await response.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponse>(responseString, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(authResponse);
        Assert.NotEmpty(authResponse.Token);
        Assert.Equal(registerRequest.Email, authResponse.User.Email);
        Assert.Equal(registerRequest.FirstName, authResponse.User.FirstName);
        Assert.Equal(registerRequest.MonthlyIncome, authResponse.User.MonthlyIncome);
        Assert.True(authResponse.ExpiresAt > DateTime.UtcNow);
    }

    [Fact]
    public async Task Register_WeakPassword_ReturnsBadRequest()
    {
        // Arrange
        var registerRequest = new RegisterRequest
        {
            Email = "test@example.com",
            Password = "weak",
            FirstName = "Test",
            MonthlyIncome = 5000
        };

        var json = JsonSerializer.Serialize(registerRequest);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/v1/auth/register", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Register_InvalidEmail_ReturnsBadRequest()
    {
        // Arrange
        var registerRequest = new RegisterRequest
        {
            Email = "invalid-email",
            Password = "TestPassword123",
            FirstName = "Test",
            MonthlyIncome = 5000
        };

        var json = JsonSerializer.Serialize(registerRequest);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/v1/auth/register", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Register_DuplicateEmail_ReturnsBadRequest()
    {
        // Arrange
        var registerRequest = new RegisterRequest
        {
            Email = "duplicate@example.com",
            Password = "TestPassword123",
            FirstName = "Test",
            MonthlyIncome = 5000
        };

        var json = JsonSerializer.Serialize(registerRequest);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // First registration
        var firstResponse = await _client.PostAsync("/api/v1/auth/register", content);
        firstResponse.EnsureSuccessStatusCode();

        // Act - Second registration with same email
        var secondResponse = await _client.PostAsync("/api/v1/auth/register", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, secondResponse.StatusCode);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsAuthResponse()
    {
        // Arrange - First register a user
        var email = "login@example.com";
        var password = "TestPassword123";
        
        var registerRequest = new RegisterRequest
        {
            Email = email,
            Password = password,
            FirstName = "Test",
            MonthlyIncome = 5000
        };

        var registerJson = JsonSerializer.Serialize(registerRequest);
        var registerContent = new StringContent(registerJson, Encoding.UTF8, "application/json");
        var registerResponse = await _client.PostAsync("/api/v1/auth/register", registerContent);
        registerResponse.EnsureSuccessStatusCode();

        // Act - Login with the same credentials
        var loginRequest = new LoginRequest
        {
            Email = email,
            Password = password
        };

        var loginJson = JsonSerializer.Serialize(loginRequest);
        var loginContent = new StringContent(loginJson, Encoding.UTF8, "application/json");
        var loginResponse = await _client.PostAsync("/api/v1/auth/login", loginContent);

        // Assert
        loginResponse.EnsureSuccessStatusCode();
        var responseString = await loginResponse.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponse>(responseString, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(authResponse);
        Assert.NotEmpty(authResponse.Token);
        Assert.Equal(email, authResponse.User.Email);
        Assert.True(authResponse.ExpiresAt > DateTime.UtcNow);
    }

    [Fact]
    public async Task Login_InvalidCredentials_ReturnsBadRequest()
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            Email = "nonexistent@example.com",
            Password = "WrongPassword123"
        };

        var json = JsonSerializer.Serialize(loginRequest);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/v1/auth/login", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_WrongPassword_ReturnsBadRequest()
    {
        // Arrange - First register a user
        var email = "wrongpass@example.com";
        var correctPassword = "TestPassword123";
        
        var registerRequest = new RegisterRequest
        {
            Email = email,
            Password = correctPassword,
            FirstName = "Test",
            MonthlyIncome = 5000
        };

        var registerJson = JsonSerializer.Serialize(registerRequest);
        var registerContent = new StringContent(registerJson, Encoding.UTF8, "application/json");
        var registerResponse = await _client.PostAsync("/api/v1/auth/register", registerContent);
        registerResponse.EnsureSuccessStatusCode();

        // Act - Login with wrong password
        var loginRequest = new LoginRequest
        {
            Email = email,
            Password = "WrongPassword123"
        };

        var loginJson = JsonSerializer.Serialize(loginRequest);
        var loginContent = new StringContent(loginJson, Encoding.UTF8, "application/json");
        var loginResponse = await _client.PostAsync("/api/v1/auth/login", loginContent);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, loginResponse.StatusCode);
    }
}