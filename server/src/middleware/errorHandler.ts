/**
 * Middleware de tratamento de erros
 * Responsabilidade única: interceptar e formatar erros
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/AppError';
import { ILogger } from '../core/Logger';

export function createErrorHandler(logger: ILogger) {
  return (err: Error | AppError, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Request error', err);

    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        details: err.details,
        timestamp: new Date().toISOString(),
      });
    }

    // Erro genérico
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: err instanceof Error ? err.message : 'Unknown error',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    });
  };
}
