import path from 'path';
import dotenv from 'dotenv';
import moduleAlias from 'module-alias';
import { existsSync } from 'fs';


// Check the env - default to 'development' if not set, and ensure it's not empty
const NODE_ENV = (process.env.NODE_ENV || 'development').trim();

// Configure "dotenv"
// In Azure App Service or CI/CD, environment variables are set directly via App Settings/Environment
// So we only load .env files in local development (when not in Azure/CI)
const isAzure = !!process.env.AZURE_WEBSITE_SITE_NAME || !!process.env.WEBSITE_SITE_NAME;
const isCI = !!process.env.CI || !!process.env.GITHUB_ACTIONS;

// Only try to load .env files in local development (not in Azure or CI/CD)
if (!isAzure && !isCI && NODE_ENV && NODE_ENV !== '') {
  const envPath = path.join(__dirname, `./config/.env.${NODE_ENV}`);
  
  // Only try to load if file exists
  if (existsSync(envPath)) {
    const result2 = dotenv.config({ path: envPath });
    if (result2.error) {
      // In local development, warn but don't fail if .env file has issues
      console.warn(`Warning: Could not load .env file: ${result2.error.message}`);
    }
  } else {
    // File doesn't exist - this is OK in CI/CD and Azure, but warn in local dev
    if (NODE_ENV === 'development') {
      console.warn(`Warning: .env file not found at ${envPath}. Using environment variables from system.`);
    }
  }
}

// Configure moduleAlias
if (__filename.endsWith('js')) {
  moduleAlias.addAlias('@src', __dirname + '/dist');
}
