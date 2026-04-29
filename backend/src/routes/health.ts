import { sql } from 'kysely'
import { FastifyPluginAsync } from 'fastify'
import '../types/fastify'

const health: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/health', async (_request, reply) => {
    try {
      await fastify.db
        .selectNoFrom(sql<number>`1`.as('connection'))
        .executeTakeFirst()

      return {
        status: 'ok',
        database: 'ok'
      }
    } catch {
      return reply.code(503).send({
        status: 'error',
        database: 'unavailable'
      })
    }
  })
}

export default health
