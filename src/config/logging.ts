/**
 * Logging Configuration for DramaBox API
 */

import { LogLevel, type LoggerConfig } from '../utils/logger.js';

export interface AppLoggingConfig {
  development: LoggerConfig;
  production: LoggerConfig;
  test: LoggerConfig;
}

export const loggingConfig: AppLoggingConfig = {
  development: {
    logLevel: LogLevel.DEBUG,
    enableFileLogging: true,
    enableConsoleLogging: true,
    logDirectory: './logs/dev',
    maxLogFiles: 5,
    maxFileSize: 10, // MB
    dateFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
    includeStackTrace: true
  },

  production: {
    logLevel: LogLevel.INFO,
    enableFileLogging: true,
    enableConsoleLogging: false, // Disable console in production
    logDirectory: './logs/prod',
    maxLogFiles: 30,
    maxFileSize: 100, // MB
    dateFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
    includeStackTrace: false
  },

  test: {
    logLevel: LogLevel.WARN,
    enableFileLogging: false, // Disable file logging in tests
    enableConsoleLogging: true,
    logDirectory: './logs/test',
    maxLogFiles: 1,
    maxFileSize: 1, // MB
    dateFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
    includeStackTrace: true
  }
};

// Get current environment
export const getEnvironment = (): keyof AppLoggingConfig => {
  if (typeof process !== 'undefined') {
    return (process.env.NODE_ENV as keyof AppLoggingConfig) || 'development';
  }
  return 'development';
};

// Get configuration for current environment
export const getCurrentLoggingConfig = (): LoggerConfig => {
  const env = getEnvironment();
  return loggingConfig[env];
};

// API specific logging settings
export const apiLoggingSettings = {
  // Log all API requests in development, only errors in production
  logRequests: getEnvironment() === 'development',
  
  // Log response bodies (truncated in production)
  logResponseBodies: getEnvironment() === 'development',
  
  // Maximum response body length to log
  maxResponseBodyLength: getEnvironment() === 'development' ? 5000 : 1000,
  
  // Log slow requests (threshold in milliseconds)
  slowRequestThreshold: 3000,
  
  // Sensitive data patterns to exclude from logs
  sensitiveDataPatterns: [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /authorization/i,
    /cookie/i,
    /session/i
  ]
};

// Performance logging settings
export const performanceLoggingSettings = {
  // Enable performance monitoring
  enabled: true,
  
  // Thresholds for different performance levels (in milliseconds)
  thresholds: {
    fast: 100,
    normal: 500,
    slow: 1000,
    critical: 3000
  },
  
  // Operations to monitor
  monitoredOperations: [
    'api_request',
    'database_query',
    'file_operation',
    'user_action',
    'render_component'
  ]
};

// Error reporting settings
export const errorReportingSettings = {
  // Enable automatic error reporting
  enabled: getEnvironment() === 'production',
  
  // Error levels to report
  reportLevels: [LogLevel.ERROR, LogLevel.FATAL],
  
  // Maximum error context data to include
  maxContextDataLength: 2000,
  
  // Rate limiting for error reports
  rateLimitPerMinute: 10
};

export default {
  loggingConfig,
  getCurrentLoggingConfig,
  getEnvironment,
  apiLoggingSettings,
  performanceLoggingSettings,
  errorReportingSettings
};
