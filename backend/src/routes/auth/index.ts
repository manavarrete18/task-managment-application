import { FastifyPluginAsync } from 'fastify'
import { hash, compare } from 'bcryptjs'
import { z } from 'zod'
import '../../types/fastify'

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(72)
})

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(72)
})

const auth: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post('/register', async (request, reply) => {
    const body = registerSchema.safeParse(request.body)

    if (!body.success) {
      return reply.badRequest('Invalid request body')
    }

    const existingUser = await fastify.db
      .selectFrom('users')
      .select('id')
      .where('email', '=', body.data.email)
      .executeTakeFirst()

    if (existingUser) {
      return reply.conflict('Email is already registered')
    }

    const passwordHash = await hash(body.data.password, 12)
    const user = await fastify.db
      .insertInto('users')
      .values({
        name: body.data.name,
        email: body.data.email,
        password_hash: passwordHash
      })
      .returning(['id', 'name', 'email', 'role'])
      .executeTakeFirstOrThrow()

    const token = fastify.jwt.sign({
      sub: user.id,
      role: user.role
    })

    return reply.code(201).send({
      user,
      token
    })
  })

  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.safeParse(request.body)

    if (!body.success) {
      return reply.badRequest('Invalid request body')
    }

    const user = await fastify.db
      .selectFrom('users')
      .select(['id', 'name', 'email', 'password_hash', 'role'])
      .where('email', '=', body.data.email)
      .executeTakeFirst()

    if (!user) {
      return reply.unauthorized('Invalid email or password')
    }

    const isValidPassword = await compare(body.data.password, user.password_hash)

    if (!isValidPassword) {
      return reply.unauthorized('Invalid email or password')
    }

    const token = fastify.jwt.sign({
      sub: user.id,
      role: user.role
    })

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    }
  })
}

export default auth

