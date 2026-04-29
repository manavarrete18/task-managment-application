import fp from 'fastify-plugin'
import type { FastifyReply, FastifyRequest } from 'fastify'
import '../types/fastify'

export default fp(async (fastify) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch {
      return reply.code(401).send({
        message: 'Authentication required'
      })
    }
  })
})
