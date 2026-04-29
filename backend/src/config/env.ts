import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url().default('postgres://postgres:postgres@localhost:5432/task_management'),
  JWT_SECRET: z.string().min(16).default('local-development-jwt-secret')
})

export const env = envSchema.parse(process.env)
export type Env = typeof env
