using api.Models;

namespace api.DTOs;

public class DashboardResponse
{
    public string OverallHealthStatus { get; set; } = string.Empty;
    public decimal TotalNetWorth { get; set; }
    public List<AccountDto> Accounts { get; set; } = new();
}

public class AccountDto
{
    public string AccountId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string AccountType { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public decimal CurrentBalance { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class CreateAccountRequest
{
    public string AccountType { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public decimal CurrentBalance { get; set; }
}

public class UpdateAccountRequest
{
    public string AccountName { get; set; } = string.Empty;
    public decimal CurrentBalance { get; set; }
}