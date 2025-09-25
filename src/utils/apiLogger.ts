/**
 * API-specific logging utilities for DramaBox API
 */

import defaultLogger, { Logger } from './logger.js';
import { apiLoggingSettings } from '../config/logging.js';

export interface ApiLogContext {
  requestId: string;
  method: string;
  url: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
}

export interface ApiRequestLog extends ApiLogContext {
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
}

export interface ApiResponseLog extends ApiLogContext {
  status: number;
  duration: number;
  responseBody?: any;
  error?: any;
}

class ApiLogger {
  private logger: Logger;
  private activeRequests: Map<string, ApiLogContext> = new Map();

  constructor(logger: Logger = defaultLogger) {
    this.logger = logger;
  }

  // Generate unique request ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Sanitize sensitive data from logs
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    
    const sanitizeRecursive = (obj: any, depth = 0): any => {
      if (depth > 5) return '[Object too deep]'; // Prevent infinite recursion
      
      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeRecursive(item, depth + 1));
      }
      
      if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          // Check if key matches sensitive patterns
          const isSensitive = apiLoggingSettings.sensitiveDataPatterns.some(
            pattern => pattern.test(key)
          );
          
          if (isSensitive) {
            result[key] = '[REDACTED]';
          } else if (value && typeof value === 'object') {
            result[key] = sanitizeRecursive(value, depth + 1);
          } else {
            result[key] = value;
          }
        }
        return result;
      }
      
      return obj;
    };

    return sanitizeRecursive(sanitized);
  }

  // Truncate large response bodies
  private truncateResponseBody(body: any, maxLength: number = apiLoggingSettings.maxResponseBodyLength): any {
    if (!body) return body;
    
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    if (bodyString.length <= maxLength) {
      return body;
    }
    
    return {
      _truncated: true,
      _originalLength: bodyString.length,
      _data: bodyString.substring(0, maxLength) + '...'
    };
  }

  // Start logging an API request
  logRequest(request: ApiRequestLog): string {
    const requestId = request.requestId || this.generateRequestId();
    
    const context: ApiLogContext = {
      requestId,
      method: request.method,
      url: request.url,
      timestamp: Date.now(),
      userId: request.userId,
      sessionId: request.sessionId,
      userAgent: request.userAgent,
      ip: request.ip
    };

    this.activeRequests.set(requestId, context);

    if (apiLoggingSettings.logRequests) {
      const logData = {
        method: request.method,
        url: request.url,
        headers: this.sanitizeData(request.headers),
        body: this.sanitizeData(request.body),
        query: request.query,
        userAgent: request.userAgent,
        ip: request.ip
      };

      this.logger.apiRequest(request.method, request.url, logData, requestId);
    }

    return requestId;
  }

  // Log API response
  logResponse(response: ApiResponseLog): void {
    const context = this.activeRequests.get(response.requestId);
    if (!context) {
      this.logger.warn(`No request context found for response: ${response.requestId}`);
      return;
    }

    const duration = response.duration || (Date.now() - context.timestamp);
    
    // Log slow requests as warnings
    if (duration > apiLoggingSettings.slowRequestThreshold) {
      this.logger.warn(`Slow API request detected: ${context.method} ${context.url}`, {
        requestId: response.requestId,
        duration: `${duration}ms`,
        threshold: `${apiLoggingSettings.slowRequestThreshold}ms`
      }, 'API-PERFORMANCE');
    }

    // Prepare response data for logging
    let responseBody = response.responseBody;
    if (apiLoggingSettings.logResponseBodies && responseBody) {
      responseBody = this.truncateResponseBody(
        this.sanitizeData(responseBody),
        apiLoggingSettings.maxResponseBodyLength
      );
    }

    this.logger.apiResponse(
      context.method,
      context.url,
      response.status,
      responseBody,
      response.requestId,
      duration
    );

    // Clean up
    this.activeRequests.delete(response.requestId);
  }

  // Log API error
  logError(requestId: string, error: any, additionalContext?: any): void {
    const context = this.activeRequests.get(requestId);
    if (!context) {
      this.logger.error('API Error without request context', { 
        requestId, 
        error: error.message || error,
        additionalContext
      });
      return;
    }

    const duration = Date.now() - context.timestamp;
    
    const errorData = {
      method: context.method,
      url: context.url,
      error: {
        message: error.message || error,
        stack: error.stack,
        code: error.code,
        status: error.status || error.response?.status
      },
      duration: `${duration}ms`,
      context: this.sanitizeData(additionalContext),
      userAgent: context.userAgent,
      ip: context.ip
    };

    this.logger.apiError(context.method, context.url, errorData, requestId);
    
    // Clean up
    this.activeRequests.delete(requestId);
  }

  // Log authentication events
  logAuth(event: 'login' | 'logout' | 'token_refresh' | 'auth_failure', details?: any, userId?: string): void {
    this.logger.info(`Authentication Event: ${event}`, {
      event,
      details: this.sanitizeData(details),
      timestamp: new Date().toISOString()
    }, 'AUTH', undefined, userId);
  }

  // Log data access events
  logDataAccess(operation: 'read' | 'write' | 'delete', resource: string, details?: any, userId?: string): void {
    this.logger.info(`Data Access: ${operation} ${resource}`, {
      operation,
      resource,
      details: this.sanitizeData(details),
      timestamp: new Date().toISOString()
    }, 'DATA', undefined, userId);
  }

  // Log security events
  logSecurity(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: any, userId?: string): void {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    
    this.logger[level](`Security Event: ${event}`, {
      event,
      severity,
      details: this.sanitizeData(details),
      timestamp: new Date().toISOString()
    }, 'SECURITY', undefined, userId);
  }

  // Performance monitoring for API operations
  withPerformanceLogging<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: any
  ): Promise<T> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    this.logger.debug(`Starting operation: ${operation}`, context, 'PERFORMANCE', requestId);
    
    return fn()
      .then(result => {
        const duration = Date.now() - startTime;
        this.logger.performance(operation, duration, { context, success: true });
        return result;
      })
      .catch(error => {
        const duration = Date.now() - startTime;
        this.logger.performance(operation, duration, { 
          context, 
          success: false, 
          error: error.message || error 
        });
        throw error;
      });
  }

  // Create a scoped logger for specific API endpoints
  forEndpoint(endpoint: string, method: string = 'GET'): EndpointLogger {
    return new EndpointLogger(this, endpoint, method);
  }

  // Get statistics about active requests
  getActiveRequestsStats(): { total: number; byMethod: Record<string, number>; oldestRequest?: string } {
    const stats = {
      total: this.activeRequests.size,
      byMethod: {} as Record<string, number>,
      oldestRequest: undefined as string | undefined
    };

    let oldestTimestamp = Date.now();
    
    for (const [requestId, context] of this.activeRequests) {
      stats.byMethod[context.method] = (stats.byMethod[context.method] || 0) + 1;
      
      if (context.timestamp < oldestTimestamp) {
        oldestTimestamp = context.timestamp;
        stats.oldestRequest = requestId;
      }
    }

    return stats;
  }

  // Clean up stale requests (older than 5 minutes)
  cleanupStaleRequests(): number {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    let cleaned = 0;

    for (const [requestId, context] of this.activeRequests) {
      if (context.timestamp < fiveMinutesAgo) {
        this.logger.warn(`Cleaning up stale request: ${context.method} ${context.url}`, {
          requestId,
          age: `${Date.now() - context.timestamp}ms`
        });
        this.activeRequests.delete(requestId);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Endpoint-specific logger
class EndpointLogger {
  constructor(
    private apiLogger: ApiLogger,
    private endpoint: string,
    private method: string
  ) {}

  logRequest(requestData?: any, userId?: string): string {
    return this.apiLogger.logRequest({
      requestId: '',
      method: this.method,
      url: this.endpoint,
      timestamp: Date.now(),
      body: requestData,
      userId
    });
  }

  logResponse(requestId: string, status: number, responseData?: any, duration?: number): void {
    this.apiLogger.logResponse({
      requestId,
      method: this.method,
      url: this.endpoint,
      timestamp: Date.now(),
      status,
      duration: duration || 0,
      responseBody: responseData
    });
  }

  logError(requestId: string, error: any): void {
    this.apiLogger.logError(requestId, error);
  }

  async withLogging<T>(fn: () => Promise<T>, requestData?: any, userId?: string): Promise<T> {
    const requestId = this.logRequest(requestData, userId);
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.logResponse(requestId, 200, result, duration);
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logError(requestId, error);
      this.logResponse(requestId, error.status || 500, undefined, duration);
      throw error;
    }
  }
}

// Create and export default API logger
const defaultApiLogger = new ApiLogger(defaultLogger);

// Set up periodic cleanup
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = defaultApiLogger.cleanupStaleRequests();
    if (cleaned > 0) {
      defaultLogger.info(`Cleaned up ${cleaned} stale API requests`);
    }
  }, 60000); // Run every minute
}

export default defaultApiLogger;
export { ApiLogger, EndpointLogger };
