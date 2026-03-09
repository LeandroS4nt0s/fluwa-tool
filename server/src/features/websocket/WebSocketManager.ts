/**
 * Gerenciador de WebSocket
 * Responsabilidade única: gerenciar conexões e broadcasts
 */

import { WebSocket } from 'ws';
import { ILogger } from '../../core/Logger';
import { WebSocketMessage } from '@fluwa-tool/sdk';

export interface ClientInfo {
  ws: WebSocket;
  appName?: string;
  connectedAt: number;
}

export interface IBroadcaster {
  broadcast(message: WebSocketMessage): void;
  connect(ws: WebSocket, appName?: string): void;
  disconnect(ws: WebSocket): void;
  isConnected(ws: WebSocket): boolean;
  getStats(): { totalConnections: number; connectedApps: string[] };
  getConnectedApps(): string[];
}

/**
 * Implementação do WebSocket Manager
 * Padrão: Observer
 */
export class WebSocketManager implements IBroadcaster {
  private clients: Map<WebSocket, ClientInfo> = new Map();

  constructor(private logger: ILogger) {}

  /**
   * Registrar nova conexão
   */
  connect(ws: WebSocket, appName?: string): void {
    this.clients.set(ws, {
      ws,
      appName: appName || 'Unknown App',
      connectedAt: Date.now()
    });
    this.logger.info(`WebSocket connected from ${appName || 'Unknown'}. Total: ${this.clients.size}`);
  }

  /**
   * Remover desconexão
   */
  disconnect(ws: WebSocket): void {
    const client = this.clients.get(ws);
    if (client) {
      this.logger.info(`WebSocket disconnected from ${client.appName}. Total: ${this.clients.size - 1}`);
    }
    this.clients.delete(ws);
  }

  /**
   * Verificar se cliente está conectado
   */
  isConnected(ws: WebSocket): boolean {
    return this.clients.has(ws);
  }

  /**
   * Obter lista de apps conectados
   * Filtra 'Unknown App' para mostrar apenas apps com nome explícito
   */
  getConnectedApps(): string[] {
    const apps = Array.from(this.clients.values())
      .map(client => client.appName)
      .filter((app): app is string => app !== undefined && app !== 'Unknown App')
      .filter((app, idx, arr) => arr.indexOf(app) === idx); // Remove duplicatas
    return apps;
  }

  /**
   * Broadcast para todos os clientes
   */
  broadcast(message: WebSocketMessage): void {
    const jsonMessage = JSON.stringify(message);
    let successCount = 0;

    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(jsonMessage);
          successCount++;
        } catch (error) {
          this.logger.warn('Error sending message to client', error);
        }
      }
    });

    this.logger.debug(`Broadcast sent to ${successCount}/${this.clients.size} clients`);
  }

  /**
   * Obter estatísticas
   */
  getStats() {
    return {
      totalConnections: this.clients.size,
      connectedApps: this.getConnectedApps()
    };
  }
}
