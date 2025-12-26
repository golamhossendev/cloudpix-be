import HTTP_STATUS_CODES from '@src/common/constants/HTTP_STATUS_CODES';
import ShareLinkService from '@src/services/ShareLinkService';
import { IReq, IRes } from './common/types';
import { authenticate, AuthRequest } from '@src/middleware/auth';

/******************************************************************************
                                 Types
******************************************************************************/

interface CreateShareLinkRequest {
  expirationDays?: number;
}

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * Create a share link for a file
 */
async function createShareLink(req: AuthRequest, res: IRes) {
  try {
    const userId = req.userId!;
    const { id: fileId } = req.params;
    const { expirationDays } = req.body as CreateShareLinkRequest;

    const shareLink = await ShareLinkService.createShareLink({
      fileId,
      userId,
      expirationDays,
    });

    res.status(HTTP_STATUS_CODES.Created).json(shareLink);
  } catch (error: any) {
    const status = error.message.includes('not found') 
      ? HTTP_STATUS_CODES.NotFound 
      : error.message.includes('Unauthorized')
      ? HTTP_STATUS_CODES.Unauthorized
      : HTTP_STATUS_CODES.BadRequest;
    res.status(status).json({
      error: error.message || 'Failed to create share link',
    });
  }
}

/**
 * Get file via share link
 */
async function getFileByShareLink(req: IReq, res: IRes) {
  try {
    const { linkId } = req.params;
    const result = await ShareLinkService.getFileByShareLink(linkId);
    res.status(HTTP_STATUS_CODES.Ok).json(result);
  } catch (error: any) {
    const status = error.message.includes('not found') 
      ? HTTP_STATUS_CODES.NotFound 
      : error.message.includes('expired') || error.message.includes('revoked')
      ? HTTP_STATUS_CODES.Gone
      : HTTP_STATUS_CODES.BadRequest;
    res.status(status).json({
      error: error.message || 'Failed to access share link',
    });
  }
}

/**
 * Revoke a share link
 */
async function revokeShareLink(req: AuthRequest, res: IRes) {
  try {
    const userId = req.userId!;
    const { linkId } = req.params;
    await ShareLinkService.revokeShareLink(linkId, userId);
    res.status(HTTP_STATUS_CODES.Ok).json({ message: 'Share link revoked successfully' });
  } catch (error: any) {
    const status = error.message.includes('not found') 
      ? HTTP_STATUS_CODES.NotFound 
      : error.message.includes('Unauthorized')
      ? HTTP_STATUS_CODES.Unauthorized
      : HTTP_STATUS_CODES.BadRequest;
    res.status(status).json({
      error: error.message || 'Failed to revoke share link',
    });
  }
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  create: [authenticate, createShareLink],
  getByLinkId: getFileByShareLink,
  revoke: [authenticate, revokeShareLink],
} as const;

