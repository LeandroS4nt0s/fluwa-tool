/**
 * 🔧 Fluwa Server
 * Entry point principal do servidor
 *
 * Roda em http://localhost:5555
 */

import http from 'http';
import { WebSocketServer } from 'ws';
import { createApp } from './app';
import { logger, LogLevel } from './core/Logger';
import { Container } from './core/Container';

// Features
import { RequestRepository } from './features/requests/RequestRepository';
import { RequestService } from './features/requests/RequestService';
import { RequestController } from './features/requests/RequestController';
import { ScenarioRepository } from './features/scenarios/ScenarioRepository';
import { ScenarioService } from './features/scenarios/ScenarioService';
import { ScenarioController } from './features/scenarios/ScenarioController';
import { WebSocketManager } from './features/websocket/WebSocketManager';

const PORT = 5555;

async function bootstrap() {
  try {
    // ============================================
    // 1. SETUP
    // ============================================

    logger.setLevel(LogLevel.INFO);
    logger.info('Iniciando Fluwa Server...');

    // ============================================
    // 2. CRIAR EXPRESS APP
    // ============================================

    const app = createApp(logger);

    // ============================================
    // 3. DEPENDENCY INJECTION
    // ============================================

    const container = new Container(logger);

    // Registrar repositories
    const requestRepository = new RequestRepository(logger);
    container.set('requestRepository', requestRepository);

    const scenarioRepository = new ScenarioRepository(logger);
    container.set('scenarioRepository', scenarioRepository);

    // Registrar services
    const requestService = new RequestService(requestRepository, logger);
    container.set('requestService', requestService);

    const scenarioService = new ScenarioService(scenarioRepository, logger);
    container.set('scenarioService', scenarioService);

    // Registrar WebSocket manager
    const broadcaster = new WebSocketManager(logger);
    container.set('broadcaster', broadcaster);

    // Registrar controllers
    const requestController = new RequestController(requestService, logger, broadcaster);
    container.set('requestController', requestController);

    const scenarioController = new ScenarioController(scenarioService, logger, broadcaster);
    container.set('scenarioController', scenarioController);

    // ============================================
    // 4. ROTAS
    // ============================================

    // Requests routes
    app.post('/api/requests', (req, res, next) =>
      requestController.create(req, res).catch(next)
    );
    app.get('/api/requests', (req, res, next) =>
      requestController.getAll(req, res).catch(next)
    );
    app.get('/api/requests/:id', (req, res, next) =>
      requestController.getOne(req, res).catch(next)
    );
    app.put('/api/requests/:id', (req, res, next) =>
      requestController.update(req, res).catch(next)
    );
    app.delete('/api/requests/:id', (req, res, next) =>
      requestController.delete(req, res).catch(next)
    );
    app.delete('/api/requests', (req, res, next) =>
      requestController.clearAll(req, res).catch(next)
    );

    // Status route
    app.get('/api/status', (req, res) => {
      const stats = broadcaster.getStats();
      res.json({ data: stats });
    });

    // Scenarios routes (specific routes BEFORE parameterized routes)
    app.post('/api/scenarios', (req, res, next) =>
      scenarioController.create(req, res).catch(next)
    );
    app.get('/api/scenarios', (req, res, next) =>
      scenarioController.getAll(req, res).catch(next)
    );
    app.get('/api/scenarios/active', (req, res, next) =>
      scenarioController.getActive(req, res).catch(next)
    );
    app.post('/api/scenarios/deactivate', (req, res, next) =>
      scenarioController.deactivate(req, res).catch(next)
    );
    app.get('/api/scenarios/:id', (req, res, next) =>
      scenarioController.getOne(req, res).catch(next)
    );
    app.put('/api/scenarios/:id', (req, res, next) =>
      scenarioController.update(req, res).catch(next)
    );
    app.delete('/api/scenarios/:id', (req, res, next) =>
      scenarioController.delete(req, res).catch(next)
    );
    app.post('/api/scenarios/:id/activate', (req, res, next) =>
      scenarioController.activate(req, res).catch(next)
    );
    app.post('/api/scenarios/import', (req, res, next) =>
      scenarioController.import(req, res).catch(next)
    );
    app.get('/api/scenarios/:id/export', (req, res, next) =>
      scenarioController.export(req, res).catch(next)
    );

    // ============================================
    // SPA FALLBACK - Serve UI for non-API routes
    // ============================================

    app.get('*', (_req, res) => {
      const path = require('path');
      const publicPath = path.resolve(process.cwd(), 'public');
      const indexPath = path.join(publicPath, 'index.html');
      res.sendFile(indexPath);
    });

    // ============================================
    // 5. CRIAR SERVIDOR HTTP COM WEBSOCKET
    // ============================================

    const server = http.createServer(app);

    const wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', (ws, req) => {
      // Extrair appName do query string (ex: ws://localhost:5555/ws?appName=myapp)
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const appName = url.searchParams.get('appName') || 'Unknown App';

      logger.info(`Nova conexão WebSocket: ${appName}`);
      broadcaster.connect(ws, appName);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          logger.debug('WebSocket message received', message);
        } catch (error) {
          logger.warn('Erro ao parsear mensagem WebSocket', error);
        }
      });

      ws.on('close', () => {
        logger.info('Conexão WebSocket fechada');
        broadcaster.disconnect(ws);
      });

      ws.on('error', (error) => {
        logger.error('Erro WebSocket', error);
      });
    });

    // ============================================
    // 6. INICIAR SERVIDOR
    // ============================================

    server.listen(PORT, () => {
      logger.success(`Fluwa Server rodando em http://localhost:${PORT}`);
      logger.success(`WebSocket disponível em ws://localhost:${PORT}/ws`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info('');
      logger.info('Endpoints disponíveis:');
      logger.info('  POST   /api/requests');
      logger.info('  GET    /api/requests');
      logger.info('  GET    /api/requests/:id');
      logger.info('  PUT    /api/requests/:id');
      logger.info('  DELETE /api/requests/:id');
      logger.info('');
      logger.info('  POST   /api/scenarios');
      logger.info('  GET    /api/scenarios');
      logger.info('  GET    /api/scenarios/active');
      logger.info('  GET    /api/scenarios/:id');
      logger.info('  PUT    /api/scenarios/:id');
      logger.info('  DELETE /api/scenarios/:id');
      logger.info('  POST   /api/scenarios/:id/activate');
      logger.info('  POST   /api/scenarios/deactivate');
      logger.info('');
    });

    // ============================================
    // 7. GRACEFUL SHUTDOWN
    // ============================================

    process.on('SIGTERM', () => {
      logger.warn('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.success('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.warn('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.success('Server closed');
        process.exit(0);
      });

      // Force exit after 3 seconds if server doesn't close
      setTimeout(() => {
        logger.warn('Force closing server');
        process.exit(0);
      }, 3000);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at', reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to bootstrap server', error);
    process.exit(1);
  }
}

// Iniciar
bootstrap();
