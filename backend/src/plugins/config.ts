import fp from 'fastify-plugin'
import { env, type Env } from '../config/env'

export default fp(async (fastify) => {
  fastify.decorate('config', env)
})

declare module 'fastify' {
  export interface FastifyInstance {
    config: Env;
  }
}

