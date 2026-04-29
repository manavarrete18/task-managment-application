import { test } from 'node:test'
import * as assert from 'node:assert'

import Fastify from 'fastify'
import Health from '../../src/routes/health'
import type { Db } from '../../src/db/client'

test('health route reports database status', async () => {
  const fastify = Fastify()
  const db = {
    selectNoFrom: () => ({
      executeTakeFirst: async () => ({ connection: 1 })
    })
  } as unknown as Db

  fastify.decorate('db', db)
  await fastify.register(Health)

  const response = await fastify.inject({
    method: 'GET',
    url: '/health'
  })

  assert.equal(response.statusCode, 200)
  assert.deepStrictEqual(JSON.parse(response.payload), {
    status: 'ok',
    database: 'ok'
  })
})
