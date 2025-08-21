using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.DTOs;
using api.Models;
using api.Services;

namespace api.Controllers;

[ApiController]
[Route("api/v1/savings-goals")]
[Authorize]
public class SavingsGoalsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ISavingsGoalService _savingsGoalService;
    private readonly ILogger<SavingsGoalsController> _logger;

    public SavingsGoalsController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        ISavingsGoalService savingsGoalService,
        ILogger<SavingsGoalsController> logger)
    {
        _context = context;
        _userManager = userManager;
        _savingsGoalService = savingsGoalService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<SavingsGoalProgressDto>>> GetSavingsGoals()
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        try
        {
            var savingsGoalsProgress = await _savingsGoalService.GetSavingsGoalProgressAsync(userId);
            return Ok(savingsGoalsProgress);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving savings goals for user {UserId}", userId);
            return StatusCode(500, "An error occurred while retrieving savings goals.");
        }
    }

    [HttpPost]
    public async Task<ActionResult<SavingsGoalDto>> CreateSavingsGoal(CreateSavingsGoalRequest request)
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

        // Check for duplicate name
        var existingGoal = await _context.SavingsGoals
            .FirstOrDefaultAsync(sg => sg.UserId == userId && sg.Name.ToLower() == request.Name.ToLower());

        if (existingGoal != null)
        {
            return BadRequest("A savings goal with this name already exists.");
        }

        var savingsGoal = new SavingsGoal
        {
            SavingsGoalId = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name,
            TargetAmount = request.TargetAmount,
            CurrentProgress = 0,
            MonthlySavingsTarget = request.MonthlySavingsTarget,
            CreatedAt = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow
        };

        _context.SavingsGoals.Add(savingsGoal);
        await _context.SaveChangesAsync();

        // Invalidate cache
        await _savingsGoalService.InvalidateSavingsGoalCacheAsync(userId);

        var savingsGoalDto = new SavingsGoalDto
        {
            SavingsGoalId = savingsGoal.SavingsGoalId,
            UserId = savingsGoal.UserId,
            Name = savingsGoal.Name,
            TargetAmount = savingsGoal.TargetAmount,
            CurrentProgress = savingsGoal.CurrentProgress,
            MonthlySavingsTarget = savingsGoal.MonthlySavingsTarget,
            CreatedAt = savingsGoal.CreatedAt,
            LastUpdated = savingsGoal.LastUpdated
        };

        return CreatedAtAction(nameof(GetSavingsGoal), new { id = savingsGoal.SavingsGoalId }, savingsGoalDto);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SavingsGoalDto>> GetSavingsGoal(Guid id)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var savingsGoal = await _context.SavingsGoals
            .Where(sg => sg.SavingsGoalId == id && sg.UserId == userId)
            .Select(sg => new SavingsGoalDto
            {
                SavingsGoalId = sg.SavingsGoalId,
                UserId = sg.UserId,
                Name = sg.Name,
                TargetAmount = sg.TargetAmount,
                CurrentProgress = sg.CurrentProgress,
                MonthlySavingsTarget = sg.MonthlySavingsTarget,
                CreatedAt = sg.CreatedAt,
                LastUpdated = sg.LastUpdated
            })
            .FirstOrDefaultAsync();

        if (savingsGoal == null)
        {
            return NotFound();
        }

        return Ok(savingsGoal);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SavingsGoalDto>> UpdateSavingsGoal(Guid id, UpdateSavingsGoalRequest request)
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

        var savingsGoal = await _context.SavingsGoals
            .FirstOrDefaultAsync(sg => sg.SavingsGoalId == id && sg.UserId == userId);

        if (savingsGoal == null)
        {
            return NotFound();
        }

        // Check for duplicate name (excluding current goal)
        var existingGoal = await _context.SavingsGoals
            .FirstOrDefaultAsync(sg => sg.UserId == userId && 
                                     sg.SavingsGoalId != id && 
                                     sg.Name.ToLower() == request.Name.ToLower());

        if (existingGoal != null)
        {
            return BadRequest("A savings goal with this name already exists.");
        }

        savingsGoal.Name = request.Name;
        savingsGoal.TargetAmount = request.TargetAmount;
        savingsGoal.MonthlySavingsTarget = request.MonthlySavingsTarget;
        savingsGoal.LastUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Invalidate cache
        await _savingsGoalService.InvalidateSavingsGoalCacheAsync(userId);

        var savingsGoalDto = new SavingsGoalDto
        {
            SavingsGoalId = savingsGoal.SavingsGoalId,
            UserId = savingsGoal.UserId,
            Name = savingsGoal.Name,
            TargetAmount = savingsGoal.TargetAmount,
            CurrentProgress = savingsGoal.CurrentProgress,
            MonthlySavingsTarget = savingsGoal.MonthlySavingsTarget,
            CreatedAt = savingsGoal.CreatedAt,
            LastUpdated = savingsGoal.LastUpdated
        };

        return Ok(savingsGoalDto);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSavingsGoal(Guid id)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var savingsGoal = await _context.SavingsGoals
            .FirstOrDefaultAsync(sg => sg.SavingsGoalId == id && sg.UserId == userId);

        if (savingsGoal == null)
        {
            return NotFound();
        }

        // Set any linked expenses to null for savings goal relationship
        var linkedExpenses = await _context.Expenses
            .Where(e => e.SavingsGoalId == id)
            .ToListAsync();

        foreach (var expense in linkedExpenses)
        {
            expense.SavingsGoalId = null;
        }

        _context.SavingsGoals.Remove(savingsGoal);
        await _context.SaveChangesAsync();

        // Invalidate cache
        await _savingsGoalService.InvalidateSavingsGoalCacheAsync(userId);

        return NoContent();
    }

    [HttpPost("{id}/contribute")]
    public async Task<ActionResult> ContributeToSavingsGoal(Guid id, ContributeToSavingsGoalRequest request)
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

        var savingsGoal = await _context.SavingsGoals
            .FirstOrDefaultAsync(sg => sg.SavingsGoalId == id && sg.UserId == userId);

        if (savingsGoal == null)
        {
            return NotFound();
        }

        // Update savings goal progress
        await _savingsGoalService.UpdateSavingsGoalProgressAsync(userId, id, request.Amount);

        return Ok();
    }
}