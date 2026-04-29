import '@fastify/jwt'
import type { Env } from '../config/env'
import type { Db } from '../db/client'

declare module 'fastify' {
  export interface FastifyInstance {
    config: Env;
    db: Db;
    authenticate(
      request: import('fastify').FastifyRequest,
      reply: import('fastify').FastifyReply
    ): Promise<void>;
  }
}

declare module '@fastify/jwt' {
  export interface FastifyJWT {
    payload: {
      sub: string;
      role: 'admin' | 'user';
    };
    user: {
      sub: string;
      role: 'admin' | 'user';
    };
  }
}
