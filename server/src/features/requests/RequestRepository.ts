/**
 * Repository para requisições
 * Responsabilidade única: persistência de dados de requisições
 */

import { RequestMetadata } from '../../types';
import { ILogger } from '../../core/Logger';

export interface IRequestRepository {
  save(request: RequestMetadata): Promise<void>;
  findById(id: string): Promise<RequestMetadata | null>;
  findAll(): Promise<RequestMetadata[]>;
  update(id: string, request: Partial<RequestMetadata>): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Implementação em memória (pode ser substituída por DB depois)
 * Padrão: Repository
 */
export class RequestRepository implements IRequestRepository {
  private requests: Map<string, RequestMetadata> = new Map();

  constructor(private logger: ILogger) {}

  async save(request: RequestMetadata): Promise<void> {
    this.requests.set(request.id, request);
    this.logger.debug(`Request saved: ${request.id}`);
  }

  async findById(id: string): Promise<RequestMetadata | null> {
    return this.requests.get(id) || null;
  }

  async findAll(): Promise<RequestMetadata[]> {
    return Array.from(this.requests.values());
  }

  async update(id: string, request: Partial<RequestMetadata>): Promise<void> {
    const existing = this.requests.get(id);
    if (!existing) {
      throw new Error(`Request not found: ${id}`);
    }

    this.requests.set(id, { ...existing, ...request });
    this.logger.debug(`Request updated: ${id}`);
  }

  async delete(id: string): Promise<void> {
    this.requests.delete(id);
    this.logger.debug(`Request deleted: ${id}`);
  }

  async clear(): Promise<void> {
    this.requests.clear();
    this.logger.debug('All requests cleared');
  }

  /**
   * Obter estatísticas (útil para debug)
   */
  getStats() {
    return {
      total: this.requests.size,
      bySource: {
        mock: Array.from(this.requests.values()).filter((r) => r.source === 'mock').length,
        real: Array.from(this.requests.values()).filter((r) => r.source === 'real').length,
        error: Array.from(this.requests.values()).filter((r) => r.source === 'error').length,
      },
    };
  }
}
