import { getContainer } from '../services/azure/CosmosService';
import logger from 'jet-logger';

export const CONTAINER_NAMES = {
  USERS: 'Users',
  FILES: 'Files',
  SHARE_LINKS: 'ShareLinks',
} as const;

/**
 * Initialize all Cosmos DB containers
 */
export async function initializeContainers(): Promise<void> {
  try {
    // Users container - partition key: userId
    await getContainer(CONTAINER_NAMES.USERS, '/userId');
    logger.info(`Container '${CONTAINER_NAMES.USERS}' initialized`);

    // Files container - partition key: fileId
    await getContainer(CONTAINER_NAMES.FILES, '/fileId');
    logger.info(`Container '${CONTAINER_NAMES.FILES}' initialized`);

    // ShareLinks container - partition key: linkId
    await getContainer(CONTAINER_NAMES.SHARE_LINKS, '/linkId');
    logger.info(`Container '${CONTAINER_NAMES.SHARE_LINKS}' initialized`);
  } catch (error) {
    logger.err(error);
    throw new Error('Failed to initialize Cosmos DB containers');
  }
}


