/**
 * Interceptador de fetch nativo do navegador
 * Responsabilidade única: interceptar e logar requisições fetch
 */

import { ILogger } from '../../core/Logger';
import { RequestMetadata, RequestSource, HttpMethod } from '../../types';
import { IRequestLogger } from './RequestLogger';
import { IMockResolver } from './MockResolver';

export interface IFetchInterceptor {
  install(): void;
  uninstall(): void;
}

/**
 * Implementação de interceptador de fetch
 * Preserva fetch original e sobrescreve com versão interceptada
 */
export class FetchInterceptor implements IFetchInterceptor {
  private originalFetch: typeof fetch | null = null;
  private isInstalled = false;

  constructor(
    private logger: ILogger,
    private requestLogger: IRequestLogger,
    private mockResolver: IMockResolver,
    private sessionId: string,
    private appName: string
  ) {}

  /**
   * Instalar o interceptador
   * Substitui fetch global
   */
  install(): void {
    if (this.isInstalled) {
      this.logger.warn('Fetch interceptor já foi instalado');
      return;
    }

    // Detectar ambiente (navegador ou Node.js)
    const isBrowser = typeof window !== 'undefined';
    const globalObj = isBrowser ? (window as any) : (globalThis as any);

    if (typeof globalObj.fetch === 'undefined') {
      this.logger.warn('Fetch não disponível nesse ambiente');
      return;
    }

    this.originalFetch = globalObj.fetch;

    // Sobrescrever fetch global
    globalObj.fetch = this.createInterceptedFetch();

    this.isInstalled = true;
    this.logger.success('Fetch interceptor instalado');
  }

  /**
   * Desinstalar o interceptador
   * Restaura fetch original
   */
  uninstall(): void {
    if (!this.isInstalled || !this.originalFetch) {
      return;
    }

    const isBrowser = typeof window !== 'undefined';
    const globalObj = isBrowser ? (window as any) : (globalThis as any);

    globalObj.fetch = this.originalFetch;
    this.originalFetch = null;
    this.isInstalled = false;
    this.logger.success('Fetch interceptor desinstalado');
  }

  /**
   * Criar versão interceptada de fetch
   */
  private createInterceptedFetch() {
    return async (...args: Parameters<typeof fetch>) => {
      const startTime = performance.now();
      const [resource, init] = args;

      // Ignorar requisições internas do Fluwa (header X-Fluwa-Internal)
      if (init?.headers && typeof init.headers === 'object') {
        const headers = init.headers as any;
        if (headers['X-Fluwa-Internal'] === 'true') {
          // Usar fetch original para requisições internas
          return this.originalFetch!.apply(globalThis, args);
        }
      }

      // Extrair informações da requisição
      const method = ((init?.method || 'GET').toUpperCase() as HttpMethod);
      const url = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : resource.toString());

      const requestId = this.generateId();
      const requestMetadata: RequestMetadata = {
        id: requestId,
        method,
        url,
        headers: (init?.headers as Record<string, string>) || {},
        body: init?.body ? this.safeParseBody(init.body) : undefined,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        appName: this.appName,
        source: RequestSource.REAL, // Default, pode mudar se usar mock
      };

      try {
        // Registrar que começou
        await this.requestLogger.logStart(requestMetadata);

        // Verificar se há mock disponível
        const mockResponse = await this.mockResolver.resolve(method, url);

        if (mockResponse) {
          // Usar mock
          requestMetadata.source = RequestSource.MOCK;
          requestMetadata.response = mockResponse.response;
          requestMetadata.status = mockResponse.status;

          // Aplicar delay se configurado
          if (mockResponse.delay) {
            await this.delay(mockResponse.delay);
          }

          const duration = performance.now() - startTime;
          requestMetadata.duration = duration;

          // Registrar completamento
          await this.requestLogger.logComplete(requestMetadata);

          // Retornar mock como Response
          return new Response(JSON.stringify(mockResponse.response), {
            status: mockResponse.status || 200,
            statusText: 'Mock',
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Fazer request real
        const response = await this.originalFetch!.apply(globalThis, args);
        const responseClone = response.clone();

        requestMetadata.source = RequestSource.REAL;
        requestMetadata.status = response.status;

        // Tentar extrair body da resposta
        try {
          const responseBody = await responseClone.json();
          requestMetadata.response = responseBody;
        } catch {
          // Se não conseguir parsear JSON, deixa vazio
        }

        const duration = performance.now() - startTime;
        requestMetadata.duration = duration;

        // Registrar completamento
        await this.requestLogger.logComplete(requestMetadata);

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        requestMetadata.source = RequestSource.ERROR;
        requestMetadata.duration = duration;
        requestMetadata.error = error instanceof Error ? error.message : String(error);

        // Registrar erro
        await this.requestLogger.logComplete(requestMetadata);

        throw error;
      }
    };
  }

  /**
   * Parse seguro do body (string ou object)
   */
  private safeParseBody(body: unknown): unknown {
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return body;
      }
    }
    return body;
  }

  /**
   * Gerar ID único para requisição
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep (para delays de mock)
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
