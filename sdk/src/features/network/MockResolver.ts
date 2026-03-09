/**
 * Resolvedor de mocks
 * Responsabilidade única: encontrar e retornar mock baseado em URL/método
 */

import { ILogger } from '../../core/Logger';
import { HttpMethod, MockRoute, Scenario } from '../../types';
import { IHttpClient } from '../communication/HttpClient';

export interface IMockResolver {
  resolve(method: HttpMethod, url: string): Promise<MockRoute | null>;
  setActiveScenario(scenarioId: string | null): void;
  refreshActiveScenario(): Promise<void>;
}

/**
 * Implementação do resolvedor de mocks
 * Busca cenário ativo do servidor e faz matching local
 */
export class MockResolver implements IMockResolver {
  private cachedScenario: Scenario | null = null;
  private lastFetchTime = 0;
  private cacheTimeout = 5000; // 5 segundos

  constructor(private httpClient: IHttpClient, private logger: ILogger) {}

  /**
   * Resolver mock para método e URL
   * Retorna null se não houver mock
   */
  async resolve(method: HttpMethod, url: string): Promise<MockRoute | null> {
    try {
      // Atualizar scenario do servidor se necessário
      await this.refreshActiveScenario();

      if (!this.cachedScenario) {
        return null;
      }

      // Encontrar rota correspondente
      const matchingRoute = this.findMatchingRoute(method, url, this.cachedScenario.routes);

      if (matchingRoute) {
        this.logger.debug(`Mock encontrado para ${method} ${url}`);
        return matchingRoute;
      }

      return null;
    } catch (error) {
      this.logger.warn(`Erro ao resolver mock: ${error}`);
      return null;
    }
  }

  /**
   * Atualizar cenário ativo do servidor
   */
  async refreshActiveScenario(): Promise<void> {
    const now = Date.now();

    // Usar cache se recente
    if (this.lastFetchTime && now - this.lastFetchTime < this.cacheTimeout) {
      return;
    }

    try {
      const response = await this.httpClient.get<{ data: Scenario | null }>('/api/scenarios/active');
      this.cachedScenario = response.data || null;
      this.lastFetchTime = now;

      if (this.cachedScenario) {
        this.logger.debug(`Cenário ativo atualizado: ${this.cachedScenario.name}`);
      }
    } catch (error) {
      this.logger.debug('Nenhum cenário ativo no servidor');
      this.cachedScenario = null;
      this.lastFetchTime = now;
    }
  }

  /**
   * Atualizar cenário ativo (interface anterior)
   */
  setActiveScenario(scenarioId: string | null): void {
    // Invalidar cache para forçar atualização do servidor
    this.lastFetchTime = 0;
    if (scenarioId) {
      this.logger.info(`Cenário ativo definido para: ${scenarioId}`);
    } else {
      this.logger.info('Mocks desativados');
    }
  }

  /**
   * Encontrar rota que corresponde ao método e URL
   */
  private findMatchingRoute(
    method: string,
    url: string,
    routes: MockRoute[]
  ): MockRoute | undefined {
    return routes.find((route) => {
      // Verificar se o método corresponde
      if (route.method.toString() !== method.toString()) {
        return false;
      }

      // Verificar se a URL corresponde
      return this.urlMatches(url, route.url);
    });
  }

  /**
   * Verificar se a URL atual corresponde ao padrão da rota
   */
  private urlMatches(actualUrl: string, routePattern: string): boolean {
    // Remover query string e hash
    const actualUrlPath = actualUrl.split('?')[0].split('#')[0];

    // Correspondência exata
    if (routePattern === actualUrlPath) {
      return true;
    }

    // Correspondência com wildcard
    if (routePattern.endsWith('/*')) {
      const basePath = routePattern.slice(0, -2);
      return actualUrlPath.startsWith(basePath);
    }

    // Correspondência com :param (ex: /api/users/:id)
    return this.matchesParamPattern(actualUrlPath, routePattern);
  }

  /**
   * Verificar correspondência com parâmetros
   */
  private matchesParamPattern(actualUrl: string, pattern: string): boolean {
    const actualParts = actualUrl.split('/').filter(Boolean);
    const patternParts = pattern.split('/').filter(Boolean);

    if (actualParts.length !== patternParts.length) {
      return false;
    }

    return patternParts.every((patternPart, index) => {
      const actualPart = actualParts[index];
      if (patternPart.startsWith(':')) {
        return actualPart !== undefined;
      }
      return patternPart === actualPart;
    });
  }
}
