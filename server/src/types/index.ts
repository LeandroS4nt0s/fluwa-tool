/**
 * Tipos e interfaces do Fluwa Server
 */

// Import dos tipos shared (necessário para que o TS encontre os tipos)
import {
  FluwaConfig,
  HttpMethod,
  RequestSource,
  RequestMetadata,
  MockRoute,
  Scenario,
  SchemaType,
  SchemaDifference,
  SchemaAlert,
  WebSocketMessage,
  WebSocketMessageType,
  FluwaError,
} from './shared';

// Re-export dos tipos shared
export {
  FluwaConfig,
  HttpMethod,
  RequestSource,
  RequestMetadata,
  MockRoute,
  Scenario,
  SchemaType,
  SchemaDifference,
  SchemaAlert,
  WebSocketMessage,
  WebSocketMessageType,
  FluwaError,
};

// ============================================
// REPOSITORY
// ============================================

export interface IRepository<T> {
  save(item: T): Promise<void>;
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  delete(id: string): Promise<void>;
  update(id: string, item: Partial<T>): Promise<void>;
}

// ============================================
// SERVICE LAYER
// ============================================

export interface IRequestService {
  createRequest(request: RequestMetadata): Promise<RequestMetadata>;
  updateRequest(id: string, request: Partial<RequestMetadata>): Promise<void>;
  getRequest(id: string): Promise<RequestMetadata | null>;
  getAllRequests(): Promise<RequestMetadata[]>;
  deleteRequest(id: string): Promise<void>;
  clearAllRequests(): Promise<void>;
}

export interface IScenarioService {
  createScenario(name: string, description?: string, routes?: MockRoute[]): Promise<Scenario>;
  updateScenario(id: string, scenario: Partial<Scenario>): Promise<void>;
  getScenario(id: string): Promise<Scenario | null>;
  getAllScenarios(): Promise<Scenario[]>;
  deleteScenario(id: string): Promise<void>;
  activateScenario(id: string): Promise<void>;
  deactivateScenario(): Promise<void>;
  getActiveScenario(): Promise<Scenario | null>;
}

export interface ISchemaService {
  compareSchemas(mockData: unknown, realData: unknown): SchemaDifference[];
  createAlert(requestId: string, endpoint: string, differences: SchemaDifference[]): Promise<SchemaAlert>;
  getAlerts(): Promise<SchemaAlert[]>;
  dismissAlert(requestId: string): Promise<void>;
}

// ============================================
// BROADCASTER
// ============================================

export interface IBroadcaster {
  broadcast(message: WebSocketMessage): void;
  connect(ws: any): void;
  disconnect(ws: any): void;
}

// ============================================
// ERROR HANDLING
// ============================================

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export interface ErrorResponse {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
  timestamp: string;
}
