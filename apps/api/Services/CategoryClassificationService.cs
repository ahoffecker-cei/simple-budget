using Microsoft.EntityFrameworkCore;
using api.Data;
using api.DTOs;

namespace api.Services;

public class CategoryClassificationService : ICategoryClassificationService
{
    private readonly ApplicationDbContext _context;

    public CategoryClassificationService(ApplicationDbContext context)
    {
        _context = context;
    }

    private static readonly HashSet<string> EssentialKeywords = new(StringComparer.OrdinalIgnoreCase)
    {
        "rent", "mortgage", "utilities", "electricity", "water", "gas", "fuel", "internet",
        "phone", "insurance", "student loan", "debt payment", "groceries", "food",
        "transportation", "car payment", "transit", "healthcare", "medical", "housing"
    };

    private static readonly HashSet<string> NonEssentialKeywords = new(StringComparer.OrdinalIgnoreCase)
    {
        "entertainment", "dining out", "restaurant", "movies", "games", "hobbies",
        "shopping", "clothes", "subscriptions", "streaming", "coffee", "alcohol",
        "travel", "vacation", "gifts", "cosmetics", "gym membership"
    };

    public async Task<CategoryClassificationSuggestion> GetClassificationSuggestionAsync(string categoryName)
    {
        var suggestions = await GetClassificationSuggestionsAsync(new List<string> { categoryName });
        return suggestions.First();
    }

    public Task<List<CategoryClassificationSuggestion>> GetClassificationSuggestionsAsync(List<string> categoryNames)
    {
        var suggestions = new List<CategoryClassificationSuggestion>();

        foreach (var categoryName in categoryNames)
        {
            var (isEssential, confidence, reasoning) = ClassifyCategory(categoryName);
            
            suggestions.Add(new CategoryClassificationSuggestion
            {
                CategoryName = categoryName,
                SuggestedIsEssential = isEssential,
                Confidence = confidence,
                Reasoning = reasoning
            });
        }

        return Task.FromResult(suggestions);
    }

    public async Task<BudgetHealthByClassification> CalculateBudgetHealthByClassificationAsync(string userId)
    {
        var categories = await _context.BudgetCategories
            .Where(bc => bc.UserId == userId)
            .ToListAsync();

        var essentialCategories = categories.Where(bc => bc.IsEssential);
        var nonEssentialCategories = categories.Where(bc => !bc.IsEssential);

        var essentialLimit = essentialCategories.Sum(bc => bc.MonthlyLimit);
        var nonEssentialLimit = nonEssentialCategories.Sum(bc => bc.MonthlyLimit);

        // For now, set spending to 0 since we don't have expense tracking yet
        var essentialSpending = 0m;
        var nonEssentialSpending = 0m;

        return new BudgetHealthByClassification
        {
            EssentialSpending = essentialSpending,
            EssentialLimit = essentialLimit,
            NonEssentialSpending = nonEssentialSpending,
            NonEssentialLimit = nonEssentialLimit,
            EssentialHealthStatus = CalculateHealthStatus(essentialSpending, essentialLimit),
            NonEssentialHealthStatus = CalculateHealthStatus(nonEssentialSpending, nonEssentialLimit)
        };
    }

    private static (bool isEssential, double confidence, string reasoning) ClassifyCategory(string categoryName)
    {
        var lowerName = categoryName.ToLower();

        // Check for exact matches first
        foreach (var keyword in EssentialKeywords)
        {
            if (lowerName.Contains(keyword, StringComparison.OrdinalIgnoreCase))
            {
                return (true, 0.9, $"Contains essential keyword: '{keyword}'");
            }
        }

        foreach (var keyword in NonEssentialKeywords)
        {
            if (lowerName.Contains(keyword, StringComparison.OrdinalIgnoreCase))
            {
                return (false, 0.9, $"Contains non-essential keyword: '{keyword}'");
            }
        }

        // Default classification for unrecognized categories
        return (true, 0.5, "Unknown category - defaulting to essential for safety");
    }

    private static string CalculateHealthStatus(decimal spending, decimal limit)
    {
        if (limit == 0) return "excellent";

        var percentage = spending / limit;

        return percentage switch
        {
            <= 0.5m => "excellent",
            <= 0.75m => "good", 
            <= 0.9m => "attention",
            _ => "concern"
        };
    }
}