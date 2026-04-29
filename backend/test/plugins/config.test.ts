import { test } from 'node:test'
import * as assert from 'node:assert'

import Fastify from 'fastify'
import Config from '../../src/plugins/config'

test('config plugin decorates the Fastify instance', async () => {
  const fastify = Fastify()
  await fastify.register(Config)
  await fastify.ready()

  assert.equal(fastify.config.NODE_ENV, 'development')
  assert.equal(fastify.config.PORT, 3000)
})
