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
[Route("api/v1/income-sources")]
[Authorize]
public class IncomeController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IIncomeManagementService _incomeManagementService;
    private readonly ILogger<IncomeController> _logger;

    public IncomeController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        IIncomeManagementService incomeManagementService,
        ILogger<IncomeController> logger)
    {
        _context = context;
        _userManager = userManager;
        _incomeManagementService = incomeManagementService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IncomeManagementResponseDto>> GetIncomeSources()
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        try
        {
            var incomeManagement = await _incomeManagementService.GetIncomeManagementAsync(userId);
            return Ok(incomeManagement);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving income sources for user {UserId}", userId);
            return StatusCode(500, "An error occurred while retrieving income sources.");
        }
    }

    [HttpPost]
    public async Task<ActionResult<IncomeSourceDto>> CreateIncomeSource(CreateIncomeSourceRequest request)
    {
        Console.WriteLine($"CreateIncomeSource called with: Name='{request.Name}', Amount={request.Amount}, Frequency='{request.Frequency}'");
        
        if (!ModelState.IsValid)
        {
            Console.WriteLine("ModelState is invalid:");
            foreach (var error in ModelState)
            {
                Console.WriteLine($"  {error.Key}: {string.Join(", ", error.Value.Errors.Select(e => e.ErrorMessage))}");
            }
            return BadRequest(ModelState);
        }

        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        // Validate frequency
        var validFrequencies = new[] { "weekly", "bi-weekly", "monthly" };
        if (!validFrequencies.Contains(request.Frequency.ToLower()))
        {
            return BadRequest("Frequency must be 'weekly', 'bi-weekly', or 'monthly'.");
        }

        // Check for duplicate name
        var existingSource = await _context.IncomeSources
            .FirstOrDefaultAsync(i => i.UserId == userId && i.Name.ToLower() == request.Name.ToLower());

        if (existingSource != null)
        {
            return BadRequest("An income source with this name already exists.");
        }

        var incomeSource = new IncomeSource
        {
            IncomeSourceId = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name,
            Amount = request.Amount,
            Frequency = request.Frequency.ToLower(),
            CreatedAt = DateTime.UtcNow
        };

        _context.IncomeSources.Add(incomeSource);
        await _context.SaveChangesAsync();

        // Invalidate cache
        await _incomeManagementService.InvalidateIncomeCacheAsync(userId);

        var incomeSourceDto = new IncomeSourceDto
        {
            IncomeSourceId = incomeSource.IncomeSourceId,
            UserId = incomeSource.UserId,
            Name = incomeSource.Name,
            Amount = incomeSource.Amount,
            Frequency = incomeSource.Frequency,
            CreatedAt = incomeSource.CreatedAt
        };

        return CreatedAtAction(nameof(GetIncomeSource), new { id = incomeSource.IncomeSourceId }, incomeSourceDto);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<IncomeSourceDto>> GetIncomeSource(Guid id)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var incomeSource = await _context.IncomeSources
            .Where(i => i.IncomeSourceId == id && i.UserId == userId)
            .Select(i => new IncomeSourceDto
            {
                IncomeSourceId = i.IncomeSourceId,
                UserId = i.UserId,
                Name = i.Name,
                Amount = i.Amount,
                Frequency = i.Frequency,
                CreatedAt = i.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (incomeSource == null)
        {
            return NotFound();
        }

        return Ok(incomeSource);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<IncomeSourceDto>> UpdateIncomeSource(Guid id, UpdateIncomeSourceRequest request)
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

        // Validate frequency
        var validFrequencies = new[] { "weekly", "bi-weekly", "monthly" };
        if (!validFrequencies.Contains(request.Frequency.ToLower()))
        {
            return BadRequest("Frequency must be 'weekly', 'bi-weekly', or 'monthly'.");
        }

        var incomeSource = await _context.IncomeSources
            .FirstOrDefaultAsync(i => i.IncomeSourceId == id && i.UserId == userId);

        if (incomeSource == null)
        {
            return NotFound();
        }

        // Check for duplicate name (excluding current source)
        var existingSource = await _context.IncomeSources
            .FirstOrDefaultAsync(i => i.UserId == userId && 
                                    i.IncomeSourceId != id && 
                                    i.Name.ToLower() == request.Name.ToLower());

        if (existingSource != null)
        {
            return BadRequest("An income source with this name already exists.");
        }

        incomeSource.Name = request.Name;
        incomeSource.Amount = request.Amount;
        incomeSource.Frequency = request.Frequency.ToLower();

        await _context.SaveChangesAsync();

        // Invalidate cache
        await _incomeManagementService.InvalidateIncomeCacheAsync(userId);

        var incomeSourceDto = new IncomeSourceDto
        {
            IncomeSourceId = incomeSource.IncomeSourceId,
            UserId = incomeSource.UserId,
            Name = incomeSource.Name,
            Amount = incomeSource.Amount,
            Frequency = incomeSource.Frequency,
            CreatedAt = incomeSource.CreatedAt
        };

        return Ok(incomeSourceDto);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteIncomeSource(Guid id)
    {
        Console.WriteLine($"DeleteIncomeSource called with id: {id}");
        
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            Console.WriteLine("DeleteIncomeSource: Unauthorized - no userId");
            return Unauthorized();
        }
        
        Console.WriteLine($"DeleteIncomeSource: Looking for income source with id: {id}, userId: {userId}");

        var incomeSource = await _context.IncomeSources
            .FirstOrDefaultAsync(i => i.IncomeSourceId == id && i.UserId == userId);

        if (incomeSource == null)
        {
            Console.WriteLine($"DeleteIncomeSource: Income source not found with id: {id} for user: {userId}");
            return NotFound();
        }

        Console.WriteLine($"DeleteIncomeSource: Found income source '{incomeSource.Name}' - removing from context");
        
        _context.IncomeSources.Remove(incomeSource);
        
        try
        {
            var result = await _context.SaveChangesAsync();
            Console.WriteLine($"DeleteIncomeSource: SaveChanges result: {result} affected rows");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"DeleteIncomeSource: Error saving changes: {ex.Message}");
            Console.WriteLine($"DeleteIncomeSource: Stack trace: {ex.StackTrace}");
            return StatusCode(500, "Error deleting income source");
        }

        Console.WriteLine("DeleteIncomeSource: Invalidating cache");
        // Invalidate cache
        await _incomeManagementService.InvalidateIncomeCacheAsync(userId);

        Console.WriteLine("DeleteIncomeSource: Successfully deleted");
        return NoContent();
    }
}