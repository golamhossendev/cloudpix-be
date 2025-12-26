import { getContainer } from '@src/services/azure/CosmosService';

import { IFile } from '@src/models/File';
import logger from 'jet-logger';
import { CONTAINER_NAMES } from '@src/common/constants';

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * Create a new file record
 */
export const createFile = async (file: IFile): Promise<IFile> => {
  try {
    const container = await getContainer(CONTAINER_NAMES.FILES, '/fileId');
    const { resource } = await container.items.create(file);

    if (!resource) {
      throw new Error('Failed to create file');
    }

    return resource as IFile;
  } catch (error) {
    logger.err(error);
    throw new Error('Failed to create file');
  }
};

/**
 * Get file by fileId
 */
export const getFileById = async (fileId: string): Promise<IFile | null> => {
  try {
    const container = await getContainer(CONTAINER_NAMES.FILES, '/fileId');
    const { resource } = await container.item(fileId, fileId).read<IFile>();
    return resource || null;
  } catch (error: any) {
    if (error.code === 404) {
      return null;
    }
    logger.err(error);
    throw new Error('Failed to get file');
  }
};

/**
 * Get all files for a user
 */
export const getFilesByUserId = async (userId: string): Promise<IFile[]> => {
  try {
    const container = await getContainer(CONTAINER_NAMES.FILES, '/fileId');
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId AND c.status = @status',
      parameters: [
        {
          name: '@userId',
          value: userId,
        },
        {
          name: '@status',
          value: 'active',
        },
      ],
    };

    const { resources } = await container.items
      .query<IFile>(querySpec)
      .fetchAll();
    return resources;
  } catch (error) {
    logger.err(error);
    throw new Error('Failed to get user files');
  }
};

/**
 * Update file
 */
export const updateFile = async (file: IFile): Promise<IFile> => {
  try {
    const container = await getContainer(CONTAINER_NAMES.FILES, '/fileId');
    const { resource } = await container
      .item(file.fileId, file.fileId)
      .replace(file);

    if (!resource) {
      throw new Error('Failed to update file');
    }

    return resource as IFile;
  } catch (error) {
    logger.err(error);
    throw new Error('Failed to update file');
  }
};

/**
 * Delete file (soft delete by setting status to deleted)
 */
export const deleteFile = async (fileId: string): Promise<void> => {
  try {
    const file = await getFileById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    file.status = 'deleted';
    await updateFile(file);
  } catch (error) {
    logger.err(error);
    throw new Error('Failed to delete file');
  }
};

/**
 * Hard delete file from Cosmos DB
 */
export const hardDeleteFile = async (fileId: string): Promise<void> => {
  try {
    const container = await getContainer(CONTAINER_NAMES.FILES, '/fileId');
    await container.item(fileId, fileId).delete();
  } catch (error: any) {
    if (error.code !== 404) {
      logger.err(error);
      throw new Error('Failed to hard delete file');
    }
  }
};

/******************************************************************************
                            Export default
******************************************************************************/

export default {
  createFile,
  getFileById,
  getFilesByUserId,
  updateFile,
  deleteFile,
  hardDeleteFile,
};
