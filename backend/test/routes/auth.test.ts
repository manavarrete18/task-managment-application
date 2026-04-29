import { test } from 'node:test'
import * as assert from 'node:assert'

import Fastify from 'fastify'
import jwt from '@fastify/jwt'
import { hash } from 'bcryptjs'
import Auth from '../../src/routes/auth'
import Sensible from '../../src/plugins/sensible'
import type { Db } from '../../src/db/client'

function buildApp (db: Db) {
  const fastify = Fastify()

  fastify.decorate('db', db)
  fastify.register(Sensible)
  fastify.register(jwt, {
    secret: 'test-secret-for-auth-routes'
  })
  fastify.register(Auth, {
    prefix: '/auth'
  })

  return fastify
}

test('register creates a user and returns a token', async () => {
  const user = {
    id: 'user-id',
    name: 'Marcela',
    email: 'marcela@example.com',
    role: 'user'
  }
  const db = {
    selectFrom: () => ({
      select: () => ({
        where: () => ({
          executeTakeFirst: async () => undefined
        })
      })
    }),
    insertInto: () => ({
      values: () => ({
        returning: () => ({
          executeTakeFirstOrThrow: async () => user
        })
      })
    })
  } as unknown as Db
  const app = buildApp(db)

  const response = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: {
      name: user.name,
      email: user.email,
      password: 'password123'
    }
  })

  assert.equal(response.statusCode, 201)
  const payload = JSON.parse(response.payload)
  assert.deepStrictEqual(payload.user, user)
  assert.equal(typeof payload.token, 'string')
})

test('login returns a user and token for valid credentials', async () => {
  const passwordHash = await hash('password123', 4)
  const user = {
    id: 'user-id',
    name: 'Marcela',
    email: 'marcela@example.com',
    password_hash: passwordHash,
    role: 'user'
  }
  const db = {
    selectFrom: () => ({
      select: () => ({
        where: () => ({
          executeTakeFirst: async () => user
        })
      })
    })
  } as unknown as Db
  const app = buildApp(db)

  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: user.email,
      password: 'password123'
    }
  })

  assert.equal(response.statusCode, 200)
  const payload = JSON.parse(response.payload)
  assert.deepStrictEqual(payload.user, {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  })
  assert.equal(typeof payload.token, 'string')
})

