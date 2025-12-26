import HTTP_STATUS_CODES from '@src/common/constants/HTTP_STATUS_CODES';
import FileService from '@src/services/FileService';
import { IReq, IRes } from './common/types';
import { authenticate, AuthRequest } from '@src/middleware/auth';
import { upload, validateFileSize, validateFileType } from '@src/middleware/upload';

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * Upload a file
 */
async function uploadFile(req: AuthRequest, res: IRes) {
  try {
    const userId = req.userId!;
    const file = req.file;

    if (!file) {
      return res.status(HTTP_STATUS_CODES.BadRequest).json({
        error: 'No file provided',
      });
    }

    // Validate file
    validateFileSize(file);
    validateFileType(file);

    const result = await FileService.uploadFile({
      userId,
      fileName: file.originalname,
      contentType: file.mimetype,
      fileSize: file.size,
      buffer: file.buffer,
    });

    res.status(HTTP_STATUS_CODES.Created).json(result);
  } catch (error: any) {
    res.status(HTTP_STATUS_CODES.BadRequest).json({
      error: error.message || 'Failed to upload file',
    });
  }
}

/**
 * Get all user files
 */
async function getUserFiles(req: AuthRequest, res: IRes) {
  try {
    const userId = req.userId!;
    const files = await FileService.getUserFiles(userId);
    res.status(HTTP_STATUS_CODES.Ok).json({ files });
  } catch (error: any) {
    res.status(HTTP_STATUS_CODES.InternalServerError).json({
      error: error.message || 'Failed to get files',
    });
  }
}

/**
 * Get file by ID
 */
async function getFileById(req: AuthRequest, res: IRes) {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const file = await FileService.getFileById(id, userId);
    res.status(HTTP_STATUS_CODES.Ok).json(file);
  } catch (error: any) {
    const status = error.message.includes('not found') 
      ? HTTP_STATUS_CODES.NotFound 
      : HTTP_STATUS_CODES.Unauthorized;
    res.status(status).json({
      error: error.message || 'Failed to get file',
    });
  }
}

/**
 * Delete a file
 */
async function deleteFile(req: AuthRequest, res: IRes) {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    await FileService.deleteFile(id, userId);
    res.status(HTTP_STATUS_CODES.Ok).json({ message: 'File deleted successfully' });
  } catch (error: any) {
    const status = error.message.includes('not found') 
      ? HTTP_STATUS_CODES.NotFound 
      : error.message.includes('Unauthorized')
      ? HTTP_STATUS_CODES.Unauthorized
      : HTTP_STATUS_CODES.InternalServerError;
    res.status(status).json({
      error: error.message || 'Failed to delete file',
    });
  }
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  upload: [authenticate, upload.single('file'), uploadFile],
  getAll: [authenticate, getUserFiles],
  getById: [authenticate, getFileById],
  delete: [authenticate, deleteFile],
} as const;

