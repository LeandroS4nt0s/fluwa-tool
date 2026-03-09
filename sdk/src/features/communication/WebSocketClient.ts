/**
 * Cliente WebSocket para comunicação bidirecional em tempo real
 * Responsabilidade única: gerenciar conexão WebSocket
 */

import { ILogger } from '../../core/Logger';
import { WebSocketMessage } from '../../types';

export enum WebSocketState {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
}

export interface IWebSocketClient {
  connect(): Promise<void>;
  disconnect(): void;
  send(message: WebSocketMessage): void;
  isConnected(): boolean;
  on(event: 'message' | 'connected' | 'disconnected' | 'error', callback: (data?: unknown) => void): void;
}

/**
 * Implementação do cliente WebSocket
 * Implementa pattern: Observer
 */
export class WebSocketClient implements IWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private state: WebSocketState = WebSocketState.DISCONNECTED;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  // Listeners para eventos
  private messageListeners: Set<(data: WebSocketMessage) => void> = new Set();
  private connectedListeners: Set<() => void> = new Set();
  private disconnectedListeners: Set<() => void> = new Set();
  private errorListeners: Set<(error: unknown) => void> = new Set();

  constructor(serverUrl: string, private logger: ILogger, appName?: string) {
    // Converter http:// para ws:// ou https:// para wss://
    const wsUrl = serverUrl
      .replace(/^https?:\/\//, (match) => {
        return match.startsWith('https') ? 'wss://' : 'ws://';
      })
      .concat('/ws');

    // Adicionar appName como query string se fornecido
    this.url = appName ? `${wsUrl}?appName=${encodeURIComponent(appName)}` : wsUrl;
  }

  /**
   * Conectar ao servidor WebSocket
   */
  async connect(): Promise<void> {
    if (this.state === WebSocketState.CONNECTED || this.state === WebSocketState.CONNECTING) {
      return;
    }

    this.state = WebSocketState.CONNECTING;
    this.logger.debug(`Conectando ao WebSocket: ${this.url}`);

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.state = WebSocketState.CONNECTED;
          this.reconnectAttempts = 0;
          this.logger.success('WebSocket conectado');
          this.connectedListeners.forEach((cb) => cb());
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            this.messageListeners.forEach((cb) => cb(message));
          } catch (error) {
            this.logger.warn('Erro ao parsear mensagem WebSocket', error);
          }
        };

        this.ws.onerror = (error) => {
          this.state = WebSocketState.ERROR;
          this.logger.error('Erro WebSocket', error);
          this.errorListeners.forEach((cb) => cb(error));
        };

        this.ws.onclose = () => {
          this.state = WebSocketState.DISCONNECTED;
          this.logger.warn('WebSocket desconectado');
          this.disconnectedListeners.forEach((cb) => cb());

          // Tentar reconectar
          this.reconnect();
        };
      } catch (error) {
        this.state = WebSocketState.ERROR;
        this.logger.error('Erro ao criar WebSocket', error);
        reject(error);
      }
    });
  }

  /**
   * Desconectar do WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.state = WebSocketState.DISCONNECTED;
      this.maxReconnectAttempts = 0; // Previne reconexão automática
    }
  }

  /**
   * Enviar mensagem via WebSocket
   */
  send(message: WebSocketMessage): void {
    if (!this.isConnected()) {
      this.logger.warn('WebSocket não está conectado');
      return;
    }

    try {
      this.ws!.send(JSON.stringify(message));
    } catch (error) {
      this.logger.error('Erro ao enviar mensagem WebSocket', error);
    }
  }

  /**
   * Verificar se está conectado
   */
  isConnected(): boolean {
    return this.state === WebSocketState.CONNECTED;
  }

  /**
   * Registrar listener para evento
   */
  on(
    event: 'message' | 'connected' | 'disconnected' | 'error',
    callback: (data?: unknown) => void
  ): void {
    switch (event) {
      case 'message':
        this.messageListeners.add(callback as (data: WebSocketMessage) => void);
        break;
      case 'connected':
        this.connectedListeners.add(callback as () => void);
        break;
      case 'disconnected':
        this.disconnectedListeners.add(callback as () => void);
        break;
      case 'error':
        this.errorListeners.add(callback as (error: unknown) => void);
        break;
    }
  }

  /**
   * Tentar reconectar com backoff exponencial
   */
  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error(
        `Falha ao reconectar após ${this.maxReconnectAttempts} tentativas`
      );
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.logger.warn(
      `Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        this.logger.error('Reconexão falhou', error);
      });
    }, delay);
  }
}
