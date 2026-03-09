/**
 * Logger de requisições
 * Responsabilidade única: enviar requisições para o servidor Fluwa
 */

import { ILogger } from '../../core/Logger';
import { RequestMetadata } from '../../types';
import { IHttpClient } from '../communication/HttpClient';

export interface IRequestLogger {
  logStart(request: RequestMetadata): Promise<void>;
  logComplete(request: RequestMetadata): Promise<void>;
}

/**
 * Implementação do logger de requisições
 * Envia dados para servidor via HTTP
 */
export class RequestLogger implements IRequestLogger {
  constructor(private httpClient: IHttpClient, private logger: ILogger) {}

  /**
   * Logar início de uma requisição
   */
  async logStart(request: RequestMetadata): Promise<void> {
    try {
      await this.httpClient.post('/api/requests', request);
      this.logger.debug(`Request iniciado: ${request.method} ${request.url}`);
    } catch (error) {
      this.logger.warn(`Falha ao logar request start`, error);
    }
  }

  /**
   * Logar completamento de uma requisição
   */
  async logComplete(request: RequestMetadata): Promise<void> {
    try {
      await this.httpClient.put(`/api/requests/${request.id}`, request);
      this.logger.debug(`Request completado: ${request.method} ${request.url}`);
    } catch (error) {
      this.logger.warn(`Falha ao logar request complete`, error);
    }
  }
}
