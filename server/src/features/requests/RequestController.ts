/**
 * Controller para requisições
 * Responsabilidade única: HTTP request handling
 */

import { Request, Response } from 'express';
import { ILogger } from '../../core/Logger';
import { IRequestService } from './RequestService';
import { IBroadcaster } from '../../types';
import { WebSocketMessageType } from '@sdk/types';

export class RequestController {
  constructor(
    private service: IRequestService,
    private logger: ILogger,
    private broadcaster: IBroadcaster
  ) {}

  /**
   * POST /api/requests
   * Criar nova requisição
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const request = await this.service.createRequest(req.body);

      // Broadcast para clientes WebSocket
      this.broadcaster.broadcast({
        type: WebSocketMessageType.NEW_REQUEST,
        data: request,
      });

      res.status(201).json(request);
    } catch (error) {
      this.logger.error('Error in create', error);
      res.status(400).json({ error: 'Failed to create request' });
    }
  }

  /**
   * PUT /api/requests/:id
   * Atualizar requisição
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await this.service.updateRequest(id, req.body);

      // Broadcast para clientes
      this.broadcaster.broadcast({
        type: WebSocketMessageType.REQUEST_UPDATED,
        data: updated,
      });

      res.json(updated);
    } catch (error) {
      this.logger.error('Error in update', error);
      res.status(400).json({ error: 'Failed to update request' });
    }
  }

  /**
   * GET /api/requests/:id
   * Obter requisição específica
   */
  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = await this.service.getRequest(id);
      res.json(request);
    } catch (error) {
      this.logger.error('Error in getOne', error);
      res.status(404).json({ error: 'Request not found' });
    }
  }

  /**
   * GET /api/requests
   * Listar todas as requisições
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const requests = await this.service.getAllRequests();
      res.json({ data: requests });
    } catch (error) {
      this.logger.error('Error in getAll', error);
      res.status(500).json({ error: 'Failed to get requests' });
    }
  }

  /**
   * DELETE /api/requests/:id
   * Deletar requisição
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.service.deleteRequest(id);

      // Broadcast para clientes
      this.broadcaster.broadcast({
        type: WebSocketMessageType.REQUEST_UPDATED,
        data: { id, deleted: true },
      });

      res.json({ success: true });
    } catch (error) {
      this.logger.error('Error in delete', error);
      res.status(400).json({ error: 'Failed to delete request' });
    }
  }

  /**
   * GET /api/requests/clear/all
   * Deletar todas as requisições
   */
  async clearAll(req: Request, res: Response): Promise<void> {
    try {
      await this.service.clearAllRequests();

      this.broadcaster.broadcast({
        type: WebSocketMessageType.REQUEST_UPDATED,
        data: { action: 'clearAll' },
      });

      res.json({ success: true });
    } catch (error) {
      this.logger.error('Error in clearAll', error);
      res.status(500).json({ error: 'Failed to clear requests' });
    }
  }
}
