import jetEnv, { num } from 'jet-env';
import { isValueOf } from 'jet-validators';

import { NODE_ENVS } from '.';

// Azure App Service sets PORT environment variable automatically
// Default to 3000 for local development, or use PORT from environment
const DEFAULT_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const ENV = jetEnv({
  NodeEnv: isValueOf(NODE_ENVS),
  Port: num,
}, {
  Port: DEFAULT_PORT, // Provide default if PORT is not in .env file
});

// Ensure Port is always a number
if (typeof ENV.Port !== 'number') {
  ENV.Port = DEFAULT_PORT;
}

export default ENV;
