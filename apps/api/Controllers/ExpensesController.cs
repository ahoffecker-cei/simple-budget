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
[Route("api/v1/expenses")]
[Authorize]
public class ExpensesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IBudgetCalculationService _budgetCalculationService;

    public ExpensesController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        IBudgetCalculationService budgetCalculationService)
    {
        _context = context;
        _userManager = userManager;
        _budgetCalculationService = budgetCalculationService;
    }

    [HttpPost]
    public async Task<ActionResult<ExpenseWithBudgetImpact>> CreateExpense(CreateExpenseRequest request)
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

        // Validate that the category exists and belongs to the user
        var category = await _context.BudgetCategories
            .FirstOrDefaultAsync(bc => bc.CategoryId == request.CategoryId && bc.UserId == userId);

        if (category == null)
        {
            return BadRequest("Invalid category ID or category does not belong to user.");
        }

        // Set expense date to today if not provided
        var expenseDate = request.ExpenseDate ?? DateTime.Today;

        // Validate expense date is not in the future (compare only date part, not time)
        if (expenseDate.Date > DateTime.Today)
        {
            return BadRequest("Expense date cannot be in the future.");
        }

        var expense = new Expense
        {
            ExpenseId = Guid.NewGuid(),
            UserId = userId,
            CategoryId = request.CategoryId,
            Amount = request.Amount,
            Description = request.Description,
            ExpenseDate = expenseDate,
            CreatedAt = DateTime.UtcNow
        };

        _context.Expenses.Add(expense);
        await _context.SaveChangesAsync();

        // Invalidate budget cache after expense creation
        await _budgetCalculationService.InvalidateBudgetCacheAsync(userId, request.CategoryId);

        // Calculate budget impact for the current month using the new service
        var budgetImpact = await _budgetCalculationService.GetBudgetImpactPreviewAsync(userId, request.CategoryId, 0, expenseDate);
        
        string healthStatus = budgetImpact.HealthStatus;

        var expenseDto = new ExpenseDto
        {
            ExpenseId = expense.ExpenseId,
            UserId = expense.UserId,
            CategoryId = expense.CategoryId,
            CategoryName = category.Name,
            Amount = expense.Amount,
            Description = expense.Description,
            ExpenseDate = expense.ExpenseDate,
            CreatedAt = expense.CreatedAt,
            IsEssential = category.IsEssential
        };

        var result = new ExpenseWithBudgetImpact
        {
            Expense = expenseDto,
            CategoryRemainingBudget = budgetImpact.RemainingAfterExpense,
            BudgetHealthStatus = healthStatus,
            CategoryMonthlyLimit = budgetImpact.MonthlyLimit,
            CategoryCurrentSpending = budgetImpact.CurrentSpent
        };

        return CreatedAtAction(nameof(GetExpense), new { id = expense.ExpenseId }, result);
    }

    [HttpGet("budget-impact-preview")]
    public async Task<ActionResult<BudgetImpactPreviewDto>> GetBudgetImpactPreview(
        [FromQuery] Guid categoryId, 
        [FromQuery] decimal amount, 
        [FromQuery] DateTime? expenseDate = null)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (categoryId == Guid.Empty)
        {
            return BadRequest("CategoryId is required.");
        }

        if (amount <= 0 || amount > 999999.99m)
        {
            return BadRequest("Amount must be between $0.01 and $999,999.99");
        }

        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        try
        {
            var preview = await _budgetCalculationService.GetBudgetImpactPreviewAsync(userId, categoryId, amount, expenseDate);
            return Ok(preview);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ExpenseDto>> GetExpense(Guid id)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var expense = await _context.Expenses
            .Include(e => e.BudgetCategory)
            .Where(e => e.ExpenseId == id && e.UserId == userId)
            .Select(e => new ExpenseDto
            {
                ExpenseId = e.ExpenseId,
                UserId = e.UserId,
                CategoryId = e.CategoryId,
                CategoryName = e.BudgetCategory.Name,
                Amount = e.Amount,
                Description = e.Description,
                ExpenseDate = e.ExpenseDate,
                CreatedAt = e.CreatedAt,
                IsEssential = e.BudgetCategory.IsEssential
            })
            .FirstOrDefaultAsync();

        if (expense == null)
        {
            return NotFound();
        }

        return Ok(expense);
    }

    [HttpGet]
    public async Task<ActionResult<RecentExpensesResponse>> GetExpenses([FromQuery] ExpenseListQueryParameters parameters)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        // Validate pagination parameters
        if (parameters.Page < 1) parameters.Page = 1;
        if (parameters.PageSize < 1 || parameters.PageSize > 100) parameters.PageSize = 20;

        var query = _context.Expenses
            .Include(e => e.BudgetCategory)
            .Where(e => e.UserId == userId);

        // Apply filters
        if (parameters.CategoryId.HasValue)
        {
            query = query.Where(e => e.CategoryId == parameters.CategoryId.Value);
        }

        if (parameters.StartDate.HasValue)
        {
            query = query.Where(e => e.ExpenseDate >= parameters.StartDate.Value);
        }

        if (parameters.EndDate.HasValue)
        {
            query = query.Where(e => e.ExpenseDate <= parameters.EndDate.Value);
        }

        var totalCount = await query.CountAsync();

        var expenses = await query
            .OrderByDescending(e => e.ExpenseDate)
            .ThenByDescending(e => e.CreatedAt)
            .Skip((parameters.Page - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .Select(e => new ExpenseDto
            {
                ExpenseId = e.ExpenseId,
                UserId = e.UserId,
                CategoryId = e.CategoryId,
                CategoryName = e.BudgetCategory.Name,
                Amount = e.Amount,
                Description = e.Description,
                ExpenseDate = e.ExpenseDate,
                CreatedAt = e.CreatedAt,
                IsEssential = e.BudgetCategory.IsEssential
            })
            .ToListAsync();

        var result = new RecentExpensesResponse
        {
            Expenses = expenses,
            TotalCount = totalCount,
            Page = parameters.Page,
            PageSize = parameters.PageSize
        };

        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteExpense(Guid id)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var expense = await _context.Expenses
            .FirstOrDefaultAsync(e => e.ExpenseId == id && e.UserId == userId);

        if (expense == null)
        {
            return NotFound();
        }

        _context.Expenses.Remove(expense);
        await _context.SaveChangesAsync();

        // Invalidate budget cache after expense deletion
        await _budgetCalculationService.InvalidateBudgetCacheAsync(userId, expense.CategoryId);

        return NoContent();
    }
}