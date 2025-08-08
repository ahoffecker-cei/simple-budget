# Business Logic Service Layer

**Responsibility:** Core financial calculations, budget health analysis, and confidence-building messaging logic

**Key Interfaces:**
- Budget calculation service for real-time remaining amounts
- Financial health analyzer determining excellent/good/attention/concern status
- Expense categorization service with essential/non-essential logic
- User onboarding service orchestrating wizard flow

**Dependencies:** Data access repositories, external validation services, caching layer for performance

**Technology Stack:** C# business services, in-memory caching, validation attributes
