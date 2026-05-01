import { sql } from 'kysely'
import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import '../../types/fastify'

const taskParamsSchema = z.object({
  id: z.string().uuid()
})

const listTasksQuerySchema = z.object({
  status: z.enum(['pending', 'completed']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10)
})

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional(),
  due_date: z.string().datetime().optional()
})

const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  status: z.enum(['pending', 'completed']).optional(),
  due_date: z.string().datetime().nullable().optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required'
})

const tasks: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.addHook('preHandler', fastify.authenticate)

  function applyTaskAccessFilter<T extends {
    where(column: 'user_id', operator: '=', value: string): T;
  }> (query: T, user: { sub: string; role: 'admin' | 'user' }) {
    return user.role === 'admin' ? query : query.where('user_id', '=', user.sub)
  }

  fastify.get('/', async (request, reply) => {
    const query = listTasksQuerySchema.safeParse(request.query)

    if (!query.success) {
      return reply.badRequest('Invalid query parameters')
    }

    const { status, page, limit } = query.data
    const offset = (page - 1) * limit

    let tasksQuery = fastify.db
      .selectFrom('tasks')
      .select(['id', 'user_id', 'title', 'description', 'status', 'due_date', 'created_at', 'updated_at'])
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)

    let countQuery = fastify.db
      .selectFrom('tasks')
      .select((eb) => eb.fn.countAll<string>().as('total'))

    tasksQuery = applyTaskAccessFilter(tasksQuery, request.user)
    countQuery = applyTaskAccessFilter(countQuery, request.user)

    if (status) {
      tasksQuery = tasksQuery.where('status', '=', status)
      countQuery = countQuery.where('status', '=', status)
    }

    const [items, totalResult] = await Promise.all([
      tasksQuery.execute(),
      countQuery.executeTakeFirst()
    ])
    const total = Number(totalResult?.total ?? 0)

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  })

  fastify.post('/', async (request, reply) => {
    const body = createTaskSchema.safeParse(request.body)

    if (!body.success) {
      return reply.badRequest('Invalid request body')
    }

    const task = await fastify.db
      .insertInto('tasks')
      .values({
        user_id: request.user.sub,
        title: body.data.title,
        description: body.data.description ?? null,
        due_date: body.data.due_date ?? null
      })
      .returning(['id', 'user_id', 'title', 'description', 'status', 'due_date', 'created_at', 'updated_at'])
      .executeTakeFirstOrThrow()

    return reply.code(201).send(task)
  })

  fastify.get('/:id', async (request, reply) => {
    const params = taskParamsSchema.safeParse(request.params)

    if (!params.success) {
      return reply.badRequest('Invalid task id')
    }

    let taskQuery = fastify.db
      .selectFrom('tasks')
      .select(['id', 'user_id', 'title', 'description', 'status', 'due_date', 'created_at', 'updated_at'])
      .where('id', '=', params.data.id)

    taskQuery = applyTaskAccessFilter(taskQuery, request.user)
    const task = await taskQuery.executeTakeFirst()

    if (!task) {
      return reply.notFound('Task not found')
    }

    return task
  })

  fastify.patch('/:id', async (request, reply) => {
    const params = taskParamsSchema.safeParse(request.params)
    const body = updateTaskSchema.safeParse(request.body)

    if (!params.success) {
      return reply.badRequest('Invalid task id')
    }

    if (!body.success) {
      return reply.badRequest('Invalid request body')
    }

    let updateQuery = fastify.db
      .updateTable('tasks')
      .set({
        ...body.data,
        updated_at: sql`now()`
      })
      .where('id', '=', params.data.id)
      .returning(['id', 'user_id', 'title', 'description', 'status', 'due_date', 'created_at', 'updated_at'])

    updateQuery = applyTaskAccessFilter(updateQuery, request.user)
    const task = await updateQuery.executeTakeFirst()

    if (!task) {
      return reply.notFound('Task not found')
    }

    return task
  })

  fastify.delete('/:id', async (request, reply) => {
    const params = taskParamsSchema.safeParse(request.params)

    if (!params.success) {
      return reply.badRequest('Invalid task id')
    }

    let deleteQuery = fastify.db
      .deleteFrom('tasks')
      .where('id', '=', params.data.id)
      .returning('id')

    deleteQuery = applyTaskAccessFilter(deleteQuery, request.user)
    const result = await deleteQuery.executeTakeFirst()

    if (!result) {
      return reply.notFound('Task not found')
    }

    return reply.code(204).send()
  })
}

export default tasks
