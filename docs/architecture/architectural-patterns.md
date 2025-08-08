# Architectural Patterns

- **Monolithic Architecture:** Single deployable unit per service tier - _Rationale:_ Simplifies development, deployment, and debugging for MVP while maintaining service boundaries
- **Repository Pattern:** Abstract data access behind interfaces - _Rationale:_ Enables testing and future database flexibility without tight coupling
- **Service Layer Pattern:** Business logic separated from API controllers - _Rationale:_ Maintains clean separation of concerns and supports unit testing
- **Progressive Web App (PWA):** Service workers for offline capability - _Rationale:_ Meets NFR8 offline expense logging requirement
- **RESTful API Design:** Standard HTTP methods and status codes - _Rationale:_ Familiar patterns for frontend consumption and future integrations
- **Component-Based Frontend:** Reusable Angular components with TypeScript - _Rationale:_ Supports maintainability and confidence-building UI consistency
- **JWT Authentication:** Stateless token-based security - _Rationale:_ Scalable authentication that works across web and future mobile clients
