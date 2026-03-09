/**
 * Configuração do Express
 * Responsabilidade única: setup da aplicação
 */

import path from 'path';
import express, { Express } from 'express';
import { corsMiddleware } from './middleware/corsHandler';
import { createErrorHandler } from './middleware/errorHandler';
import { ILogger } from './core/Logger';

/**
 * Criar instância do Express configurada
 */
export function createApp(logger: ILogger): Express {
  const app = express();

  // ============================================
  // MIDDLEWARES GLOBAIS
  // ============================================

  // CORS
  app.use(corsMiddleware);

  // Body parsing
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Request logging
  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });

  // ============================================
  // SERVE STATIC UI
  // ============================================

  // Resolve public path relative to the package location
  const packageDir = path.dirname(require.resolve('@fluwa-tool/server/package.json'));
  const publicPath = path.join(packageDir, 'public');
  app.use(express.static(publicPath));

  // ============================================
  // HEALTH CHECK
  // ============================================

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  // ============================================
  // ERROR HANDLER (deve ser o último middleware)
  // ============================================

  app.use(createErrorHandler(logger));

  return app;
}
