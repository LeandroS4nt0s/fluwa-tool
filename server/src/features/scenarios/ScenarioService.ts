/**
 * Service para cenários
 * Responsabilidade única: lógica de negócio relacionada a cenários
 */

import { Scenario, MockRoute } from '../../types';
import { ILogger } from '../../core/Logger';
import { IScenarioRepository } from './ScenarioRepository';
import { AppError, ErrorFactory } from '../../core/AppError';
import { v4 as uuidv4 } from 'uuid';

export interface IScenarioService {
  createScenario(name: string, description?: string, routes?: MockRoute[]): Promise<Scenario>;
  updateScenario(id: string, scenario: Partial<Scenario>): Promise<Scenario>;
  getScenario(id: string): Promise<Scenario>;
  getAllScenarios(): Promise<Scenario[]>;
  deleteScenario(id: string): Promise<void>;
  activateScenario(id: string): Promise<Scenario>;
  deactivateScenario(): Promise<void>;
  getActiveScenario(): Promise<Scenario | null>;
}

/**
 * Implementação do serviço
 */
export class ScenarioService implements IScenarioService {
  constructor(
    private repository: IScenarioRepository,
    private logger: ILogger
  ) {}

  async createScenario(
    name: string,
    description?: string,
    routes?: MockRoute[]
  ): Promise<Scenario> {
    try {
      this.validateScenarioName(name);

      const scenario: Scenario = {
        id: uuidv4(),
        name,
        description,
        routes: routes || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        active: false,
      };

      await this.repository.save(scenario);
      this.logger.debug(`Scenario created: ${scenario.id} - ${scenario.name}`);
      return scenario;
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error('Error creating scenario', error);
      throw ErrorFactory.internalError('Failed to create scenario');
    }
  }

  async updateScenario(id: string, scenario: Partial<Scenario>): Promise<Scenario> {
    try {
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw ErrorFactory.notFound('Scenario');
      }

      const updated = {
        ...scenario,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
      };

      await this.repository.update(id, updated);
      this.logger.debug(`Scenario updated: ${id}`);
      return { ...existing, ...updated };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error('Error updating scenario', error);
      throw ErrorFactory.internalError('Failed to update scenario');
    }
  }

  async getScenario(id: string): Promise<Scenario> {
    try {
      const scenario = await this.repository.findById(id);
      if (!scenario) {
        throw ErrorFactory.notFound('Scenario');
      }
      return scenario;
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error('Error getting scenario', error);
      throw ErrorFactory.internalError('Failed to get scenario');
    }
  }

  async getAllScenarios(): Promise<Scenario[]> {
    try {
      return await this.repository.findAll();
    } catch (error) {
      this.logger.error('Error getting all scenarios', error);
      throw ErrorFactory.internalError('Failed to get scenarios');
    }
  }

  async deleteScenario(id: string): Promise<void> {
    try {
      const scenario = await this.repository.findById(id);
      if (!scenario) {
        throw ErrorFactory.notFound('Scenario');
      }

      await this.repository.delete(id);
      this.logger.debug(`Scenario deleted: ${id}`);
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error('Error deleting scenario', error);
      throw ErrorFactory.internalError('Failed to delete scenario');
    }
  }

  async activateScenario(id: string): Promise<Scenario> {
    try {
      // Validação: cenário deve existir
      const scenario = await this.repository.findById(id);
      if (!scenario) {
        this.logger.warn(`Attempt to activate non-existent scenario: ${id}`);
        throw ErrorFactory.notFound('Scenario');
      }

      // Ativar no repository
      await this.repository.setActive(id);

      // Retornar com o estado atualizado
      const activated = await this.repository.findById(id);
      this.logger.info(`Scenario activated: ${id} - ${scenario.name}`);

      return activated!;
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error('Error activating scenario', error);
      throw ErrorFactory.internalError('Failed to activate scenario');
    }
  }

  async deactivateScenario(): Promise<void> {
    try {
      const activeScenario = await this.repository.findActive();

      // Desativar
      await this.repository.setActive(null);

      if (activeScenario) {
        this.logger.info(`Scenario deactivated: ${activeScenario.id} - ${activeScenario.name}`);
      } else {
        this.logger.info('Deactivate called but no scenario was active');
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error('Error deactivating scenario', error);
      throw ErrorFactory.internalError('Failed to deactivate scenario');
    }
  }

  async getActiveScenario(): Promise<Scenario | null> {
    try {
      return await this.repository.findActive();
    } catch (error) {
      this.logger.error('Error getting active scenario', error);
      throw ErrorFactory.internalError('Failed to get active scenario');
    }
  }

  private validateScenarioName(name: string): void {
    if (!name || !name.trim()) {
      throw ErrorFactory.invalidInput('Scenario name is required');
    }

    if (name.length > 255) {
      throw ErrorFactory.invalidInput('Scenario name must be less than 255 characters');
    }
  }
}
