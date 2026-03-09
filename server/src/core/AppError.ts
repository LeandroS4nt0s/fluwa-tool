/**
 * Classe de erro customizado para a aplicação
 * Permite tipar erros com código e status HTTP
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Factory para criar erros tipados
 * Implementa pattern: Factory
 */
export class ErrorFactory {
  static notFound(resource: string): AppError {
    return new AppError('NOT_FOUND', `${resource} not found`, 404);
  }

  static invalidInput(message: string, details?: unknown): AppError {
    return new AppError('INVALID_INPUT', message, 400, details);
  }

  static internalError(message: string, details?: unknown): AppError {
    return new AppError('INTERNAL_ERROR', message, 500, details);
  }

  static conflict(message: string, details?: unknown): AppError {
    return new AppError('CONFLICT', message, 409, details);
  }

  static unauthorized(message: string = 'Unauthorized'): AppError {
    return new AppError('UNAUTHORIZED', message, 401);
  }

  static forbidden(message: string = 'Forbidden'): AppError {
    return new AppError('FORBIDDEN', message, 403);
  }
}
