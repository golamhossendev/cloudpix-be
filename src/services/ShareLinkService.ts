import { v4 as uuidv4 } from 'uuid';
import ShareLinkRepo from '@src/repos/CosmosShareLinkRepo';
import FileRepo from '@src/repos/CosmosFileRepo';
import { IShareLink } from '@src/models/ShareLink';
import { trackEvent, trackException } from '@src/services/azure/AppInsightsService';
import logger from 'jet-logger';

/******************************************************************************
                                 Types
******************************************************************************/

export interface CreateShareLinkData {
  fileId: string;
  userId: string;
  expirationDays?: number; // Optional: 1, 7, 30, or never (undefined)
}

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * Calculate expiry date based on expiration days
 */
const calculateExpiryDate = (expirationDays?: number): Date | undefined => {
  if (!expirationDays) {
    return undefined; // Never expire
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expirationDays);
  return expiryDate;
};

/**
 * Calculate TTL in seconds for Cosmos DB
 */
const calculateTTL = (expiryDate?: Date): number | undefined => {
  if (!expiryDate) {
    return undefined; // No TTL
  }

  const now = new Date();
  const diffInSeconds = Math.floor((expiryDate.getTime() - now.getTime()) / 1000);
  return diffInSeconds > 0 ? diffInSeconds : undefined;
};

/**
 * Create a share link
 */
export const createShareLink = async (
  data: CreateShareLinkData
): Promise<IShareLink> => {
  try {
    // Verify file exists and user owns it
    const file = await FileRepo.getFileById(data.fileId);
    if (!file) {
      throw new Error('File not found');
    }

    if (file.userId !== data.userId) {
      throw new Error('Unauthorized access to file');
    }

    if (file.status !== 'active') {
      throw new Error('Cannot share deleted file');
    }

    // Calculate expiry
    const expiryDate = calculateExpiryDate(data.expirationDays);
    const ttl = calculateTTL(expiryDate);

    // Create share link
    const shareLink: IShareLink = {
      linkId: uuidv4(),
      fileId: data.fileId,
      expiryDate: expiryDate || new Date(), // Set to future date or current if never expires
      accessCount: 0,
      createdDate: new Date(),
      isRevoked: false,
      ttl,
    };

    const createdLink = await ShareLinkRepo.createShareLink(shareLink);

    trackEvent('share_link_created', {
      userId: data.userId,
      fileId: data.fileId,
      linkId: createdLink.linkId,
    });

    return createdLink;
  } catch (error: any) {
    trackException(error instanceof Error ? error : new Error(String(error)), {
      operation: 'create_share_link',
      fileId: data.fileId,
      userId: data.userId,
    });
    logger.err(error);
    throw error;
  }
};

/**
 * Get file via share link
 */
export const getFileByShareLink = async (linkId: string): Promise<{
  file: any;
  shareLink: IShareLink;
}> => {
  try {
    const shareLink = await ShareLinkRepo.getShareLinkById(linkId);
    
    if (!shareLink) {
      throw new Error('Share link not found');
    }

    // Check if link is valid
    if (!ShareLinkRepo.isShareLinkValid(shareLink)) {
      throw new Error('Share link is expired or revoked');
    }

    // Get file
    const file = await FileRepo.getFileById(shareLink.fileId);
    if (!file || file.status !== 'active') {
      throw new Error('File not found or deleted');
    }

    // Increment access count
    await ShareLinkRepo.incrementAccessCount(linkId);

    trackEvent('share_link_accessed', {
      linkId,
      fileId: shareLink.fileId,
    });

    return {
      file,
      shareLink,
    };
  } catch (error: any) {
    trackException(error instanceof Error ? error : new Error(String(error)), {
      operation: 'get_file_by_share_link',
      linkId,
    });
    logger.err(error);
    throw error;
  }
};

/**
 * Revoke a share link
 */
export const revokeShareLink = async (
  linkId: string,
  userId: string
): Promise<void> => {
  try {
    const shareLink = await ShareLinkRepo.getShareLinkById(linkId);
    
    if (!shareLink) {
      throw new Error('Share link not found');
    }

    // Verify file ownership
    const file = await FileRepo.getFileById(shareLink.fileId);
    if (!file || file.userId !== userId) {
      throw new Error('Unauthorized access');
    }

    await ShareLinkRepo.revokeShareLink(linkId);

    trackEvent('share_link_revoked', {
      userId,
      linkId,
      fileId: shareLink.fileId,
    });
  } catch (error: any) {
    trackException(error instanceof Error ? error : new Error(String(error)), {
      operation: 'revoke_share_link',
      linkId,
      userId,
    });
    logger.err(error);
    throw error;
  }
};

/******************************************************************************
                            Export default
******************************************************************************/

export default {
  createShareLink,
  getFileByShareLink,
  revokeShareLink,
};

