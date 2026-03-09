/**
 * Logger centralizado do servidor
 * Responsabilidade única: logging estruturado com níveis
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface ILogger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, error?: Error | unknown): void;
  success(message: string, data?: unknown): void;
  setLevel(level: LogLevel): void;
}

export class Logger implements ILogger {
  private minLevel: LogLevel;
  private readonly levelOrder = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
  };

  constructor(
    private namespace: string = 'FluwaServer',
    minLevel: LogLevel = LogLevel.INFO
  ) {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelOrder[level] >= this.levelOrder[this.minLevel];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${this.namespace}:${level}] ${message}`;
  }

  debug(message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.log(this.formatMessage(LogLevel.DEBUG, message), data || '');
  }

  info(message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.log(this.formatMessage(LogLevel.INFO, message), data || '');
  }

  warn(message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    console.warn(this.formatMessage(LogLevel.WARN, message), data || '');
  }

  error(message: string, error?: Error | unknown): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    console.error(this.formatMessage(LogLevel.ERROR, message));
    if (error instanceof Error) {
      console.error(`Stack: ${error.stack}`);
    } else if (error) {
      console.error('Details:', error);
    }
  }

  success(message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.log(this.formatMessage(LogLevel.INFO, message), data || '');
  }

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

export const logger = new Logger('FluwaServer', LogLevel.INFO);
