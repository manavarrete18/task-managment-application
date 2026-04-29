import type { Env } from '../config/env'
import type { Db } from '../db/client'

declare module 'fastify' {
  export interface FastifyInstance {
    config: Env;
    db: Db;
  }
}

