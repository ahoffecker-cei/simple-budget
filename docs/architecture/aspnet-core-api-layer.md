# ASP.NET Core API Layer

**Responsibility:** RESTful API providing secure, fast access to business logic and data persistence with sub-500ms response times

**Key Interfaces:**
- Authentication endpoints (register, login, JWT token management)
- Budget management endpoints (categories, spending calculations)
- Expense logging endpoints with immediate budget impact response
- Dashboard aggregation endpoint for single-call "Am I doing okay?" data

**Dependencies:** Entity Framework Core for data access, ASP.NET Identity for authentication, Azure Application Insights for monitoring

**Technology Stack:** ASP.NET Core 8, C#, JWT authentication, Serilog logging
