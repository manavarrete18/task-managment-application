import { promises as fs } from 'node:fs'
import path from 'node:path'
import { FileMigrationProvider, Migrator } from 'kysely'
import { createDb } from './client'

async function migrate () {
  const db = createDb()
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'migrations')
    })
  })

  const direction = process.argv[2]
  const result = direction === 'down'
    ? await migrator.migrateDown()
    : await migrator.migrateToLatest()

  const { error, results } = result

  results?.forEach((migration) => {
    if (migration.status === 'Success') {
      console.log(`Migration ${migration.migrationName} was executed successfully`)
    } else if (migration.status === 'Error') {
      console.error(`Migration ${migration.migrationName} failed`)
    }
  })

  await db.destroy()

  if (error) {
    console.error('Migration failed')
    console.error(error)
    process.exit(1)
  }
}

migrate().catch((error) => {
  console.error(error)
  process.exit(1)
})

