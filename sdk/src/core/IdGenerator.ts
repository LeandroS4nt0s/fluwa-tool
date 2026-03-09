/**
 * Gerador de IDs únicos
 * Responsabilidade única: gerar identificadores
 */

export interface IIdGenerator {
  generate(): string;
}

/**
 * Implementação de gerador de IDs
 * Usa combinação de timestamp + random para garantir unicidade
 */
export class IdGenerator implements IIdGenerator {
  /**
   * Gera ID único no formato: timestamp_random
   * Exemplo: 1710000000000_abc123def456
   */
  generate(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${timestamp}_${random}`;
  }
}

// Instância singleton
export const idGenerator = new IdGenerator();
