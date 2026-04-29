import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { env } from '../config/env'
import type { Database } from './database'

export function createDb () {
  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: env.DATABASE_URL
      })
    })
  })
}

export type Db = ReturnType<typeof createDb>

