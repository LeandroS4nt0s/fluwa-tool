/**
 * Repository para cenários
 * Responsabilidade única: persistência de dados de cenários
 */

import { Scenario } from '../../types';
import { ILogger } from '../../core/Logger';

export interface IScenarioRepository {
  save(scenario: Scenario): Promise<void>;
  findById(id: string): Promise<Scenario | null>;
  findAll(): Promise<Scenario[]>;
  update(id: string, scenario: Partial<Scenario>): Promise<void>;
  delete(id: string): Promise<void>;
  findActive(): Promise<Scenario | null>;
  setActive(id: string | null): Promise<void>;
}

/**
 * Implementação em memória (pode ser substituída por DB depois)
 */
export class ScenarioRepository implements IScenarioRepository {
  private scenarios: Map<string, Scenario> = new Map();
  private activeScenarioId: string | null = null;

  constructor(private logger: ILogger) {}

  async save(scenario: Scenario): Promise<void> {
    this.scenarios.set(scenario.id, scenario);
    this.logger.debug(`Scenario saved: ${scenario.id} - ${scenario.name}`);
  }

  async findById(id: string): Promise<Scenario | null> {
    const scenario = this.scenarios.get(id);
    if (!scenario) return null;

    // Sempre retornar o status correto do campo active
    return {
      ...scenario,
      active: scenario.id === this.activeScenarioId
    };
  }

  async findAll(): Promise<Scenario[]> {
    // Retornar todos os cenários marcando qual é ativo
    return Array.from(this.scenarios.values()).map(scenario => ({
      ...scenario,
      active: scenario.id === this.activeScenarioId
    }));
  }

  async update(id: string, scenario: Partial<Scenario>): Promise<void> {
    const existing = this.scenarios.get(id);
    if (!existing) {
      throw new Error(`Scenario not found: ${id}`);
    }

    this.scenarios.set(id, { ...existing, ...scenario });
    this.logger.debug(`Scenario updated: ${id}`);
  }

  async delete(id: string): Promise<void> {
    // Validar que o cenário existe
    if (!this.scenarios.has(id)) {
      this.logger.warn(`Cannot delete non-existent scenario: ${id}`);
      throw new Error(`Scenario not found: ${id}`);
    }

    const scenario = this.scenarios.get(id);

    // Se era o cenário ativo, desativar
    if (this.activeScenarioId === id) {
      this.logger.info(`Deleting active scenario: ${id} - ${scenario?.name}, deactivating...`);
      this.activeScenarioId = null;
    }

    this.scenarios.delete(id);
    this.logger.info(`Scenario deleted: ${id} - ${scenario?.name}`);
  }

  async findActive(): Promise<Scenario | null> {
    if (!this.activeScenarioId) return null;

    const scenario = this.scenarios.get(this.activeScenarioId);
    if (!scenario) return null;

    // Garantir que o campo active está sempre true
    return {
      ...scenario,
      active: true
    };
  }

  async setActive(id: string | null): Promise<void> {
    // Validação: se tenta ativar, garantir que o cenário existe
    if (id) {
      if (!this.scenarios.has(id)) {
        this.logger.error(`Cannot activate non-existent scenario: ${id}`);
        throw new Error(`Scenario not found: ${id}`);
      }

      const scenario = this.scenarios.get(id);
      this.logger.info(`Activating scenario: ${id} - ${scenario?.name}`);
    } else {
      // Desativando
      if (this.activeScenarioId) {
        const scenario = this.scenarios.get(this.activeScenarioId);
        this.logger.info(`Deactivating scenario: ${this.activeScenarioId} - ${scenario?.name}`);
      }
    }

    this.activeScenarioId = id;
  }

  getStats() {
    return {
      total: this.scenarios.size,
      active: this.activeScenarioId,
      scenarios: Array.from(this.scenarios.values()).map((s) => ({
        id: s.id,
        name: s.name,
        routeCount: s.routes.length,
      })),
    };
  }
}
