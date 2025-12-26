import HTTP_STATUS_CODES from '@src/common/constants/HTTP_STATUS_CODES';
import { IReq, IRes } from './common/types';

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * Health check endpoint
 */
function health(_: IReq, res: IRes) {
  console.log('Health check endpoint called');
  res.status(HTTP_STATUS_CODES.Ok).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CloudPix API',
  });
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  health,
} as const;
