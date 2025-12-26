import * as appInsights from 'applicationinsights';
import logger from 'jet-logger';

let isInitialized = false;

/**
 * Initialize Application Insights
 */
export const initializeAppInsights = (): void => {
  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

  if (!connectionString) {
    logger.warn('Application Insights connection string not provided. Monitoring disabled.');
    return;
  }

  try {
    appInsights.setup(connectionString)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true, true)
      .setUseDiskRetryCaching(true)
      .start();

    isInitialized = true;
    logger.info('Application Insights initialized');
  } catch (error) {
    logger.err(error);
    logger.warn('Failed to initialize Application Insights');
  }
};

/**
 * Track a custom event
 */
export const trackEvent = (name: string, properties?: Record<string, string>): void => {
  if (!isInitialized) return;
  
  try {
    appInsights.defaultClient?.trackEvent({
      name,
      properties,
    });
  } catch (error) {
    logger.err(error);
  }
};

/**
 * Track a custom metric
 */
export const trackMetric = (name: string, value: number): void => {
  if (!isInitialized) return;
  
  try {
    appInsights.defaultClient?.trackMetric({
      name,
      value,
    });
  } catch (error) {
    logger.err(error);
  }
};

/**
 * Track an exception
 */
export const trackException = (error: Error, properties?: Record<string, string>): void => {
  if (!isInitialized) return;
  
  try {
    appInsights.defaultClient?.trackException({
      exception: error,
      properties,
    });
  } catch (err) {
    logger.err(err);
  }
};

/**
 * Track a dependency (external service call)
 */
export const trackDependency = (
  name: string,
  commandName: string,
  duration: number,
  success: boolean,
  dependencyTypeName?: string
): void => {
  if (!isInitialized) return;
  
  try {
    appInsights.defaultClient?.trackDependency({
      name,
      data: commandName,
      duration,
      success,
      dependencyTypeName: dependencyTypeName || 'HTTP',
    });
  } catch (error) {
    logger.err(error);
  }
};

/**
 * Track a trace
 */
export const trackTrace = (message: string, severityLevel?: number): void => {
  if (!isInitialized) return;
  
  try {
    // Severity levels: 0=Verbose, 1=Information, 2=Warning, 3=Error, 4=Critical
    // Application Insights expects severity as a number, but the type might expect string
    appInsights.defaultClient?.trackTrace({
      message,
      severity: severityLevel ?? 1,
    } as any);
  } catch (error) {
    logger.err(error);
  }
};

export default {
  initializeAppInsights,
  trackEvent,
  trackMetric,
  trackException,
  trackDependency,
  trackTrace,
};

