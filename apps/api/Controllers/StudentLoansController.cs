using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;
using System.Security.Claims;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StudentLoansController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public StudentLoansController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/StudentLoans
    [HttpGet]
    public async Task<ActionResult<StudentLoanSummaryDto>> GetStudentLoans()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var loans = await _context.StudentLoans
            .Where(l => l.UserId == userId)
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

        var summary = new StudentLoanSummaryDto
        {
            TotalBalance = loanDtos.Sum(l => l.Balance),
            TotalMonthlyPayment = loanDtos.Sum(l => l.MonthlyPayment),
            AverageInterestRate = loanDtos.Any() ? loanDtos.Average(l => l.InterestRate) : 0,
            TotalLoans = loanDtos.Count,
            Loans = loanDtos
        };

        return Ok(summary);
    }

    // GET: api/StudentLoans/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<StudentLoanDto>> GetStudentLoan(Guid id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var loan = await _context.StudentLoans
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);

        if (loan == null)
            return NotFound();

        var loanDto = new StudentLoanDto
        {
            Id = loan.Id.ToString(),
            UserId = loan.UserId,
            ServicerName = loan.ServicerName,
            AccountNumber = loan.AccountNumber,
            Balance = loan.Balance,
            InterestRate = loan.InterestRate,
            MonthlyPayment = loan.MonthlyPayment,
            LoanType = loan.LoanType.ToString().ToLower(),
            Status = loan.Status.ToString().ToLower().Replace("_", "_"),
            CreatedAt = loan.CreatedAt,
            UpdatedAt = loan.UpdatedAt
        };

        return Ok(loanDto);
    }

    // POST: api/StudentLoans
    [HttpPost]
    public async Task<ActionResult<StudentLoanDto>> CreateStudentLoan(CreateStudentLoanDto createDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        if (!Enum.TryParse<LoanType>(createDto.LoanType, true, out var loanType))
            return BadRequest("Invalid loan type");

        if (!Enum.TryParse<LoanStatus>(createDto.Status, true, out var loanStatus))
            return BadRequest("Invalid loan status");

        var loan = new StudentLoan
        {
            UserId = userId,
            ServicerName = createDto.ServicerName,
            AccountNumber = createDto.AccountNumber,
            Balance = createDto.Balance,
            InterestRate = createDto.InterestRate,
            MonthlyPayment = createDto.MonthlyPayment,
            LoanType = loanType,
            Status = loanStatus
        };

        _context.StudentLoans.Add(loan);
        await _context.SaveChangesAsync();

        var loanDto = new StudentLoanDto
        {
            Id = loan.Id.ToString(),
            UserId = loan.UserId,
            ServicerName = loan.ServicerName,
            AccountNumber = loan.AccountNumber,
            Balance = loan.Balance,
            InterestRate = loan.InterestRate,
            MonthlyPayment = loan.MonthlyPayment,
            LoanType = loan.LoanType.ToString().ToLower(),
            Status = loan.Status.ToString().ToLower().Replace("_", "_"),
            CreatedAt = loan.CreatedAt,
            UpdatedAt = loan.UpdatedAt
        };

        return CreatedAtAction(nameof(GetStudentLoan), new { id = loan.Id }, loanDto);
    }

    // PUT: api/StudentLoans/{id}
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateStudentLoan(Guid id, UpdateStudentLoanDto updateDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var loan = await _context.StudentLoans
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);

        if (loan == null)
            return NotFound();

        if (!Enum.TryParse<LoanType>(updateDto.LoanType, true, out var loanType))
            return BadRequest("Invalid loan type");

        if (!Enum.TryParse<LoanStatus>(updateDto.Status, true, out var loanStatus))
            return BadRequest("Invalid loan status");

        loan.ServicerName = updateDto.ServicerName;
        loan.AccountNumber = updateDto.AccountNumber;
        loan.Balance = updateDto.Balance;
        loan.InterestRate = updateDto.InterestRate;
        loan.MonthlyPayment = updateDto.MonthlyPayment;
        loan.LoanType = loanType;
        loan.Status = loanStatus;
        loan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/StudentLoans/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteStudentLoan(Guid id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var loan = await _context.StudentLoans
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);

        if (loan == null)
            return NotFound();

        _context.StudentLoans.Remove(loan);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

// DTOs for request/response
public class CreateStudentLoanDto
{
    public string ServicerName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public decimal Balance { get; set; }
    public decimal InterestRate { get; set; }
    public decimal MonthlyPayment { get; set; }
    public string LoanType { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
}

public class UpdateStudentLoanDto
{
    public string ServicerName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public decimal Balance { get; set; }
    public decimal InterestRate { get; set; }
    public decimal MonthlyPayment { get; set; }
    public string LoanType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}