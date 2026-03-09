/**
 * Service para requisições
 * Responsabilidade única: lógica de negócio relacionada a requisições
 */

import { RequestMetadata } from '../../types';
import { ILogger } from '../../core/Logger';
import { IRequestRepository } from './RequestRepository';
import { AppError, ErrorFactory } from '../../core/AppError';

export interface IRequestService {
  createRequest(request: RequestMetadata): Promise<RequestMetadata>;
  updateRequest(id: string, request: Partial<RequestMetadata>): Promise<RequestMetadata>;
  getRequest(id: string): Promise<RequestMetadata>;
  getAllRequests(): Promise<RequestMetadata[]>;
  deleteRequest(id: string): Promise<void>;
  clearAllRequests(): Promise<void>;
}

/**
 * Implementação do serviço
 * Usa repository para persistência
 */
export class RequestService implements IRequestService {
  constructor(
    private repository: IRequestRepository,
    private logger: ILogger
  ) {}

  async createRequest(request: RequestMetadata): Promise<RequestMetadata> {
    try {
      this.validateRequest(request);
      await this.repository.save(request);
      this.logger.debug(`Request created: ${request.id} ${request.method} ${request.url}`);
      return request;
    } catch (error) {
      this.logger.error('Error creating request', error);
      throw ErrorFactory.internalError('Failed to create request');
    }
  }

  async updateRequest(
    id: string,
    request: Partial<RequestMetadata>
  ): Promise<RequestMetadata> {
    try {
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw ErrorFactory.notFound('Request');
      }

      await this.repository.update(id, request);
      const updated = await this.repository.findById(id);

      this.logger.debug(`Request updated: ${id}`);
      return updated!;
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error('Error updating request', error);
      throw ErrorFactory.internalError('Failed to update request');
    }
  }

  async getRequest(id: string): Promise<RequestMetadata> {
    try {
      const request = await this.repository.findById(id);
      if (!request) {
        throw ErrorFactory.notFound('Request');
      }
      return request;
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error('Error getting request', error);
      throw ErrorFactory.internalError('Failed to get request');
    }
  }

  async getAllRequests(): Promise<RequestMetadata[]> {
    try {
      return await this.repository.findAll();
    } catch (error) {
      this.logger.error('Error getting all requests', error);
      throw ErrorFactory.internalError('Failed to get requests');
    }
  }

  async deleteRequest(id: string): Promise<void> {
    try {
      const request = await this.repository.findById(id);
      if (!request) {
        throw ErrorFactory.notFound('Request');
      }
      await this.repository.delete(id);
      this.logger.debug(`Request deleted: ${id}`);
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error('Error deleting request', error);
      throw ErrorFactory.internalError('Failed to delete request');
    }
  }

  async clearAllRequests(): Promise<void> {
    try {
      await this.repository.clear();
      this.logger.info('All requests cleared');
    } catch (error) {
      this.logger.error('Error clearing requests', error);
      throw ErrorFactory.internalError('Failed to clear requests');
    }
  }

  /**
   * Validar dados da requisição
   */
  private validateRequest(request: RequestMetadata): void {
    if (!request.id) {
      throw ErrorFactory.invalidInput('Request ID is required');
    }

    if (!request.url) {
      throw ErrorFactory.invalidInput('Request URL is required');
    }

    if (!request.method) {
      throw ErrorFactory.invalidInput('Request method is required');
    }
  }
}
