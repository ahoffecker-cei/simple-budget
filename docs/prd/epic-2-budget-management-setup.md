# Epic 2: Budget Management & Setup

**Epic Goal:** Enable users to establish their complete budget framework through guided onboarding that collects income, planned expenses, and essential vs. non-essential categorization, delivering the confidence-building experience of "I know where my money should go" and can see my budget status at a glance.

## Story 2.1: Budget Setup Wizard - Income & Basic Info
As a **new user**,
I want **a guided wizard that collects my monthly income and basic financial information**,
so that **I can establish the foundation for my budget without feeling overwhelmed**.

### Acceptance Criteria
1. Multi-step wizard with encouraging progress indicators and "you're doing great" messaging
2. Monthly income collection with validation for reasonable amounts ($1,000-$200,000 range)
3. Student loan information capture (monthly payment amount, total remaining balance)
4. Expected major monthly expenses (rent, utilities, transportation) with helpful prompting
5. Savings goal setting with encouraging guidance on emergency fund building
6. Navigation allows going back to previous steps without losing data
7. Visual design maintains reassuring, confidence-building aesthetic throughout

## Story 2.2: Budget Category Creation & Management
As a **user**,
I want **to create and manage budget categories with spending limits**,
so that **I can organize my expenses and set realistic spending boundaries**.

### Acceptance Criteria
1. Pre-populated common categories (groceries, entertainment, utilities, transportation)
2. Ability to add custom categories with user-defined names and spending limits
3. Category editing and deletion functionality with confirmation for safety
4. Monthly budget allocation with visual feedback on total vs. income
5. Category descriptions and examples to help users understand organization
6. Validation prevents budget total from exceeding income with helpful messaging
7. Categories persist in database and display in logical groupings

## Story 2.3: Essential vs. Non-Essential Classification
As a **user**,
I want **to mark budget categories as essential or non-essential**,
so that **I can make smart financial decisions when I need to adjust spending**.

### Acceptance Criteria
1. Clear explanation of essential (rent, utilities, student loans) vs. non-essential (entertainment, dining out)
2. Toggle interface for marking categories with visual indicators (icons or color coding)
3. Essential categories display differently in budget overview with priority indication
4. System provides intelligent suggestions based on category names and common classifications
5. Users can override system suggestions with their own essential/non-essential decisions
6. Essential vs. non-essential status influences dashboard visual priority and future guidance
7. Classification data stored and used for budget health calculations

## Story 2.4: Budget Overview Dashboard Integration
As a **user**,
I want **my completed budget integrated into the main dashboard with visual status indicators**,
so that **I can see my budget plan and feel confident about my financial framework**.

### Acceptance Criteria
1. Dashboard displays all budget categories with allocated amounts and essential/non-essential indicators
2. Visual budget health overview showing total planned spending vs. income
3. "Budget Setup Complete" achievement messaging to build user confidence
4. Categories displayed in logical order (essential first, then non-essential)
5. Edit budget functionality accessible from dashboard without repeating full wizard
6. Budget data integration with existing account balance display from Epic 1
7. Loading performance maintains under 2-second requirement with budget data included
