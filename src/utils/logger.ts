/**
 * Comprehensive Logging System for DramaBox API
 * Supports both client-side and server-side logging with file output
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  message: string;
  data?: any;
  source?: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
}

export interface LoggerConfig {
  logLevel: LogLevel;
  enableFileLogging: boolean;
  enableConsoleLogging: boolean;
  logDirectory: string;
  maxLogFiles: number;
  maxFileSize: number; // in MB
  dateFormat: string;
  includeStackTrace: boolean;
}

class Logger {
  private config: LoggerConfig;
  private sessionId: string;
  private logBuffer: LogEntry[] = [];
  private flushTimeout?: NodeJS.Timeout;
  private isServer: boolean;

  constructor(config?: Partial<LoggerConfig>) {
    this.isServer = typeof window === 'undefined';
    this.sessionId = this.generateSessionId();
    
    this.config = {
      logLevel: LogLevel.INFO,
      enableFileLogging: true,
      enableConsoleLogging: true,
      logDirectory: './logs',
      maxLogFiles: 10,
      maxFileSize: 50, // MB
      dateFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
      includeStackTrace: false,
      ...config
    };

    // Auto-flush buffer every 5 seconds
    if (this.isServer && this.config.enableFileLogging) {
      this.flushTimeout = setInterval(() => this.flushLogs(), 5000);
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.logLevel;
  }

  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace('T', ' ').replace('Z', '');
  }

  private getLevelName(level: LogLevel): string {
    return LogLevel[level];
  }

  private formatLogMessage(entry: LogEntry): string {
    let message = `[${entry.timestamp}] [${entry.levelName}]`;
    
    if (entry.source) {
      message += ` [${entry.source}]`;
    }
    
    if (entry.requestId) {
      message += ` [Request: ${entry.requestId}]`;
    }
    
    if (entry.sessionId) {
      message += ` [Session: ${entry.sessionId}]`;
    }
    
    message += ` ${entry.message}`;
    
    if (entry.data) {
      message += `\nData: ${JSON.stringify(entry.data, null, 2)}`;
    }
    
    return message;
  }

  private createLogEntry(
    level: LogLevel, 
    message: string, 
    data?: any, 
    source?: string,
    requestId?: string,
    userId?: string
  ): LogEntry {
    return {
      timestamp: this.getTimestamp(),
      level,
      levelName: this.getLevelName(level),
      message,
      data,
      source,
      requestId,
      userId,
      sessionId: this.sessionId
    };
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.isServer) return;

    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Create logs directory if it doesn't exist
      if (!fs.existsSync(this.config.logDirectory)) {
        fs.mkdirSync(this.config.logDirectory, { recursive: true });
      }

      const date = new Date().toISOString().split('T')[0];
      const fileName = `dramabox-${date}.log`;
      const filePath = path.join(this.config.logDirectory, fileName);
      
      const logMessage = this.formatLogMessage(entry) + '\n';
      
      // Check file size and rotate if necessary
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        
        if (fileSizeInMB > this.config.maxFileSize) {
          await this.rotateLogFile(filePath);
        }
      }
      
      fs.appendFileSync(filePath, logMessage, 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private async rotateLogFile(currentFile: string): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    
    try {
      const dir = path.dirname(currentFile);
      const baseName = path.basename(currentFile, '.log');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedFile = path.join(dir, `${baseName}-${timestamp}.log`);
      
      fs.renameSync(currentFile, rotatedFile);
      
      // Clean up old log files
      await this.cleanupOldLogs(dir);
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  private async cleanupOldLogs(directory: string): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    
    try {
      const files = fs.readdirSync(directory)
        .filter(file => file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(directory, file),
          stats: fs.statSync(path.join(directory, file))
        }))
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      // Keep only the latest maxLogFiles
      const filesToDelete = files.slice(this.config.maxLogFiles);
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsoleLogging) return;

    const message = `[${entry.levelName}] ${entry.message}`;
    const args = entry.data ? [message, entry.data] : [message];

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(...args);
        break;
      case LogLevel.INFO:
        console.info(...args);
        break;
      case LogLevel.WARN:
        console.warn(...args);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(...args);
        if (this.config.includeStackTrace) {
          console.trace();
        }
        break;
    }
  }

  private async processLog(
    level: LogLevel, 
    message: string, 
    data?: any, 
    source?: string,
    requestId?: string,
    userId?: string
  ): Promise<void> {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, data, source, requestId, userId);
    
    // Console logging (immediate)
    this.logToConsole(entry);
    
    // File logging (buffered for server-side)
    if (this.isServer && this.config.enableFileLogging) {
      this.logBuffer.push(entry);
      
      // Immediate flush for ERROR and FATAL
      if (level >= LogLevel.ERROR) {
        await this.flushLogs();
      }
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;
    
    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];
    
    for (const entry of logsToFlush) {
      await this.writeToFile(entry);
    }
  }

  // Public logging methods
  debug(message: string, data?: any, source?: string, requestId?: string, userId?: string): void {
    this.processLog(LogLevel.DEBUG, message, data, source, requestId, userId);
  }

  info(message: string, data?: any, source?: string, requestId?: string, userId?: string): void {
    this.processLog(LogLevel.INFO, message, data, source, requestId, userId);
  }

  warn(message: string, data?: any, source?: string, requestId?: string, userId?: string): void {
    this.processLog(LogLevel.WARN, message, data, source, requestId, userId);
  }

  error(message: string, data?: any, source?: string, requestId?: string, userId?: string): void {
    this.processLog(LogLevel.ERROR, message, data, source, requestId, userId);
  }

  fatal(message: string, data?: any, source?: string, requestId?: string, userId?: string): void {
    this.processLog(LogLevel.FATAL, message, data, source, requestId, userId);
  }

  // API-specific logging methods
  apiRequest(method: string, url: string, requestData?: any, requestId?: string): void {
    this.info(`API Request: ${method} ${url}`, {
      method,
      url,
      requestData,
      timestamp: new Date().toISOString()
    }, 'API', requestId);
  }

  apiResponse(method: string, url: string, status: number, responseData?: any, requestId?: string, duration?: number): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.processLog(level, `API Response: ${method} ${url} - ${status}`, {
      method,
      url,
      status,
      responseData: responseData ? (typeof responseData === 'object' ? JSON.stringify(responseData).substring(0, 1000) : responseData) : undefined,
      duration: duration ? `${duration}ms` : undefined,
      timestamp: new Date().toISOString()
    }, 'API', requestId);
  }

  apiError(method: string, url: string, error: any, requestId?: string): void {
    this.error(`API Error: ${method} ${url}`, {
      method,
      url,
      error: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, 'API', requestId);
  }

  // User interaction logging
  userAction(action: string, details?: any, userId?: string, sessionId?: string): void {
    this.info(`User Action: ${action}`, {
      action,
      details,
      timestamp: new Date().toISOString()
    }, 'USER', undefined, userId);
  }

  // Performance logging
  performance(operation: string, duration: number, details?: any): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.INFO;
    this.processLog(level, `Performance: ${operation} took ${duration}ms`, {
      operation,
      duration,
      details,
      timestamp: new Date().toISOString()
    }, 'PERFORMANCE');
  }

  // Database/Storage logging
  storage(operation: string, success: boolean, details?: any): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    this.processLog(level, `Storage ${operation}: ${success ? 'SUCCESS' : 'FAILED'}`, {
      operation,
      success,
      details,
      timestamp: new Date().toISOString()
    }, 'STORAGE');
  }

  // Create a child logger with preset context
  child(source: string, requestId?: string, userId?: string): ChildLogger {
    return new ChildLogger(this, source, requestId, userId);
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    if (this.flushTimeout) {
      clearInterval(this.flushTimeout);
    }
    await this.flushLogs();
  }

  // Get current configuration
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // Update configuration
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Child logger class for context-specific logging
class ChildLogger {
  constructor(
    private parent: Logger,
    private source: string,
    private requestId?: string,
    private userId?: string
  ) {}

  debug(message: string, data?: any): void {
    this.parent.debug(message, data, this.source, this.requestId, this.userId);
  }

  info(message: string, data?: any): void {
    this.parent.info(message, data, this.source, this.requestId, this.userId);
  }

  warn(message: string, data?: any): void {
    this.parent.warn(message, data, this.source, this.requestId, this.userId);
  }

  error(message: string, data?: any): void {
    this.parent.error(message, data, this.source, this.requestId, this.userId);
  }

  fatal(message: string, data?: any): void {
    this.parent.fatal(message, data, this.source, this.requestId, this.userId);
  }

  apiRequest(method: string, url: string, requestData?: any): void {
    this.parent.apiRequest(method, url, requestData, this.requestId);
  }

  apiResponse(method: string, url: string, status: number, responseData?: any, duration?: number): void {
    this.parent.apiResponse(method, url, status, responseData, this.requestId, duration);
  }

  apiError(method: string, url: string, error: any): void {
    this.parent.apiError(method, url, error, this.requestId);
  }
}

// Create and export a default logger instance
const defaultLogger = new Logger({
  logLevel: LogLevel.INFO,
  enableFileLogging: true,
  enableConsoleLogging: true,
  logDirectory: './logs',
  maxLogFiles: 10,
  maxFileSize: 50,
  includeStackTrace: true
});

export default defaultLogger;
export { Logger, ChildLogger };
