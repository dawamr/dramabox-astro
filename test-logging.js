#!/usr/bin/env node

/**
 * Simple test script to demonstrate the logging system
 * Run this with: node test-logging.js
 */

import { runAllLoggingExamples } from './src/examples/loggingExamples.js';
import defaultLogger from './src/utils/logger.js';
import defaultApiLogger from './src/utils/apiLogger.js';

console.log('🎭 DramaBox API Logging System Test\n');

async function main() {
  try {
    // Test basic logging
    console.log('📝 Testing basic logging...');
    defaultLogger.info('Logging system test started', {
      testRunner: 'test-logging.js',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });

    // Test API logging
    console.log('🌐 Testing API logging...');
    const requestId = defaultApiLogger.logRequest({
      requestId: '',
      method: 'GET',
      url: '/api/test',
      timestamp: Date.now(),
      headers: { 'Content-Type': 'application/json' }
    });

    // Simulate API processing
    await new Promise(resolve => setTimeout(resolve, 100));

    defaultApiLogger.logResponse({
      requestId,
      method: 'GET',
      url: '/api/test',
      timestamp: Date.now(),
      status: 200,
      duration: 100,
      responseBody: { message: 'Test successful' }
    });

    // Test performance logging
    console.log('⚡ Testing performance logging...');
    await defaultApiLogger.withPerformanceLogging(
      'test_operation',
      async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return { success: true };
      },
      { testData: 'sample' }
    );

    // Test error logging
    console.log('🚨 Testing error logging...');
    try {
      throw new Error('This is a test error');
    } catch (error) {
      defaultLogger.error('Test error logged successfully', {
        error: error.message,
        stack: error.stack,
        testPurpose: 'error_logging_validation'
      });
    }

    // Test child logger
    console.log('👶 Testing child logger...');
    const childLogger = defaultLogger.child('TestModule', 'test_req_123', 'test_user_456');
    childLogger.info('Child logger test', { message: 'This should include context' });

    // Log system statistics
    const stats = defaultApiLogger.getActiveRequestsStats();
    defaultLogger.info('Logging system statistics', {
      activeRequests: stats.total,
      requestsByMethod: stats.byMethod
    });

    // Run comprehensive examples
    console.log('\n🎯 Running comprehensive logging examples...\n');
    await runAllLoggingExamples();

    console.log('\n✅ All logging tests completed successfully!');
    
    defaultLogger.info('Logging system test completed', {
      testRunner: 'test-logging.js',
      success: true,
      timestamp: new Date().toISOString()
    });

    // Give time for async log writes to complete
    console.log('\n⏳ Waiting for log files to flush...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n📄 Check your log files in the ./logs directory!');
    console.log('   Example: tail -f logs/dev/dramabox-*.log');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    defaultLogger.fatal('Logging system test failed', {
      error: error.message,
      stack: error.stack,
      testRunner: 'test-logging.js'
    });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await defaultLogger.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await defaultLogger.shutdown();
  process.exit(0);
});

// Run the test
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
