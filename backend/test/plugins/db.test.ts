import { test } from 'node:test'
import * as assert from 'node:assert'

import Fastify from 'fastify'
import Db from '../../src/plugins/db'

test('db plugin decorates the Fastify instance', async () => {
  const fastify = Fastify()
  await fastify.register(Db)
  await fastify.ready()

  assert.equal(typeof fastify.db.selectFrom, 'function')

  await fastify.close()
})

