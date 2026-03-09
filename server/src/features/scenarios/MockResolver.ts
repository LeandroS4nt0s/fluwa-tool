/**
 * MockResolver
 * Responsabilidade: resolver se uma requisição deve ser mockada e retornar a resposta mockada
 */

import { Scenario, MockRoute, HttpMethod } from '../../types';
import { ILogger } from '../../core/Logger';

export interface MockResolution {
  isMocked: boolean;
  route?: MockRoute;
  scenario?: Scenario;
}

export class MockResolver {
  constructor(private logger: ILogger) {}

  /**
   * Verificar se uma requisição deve ser mockada
   * Retorna true se há uma rota correspondente na scenario ativa
   */
  resolve(
    method: string,
    url: string,
    activeScenario: Scenario | null
  ): MockResolution {
    if (!activeScenario) {
      return { isMocked: false };
    }

    const matchingRoute = this.findMatchingRoute(method, url, activeScenario.routes);

    if (matchingRoute) {
      this.logger.debug(
        `Mock matched: ${method} ${url} -> ${matchingRoute.status}`,
        matchingRoute
      );

      return {
        isMocked: true,
        route: matchingRoute,
        scenario: activeScenario,
      };
    }

    return { isMocked: false };
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
      if (route.method.toString() !== method.toUpperCase()) {
        return false;
      }

      // Verificar se a URL corresponde
      // Suporta URLs exatas ou padrões simples
      return this.urlMatches(url, route.url);
    });
  }

  /**
   * Verificar se a URL atual corresponde ao padrão da rota
   * Suporta:
   * - Correspondência exata: /api/users
   * - Correspondência com wildcard: /api/users/* para /api/users/123, /api/users/xyz, etc
   */
  private urlMatches(actualUrl: string, routePattern: string): boolean {
    // Remover query string e hash para comparação
    const actualUrlPath = actualUrl.split('?')[0].split('#')[0];

    // Correspondência exata
    if (routePattern === actualUrlPath) {
      return true;
    }

    // Correspondência com wildcard
    if (routePattern.endsWith('/*')) {
      const basePath = routePattern.slice(0, -2); // Remove /*
      return actualUrlPath.startsWith(basePath);
    }

    // Correspondência com :param (ex: /api/users/:id)
    return this.matchesParamPattern(actualUrlPath, routePattern);
  }

  /**
   * Verificar se a URL corresponde a um padrão com parâmetros
   * Ex: /api/users/:id corresponde a /api/users/123
   */
  private matchesParamPattern(actualUrl: string, pattern: string): boolean {
    const actualParts = actualUrl.split('/').filter(Boolean);
    const patternParts = pattern.split('/').filter(Boolean);

    if (actualParts.length !== patternParts.length) {
      return false;
    }

    return patternParts.every((patternPart, index) => {
      const actualPart = actualParts[index];

      // Se o padrão começa com :, é um parâmetro (match qualquer coisa)
      if (patternPart.startsWith(':')) {
        return actualPart !== undefined;
      }

      // Caso contrário, deve ser correspondência exata
      return patternPart === actualPart;
    });
  }
}
