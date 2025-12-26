import logger from 'jet-logger';

import ENV from '@src/common/constants/ENV';
import server from './server';
import { initializeContainers } from '@src/repos/database';

// Azure App Service sets PORT automatically, but we use ENV.Port which handles it
// Convert to number to ensure it's not an object
const port = Number(ENV.Port) || Number(process.env.PORT) || 3000;

// Initialize Cosmos DB containers
initializeContainers()
  .then(() => {
    // Start the server
    server.listen(port, (err) => {
      if (!!err) {
        logger.err(err.message);
        throw new Error(`Failed to start server: ${err.message}`);
      } else {
        logger.info(`Express server started on port: ${port}`);
        logger.info('Server is ready to accept connections');
      }
    });
  })
  .catch((error: unknown) => {
    if (error instanceof Error) {
      logger.err(`Failed to initialize database: ${error.message}`);
      throw error;
    } else {
      const errorMessage = typeof error === 'string' ? error : JSON.stringify(error);
      logger.err(`Failed to initialize database: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  });
