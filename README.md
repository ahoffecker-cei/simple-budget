# Simple Budget Application

A modern budget management application built with Angular frontend and ASP.NET Core backend.

## Project Structure

This is a monorepo containing:
- `apps/web` - Angular 20+ frontend with Angular Material and PWA support
- `apps/api` - ASP.NET Core Web API backend with Entity Framework Core
- `shared` - Shared TypeScript interfaces and constants

## Prerequisites

- Node.js v18+
- npm v9+
- .NET 9.0+
- Git 2.30+
- SQL Server LocalDB (for development)

## Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd simple-budget
```

### 2. Install dependencies
```bash
npm run install:all
```

### 3. Setup database
```bash
cd apps/api
dotnet ef database update
```

### 4. Start development servers

**Frontend (Angular):**
```bash
npm start
# Or: npm run start --workspace=apps/web
```
The frontend will be available at http://localhost:4200

**Backend (ASP.NET Core):**
```bash
npm run start:api
# Or: cd apps/api && dotnet run
```
The API will be available at https://localhost:5001

## Development Commands

### Frontend
- `npm start` - Start Angular dev server
- `npm run build` - Build Angular app
- `npm run test:frontend` - Run Angular tests
- `npm run lint` - Run Angular linting

### Backend
- `npm run start:api` - Start ASP.NET Core API
- `npm run build:api` - Build ASP.NET Core API
- `npm run test:backend` - Run ASP.NET Core tests

### Combined
- `npm test` - Run all tests (frontend + backend)
- `npm run install:all` - Install all dependencies

## Technology Stack

### Frontend
- Angular 20+
- TypeScript 5.0+
- Angular Material 20+
- PWA support with service worker
- RxJS for state management

### Backend
- ASP.NET Core 9.0
- C# .NET 9
- Entity Framework Core 9
- SQL Server LocalDB (development)
- OpenAPI/Swagger documentation

### Shared
- TypeScript interfaces for data models
- Consistent type definitions across frontend and backend

## Project Architecture

The application follows a clean architecture with separation of concerns:
- **UI Layer**: Angular frontend (`apps/web`)
- **API Layer**: ASP.NET Core Web API (`apps/api`)
- **Business Logic Layer**: Service classes within the API
- **Data Layer**: Entity Framework Core within the API
- **Shared Layer**: Common TypeScript interfaces (`shared`)

## Environment Configuration

### Development URLs
- Frontend: http://localhost:4200
- Backend: https://localhost:5001
- API Documentation: https://localhost:5001/swagger

### Database
Development uses SQL Server LocalDB with the connection string configured in `apps/api/appsettings.json`.

## Contributing

1. Create a feature branch from main
2. Make your changes
3. Run tests to ensure everything works
4. Submit a pull request

## License

MIT