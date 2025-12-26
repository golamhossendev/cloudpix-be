import HTTP_STATUS_CODES from '@src/common/constants/HTTP_STATUS_CODES';
import { IReq, IRes } from './common/types';
import { trackMetric, trackEvent } from '@src/services/azure/AppInsightsService';

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * Metrics endpoint (Application Insights hook)
 */
async function metrics(_: IReq, res: IRes) {
  try {
    // This endpoint can be used to manually trigger metrics or events
    // In production, Application Insights will automatically collect metrics
    trackEvent('metrics_endpoint_called');
    
    res.status(HTTP_STATUS_CODES.Ok).json({
      message: 'Metrics endpoint active',
      timestamp: new Date().toISOString(),
      appInsights: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ? 'configured' : 'not configured',
    });
  } catch (error: any) {
    res.status(HTTP_STATUS_CODES.InternalServerError).json({
      error: 'Failed to process metrics',
    });
  }
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  metrics,
} as const;

