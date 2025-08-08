# Service Architecture

## Controller/Route Organization

```
src/
├── SimpleBudget.Api/
│   ├── Controllers/
│   │   ├── AuthController.cs           # Authentication endpoints
│   │   ├── UsersController.cs          # User profile management
│   │   ├── BudgetCategoriesController.cs # Budget category CRUD
│   │   ├── AccountsController.cs       # Account balance management
│   │   ├── ExpensesController.cs       # Expense logging and retrieval
│   │   └── DashboardController.cs      # Aggregated dashboard data
│   ├── Middleware/
│   │   ├── AuthenticationMiddleware.cs
│   │   ├── ErrorHandlingMiddleware.cs
│   │   └── PerformanceMiddleware.cs
│   └── Program.cs
├── SimpleBudget.Core/                  # Business logic layer
│   ├── Services/
│   │   ├── BudgetCalculationService.cs
│   │   ├── FinancialHealthAnalyzer.cs
│   │   └── UserOnboardingService.cs
│   └── Models/
├── SimpleBudget.Infrastructure/        # Data access layer
│   ├── Data/
│   │   └── ApplicationDbContext.cs
│   └── Repositories/
└── SimpleBudget.Shared/                # Shared models and utilities
```

## Controller Template

```csharp
[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class ExpensesController : ControllerBase
{
    private readonly IExpenseService _expenseService;
    private readonly IBudgetCalculationService _budgetCalculationService;
    private readonly ILogger<ExpensesController> _logger;

    public ExpensesController(
        IExpenseService expenseService,
        IBudgetCalculationService budgetCalculationService,
        ILogger<ExpensesController> logger)
    {
        _expenseService = expenseService;
        _budgetCalculationService = budgetCalculationService;
        _logger = logger;
    }

    [HttpPost]
    [ProducesResponseType(typeof(ExpenseWithBudgetImpactResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateExpense(CreateExpenseRequest request)
    {
        var userId = User.GetUserId();
        var stopwatch = Stopwatch.StartNew();

        try
        {
            var expense = await _expenseService.CreateExpenseAsync(request, userId);
            var budgetImpact = await _budgetCalculationService.CalculateBudgetImpactAsync(expense);
            
            var response = _mapper.Map<ExpenseWithBudgetImpactResponse>(expense);
            response.BudgetRemaining = budgetImpact.RemainingBudget;
            response.HealthStatus = budgetImpact.HealthStatus;

            stopwatch.Stop();
            _logger.LogInformation(
                "Expense created successfully for user {UserId} in {ElapsedMs}ms", 
                userId, 
                stopwatch.ElapsedMilliseconds);

            return CreatedAtAction(
                nameof(GetExpense), 
                new { id = expense.ExpenseId }, 
                response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating expense for user {UserId}", userId);
            return StatusCode(500, new ApiErrorResponse
            {
                Error = new ErrorDetail
                {
                    Code = "INTERNAL_ERROR",
                    Message = "We're sorry, something went wrong. Please try again.",
                    Timestamp = DateTime.UtcNow,
                    RequestId = HttpContext.TraceIdentifier
                }
            });
        }
    }
}
```
