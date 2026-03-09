/**
 * Tipos compartilhados entre SDK e Server
 */

// ============================================
// CONFIGURAÇÃO
// ============================================

export interface FluwaConfig {
  serverUrl: string;
  enabled: boolean;
  appName: string;
  debug?: boolean;
  requestTimeout?: number;
}

// ============================================
// REQUISIÇÕES
// ============================================

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

export enum RequestSource {
  MOCK = 'mock',
  REAL = 'real',
  ERROR = 'error',
}

export interface RequestMetadata {
  id: string;
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timestamp: string;
  sessionId: string;
  appName: string;
  duration?: number;
  status?: number;
  response?: unknown;
  source: RequestSource;
  mockedScenario?: string;
  error?: string;
}

// ============================================
// CENÁRIOS E ROTAS
// ============================================

export interface MockRoute {
  method: HttpMethod;
  url: string;
  status: number;
  response: unknown;
  delay?: number;
  description?: string;
}

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  routes: MockRoute[];
  createdAt: string;
  updatedAt: string;
  active?: boolean;
}

// ============================================
// SCHEMA COMPARISON
// ============================================

export type SchemaType = 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object' | 'unknown';

export interface SchemaDifference {
  path: string;
  issue: string;
  mockType?: SchemaType;
  realType?: SchemaType;
}

export interface SchemaAlert {
  requestId: string;
  endpoint: string;
  timestamp: string;
  differences: SchemaDifference[];
  mockSchema: unknown;
  realSchema: unknown;
  severity: 'info' | 'warning' | 'error';
}

// ============================================
// WEBSOCKET
// ============================================

export enum WebSocketMessageType {
  INIT_SESSION = 'INIT_SESSION',
  SCENARIO_CHANGED = 'SCENARIO_CHANGED',
  PING = 'PING',
  PONG = 'PONG',
  NEW_REQUEST = 'NEW_REQUEST',
  REQUEST_UPDATED = 'REQUEST_UPDATED',
  SCHEMA_ALERT = 'SCHEMA_ALERT',
}

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data?: unknown;
  sessionId?: string;
  appName?: string;
  scenario?: string;
}

// ============================================
// ESTADO INTERNO
// ============================================

export interface InternalState {
  mockScenario: string | null;
  sessionId: string;
  isInitialized: boolean;
  wsConnected: boolean;
}

// ============================================
// ERROS
// ============================================

export interface FluwaError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
}
