/**
 * Comprehensive examples of how to use the logging system in DramaBox API
 */

import defaultLogger, { Logger, LogLevel } from '../utils/logger.js';
import defaultApiLogger, { ApiLogger } from '../utils/apiLogger.js';
import { getCurrentLoggingConfig } from '../config/logging.js';

// ============================================================================
// BASIC LOGGING EXAMPLES
// ============================================================================

export function basicLoggingExamples() {
  console.log('\n=== BASIC LOGGING EXAMPLES ===\n');

  // Simple logging with different levels
  defaultLogger.debug('This is a debug message', { userId: 123, action: 'test' });
  defaultLogger.info('Application started successfully', { version: '1.0.0', environment: 'development' });
  defaultLogger.warn('This is a warning message', { memoryUsage: '85%', threshold: '80%' });
  defaultLogger.error('Something went wrong', { error: 'Network timeout', retryCount: 3 });
  defaultLogger.fatal('Critical system failure', { error: 'Database connection lost', uptime: '2h 30m' });

  // Using structured logging
  defaultLogger.info('User login attempt', {
    userId: 12345,
    email: 'user@example.com',
    ip: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    timestamp: new Date().toISOString(),
    success: true
  });

  // Performance logging
  const startTime = Date.now();
  // ... some operation ...
  setTimeout(() => {
    const duration = Date.now() - startTime;
    defaultLogger.performance('user_authentication', duration, {
      method: 'email_password',
      userId: 12345
    });
  }, 100);
}

// ============================================================================
// API LOGGING EXAMPLES
// ============================================================================

export async function apiLoggingExamples() {
  console.log('\n=== API LOGGING EXAMPLES ===\n');

  // Example 1: Manual API request/response logging
  const requestId = defaultApiLogger.logRequest({
    requestId: '',
    method: 'GET',
    url: '/api/dramas',
    timestamp: Date.now(),
    headers: {
      'Authorization': 'Bearer token123',
      'Content-Type': 'application/json'
    },
    query: { page: 1, limit: 10 },
    userId: '12345',
    userAgent: 'DramaBox-Client/1.0.0'
  });

  // Simulate API processing time
  await new Promise(resolve => setTimeout(resolve, 150));

  defaultApiLogger.logResponse({
    requestId,
    method: 'GET',
    url: '/api/dramas',
    timestamp: Date.now(),
    status: 200,
    duration: 150,
    responseBody: {
      data: [
        { id: 1, title: 'Drama 1' },
        { id: 2, title: 'Drama 2' }
      ],
      pagination: { page: 1, total: 100 }
    }
  });

  // Example 2: Using endpoint-specific logger
  const dramaEndpoint = defaultApiLogger.forEndpoint('/api/dramas', 'GET');
  
  try {
    await dramaEndpoint.withLogging(async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
      return { dramas: ['Drama 1', 'Drama 2'] };
    }, { page: 1, limit: 10 }, '12345');
  } catch (error) {
    // Error handling is automatic with withLogging
  }

  // Example 3: Authentication logging
  defaultApiLogger.logAuth('login', {
    method: 'email',
    email: 'user@example.com',
    success: true,
    loginTime: new Date().toISOString()
  }, '12345');

  // Example 4: Security event logging
  defaultApiLogger.logSecurity('suspicious_activity', 'medium', {
    type: 'multiple_failed_logins',
    attempts: 5,
    timeWindow: '5 minutes',
    ip: '192.168.1.100'
  }, '12345');
}

// ============================================================================
// CHILD LOGGER EXAMPLES
// ============================================================================

export function childLoggerExamples() {
  console.log('\n=== CHILD LOGGER EXAMPLES ===\n');

  // Create child loggers with context
  const userServiceLogger = defaultLogger.child('UserService', 'req_123', 'user_456');
  const dramaServiceLogger = defaultLogger.child('DramaService', 'req_124');

  // All logs from these loggers will include the context
  userServiceLogger.info('User profile updated', { 
    changes: ['email', 'preferences'] 
  });

  dramaServiceLogger.debug('Loading drama details', { 
    dramaId: 'drama_789' 
  });

  dramaServiceLogger.error('Failed to load drama', {
    dramaId: 'drama_789',
    error: 'Network timeout'
  });
}

// ============================================================================
// PERFORMANCE MONITORING EXAMPLES
// ============================================================================

export async function performanceMonitoringExamples() {
  console.log('\n=== PERFORMANCE MONITORING EXAMPLES ===\n');

  // Example 1: Using performance wrapper
  const result = await defaultApiLogger.withPerformanceLogging(
    'database_query_users',
    async () => {
      // Simulate database query
      await new Promise(resolve => setTimeout(resolve, 300));
      return { users: [{ id: 1, name: 'John' }] };
    },
    { table: 'users', filters: { active: true } }
  );

  // Example 2: Manual performance tracking
  const operationStart = Date.now();
  
  // Simulate some heavy operation
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const operationDuration = Date.now() - operationStart;
  defaultLogger.performance('heavy_computation', operationDuration, {
    algorithm: 'recommendation_engine',
    inputSize: 10000
  });

  // Example 3: Component render performance (for React components)
  const renderStart = Date.now();
  
  // Simulate component render
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const renderDuration = Date.now() - renderStart;
  defaultLogger.performance('component_render', renderDuration, {
    component: 'DramaList',
    itemCount: 25,
    cached: false
  });
}

// ============================================================================
// ERROR HANDLING EXAMPLES
// ============================================================================

export async function errorHandlingExamples() {
  console.log('\n=== ERROR HANDLING EXAMPLES ===\n');

  try {
    // Simulate an operation that might fail
    await new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Network connection failed'));
      }, 100);
    });
  } catch (error: any) {
    // Comprehensive error logging
    defaultLogger.error('Network operation failed', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      operation: 'fetch_drama_list',
      retryAttempt: 1,
      maxRetries: 3,
      context: {
        url: 'https://api.example.com/dramas',
        method: 'GET',
        timeout: 5000
      }
    });

    // API-specific error logging
    defaultApiLogger.logError('req_123', error, {
      endpoint: '/api/dramas',
      method: 'GET',
      retryCount: 1
    });
  }

  // Business logic error
  try {
    throw new Error('User not authorized to access this drama');
  } catch (error: any) {
    defaultLogger.warn('Authorization check failed', {
      userId: '12345',
      dramaId: 'drama_789',
      requiredPermission: 'premium_content',
      userPermissions: ['basic_content'],
      error: error.message
    });
  }
}

// ============================================================================
// DATA ACCESS LOGGING EXAMPLES
// ============================================================================

export function dataAccessLoggingExamples() {
  console.log('\n=== DATA ACCESS LOGGING EXAMPLES ===\n');

  // Database operations
  defaultApiLogger.logDataAccess('read', 'user_profiles', {
    query: 'SELECT * FROM users WHERE active = true',
    resultCount: 150,
    duration: '45ms'
  }, '12345');

  defaultApiLogger.logDataAccess('write', 'user_preferences', {
    operation: 'UPDATE',
    affectedRows: 1,
    changes: ['theme', 'language']
  }, '12345');

  // Cache operations
  defaultApiLogger.logDataAccess('read', 'drama_cache', {
    key: 'popular_dramas_week_45',
    hit: true,
    ttl: '2 hours'
  });

  // File operations
  defaultApiLogger.logDataAccess('write', 'user_avatar', {
    fileName: 'avatar_12345.jpg',
    fileSize: '145KB',
    uploadDuration: '2.3s'
  }, '12345');
}

// ============================================================================
// USER ACTION LOGGING EXAMPLES
// ============================================================================

export function userActionLoggingExamples() {
  console.log('\n=== USER ACTION LOGGING EXAMPLES ===\n');

  // User interactions
  defaultLogger.userAction('drama_search', {
    query: 'romantic comedy',
    resultCount: 15,
    filters: ['2023', 'korean'],
    searchTime: '150ms'
  }, '12345');

  defaultLogger.userAction('drama_watch', {
    dramaId: 'drama_789',
    episode: 5,
    watchTime: '45 minutes',
    quality: '1080p',
    device: 'mobile'
  }, '12345');

  defaultLogger.userAction('user_settings_update', {
    changed: ['notifications', 'privacy'],
    previousValues: { notifications: true, privacy: 'public' },
    newValues: { notifications: false, privacy: 'private' }
  }, '12345');
}

// ============================================================================
// CUSTOM LOGGER CONFIGURATION EXAMPLES
// ============================================================================

export function customLoggerExamples() {
  console.log('\n=== CUSTOM LOGGER CONFIGURATION EXAMPLES ===\n');

  // Create a custom logger with specific configuration
  const customLogger = new Logger({
    logLevel: LogLevel.DEBUG,
    enableFileLogging: true,
    enableConsoleLogging: true,
    logDirectory: './logs/custom',
    maxLogFiles: 5,
    maxFileSize: 25, // MB
    includeStackTrace: true
  });

  customLogger.info('Custom logger initialized', {
    config: customLogger.getConfig()
  });

  // Update logger configuration at runtime
  customLogger.updateConfig({
    logLevel: LogLevel.WARN,
    enableConsoleLogging: false
  });

  customLogger.warn('Logger configuration updated', {
    newConfig: customLogger.getConfig()
  });

  // Create specialized API logger
  const specializedApiLogger = new ApiLogger(customLogger);
  
  const specialRequestId = specializedApiLogger.logRequest({
    requestId: '',
    method: 'POST',
    url: '/api/custom-endpoint',
    timestamp: Date.now(),
    body: { data: 'custom payload' }
  });

  specializedApiLogger.logResponse({
    requestId: specialRequestId,
    method: 'POST',
    url: '/api/custom-endpoint',
    timestamp: Date.now(),
    status: 201,
    duration: 250,
    responseBody: { success: true, id: 'new_resource_123' }
  });
}

// ============================================================================
// PRODUCTION LOGGING BEST PRACTICES
// ============================================================================

export function productionLoggingBestPractices() {
  console.log('\n=== PRODUCTION LOGGING BEST PRACTICES ===\n');

  // 1. Always include correlation IDs
  const correlationId = `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const requestLogger = defaultLogger.child('ProductionAPI', correlationId);

  // 2. Log business events, not just technical events
  requestLogger.info('User subscription upgraded', {
    correlationId,
    userId: '12345',
    previousPlan: 'basic',
    newPlan: 'premium',
    revenue: 9.99,
    currency: 'USD',
    paymentMethod: 'credit_card'
  });

  // 3. Include sufficient context for troubleshooting
  requestLogger.error('Payment processing failed', {
    correlationId,
    userId: '12345',
    orderId: 'order_789',
    amount: 9.99,
    currency: 'USD',
    paymentProvider: 'stripe',
    errorCode: 'card_declined',
    retryAttempt: 2,
    totalRetries: 3,
    fallbackAvailable: true
  });

  // 4. Use structured logging for metrics and monitoring
  requestLogger.info('API response time SLA', {
    correlationId,
    endpoint: '/api/dramas',
    responseTime: 150,
    slaThreshold: 200,
    withinSLA: true,
    percentile95: 180,
    percentile99: 220
  });

  // 5. Log security-relevant events
  defaultApiLogger.logSecurity('api_rate_limit_exceeded', 'medium', {
    userId: '12345',
    endpoint: '/api/search',
    requestCount: 105,
    timeWindow: '1 minute',
    limit: 100,
    clientIP: '192.168.1.100',
    userAgent: 'Custom-Bot/1.0'
  });
}

// ============================================================================
// MAIN DEMO FUNCTION
// ============================================================================

export async function runAllLoggingExamples() {
  console.log('🚀 Starting DramaBox API Logging System Demo...\n');

  try {
    // Show current logging configuration
    const config = getCurrentLoggingConfig();
    defaultLogger.info('Logging system demo started', {
      environment: process.env.NODE_ENV || 'development',
      config: {
        logLevel: LogLevel[config.logLevel],
        fileLogging: config.enableFileLogging,
        consoleLogging: config.enableConsoleLogging,
        logDirectory: config.logDirectory
      }
    });

    // Run all example categories
    basicLoggingExamples();
    await apiLoggingExamples();
    childLoggerExamples();
    await performanceMonitoringExamples();
    await errorHandlingExamples();
    dataAccessLoggingExamples();
    userActionLoggingExamples();
    customLoggerExamples();
    productionLoggingBestPractices();

    defaultLogger.info('All logging examples completed successfully', {
      totalExamples: 9,
      duration: Date.now() - (Date.now() - 5000) // Approximate
    });

  } catch (error: any) {
    defaultLogger.fatal('Logging demo failed', {
      error: error.message,
      stack: error.stack
    });
  }
}

// Export individual functions for selective usage
export default {
  runAllLoggingExamples,
  basicLoggingExamples,
  apiLoggingExamples,
  childLoggerExamples,
  performanceMonitoringExamples,
  errorHandlingExamples,
  dataAccessLoggingExamples,
  userActionLoggingExamples,
  customLoggerExamples,
  productionLoggingBestPractices
};
