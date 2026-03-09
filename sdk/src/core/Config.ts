/**
 * Gerenciamento centralizado de configuração
 * Responsabilidade única: manter e validar configurações
 */

import { FluwaConfig } from '../types';

const DEFAULT_CONFIG: FluwaConfig = {
  serverUrl: 'http://localhost:5555',
  enabled: true,
  appName: 'DefaultApp',
  debug: false,
  requestTimeout: 5000,
};

export interface IConfigManager {
  getConfig(): FluwaConfig;
  updateConfig(partial: Partial<FluwaConfig>): void;
  isEnabled(): boolean;
  getServerUrl(): string;
  getAppName(): string;
}

/**
 * Gerenciador de configuração
 * Implementa pattern: Configuration Object
 */
export class ConfigManager implements IConfigManager {
  private config: FluwaConfig;

  constructor(initialConfig?: Partial<FluwaConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...initialConfig,
    };
    this.validate();
  }

  private validate(): void {
    if (!this.config.serverUrl || typeof this.config.serverUrl !== 'string') {
      throw new Error('serverUrl inválida');
    }

    if (typeof this.config.enabled !== 'boolean') {
      throw new Error('enabled deve ser boolean');
    }

    if (!this.config.appName || typeof this.config.appName !== 'string') {
      throw new Error('appName inválida');
    }

    if (this.config.requestTimeout && this.config.requestTimeout < 0) {
      throw new Error('requestTimeout não pode ser negativa');
    }
  }

  getConfig(): FluwaConfig {
    return { ...this.config };
  }

  updateConfig(partial: Partial<FluwaConfig>): void {
    this.config = {
      ...this.config,
      ...partial,
    };
    this.validate();
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getServerUrl(): string {
    return this.config.serverUrl;
  }

  getAppName(): string {
    return this.config.appName;
  }
}

// Instância singleton (lazy-loaded)
let configInstance: ConfigManager | null = null;

export function getConfigManager(initialConfig?: Partial<FluwaConfig>): ConfigManager {
  if (!configInstance) {
    configInstance = new ConfigManager(initialConfig);
  }
  return configInstance;
}

export function resetConfig(): void {
  configInstance = null;
}
