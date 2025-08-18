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
[Route("api/v1/budget-categories")]
[Authorize]
public class BudgetCategoriesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IBudgetValidationService _budgetValidationService;
    private readonly ICategoryClassificationService _classificationService;
    private readonly IDashboardService _dashboardService;

    public BudgetCategoriesController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        IBudgetValidationService budgetValidationService,
        ICategoryClassificationService classificationService,
        IDashboardService dashboardService)
    {
        _context = context;
        _userManager = userManager;
        _budgetValidationService = budgetValidationService;
        _classificationService = classificationService;
        _dashboardService = dashboardService;
    }

    [HttpGet]
    public async Task<ActionResult<List<BudgetCategoryDto>>> GetBudgetCategories()
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var categories = await _context.BudgetCategories
            .Where(bc => bc.UserId == userId)
            .OrderByDescending(bc => bc.IsEssential)
            .ThenBy(bc => bc.Name)
            .Select(bc => new BudgetCategoryDto
            {
                CategoryId = bc.CategoryId,
                UserId = bc.UserId,
                Name = bc.Name,
                MonthlyLimit = bc.MonthlyLimit,
                IsEssential = bc.IsEssential,
                Description = bc.Description,
                ColorId = bc.ColorId,
                IconId = bc.IconId,
                CreatedAt = bc.CreatedAt
            })
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BudgetCategoryDto>> GetBudgetCategory(Guid id)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var category = await _context.BudgetCategories
            .Where(bc => bc.CategoryId == id && bc.UserId == userId)
            .Select(bc => new BudgetCategoryDto
            {
                CategoryId = bc.CategoryId,
                UserId = bc.UserId,
                Name = bc.Name,
                MonthlyLimit = bc.MonthlyLimit,
                IsEssential = bc.IsEssential,
                Description = bc.Description,
                ColorId = bc.ColorId,
                IconId = bc.IconId,
                CreatedAt = bc.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (category == null)
        {
            return NotFound();
        }

        return Ok(category);
    }

    [HttpPost]
    public async Task<ActionResult<BudgetCategoryDto>> CreateBudgetCategory(CreateBudgetCategoryRequest request)
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

        // Check if category name already exists for user
        var existingCategory = await _context.BudgetCategories
            .AnyAsync(bc => bc.UserId == userId && bc.Name.ToLower() == request.Name.ToLower());

        if (existingCategory)
        {
            return BadRequest($"A category with the name '{request.Name}' already exists.");
        }

        // Validate budget allocation
        var validationResult = await _budgetValidationService.ValidateBudgetAllocationAsync(userId, request.MonthlyLimit);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.ErrorMessage);
        }

        var budgetCategory = new BudgetCategory
        {
            CategoryId = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name,
            MonthlyLimit = request.MonthlyLimit,
            IsEssential = request.IsEssential,
            Description = request.Description,
            ColorId = request.ColorId ?? "blue",
            IconId = request.IconId ?? "home",
            CreatedAt = DateTime.UtcNow
        };

        _context.BudgetCategories.Add(budgetCategory);
        await _context.SaveChangesAsync();
        
        // Invalidate dashboard cache since budget data has changed
        await _dashboardService.InvalidateDashboardCacheAsync(userId);

        var categoryDto = new BudgetCategoryDto
        {
            CategoryId = budgetCategory.CategoryId,
            UserId = budgetCategory.UserId,
            Name = budgetCategory.Name,
            MonthlyLimit = budgetCategory.MonthlyLimit,
            IsEssential = budgetCategory.IsEssential,
            Description = budgetCategory.Description,
            ColorId = budgetCategory.ColorId,
            IconId = budgetCategory.IconId,
            CreatedAt = budgetCategory.CreatedAt
        };

        return CreatedAtAction(nameof(GetBudgetCategory), new { id = categoryDto.CategoryId }, categoryDto);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<BudgetCategoryDto>> UpdateBudgetCategory(Guid id, UpdateBudgetCategoryRequest request)
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

        var budgetCategory = await _context.BudgetCategories
            .FirstOrDefaultAsync(bc => bc.CategoryId == id && bc.UserId == userId);

        if (budgetCategory == null)
        {
            return NotFound();
        }

        // Check if category name already exists for user (excluding current category)
        var existingCategory = await _context.BudgetCategories
            .AnyAsync(bc => bc.UserId == userId && bc.Name.ToLower() == request.Name.ToLower() && bc.CategoryId != id);

        if (existingCategory)
        {
            return BadRequest($"A category with the name '{request.Name}' already exists.");
        }

        // Validate budget allocation (excluding current category's limit)
        var additionalAmount = request.MonthlyLimit - budgetCategory.MonthlyLimit;
        if (additionalAmount > 0)
        {
            var validationResult = await _budgetValidationService.ValidateBudgetAllocationAsync(userId, additionalAmount, id);
            if (!validationResult.IsValid)
            {
                return BadRequest(validationResult.ErrorMessage);
            }
        }

        budgetCategory.Name = request.Name;
        budgetCategory.MonthlyLimit = request.MonthlyLimit;
        budgetCategory.IsEssential = request.IsEssential;
        budgetCategory.Description = request.Description;
        if (request.ColorId != null) budgetCategory.ColorId = request.ColorId;
        if (request.IconId != null) budgetCategory.IconId = request.IconId;

        await _context.SaveChangesAsync();
        
        // Invalidate dashboard cache since budget data has changed
        await _dashboardService.InvalidateDashboardCacheAsync(userId);

        var categoryDto = new BudgetCategoryDto
        {
            CategoryId = budgetCategory.CategoryId,
            UserId = budgetCategory.UserId,
            Name = budgetCategory.Name,
            MonthlyLimit = budgetCategory.MonthlyLimit,
            IsEssential = budgetCategory.IsEssential,
            Description = budgetCategory.Description,
            ColorId = budgetCategory.ColorId,
            IconId = budgetCategory.IconId,
            CreatedAt = budgetCategory.CreatedAt
        };

        return Ok(categoryDto);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteBudgetCategory(Guid id)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var budgetCategory = await _context.BudgetCategories
            .FirstOrDefaultAsync(bc => bc.CategoryId == id && bc.UserId == userId);

        if (budgetCategory == null)
        {
            return NotFound();
        }

        // TODO: In future stories, check if category has associated expenses
        // For now, we'll allow deletion as there are no expenses yet

        _context.BudgetCategories.Remove(budgetCategory);
        await _context.SaveChangesAsync();
        
        // Invalidate dashboard cache since budget data has changed
        await _dashboardService.InvalidateDashboardCacheAsync(userId);

        return NoContent();
    }

    [HttpGet("validation")]
    public async Task<ActionResult<BudgetValidationResult>> ValidateBudgetAllocation([FromQuery] decimal amount, [FromQuery] Guid? excludeCategoryId = null)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var validationResult = await _budgetValidationService.ValidateBudgetAllocationAsync(userId, amount, excludeCategoryId);
        return Ok(validationResult);
    }

    [HttpGet("suggestions")]
    public async Task<ActionResult<List<CreateBudgetCategoryRequest>>> GetCategorySuggestions()
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound();
        }

        var userIncome = user.MonthlyIncome;
        if (userIncome <= 0)
        {
            return BadRequest("User income must be set before getting category suggestions.");
        }

        // Check if user has student loans
        var hasStudentLoans = await _context.StudentLoans
            .AnyAsync(sl => sl.UserId == userId && sl.Status == LoanStatus.Active);

        var studentLoanPayment = 0m;
        if (hasStudentLoans)
        {
            studentLoanPayment = await _context.StudentLoans
                .Where(sl => sl.UserId == userId && sl.Status == LoanStatus.Active)
                .SumAsync(sl => sl.MonthlyPayment);
        }

        var suggestions = new List<CreateBudgetCategoryRequest>
        {
            new CreateBudgetCategoryRequest
            {
                Name = "Groceries",
                MonthlyLimit = Math.Round(userIncome * 0.10m, 2),
                IsEssential = true,
                Description = "Food and household essentials like cleaning supplies, personal care items"
            },
            new CreateBudgetCategoryRequest
            {
                Name = "Transportation",
                MonthlyLimit = Math.Round(userIncome * 0.15m, 2),
                IsEssential = true,
                Description = "Gas, public transit, car payments, insurance, and maintenance"
            },
            new CreateBudgetCategoryRequest
            {
                Name = "Utilities",
                MonthlyLimit = Math.Round(userIncome * 0.08m, 2),
                IsEssential = true,
                Description = "Electricity, water, internet, phone, and other essential services"
            },
            new CreateBudgetCategoryRequest
            {
                Name = "Housing",
                MonthlyLimit = Math.Round(userIncome * 0.25m, 2),
                IsEssential = true,
                Description = "Rent, mortgage, property taxes, and home insurance"
            },
            new CreateBudgetCategoryRequest
            {
                Name = "Health & Fitness",
                MonthlyLimit = Math.Round(userIncome * 0.05m, 2),
                IsEssential = true,
                Description = "Medical expenses, gym memberships, health insurance copays"
            },
            new CreateBudgetCategoryRequest
            {
                Name = "Entertainment",
                MonthlyLimit = Math.Round(userIncome * 0.05m, 2),
                IsEssential = false,
                Description = "Movies, games, hobbies, streaming services, and recreational activities"
            },
            new CreateBudgetCategoryRequest
            {
                Name = "Dining Out",
                MonthlyLimit = Math.Round(userIncome * 0.05m, 2),
                IsEssential = false,
                Description = "Restaurants, takeout, coffee shops, and other food outside the home"
            },
            new CreateBudgetCategoryRequest
            {
                Name = "Shopping",
                MonthlyLimit = Math.Round(userIncome * 0.05m, 2),
                IsEssential = false,
                Description = "Clothing, electronics, and other non-essential purchases"
            }
        };

        // Add Student Loans category if user has active loans
        if (hasStudentLoans && studentLoanPayment > 0)
        {
            suggestions.Insert(0, new CreateBudgetCategoryRequest
            {
                Name = "Student Loans",
                MonthlyLimit = studentLoanPayment,
                IsEssential = true,
                Description = "Monthly student loan payments",
                ColorId = "orange",
                IconId = "school"
            });
        }

        // Filter out categories that user already has
        var existingCategoryNames = await _context.BudgetCategories
            .Where(bc => bc.UserId == userId)
            .Select(bc => bc.Name.ToLower())
            .ToListAsync();

        var filteredSuggestions = suggestions
            .Where(s => !existingCategoryNames.Contains(s.Name.ToLower()))
            .ToList();

        return Ok(filteredSuggestions);
    }

    [HttpPost("create-from-suggestions")]
    public async Task<ActionResult<List<BudgetCategoryDto>>> CreateCategoriesFromSuggestions([FromBody] List<CreateBudgetCategoryRequest> suggestions)
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

        var createdCategories = new List<BudgetCategory>();
        var totalSuggestedAmount = suggestions.Sum(s => s.MonthlyLimit);

        // Validate total budget allocation
        var validationResult = await _budgetValidationService.ValidateBudgetAllocationAsync(userId, totalSuggestedAmount);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.ErrorMessage);
        }

        foreach (var suggestion in suggestions)
        {
            // Check if category name already exists for user
            var existingCategory = await _context.BudgetCategories
                .AnyAsync(bc => bc.UserId == userId && bc.Name.ToLower() == suggestion.Name.ToLower());

            if (existingCategory)
            {
                continue; // Skip duplicate categories
            }

            var budgetCategory = new BudgetCategory
            {
                CategoryId = Guid.NewGuid(),
                UserId = userId,
                Name = suggestion.Name,
                MonthlyLimit = suggestion.MonthlyLimit,
                IsEssential = suggestion.IsEssential,
                Description = suggestion.Description,
                ColorId = suggestion.ColorId ?? "blue",
                IconId = suggestion.IconId ?? "home",
                CreatedAt = DateTime.UtcNow
            };

            createdCategories.Add(budgetCategory);
        }

        if (createdCategories.Any())
        {
            _context.BudgetCategories.AddRange(createdCategories);
            await _context.SaveChangesAsync();
            
            // Invalidate dashboard cache since budget data has changed
            await _dashboardService.InvalidateDashboardCacheAsync(userId);
        }

        var categoryDtos = createdCategories.Select(bc => new BudgetCategoryDto
        {
            CategoryId = bc.CategoryId,
            UserId = bc.UserId,
            Name = bc.Name,
            MonthlyLimit = bc.MonthlyLimit,
            IsEssential = bc.IsEssential,
            Description = bc.Description,
            ColorId = bc.ColorId,
            IconId = bc.IconId,
            CreatedAt = bc.CreatedAt
        }).ToList();

        return Ok(categoryDtos);
    }

    [HttpPut("{id}/classification")]
    public async Task<ActionResult<BudgetCategoryDto>> UpdateCategoryClassification(Guid id, ClassificationUpdateRequest request)
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

        var budgetCategory = await _context.BudgetCategories
            .FirstOrDefaultAsync(bc => bc.CategoryId == id && bc.UserId == userId);

        if (budgetCategory == null)
        {
            return NotFound();
        }

        budgetCategory.IsEssential = request.IsEssential;
        await _context.SaveChangesAsync();
        
        // Invalidate dashboard cache since budget data has changed
        await _dashboardService.InvalidateDashboardCacheAsync(userId);

        var categoryDto = new BudgetCategoryDto
        {
            CategoryId = budgetCategory.CategoryId,
            UserId = budgetCategory.UserId,
            Name = budgetCategory.Name,
            MonthlyLimit = budgetCategory.MonthlyLimit,
            IsEssential = budgetCategory.IsEssential,
            Description = budgetCategory.Description,
            ColorId = budgetCategory.ColorId,
            IconId = budgetCategory.IconId,
            CreatedAt = budgetCategory.CreatedAt
        };

        return Ok(categoryDto);
    }

    [HttpGet("classification-suggestions")]
    public async Task<ActionResult<List<CategoryClassificationSuggestion>>> GetClassificationSuggestions([FromQuery] string? categoryName = null)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        List<CategoryClassificationSuggestion> suggestions;

        if (!string.IsNullOrEmpty(categoryName))
        {
            var suggestion = await _classificationService.GetClassificationSuggestionAsync(categoryName);
            suggestions = new List<CategoryClassificationSuggestion> { suggestion };
        }
        else
        {
            var categories = await _context.BudgetCategories
                .Where(bc => bc.UserId == userId)
                .Select(bc => bc.Name)
                .ToListAsync();

            suggestions = await _classificationService.GetClassificationSuggestionsAsync(categories);
        }

        return Ok(suggestions);
    }

    [HttpPut("bulk-classification")]
    public async Task<ActionResult<List<BudgetCategoryDto>>> BulkUpdateClassifications(BulkClassificationUpdateRequest request)
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

        var categoryIds = request.Classifications.Select(c => c.CategoryId).ToList();
        var categories = await _context.BudgetCategories
            .Where(bc => categoryIds.Contains(bc.CategoryId) && bc.UserId == userId)
            .ToListAsync();

        var updatedCategories = new List<BudgetCategoryDto>();

        foreach (var classificationUpdate in request.Classifications)
        {
            var category = categories.FirstOrDefault(c => c.CategoryId == classificationUpdate.CategoryId);
            if (category != null)
            {
                category.IsEssential = classificationUpdate.IsEssential;
                updatedCategories.Add(new BudgetCategoryDto
                {
                    CategoryId = category.CategoryId,
                    UserId = category.UserId,
                    Name = category.Name,
                    MonthlyLimit = category.MonthlyLimit,
                    IsEssential = category.IsEssential,
                    Description = category.Description,
                    ColorId = category.ColorId,
                    IconId = category.IconId,
                    CreatedAt = category.CreatedAt
                });
            }
        }

        if (categories.Any())
        {
            await _context.SaveChangesAsync();
            
            // Invalidate dashboard cache since budget data has changed
            await _dashboardService.InvalidateDashboardCacheAsync(userId);
        }

        return Ok(updatedCategories);
    }
}