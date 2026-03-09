/**
 * Middleware de CORS
 * Permite requisições de qualquer origem (dev environment)
 */

import cors from 'cors';

export const corsMiddleware = cors({
  origin: '*', // Em produção, especificar origens permitidas
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Fluwa-Internal'],
  credentials: true,
  maxAge: 86400, // 24 horas
});
