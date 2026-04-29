import fp from 'fastify-plugin'
import '../types/fastify'
import { createDb } from '../db/client'

export default fp(async (fastify) => {
  const db = createDb()

  fastify.decorate('db', db)
  fastify.addHook('onClose', async () => {
    await db.destroy()
  })
})
