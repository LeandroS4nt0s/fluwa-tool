/**
 * Cliente HTTP para comunicação com Fluwa Server
 * Responsabilidade única: fazer requisições HTTP
 */

import { ILogger } from '../../core/Logger';
import { FluwaConfig, RequestMetadata } from '../../types';

export interface IHttpClient {
  post<T>(endpoint: string, data: unknown): Promise<T>;
  get<T>(endpoint: string, params?: Record<string, string>): Promise<T>;
  put<T>(endpoint: string, data: unknown): Promise<T>;
}

/**
 * Implementação do cliente HTTP
 * Usa fetch nativo do navegador/Node.js
 */
export class HttpClient implements IHttpClient {
  constructor(
    private baseUrl: string,
    private logger: ILogger,
    private timeout: number = 5000
  ) {}

  /**
   * Fazer POST request
   * Implementa timeout automático
   */
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>('POST', endpoint, { body: JSON.stringify(data) });
  }

  /**
   * Fazer GET request com query parameters
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    return this.request<T>('GET', url);
  }

  /**
   * Fazer PUT request
   */
  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>('PUT', endpoint, { body: JSON.stringify(data) });
  }

  /**
   * Request genérica com timeout
   */
  private async request<T>(
    method: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Fluwa-Internal': 'true', // Marcar como requisição interna do Fluwa
          ...options.headers,
        },
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      if (isTimeout) {
        this.logger.warn(`Request timeout: ${endpoint}`);
      } else {
        this.logger.error(`HTTP request failed: ${endpoint}`, error);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Construir URL com query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    if (!params || Object.keys(params).length === 0) {
      return endpoint;
    }

    const queryString = new URLSearchParams(params).toString();
    return `${endpoint}?${queryString}`;
  }
}
