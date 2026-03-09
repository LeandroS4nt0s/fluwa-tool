/**
 * Dependency Injection Container
 * Responsabilidade única: gerenciar e resolver dependências
 */

import { ILogger, Logger } from './Logger';

export interface IContainer {
  set<T>(key: string, instance: T): void;
  get<T>(key: string): T;
  has(key: string): boolean;
}

/**
 * Implementação do container
 * Padrão: Registry / Container
 */
export class Container implements IContainer {
  private services: Map<string, any> = new Map();

  constructor(private logger: ILogger) {}

  /**
   * Registrar serviço
   */
  set<T>(key: string, instance: T): void {
    this.services.set(key, instance);
    this.logger.debug(`Service registered: ${key}`);
  }

  /**
   * Obter serviço
   */
  get<T>(key: string): T {
    if (!this.services.has(key)) {
      throw new Error(`Service not found: ${key}`);
    }
    return this.services.get(key) as T;
  }

  /**
   * Verificar se serviço existe
   */
  has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * Obter todas as chaves registradas
   */
  getKeys(): string[] {
    return Array.from(this.services.keys());
  }
}

// Container global singleton
let globalContainer: Container | null = null;

/**
 * Obter instância global do container
 */
export function getContainer(): Container {
  if (!globalContainer) {
    globalContainer = new Container(new Logger());
  }
  return globalContainer;
}

/**
 * Resetar container (para testes)
 */
export function resetContainer(): void {
  globalContainer = null;
}
