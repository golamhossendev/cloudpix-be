import path from 'path';
import dotenv from 'dotenv';
import moduleAlias from 'module-alias';


// Check the env
const NODE_ENV = (process.env.NODE_ENV ?? 'development');

// Configure "dotenv"
// In Azure App Service, environment variables are set directly via App Settings
// So we only load .env files in local development (when not in Azure)
const isAzure = !!process.env.AZURE_WEBSITE_SITE_NAME || !!process.env.WEBSITE_SITE_NAME;
if (!isAzure || NODE_ENV !== 'production') {
  // Load .env file only if not in Azure production
  const envPath = path.join(__dirname, `./config/.env.${NODE_ENV}`);
  const result2 = dotenv.config({ path: envPath });
  // Don't throw error if .env file doesn't exist in Azure (env vars come from App Settings)
  if (result2.error && isAzure) {
    console.warn(`Warning: Could not load .env file: ${result2.error.message}. Using App Settings instead.`);
  } else if (result2.error && !isAzure) {
    // In local development, throw error if .env file is missing
    throw result2.error;
  }
}

// Configure moduleAlias
if (__filename.endsWith('js')) {
  moduleAlias.addAlias('@src', __dirname + '/dist');
}
