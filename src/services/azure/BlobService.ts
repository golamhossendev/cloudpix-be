import { BlobServiceClient, ContainerClient, BlockBlobClient } from '@azure/storage-blob';
import logger from 'jet-logger';

interface BlobConfig {
  connectionString: string;
  containerName: string;
}

const getBlobConfig = (): BlobConfig => {
  const connectionString = process.env.AZURE_BLOB_CONNECTION_STRING;
  const containerName = process.env.BLOB_CONTAINER_NAME || 'cloudpix-files';

  if (!connectionString) {
    throw new Error('AZURE_BLOB_CONNECTION_STRING environment variable is required');
  }

  return { connectionString, containerName };
};

let config: BlobConfig | null = null;
let blobServiceClient: BlobServiceClient | null = null;
let containerClientInstance: ContainerClient | null = null;

/**
 * Get or initialize Blob Service client
 */
const getBlobServiceClient = (): BlobServiceClient => {
  if (!blobServiceClient) {
    if (!config) {
      config = getBlobConfig();
    }
    blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionString);
  }
  return blobServiceClient;
};

/**
 * Get or create the container client
 */
export const getContainerClient = async (): Promise<ContainerClient> => {
  if (containerClientInstance) {
    return containerClientInstance;
  }

  try {
    if (!config) {
      config = getBlobConfig();
    }
    const serviceClient = getBlobServiceClient();
    const containerClient = serviceClient.getContainerClient(config.containerName);
    await containerClient.createIfNotExists({
      access: 'blob', // Public read access for blob URLs
    });
    containerClientInstance = containerClient;
    logger.info(`Blob Storage container '${config.containerName}' ready`);
    return containerClient;
  } catch (error) {
    logger.err(error);
    throw new Error('Failed to connect to Blob Storage');
  }
};

/**
 * Get a blob client for a specific file
 */
export const getBlobClient = async (
  blobName: string
): Promise<BlockBlobClient> => {
  const containerClient = await getContainerClient();
  return containerClient.getBlockBlobClient(blobName);
};

/**
 * Upload a file to blob storage
 */
export const uploadBlob = async (
  blobName: string,
  content: Buffer | Uint8Array | string,
  contentType: string
): Promise<string> => {
  try {
    const blobClient = await getBlobClient(blobName);
    await blobClient.upload(content, content.length, {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
    });
    
    // Return the blob URL
    return blobClient.url;
  } catch (error) {
    logger.err(error);
    throw new Error(`Failed to upload blob '${blobName}'`);
  }
};

/**
 * Delete a blob from storage
 */
export const deleteBlob = async (blobName: string): Promise<void> => {
  try {
    const blobClient = await getBlobClient(blobName);
    await blobClient.delete();
  } catch (error) {
    logger.err(error);
    throw new Error(`Failed to delete blob '${blobName}'`);
  }
};

/**
 * Get blob URL without uploading
 */
export const getBlobUrl = async (blobName: string): Promise<string> => {
  const blobClient = await getBlobClient(blobName);
  return blobClient.url;
};

/**
 * Check if a blob exists
 */
export const blobExists = async (blobName: string): Promise<boolean> => {
  try {
    const blobClient = await getBlobClient(blobName);
    return await blobClient.exists();
  } catch (error) {
    logger.err(error);
    return false;
  }
};

export default {
  getContainerClient,
  getBlobClient,
  uploadBlob,
  deleteBlob,
  getBlobUrl,
  blobExists,
};

