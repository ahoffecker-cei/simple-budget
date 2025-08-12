# Port Configuration

## Standard Port Assignment

**Frontend (Angular):** `http://localhost:4200`
**Backend (ASP.NET Core API):** `http://localhost:5134` (HTTP) / `https://localhost:7268` (HTTPS)

## Current Configuration Status

### Frontend
- Angular dev server will run on port 4200 by default
- No explicit port configuration found in angular.json - uses Angular CLI defaults

### Backend  
- Configured in `apps/api/Properties/launchSettings.json`
- HTTP: localhost:5134
- HTTPS: localhost:7268

## Commands
- Frontend: `npm start` (runs on port 4200)
- Backend: `npm run start:api` (runs on port 5134/7268)

## Notes
- These ports should remain consistent across all development sessions
- Frontend will proxy API calls to backend port 5134
- No port conflicts as they are on different ports