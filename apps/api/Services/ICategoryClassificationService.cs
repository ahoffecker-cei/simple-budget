using api.DTOs;

namespace api.Services;

public interface ICategoryClassificationService
{
    Task<CategoryClassificationSuggestion> GetClassificationSuggestionAsync(string categoryName);
    Task<List<CategoryClassificationSuggestion>> GetClassificationSuggestionsAsync(List<string> categoryNames);
    Task<BudgetHealthByClassification> CalculateBudgetHealthByClassificationAsync(string userId);
}