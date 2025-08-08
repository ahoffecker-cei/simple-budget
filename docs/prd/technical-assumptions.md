# Technical Assumptions

## Repository Structure: Monorepo
Single repository with clearly separated frontend and backend folders, shared models/DTOs between Angular frontend and ASP.NET Core backend, comprehensive documentation and setup guides for streamlined development workflow. This structure supports the solo developer/small team constraint while maintaining clear separation of concerns.

## Service Architecture
**Monolithic architecture initially for simplicity**, designed with clear service boundaries to enable future microservices migration if needed. Separation of concerns between data access layer (Entity Framework Core), business logic services, and API controllers to support maintainable code structure during rapid MVP development. The monolith approach aligns with bootstrap funding constraints and part-time development schedule.

## Testing Requirements
**Unit + Integration testing approach** with focus on critical user flows: expense logging, budget calculations, and dashboard data accuracy. Automated testing for API endpoints and Angular components, with manual testing procedures for user experience validation. Testing strategy must support confident deployments within the 3-4 month MVP timeline while ensuring financial data integrity.

## Additional Technical Assumptions and Requests

**Frontend Technology Stack:**
- Angular 15+ with TypeScript for type safety and maintainable code
- Angular Material UI components for consistent design system implementation
- Progressive Web App (PWA) capabilities for mobile-responsive experience without app store complexity

**Backend Technology Stack:**
- ASP.NET Core Web API with C# for business logic, leveraging existing expertise
- Entity Framework Core for database operations with SQL Server as primary data store
- RESTful API design with potential GraphQL consideration for complex data relationships in post-MVP phases

**Database and Data Management:**
- SQL Server with proper indexing for performance on user profiles, budgets, transactions, and goal tracking
- Azure SQL Database for production hosting with built-in backup and scaling capabilities
- Data encryption at rest and in transit using industry-standard security practices

**Hosting and Infrastructure:**
- Azure App Service for application hosting with integrated CI/CD pipeline support
- Azure Application Insights for monitoring, analytics, and performance tracking
- Target hosting costs under $500/month to align with bootstrap funding constraints

**Security and Compliance Requirements:**
- HTTPS encryption mandatory for all data transmission
- JWT token-based authentication for secure user sessions
- PCI compliance considerations for financial data handling
- GDPR compliance for user privacy and data protection requirements

**Integration and Future Scalability:**
- Designed API structure to support future Plaid integration for bank account connectivity
- Email service integration capability for user notifications and engagement
- Architecture prepared for AI/ML integration in Phase 2 predictive features
