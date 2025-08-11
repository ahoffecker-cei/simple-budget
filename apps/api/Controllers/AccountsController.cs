using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;
using api.DTOs;
using System.Security.Claims;

namespace api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class AccountsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AccountsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<AccountDto>>> GetAccounts()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var accounts = await _context.Accounts
            .Where(a => a.UserId == userId)
            .Select(a => new AccountDto
            {
                AccountId = a.AccountId,
                UserId = a.UserId,
                AccountType = a.AccountType.ToString().ToLower(),
                AccountName = a.AccountName,
                CurrentBalance = a.CurrentBalance,
                LastUpdated = a.LastUpdated
            })
            .ToListAsync();

        return Ok(accounts);
    }

    [HttpPost]
    public async Task<ActionResult<AccountDto>> CreateAccount([FromBody] CreateAccountRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        if (!Enum.TryParse<AccountType>(request.AccountType, true, out var accountType))
        {
            return BadRequest(new { Error = "Invalid account type. Must be 'checking', 'savings', or 'retirement'." });
        }

        var account = new Account
        {
            AccountId = Guid.NewGuid().ToString(),
            UserId = userId,
            AccountType = accountType,
            AccountName = request.AccountName,
            CurrentBalance = request.CurrentBalance,
            LastUpdated = DateTime.UtcNow
        };

        _context.Accounts.Add(account);
        await _context.SaveChangesAsync();

        var accountDto = new AccountDto
        {
            AccountId = account.AccountId,
            UserId = account.UserId,
            AccountType = account.AccountType.ToString().ToLower(),
            AccountName = account.AccountName,
            CurrentBalance = account.CurrentBalance,
            LastUpdated = account.LastUpdated
        };

        return CreatedAtAction(nameof(GetAccount), new { id = account.AccountId }, accountDto);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AccountDto>> GetAccount(string id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var account = await _context.Accounts
            .Where(a => a.AccountId == id && a.UserId == userId)
            .FirstOrDefaultAsync();

        if (account == null)
        {
            return NotFound();
        }

        var accountDto = new AccountDto
        {
            AccountId = account.AccountId,
            UserId = account.UserId,
            AccountType = account.AccountType.ToString().ToLower(),
            AccountName = account.AccountName,
            CurrentBalance = account.CurrentBalance,
            LastUpdated = account.LastUpdated
        };

        return Ok(accountDto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAccount(string id, [FromBody] UpdateAccountRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var account = await _context.Accounts
            .Where(a => a.AccountId == id && a.UserId == userId)
            .FirstOrDefaultAsync();

        if (account == null)
        {
            return NotFound();
        }

        account.AccountName = request.AccountName;
        account.CurrentBalance = request.CurrentBalance;
        account.LastUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAccount(string id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var account = await _context.Accounts
            .Where(a => a.AccountId == id && a.UserId == userId)
            .FirstOrDefaultAsync();

        if (account == null)
        {
            return NotFound();
        }

        _context.Accounts.Remove(account);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}