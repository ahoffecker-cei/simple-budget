# Epic 1: Foundation & Core Infrastructure

**Epic Goal:** Establish complete project infrastructure (Angular frontend, ASP.NET Core backend, Azure deployment, CI/CD pipeline) while delivering immediate user value through secure account balance display and basic navigation, proving the technical foundation works end-to-end with a simple but meaningful feature.

## Story 1.1: Project Setup & Development Environment
As a **developer**,
I want **complete project scaffolding with Angular frontend and ASP.NET Core backend**,
so that **I have a working development environment ready for feature implementation**.

### Acceptance Criteria
1. Angular 15+ project created with TypeScript, Angular Material, and PWA capabilities configured
2. ASP.NET Core Web API project with Entity Framework Core and SQL Server LocalDB configured
3. Shared DTOs/models between frontend and backend established
4. Git repository initialized with proper .gitignore and README documentation
5. Development scripts (npm start, dotnet run) work without manual configuration steps
6. Basic project structure follows separation of concerns (data, business logic, API, UI layers)

## Story 1.2: User Authentication System
As a **new user**,
I want **secure account creation and login functionality**,
so that **my financial data is protected and I can access it consistently**.

### Acceptance Criteria
1. User registration form collects email and secure password with validation
2. Login system authenticates users with JWT token-based sessions
3. Password requirements enforce security standards (8+ characters, mixed case, numbers)
4. JWT tokens expire appropriately and refresh automatically during active sessions
5. Logout functionality clears authentication tokens completely
6. Database stores user credentials with proper password hashing (bcrypt or equivalent)
7. Authentication guards protect all financial data routes

## Story 1.3: Account Balance Display Dashboard
As a **user**,
I want **a clean dashboard showing my checking, savings, and retirement account balances**,
so that **I can see my complete financial picture in one place**.

### Acceptance Criteria
1. Dashboard displays current balances for checking, savings, and retirement accounts
2. Account balances can be manually entered and updated by the user
3. Total net worth calculation displayed prominently
4. Visual design follows encouraging, non-intimidating aesthetic from UI goals
5. Dashboard loads in under 2 seconds as specified in NFR1
6. Responsive design works on mobile, tablet, and desktop as specified in NFR4
7. Account balance data persists securely in the database

## Story 1.4: Production Deployment & CI/CD
As a **developer**,
I want **automated deployment to Azure with CI/CD pipeline**,
so that **I can deploy updates reliably and the application is publicly accessible**.

### Acceptance Criteria
1. Azure App Service configured for Angular frontend and ASP.NET Core backend
2. Azure SQL Database connected with Entity Framework migrations
3. CI/CD pipeline deploys automatically on main branch commits
4. HTTPS encryption enforced on all production traffic
5. Application Insights monitoring configured for performance tracking
6. Environment variables properly configured for production vs. development
7. Database migrations run automatically during deployment
8. Production application accessible via public URL with authentication working
