/**
 * 🔧 Fluwa SDK
 * Entry point principal do SDK
 *
 * Uso:
 * import { initFluwaTool } from '@fluwa-tool/sdk';
 * initFluwaTool({ serverUrl: 'http://localhost:5555' });
 */

import { FluwaConfig, WebSocketMessageType } from './types';
import { Logger, LogLevel, defaultLogger } from './core/Logger';
import { ConfigManager, getConfigManager } from './core/Config';
import { HttpClient } from './features/communication/HttpClient';
import { WebSocketClient } from './features/communication/WebSocketClient';
import { FetchInterceptor } from './features/network/FetchInterceptor';
import { RequestLogger } from './features/network/RequestLogger';
import { MockResolver } from './features/network/MockResolver';
import { idGenerator } from './core/IdGenerator';

// ============================================
// ESTADO GLOBAL
// ============================================

let isInitialized = false;
let logger: Logger = defaultLogger;
let config: ConfigManager;
let sessionId: string;
let httpClient: HttpClient;
let wsClient: WebSocketClient;
let fetchInterceptor: FetchInterceptor;
let mockResolver: MockResolver;

// ============================================
// INICIALIZAÇÃO
// ============================================

/**
 * Inicializar Fluwa-Tool
 * Deve ser chamado no início da aplicação
 */
export async function initFluwaTool(
  partialConfig: Partial<FluwaConfig> = {}
): Promise<void> {
  if (isInitialized) {
    logger.warn('Fluwa já foi inicializado');
    return;
  }

  try {
    // 1. Configurar
    config = getConfigManager(partialConfig);
    logger = new Logger(
      'Fluwa',
      config.getConfig().debug ? LogLevel.DEBUG : LogLevel.INFO
    );

    logger.success('Inicializando Fluwa-Tool');
    logger.debug('Configuração', config.getConfig());

    if (!config.isEnabled()) {
      logger.warn('Fluwa desativado via config.enabled=false');
      return;
    }

    // 2. Gerar session ID
    sessionId = idGenerator.generate();
    logger.debug(`Session ID: ${sessionId}`);

    // 3. Criar clientes HTTP e WebSocket
    const { requestTimeout, serverUrl } = config.getConfig();
    httpClient = new HttpClient(serverUrl, logger, requestTimeout || 5000);
    wsClient = new WebSocketClient(serverUrl, logger, config.getAppName());

    // 4. Criar resolvedor de mocks
    mockResolver = new MockResolver(httpClient, logger);

    // 5. Criar logger de requisições
    const requestLogger = new RequestLogger(httpClient, logger);

    // 6. Criar interceptador de fetch
    fetchInterceptor = new FetchInterceptor(
      logger,
      requestLogger,
      mockResolver,
      sessionId,
      config.getAppName()
    );

    // 7. Instalar interceptadores
    fetchInterceptor.install();

    // 8. Conectar WebSocket
    logger.debug('Conectando ao WebSocket...');
    try {
      await wsClient.connect();
      setupWebSocketListeners();
    } catch (error) {
      logger.warn('Falha ao conectar WebSocket, continuando em modo offline', error);
    }

    // 9. Enviar init session
    wsClient.send({
      type: WebSocketMessageType.INIT_SESSION,
      sessionId,
      appName: config.getAppName(),
    });

    isInitialized = true;
    logger.success('Fluwa-Tool inicializado com sucesso!');
  } catch (error) {
    logger.error('Erro ao inicializar Fluwa', error);
    throw error;
  }
}

/**
 * Configurar listeners do WebSocket
 */
function setupWebSocketListeners(): void {
  wsClient.on('message', (message: any) => {
    try {
      if (message?.type === WebSocketMessageType.SCENARIO_CHANGED) {
        mockResolver.setActiveScenario(message.scenario || null);
      }
    } catch (error) {
      logger.warn('Erro ao processar mensagem WebSocket', error);
    }
  });

  wsClient.on('disconnected', () => {
    logger.warn('WebSocket desconectado');
  });

  wsClient.on('error', (error) => {
    logger.error('Erro no WebSocket', error);
  });
}

// ============================================
// CONTROLE
// ============================================

/**
 * Desativar Fluwa
 */
export function disableFluwaTool(): void {
  if (!isInitialized) {
    return;
  }

  fetchInterceptor.uninstall();
  wsClient.disconnect();
  isInitialized = false;

  logger.success('Fluwa-Tool desativado');
}

/**
 * Habilitar Fluwa
 */
export async function enableFluwaTool(): Promise<void> {
  if (isInitialized) {
    return;
  }

  fetchInterceptor.install();

  try {
    await wsClient.connect();
  } catch (error) {
    logger.warn('Falha ao reconectar WebSocket', error);
  }

  isInitialized = true;
  logger.success('Fluwa-Tool habilitado');
}

/**
 * Verificar se Fluwa está ativo
 */
export function isFluwaTooIialized(): boolean {
  return isInitialized;
}

// ============================================
// EXPORTS
// ============================================

export * from './types';
export { Logger, LogLevel } from './core/Logger';
export { ConfigManager } from './core/Config';
