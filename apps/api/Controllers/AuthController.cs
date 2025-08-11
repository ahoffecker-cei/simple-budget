using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using api.DTOs;
using api.Models;

namespace api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(CreateErrorResponse("VALIDATION_ERROR", "Invalid registration data", GetValidationErrors()));
            }

            // Check if user already exists
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                return BadRequest(CreateErrorResponse("USER_EXISTS", "A user with this email already exists"));
            }

            // Create new user
            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName,
                MonthlyIncome = request.MonthlyIncome,
                StudentLoanPayment = request.StudentLoanPayment,
                StudentLoanBalance = request.StudentLoanBalance,
                CreatedAt = DateTime.UtcNow,
                LastLoginAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return BadRequest(CreateErrorResponse("REGISTRATION_FAILED", errors));
            }

            // Generate JWT token
            var token = await GenerateJwtTokenAsync(user);
            
            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            var response = new AuthResponse
            {
                Token = token.Token,
                User = MapToUser(user),
                ExpiresAt = token.ExpiresAt
            };

            _logger.LogInformation("User {Email} registered successfully", request.Email);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user registration for {Email}", request.Email);
            return StatusCode(500, CreateErrorResponse("INTERNAL_ERROR", "An error occurred during registration"));
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(CreateErrorResponse("VALIDATION_ERROR", "Invalid login data"));
            }

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                return BadRequest(CreateErrorResponse("INVALID_CREDENTIALS", "Invalid email or password"));
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            if (!result.Succeeded)
            {
                return BadRequest(CreateErrorResponse("INVALID_CREDENTIALS", "Invalid email or password"));
            }

            // Generate JWT token
            var token = await GenerateJwtTokenAsync(user);
            
            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            var response = new AuthResponse
            {
                Token = token.Token,
                User = MapToUser(user),
                ExpiresAt = token.ExpiresAt
            };

            _logger.LogInformation("User {Email} logged in successfully", request.Email);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user login for {Email}", request.Email);
            return StatusCode(500, CreateErrorResponse("INTERNAL_ERROR", "An error occurred during login"));
        }
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        try
        {
            // For stateless JWT, logout is handled client-side by removing the token
            // We can log the event for audit purposes
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId != null)
            {
                _logger.LogInformation("User {UserId} logged out", userId);
            }

            return Ok(new { message = "Logged out successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user logout");
            return StatusCode(500, CreateErrorResponse("INTERNAL_ERROR", "An error occurred during logout"));
        }
    }

    private async Task<(string Token, DateTime ExpiresAt)> GenerateJwtTokenAsync(ApplicationUser user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings.GetValue<string>("SecretKey");
        var issuer = jwtSettings.GetValue<string>("Issuer");
        var audience = jwtSettings.GetValue<string>("Audience");
        var expiryMinutes = jwtSettings.GetValue<int>("ExpiryMinutes");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email!),
            new(ClaimTypes.Name, user.FirstName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        // Add user roles if any
        var roles = await _userManager.GetRolesAsync(user);
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    private static User MapToUser(ApplicationUser applicationUser)
    {
        return new User
        {
            UserId = applicationUser.Id,
            Email = applicationUser.Email ?? string.Empty,
            FirstName = applicationUser.FirstName,
            MonthlyIncome = applicationUser.MonthlyIncome,
            StudentLoanPayment = applicationUser.StudentLoanPayment,
            StudentLoanBalance = applicationUser.StudentLoanBalance,
            CreatedAt = applicationUser.CreatedAt,
            LastLoginAt = applicationUser.LastLoginAt
        };
    }

    private ErrorResponse CreateErrorResponse(string code, string message, string? details = null)
    {
        return new ErrorResponse
        {
            Error = new ErrorDetails
            {
                Code = code,
                Message = details != null ? $"{message}: {details}" : message,
                Timestamp = DateTime.UtcNow,
                RequestId = HttpContext.TraceIdentifier
            }
        };
    }

    private string GetValidationErrors()
    {
        return string.Join(", ", ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage));
    }
}