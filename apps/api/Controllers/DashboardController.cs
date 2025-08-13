using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.DTOs;
using api.Services;
using System.Security.Claims;

namespace api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICategoryClassificationService _classificationService;

    public DashboardController(ApplicationDbContext context, ICategoryClassificationService classificationService)
    {
        _context = context;
        _classificationService = classificationService;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardResponse>> GetDashboard()
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

        var totalNetWorth = accounts.Sum(a => a.CurrentBalance);
        var healthStatus = CalculateHealthStatus(totalNetWorth);

        var dashboardResponse = new DashboardResponse
        {
            OverallHealthStatus = healthStatus,
            TotalNetWorth = totalNetWorth,
            Accounts = accounts
        };

        return Ok(dashboardResponse);
    }

    [HttpGet("classification-health")]
    public async Task<ActionResult<BudgetHealthByClassification>> GetClassificationHealth()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var healthData = await _classificationService.CalculateBudgetHealthByClassificationAsync(userId);
        return Ok(healthData);
    }

    private static string CalculateHealthStatus(decimal totalNetWorth)
    {
        return totalNetWorth switch
        {
            >= 50000 => "excellent",
            >= 10000 => "good",
            >= 1000 => "attention",
            _ => "concern"
        };
    }
}