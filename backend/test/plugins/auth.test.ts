import { test } from 'node:test'
import * as assert from 'node:assert'

import Fastify from 'fastify'
import jwt from '@fastify/jwt'
import Sensible from '../../src/plugins/sensible'
import Auth from '../../src/plugins/auth'

async function buildApp () {
  const fastify = Fastify()

  await fastify.register(Sensible)
  await fastify.register(jwt, {
    secret: 'test-secret-for-auth-plugin'
  })
  await fastify.register(Auth)

  fastify.get('/protected', {
    preHandler: [fastify.authenticate]
  }, async (request) => {
    return {
      userId: request.user.sub,
      role: request.user.role
    }
  })

  return fastify
}

test('authenticate allows requests with a valid token', async () => {
  const app = await buildApp()
  const token = app.jwt.sign({
    sub: 'user-id',
    role: 'user'
  })

  const response = await app.inject({
    method: 'GET',
    url: '/protected',
    headers: {
      authorization: `Bearer ${token}`
    }
  })

  assert.equal(response.statusCode, 200)
  assert.deepStrictEqual(JSON.parse(response.payload), {
    userId: 'user-id',
    role: 'user'
  })
})

test('authenticate rejects requests without a token', async () => {
  const app = await buildApp()

  const response = await app.inject({
    method: 'GET',
    url: '/protected'
  })

  assert.equal(response.statusCode, 401)
})

