# DramaBox API Logging System

A comprehensive, production-ready logging system for the DramaBox API project that supports both client-side and server-side logging with file output, structured data, and performance monitoring.

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Basic Usage](#basic-usage)
- [API Logging](#api-logging)
- [Performance Monitoring](#performance-monitoring)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Log File Management](#log-file-management)
- [Examples](#examples)

## ✨ Features

### Core Features
- **Multi-level logging**: DEBUG, INFO, WARN, ERROR, FATAL
- **File logging**: Automatic rotation and cleanup
- **Structured logging**: JSON-formatted log entries with metadata
- **Performance monitoring**: Built-in performance tracking
- **API request/response logging**: Specialized logging for API calls
- **Context preservation**: Child loggers with inherited context
- **Environment-aware**: Different configs for dev/prod/test

### Advanced Features
- **Automatic log rotation**: Size-based file rotation
- **Memory buffering**: Efficient batched writes to disk
- **Sensitive data filtering**: Automatic redaction of sensitive information
- **Request correlation**: Track requests across multiple services
- **Security event logging**: Specialized security and audit logging
- **Real-time monitoring**: Integration-ready for monitoring systems

## 🚀 Quick Start

### 1. Basic Logging

```typescript
import defaultLogger from '../utils/logger.js';

// Simple logging
defaultLogger.info('User logged in', { userId: 123, email: 'user@example.com' });
defaultLogger.error('Failed to connect to database', { error: 'Connection timeout' });

// With structured data
defaultLogger.info('API request completed', {
  method: 'GET',
  url: '/api/dramas',
  status: 200,
  duration: 150,
  userId: 12345
});
```

### 2. API Logging

```typescript
import defaultApiLogger from '../utils/apiLogger.js';

// Log API request/response
const requestId = defaultApiLogger.logRequest({
  method: 'GET',
  url: '/api/dramas',
  headers: { 'Authorization': 'Bearer token' },
  userId: '123'
});

defaultApiLogger.logResponse({
  requestId,
  method: 'GET',
  url: '/api/dramas',
  status: 200,
  duration: 150,
  responseBody: { data: [...] }
});
```

### 3. Performance Monitoring

```typescript
// Automatic performance tracking
const result = await defaultApiLogger.withPerformanceLogging(
  'database_query',
  async () => {
    // Your async operation here
    return await fetchDramaList();
  },
  { query: 'popular dramas' }
);
```

## ⚙️ Configuration

### Environment-based Configuration

The logging system automatically adapts to your environment:

```typescript
// src/config/logging.ts
export const loggingConfig = {
  development: {
    logLevel: LogLevel.DEBUG,
    enableFileLogging: true,
    enableConsoleLogging: true,
    logDirectory: './logs/dev',
    maxLogFiles: 5,
    maxFileSize: 10, // MB
    includeStackTrace: true
  },
  
  production: {
    logLevel: LogLevel.INFO,
    enableFileLogging: true,
    enableConsoleLogging: false, // Disable console in production
    logDirectory: './logs/prod',
    maxLogFiles: 30,
    maxFileSize: 100, // MB
    includeStackTrace: false
  }
};
```

### Custom Logger Configuration

```typescript
import { Logger, LogLevel } from '../utils/logger.js';

const customLogger = new Logger({
  logLevel: LogLevel.WARN,
  enableFileLogging: true,
  logDirectory: './logs/custom',
  maxLogFiles: 20,
  maxFileSize: 50,
  includeStackTrace: true
});
```

## 📝 Basic Usage

### Log Levels

```typescript
defaultLogger.debug('Debug information', { variable: 'value' });
defaultLogger.info('General information', { operation: 'completed' });
defaultLogger.warn('Warning message', { threshold: 'exceeded' });
defaultLogger.error('Error occurred', { error: 'details' });
defaultLogger.fatal('Critical failure', { system: 'down' });
```

### Structured Logging

```typescript
defaultLogger.info('User action performed', {
  userId: 12345,
  action: 'drama_search',
  query: 'romantic comedy',
  results: 25,
  filters: ['2023', 'korean'],
  duration: 150, // milliseconds
  timestamp: new Date().toISOString(),
  sessionId: 'sess_abc123',
  ip: '192.168.1.100'
});
```

### Child Loggers

Create loggers with inherited context:

```typescript
// Create child logger with context
const userServiceLogger = defaultLogger.child(
  'UserService',    // source
  'req_12345',      // requestId
  'user_67890'      // userId
);

// All logs will include the context
userServiceLogger.info('Profile updated', { changes: ['email', 'preferences'] });
userServiceLogger.error('Update failed', { error: 'Validation error' });
```

## 🌐 API Logging

### Endpoint-Specific Logging

```typescript
import defaultApiLogger from '../utils/apiLogger.js';

// Create endpoint-specific logger
const dramaEndpoint = defaultApiLogger.forEndpoint('/api/dramas', 'GET');

// Use with automatic error handling
try {
  const result = await dramaEndpoint.withLogging(
    async () => {
      return await fetchDramas({ page: 1, limit: 10 });
    },
    { page: 1, limit: 10 }, // request data
    'user_123'              // user ID
  );
} catch (error) {
  // Error is automatically logged
}
```

### Manual API Logging

```typescript
// Start request logging
const requestId = defaultApiLogger.logRequest({
  requestId: '',
  method: 'POST',
  url: '/api/dramas',
  timestamp: Date.now(),
  headers: { 'Content-Type': 'application/json' },
  body: { title: 'New Drama', genre: 'Romance' },
  userId: '12345'
});

try {
  // Make API call
  const response = await createDrama(data);
  
  // Log successful response
  defaultApiLogger.logResponse({
    requestId,
    method: 'POST',
    url: '/api/dramas',
    timestamp: Date.now(),
    status: 201,
    duration: 250,
    responseBody: response
  });
  
} catch (error) {
  // Log error
  defaultApiLogger.logError(requestId, error);
}
```

### Authentication & Security Logging

```typescript
// Authentication events
defaultApiLogger.logAuth('login', {
  method: 'email',
  success: true,
  loginTime: new Date().toISOString()
}, 'user_123');

// Security events
defaultApiLogger.logSecurity('rate_limit_exceeded', 'medium', {
  endpoint: '/api/search',
  requests: 105,
  limit: 100,
  timeWindow: '1 minute'
}, 'user_123');
```

## ⚡ Performance Monitoring

### Automatic Performance Tracking

```typescript
// Track any async operation
const result = await defaultApiLogger.withPerformanceLogging(
  'user_authentication',
  async () => {
    return await authenticateUser(credentials);
  },
  { method: 'email', userId: '123' }
);
```

### Manual Performance Logging

```typescript
const startTime = Date.now();

// Your operation here
await processLargeDataset();

const duration = Date.now() - startTime;
defaultLogger.performance('data_processing', duration, {
  recordCount: 10000,
  algorithm: 'optimized_sort'
});
```

### Component Performance (React)

```typescript
// In your React component
useEffect(() => {
  const startTime = Date.now();
  
  // Component logic
  
  return () => {
    const renderTime = Date.now() - startTime;
    defaultLogger.performance('component_mount', renderTime, {
      component: 'DramaList',
      itemCount: dramas.length
    });
  };
}, []);
```

## 🚨 Error Handling

### Comprehensive Error Logging

```typescript
try {
  await riskyOperation();
} catch (error: any) {
  defaultLogger.error('Operation failed', {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    },
    operation: 'data_sync',
    retryAttempt: 2,
    maxRetries: 3,
    context: {
      userId: '123',
      dataSource: 'external_api',
      timestamp: new Date().toISOString()
    }
  });
}
```

### API Error Handling

```typescript
// In your API client code
const client = axios.create({
  baseURL: 'https://api.dramabox.com'
});

client.interceptors.response.use(
  response => {
    // Log successful responses
    defaultApiLogger.logResponse({
      requestId: response.config.metadata?.requestId,
      method: response.config.method?.toUpperCase() || 'GET',
      url: response.config.url || '',
      status: response.status,
      duration: Date.now() - response.config.metadata?.startTime,
      responseBody: response.data
    });
    return response;
  },
  error => {
    // Log errors
    defaultApiLogger.logError(
      error.config?.metadata?.requestId || 'unknown',
      error,
      {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status
      }
    );
    return Promise.reject(error);
  }
);
```

## 📊 Best Practices

### 1. Use Appropriate Log Levels

```typescript
// ✅ Good - Use appropriate levels
defaultLogger.debug('Cache hit', { key: 'user_123_profile' });
defaultLogger.info('User registered', { userId: '123', email: 'user@example.com' });
defaultLogger.warn('Slow query detected', { query: 'SELECT * FROM users', duration: 3500 });
defaultLogger.error('Payment failed', { orderId: '456', error: 'Card declined' });
defaultLogger.fatal('Database connection lost', { attempts: 5, lastError: 'Timeout' });

// ❌ Bad - Wrong log levels
defaultLogger.error('User clicked button'); // Should be debug or info
defaultLogger.info('System crashed');       // Should be fatal
```

### 2. Include Sufficient Context

```typescript
// ✅ Good - Rich context
defaultLogger.info('Video streaming started', {
  userId: '123',
  dramaId: 'drama_456',
  episode: 5,
  quality: '1080p',
  device: 'mobile',
  location: 'US',
  timestamp: new Date().toISOString(),
  sessionId: 'sess_789'
});

// ❌ Bad - Insufficient context
defaultLogger.info('Video started');
```

### 3. Use Correlation IDs

```typescript
// Generate correlation ID at request start
const correlationId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Use throughout request lifecycle
const logger = defaultLogger.child('API', correlationId);

logger.info('Request started', { endpoint: '/api/dramas' });
logger.debug('Validating request');
logger.info('Database query executed');
logger.info('Response sent', { status: 200 });
```

### 4. Sanitize Sensitive Data

```typescript
// The system automatically redacts common sensitive fields
defaultLogger.info('Login attempt', {
  email: 'user@example.com',
  password: 'secret123',        // ❌ Will be automatically redacted
  token: 'bearer_token_here',   // ❌ Will be automatically redacted
  userId: '123'                 // ✅ Safe to log
});

// Custom sanitization for business-specific sensitive data
const sanitizedData = {
  ...requestData,
  creditCard: requestData.creditCard ? '[REDACTED]' : undefined,
  ssn: requestData.ssn ? '[REDACTED]' : undefined
};

defaultLogger.info('Payment processed', sanitizedData);
```

## 📁 Log File Management

### Automatic Rotation

Log files are automatically rotated based on size:

```
logs/
├── dev/
│   ├── dramabox-2023-12-15.log          # Current log file
│   ├── dramabox-2023-12-15-14-30-45.log # Rotated file
│   └── dramabox-2023-12-14.log          # Previous day
└── prod/
    ├── dramabox-2023-12-15.log
    └── archived/
        ├── dramabox-2023-12-14.log
        └── dramabox-2023-12-13.log
```

### Log Format

```
[2023-12-15 14:30:45.123] [INFO] [UserService] [Request: req_123] [Session: sess_456] User login successful
Data: {
  "userId": "12345",
  "email": "user@example.com",
  "loginMethod": "email",
  "timestamp": "2023-12-15T14:30:45.123Z",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

### Cleanup Configuration

```typescript
// Logs are automatically cleaned up based on configuration
const config = {
  maxLogFiles: 30,        // Keep last 30 files
  maxFileSize: 100,       // Rotate at 100MB
  cleanupInterval: 60000  // Check every minute
};
```

## 📚 Examples

### Complete API Integration Example

```typescript
// src/api/dramaService.ts
import defaultLogger from '../utils/logger.js';
import defaultApiLogger from '../utils/apiLogger.js';

export class DramaService {
  private logger = defaultLogger.child('DramaService');
  private apiLogger = defaultApiLogger.forEndpoint('/api/dramas');

  async searchDramas(query: string, userId?: string): Promise<Drama[]> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Starting drama search', { query, userId });
      
      const result = await this.apiLogger.withLogging(
        async () => {
          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
          }
          return response.json();
        },
        { query, filters: [] },
        userId
      );
      
      this.logger.info('Drama search completed', {
        query,
        resultCount: result.data?.length || 0,
        duration: Date.now() - startTime
      });
      
      return result.data;
      
    } catch (error: any) {
      this.logger.error('Drama search failed', {
        query,
        userId,
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }
}
```

### React Component Integration

```typescript
// src/components/DramaList.tsx
import React, { useEffect, useState } from 'react';
import defaultLogger from '../utils/logger.js';

export const DramaList: React.FC = () => {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const logger = defaultLogger.child('DramaList');
  
  useEffect(() => {
    const startTime = Date.now();
    
    logger.info('DramaList component mounting');
    
    const loadDramas = async () => {
      try {
        logger.debug('Fetching drama list');
        const data = await fetchDramas();
        
        setDramas(data);
        
        logger.info('Drama list loaded successfully', {
          count: data.length,
          loadTime: Date.now() - startTime
        });
        
        // Log user interaction
        defaultLogger.userAction('drama_list_viewed', {
          count: data.length,
          loadTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        });
        
      } catch (error: any) {
        logger.error('Failed to load drama list', {
          error: error.message,
          loadTime: Date.now() - startTime
        });
      }
    };
    
    loadDramas();
  }, []);
  
  const handleDramaClick = (drama: Drama) => {
    logger.info('Drama selected', { dramaId: drama.id, title: drama.title });
    
    defaultLogger.userAction('drama_selected', {
      dramaId: drama.id,
      title: drama.title,
      source: 'drama_list',
      timestamp: new Date().toISOString()
    });
  };
  
  return (
    <div>
      {dramas.map(drama => (
        <div key={drama.id} onClick={() => handleDramaClick(drama)}>
          {drama.title}
        </div>
      ))}
    </div>
  );
};
```

## 🔧 Testing Your Logging Setup

Run the comprehensive logging examples:

```bash
# In your project directory
npm run dev

# Then in browser console or Node.js:
import { runAllLoggingExamples } from './src/examples/loggingExamples.js';
await runAllLoggingExamples();
```

Check your log files:

```bash
# View current logs
tail -f logs/dev/dramabox-$(date +%Y-%m-%d).log

# Search for specific log entries
grep "ERROR" logs/dev/*.log
grep "UserService" logs/dev/*.log | head -10
```

## 📈 Monitoring Integration

The logging system is designed to integrate with monitoring tools:

```typescript
// Example: Custom metrics exporter
export class MetricsExporter {
  constructor(private logger: Logger) {}
  
  exportMetrics() {
    const stats = defaultApiLogger.getActiveRequestsStats();
    
    this.logger.info('System metrics', {
      activeRequests: stats.total,
      requestsByMethod: stats.byMethod,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }
}

// Export metrics every minute
setInterval(() => {
  new MetricsExporter(defaultLogger).exportMetrics();
}, 60000);
```

## 🛠️ Troubleshooting

### Common Issues

1. **Logs not appearing in files**
   - Check file permissions in logs directory
   - Verify `enableFileLogging: true` in config
   - Check for disk space issues

2. **Performance impact**
   - Adjust `logLevel` to reduce verbosity
   - Increase buffer flush interval
   - Use async logging for high-throughput applications

3. **Log files growing too large**
   - Reduce `maxFileSize` setting
   - Increase cleanup frequency
   - Adjust log retention period

### Debug Mode

Enable debug logging to troubleshoot the logging system itself:

```typescript
// Enable debug logging
defaultLogger.updateConfig({ logLevel: LogLevel.DEBUG });

// View internal logging metrics
console.log(defaultApiLogger.getActiveRequestsStats());
```

---

## 📄 License

This logging system is part of the DramaBox API project and follows the same licensing terms.

## 🤝 Contributing

When adding new logging features:

1. Follow the established patterns for structured logging
2. Add appropriate examples to the examples file
3. Update this documentation
4. Test in both development and production configurations
5. Consider performance implications for high-throughput scenarios

---

**Happy Logging! 📝✨**
