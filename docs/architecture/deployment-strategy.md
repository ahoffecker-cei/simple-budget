# Deployment Strategy

**Frontend Deployment:**
- **Platform:** Azure Static Web Apps
- **Build Command:** `npm run build:prod`
- **Output Directory:** `apps/web/dist`
- **CDN/Edge:** Built-in Azure CDN with global edge locations for 2-second load time requirement

**Backend Deployment:**
- **Platform:** Azure App Service (Linux, Basic B1 tier)
- **Build Command:** `dotnet publish -c Release -o out`
- **Deployment Method:** Azure DevOps pipeline with ZIP deploy
