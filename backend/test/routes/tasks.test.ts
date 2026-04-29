import { test } from 'node:test'
import * as assert from 'node:assert'

import Fastify from 'fastify'
import Sensible from '../../src/plugins/sensible'
import Tasks from '../../src/routes/tasks'
import type { Db } from '../../src/db/client'

const userId = '4d6ea1bb-2f0f-4ed3-8d8d-9e068752f28f'
const taskId = '75bf2d8c-095d-41e0-9790-8d4fa2f87078'

async function buildApp (db: Db) {
  const fastify = Fastify()

  fastify.decorate('db', db)
  fastify.decorate('authenticate', async (request) => {
    request.user = {
      sub: userId,
      role: 'user'
    }
  })
  await fastify.register(Sensible)
  await fastify.register(Tasks, {
    prefix: '/tasks'
  })

  return fastify
}

test('creates a task for the authenticated user', async () => {
  const task = {
    id: taskId,
    title: 'Write tests',
    description: 'Cover tasks route',
    status: 'pending',
    due_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  const db = {
    insertInto: () => ({
      values: (values: Record<string, unknown>) => {
        assert.equal(values.user_id, userId)

        return {
          returning: () => ({
            executeTakeFirstOrThrow: async () => task
          })
        }
      }
    })
  } as unknown as Db
  const app = await buildApp(db)

  const response = await app.inject({
    method: 'POST',
    url: '/tasks',
    payload: {
      title: task.title,
      description: task.description
    }
  })

  assert.equal(response.statusCode, 201)
  assert.deepStrictEqual(JSON.parse(response.payload), task)
})

test('lists tasks filtered by status', async () => {
  const task = {
    id: taskId,
    title: 'Write tests',
    description: null,
    status: 'completed',
    due_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  const rowsQuery = {
    select: () => rowsQuery,
    where: () => rowsQuery,
    orderBy: () => rowsQuery,
    limit: () => rowsQuery,
    offset: () => rowsQuery,
    execute: async () => [task]
  }
  const countQuery = {
    select: () => countQuery,
    where: () => countQuery,
    executeTakeFirst: async () => ({ total: '1' })
  }
  let calls = 0
  const db = {
    selectFrom: () => {
      calls += 1
      return calls === 1 ? rowsQuery : countQuery
    }
  } as unknown as Db
  const app = await buildApp(db)

  const response = await app.inject({
    method: 'GET',
    url: '/tasks?status=completed&page=1&limit=10'
  })

  assert.equal(response.statusCode, 200)
  assert.deepStrictEqual(JSON.parse(response.payload), {
    items: [task],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1
    }
  })
})

