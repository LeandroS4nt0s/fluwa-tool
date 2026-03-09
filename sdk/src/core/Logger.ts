/**
 * Logger centralizado com níveis de severidade
 * Responsabilidade única: logging estruturado
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
}

export interface ILogger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, error?: Error | unknown): void;
  success(message: string): void;
  setLevel(level: LogLevel): void;
}

/**
 * Implementação do logger
 * Permite ativar/desativar diferentes níveis
 */
export class Logger implements ILogger {
  private namespace: string;
  private minLevel: LogLevel;
  private readonly levelOrder = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
    [LogLevel.SUCCESS]: 1,
  };

  constructor(namespace: string = 'Fluwa', minLevel: LogLevel = LogLevel.INFO) {
    this.namespace = namespace;
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

  success(message: string): void {
    if (!this.shouldLog(LogLevel.SUCCESS)) return;
    console.log(`✓ ${this.formatMessage(LogLevel.SUCCESS, message)}`);
  }

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

// Instância singleton do logger padrão
export const defaultLogger = new Logger('Fluwa', LogLevel.INFO);
