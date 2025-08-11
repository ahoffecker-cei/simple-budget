using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Models;
using api.Data;
using api.DTOs;

namespace api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;

    public UsersController(UserManager<ApplicationUser> userManager, ApplicationDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<User>>> GetUsers()
    {
        var applicationUsers = await _userManager.Users.ToListAsync();
        var users = applicationUsers.Select(MapToUser).ToList();
        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<User>> GetUser(string id)
    {
        var applicationUser = await _userManager.FindByIdAsync(id);

        if (applicationUser == null)
        {
            return NotFound();
        }

        return Ok(await MapToUserWithLoans(applicationUser));
    }

    [HttpPut("profile")]
    public async Task<ActionResult<User>> UpdateUserProfile(UpdateUserProfileRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var applicationUser = await _userManager.FindByIdAsync(userId);
        if (applicationUser == null)
        {
            return NotFound();
        }

        applicationUser.MonthlyIncome = request.MonthlyIncome;
        applicationUser.StudentLoanPayment = request.StudentLoanPayment;
        applicationUser.StudentLoanBalance = request.StudentLoanBalance;

        var result = await _userManager.UpdateAsync(applicationUser);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        return Ok(await MapToUserWithLoans(applicationUser));
    }

    private async Task<User> MapToUserWithLoans(ApplicationUser applicationUser)
    {
        var loans = await _context.StudentLoans
            .Where(l => l.UserId == applicationUser.Id)
            .ToListAsync();

        var loanDtos = loans.Select(l => new StudentLoanDto
        {
            Id = l.Id.ToString(),
            UserId = l.UserId,
            ServicerName = l.ServicerName,
            AccountNumber = l.AccountNumber,
            Balance = l.Balance,
            InterestRate = l.InterestRate,
            MonthlyPayment = l.MonthlyPayment,
            LoanType = l.LoanType.ToString().ToLower(),
            Status = l.Status.ToString().ToLower().Replace("_", "_"),
            CreatedAt = l.CreatedAt,
            UpdatedAt = l.UpdatedAt
        }).ToList();

        var studentLoanSummary = new StudentLoanSummaryDto
        {
            TotalBalance = loanDtos.Sum(l => l.Balance),
            TotalMonthlyPayment = loanDtos.Sum(l => l.MonthlyPayment),
            AverageInterestRate = loanDtos.Any() ? loanDtos.Average(l => l.InterestRate) : 0,
            TotalLoans = loanDtos.Count,
            Loans = loanDtos
        };

        return new User
        {
            UserId = applicationUser.Id,
            Email = applicationUser.Email ?? string.Empty,
            FirstName = applicationUser.FirstName,
            MonthlyIncome = applicationUser.MonthlyIncome,
            StudentLoanPayment = applicationUser.StudentLoanPayment,
            StudentLoanBalance = applicationUser.StudentLoanBalance,
            CreatedAt = applicationUser.CreatedAt,
            LastLoginAt = applicationUser.LastLoginAt,
            StudentLoanSummary = studentLoanSummary
        };
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
}