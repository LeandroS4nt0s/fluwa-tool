/**
 * Controller para cenários
 * Responsabilidade única: HTTP request handling
 */

import { Request, Response } from 'express';
import { ILogger } from '../../core/Logger';
import { IScenarioService } from './ScenarioService';
import { IBroadcaster } from '../../types';
import { WebSocketMessageType } from '../../types/shared';

export class ScenarioController {
  constructor(
    private service: IScenarioService,
    private logger: ILogger,
    private broadcaster: IBroadcaster
  ) {}

  /**
   * POST /api/scenarios
   * Criar novo cenário
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, routes } = req.body;
      const scenario = await this.service.createScenario(name, description, routes);

      // Broadcast para clientes WebSocket
      this.broadcaster.broadcast({
        type: WebSocketMessageType.SCENARIO_CHANGED,
        data: scenario,
      });

      res.status(201).json(scenario);
    } catch (error) {
      this.logger.error('Error in create', error);
      res.status(400).json({ error: 'Failed to create scenario' });
    }
  }

  /**
   * PUT /api/scenarios/:id
   * Atualizar cenário
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await this.service.updateScenario(id, req.body);

      // Broadcast para clientes
      this.broadcaster.broadcast({
        type: WebSocketMessageType.SCENARIO_CHANGED,
        data: updated,
      });

      res.json(updated);
    } catch (error) {
      this.logger.error('Error in update', error);
      res.status(400).json({ error: 'Failed to update scenario' });
    }
  }

  /**
   * GET /api/scenarios/:id
   * Obter cenário específico
   */
  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const scenario = await this.service.getScenario(id);
      res.json(scenario);
    } catch (error) {
      this.logger.error('Error in getOne', error);
      res.status(404).json({ error: 'Scenario not found' });
    }
  }

  /**
   * GET /api/scenarios
   * Listar todos os cenários
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const scenarios = await this.service.getAllScenarios();
      res.json({ data: scenarios });
    } catch (error) {
      this.logger.error('Error in getAll', error);
      res.status(500).json({ error: 'Failed to get scenarios' });
    }
  }

  /**
   * DELETE /api/scenarios/:id
   * Deletar cenário
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.service.deleteScenario(id);

      // Broadcast para clientes
      this.broadcaster.broadcast({
        type: WebSocketMessageType.SCENARIO_CHANGED,
        data: { id, deleted: true },
      });

      res.json({ success: true });
    } catch (error) {
      this.logger.error('Error in delete', error);
      res.status(400).json({ error: 'Failed to delete scenario' });
    }
  }

  /**
   * POST /api/scenarios/:id/activate
   * Ativar cenário
   */
  async activate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const scenario = await this.service.activateScenario(id);

      // Broadcast para clientes
      this.broadcaster.broadcast({
        type: WebSocketMessageType.SCENARIO_CHANGED,
        data: { ...scenario, activated: true },
      });

      res.json(scenario);
    } catch (error) {
      this.logger.error('Error in activate', error);
      res.status(400).json({ error: 'Failed to activate scenario' });
    }
  }

  /**
   * POST /api/scenarios/deactivate
   * Desativar cenário ativo
   */
  async deactivate(req: Request, res: Response): Promise<void> {
    try {
      await this.service.deactivateScenario();

      // Broadcast para clientes
      this.broadcaster.broadcast({
        type: WebSocketMessageType.SCENARIO_CHANGED,
        data: { deactivated: true },
      });

      res.json({ success: true });
    } catch (error) {
      this.logger.error('Error in deactivate', error);
      res.status(400).json({ error: 'Failed to deactivate scenario' });
    }
  }

  /**
   * GET /api/scenarios/active
   * Obter cenário ativo
   */
  async getActive(req: Request, res: Response): Promise<void> {
    try {
      const scenario = await this.service.getActiveScenario();
      res.json({ data: scenario });
    } catch (error) {
      this.logger.error('Error in getActive', error);
      res.status(500).json({ error: 'Failed to get active scenario' });
    }
  }

  /**
   * GET /api/scenarios/:id/export
   * Exportar cenário como JSON
   */
  async export(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const scenario = await this.service.getScenario(id);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${scenario.name}.json"`);
      res.json(scenario);

      this.logger.info(`Scenario exported: ${id} - ${scenario.name}`);
    } catch (error) {
      this.logger.error('Error in export', error);
      res.status(400).json({ error: 'Failed to export scenario' });
    }
  }

  /**
   * POST /api/scenarios/import
   * Importar cenário de arquivo JSON
   */
  async import(req: Request, res: Response): Promise<void> {
    try {
      const { scenario } = req.body;

      if (!scenario || !scenario.name) {
        res.status(400).json({ error: 'Invalid scenario data' });
        return;
      }

      // Criar novo cenário com dados importados (sem ID para criar novo)
      const imported = await this.service.createScenario(
        scenario.name,
        scenario.description,
        scenario.routes
      );

      // Broadcast para clientes
      this.broadcaster.broadcast({
        type: WebSocketMessageType.SCENARIO_CHANGED,
        data: imported,
      });

      this.logger.info(`Scenario imported: ${imported.id} - ${imported.name}`);
      res.status(201).json(imported);
    } catch (error) {
      this.logger.error('Error in import', error);
      res.status(400).json({ error: 'Failed to import scenario' });
    }
  }
}
