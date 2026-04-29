import fp from 'fastify-plugin'
import '../types/fastify'
import { env } from '../config/env'

export default fp(async (fastify) => {
  fastify.decorate('config', env)
})
