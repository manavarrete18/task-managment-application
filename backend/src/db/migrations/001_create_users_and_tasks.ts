import { sql, type Kysely } from 'kysely'

export async function up (db: Kysely<unknown>): Promise<void> {
  await sql`create extension if not exists pgcrypto`.execute(db)

  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (column) => column.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('name', 'varchar(120)', (column) => column.notNull())
    .addColumn('email', 'varchar(255)', (column) => column.notNull().unique())
    .addColumn('password_hash', 'varchar(255)', (column) => column.notNull())
    .addColumn('role', 'varchar(20)', (column) => column.notNull().defaultTo('user'))
    .addColumn('created_at', 'timestamptz', (column) => column.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull().defaultTo(sql`now()`))
    .addCheckConstraint('users_role_check', sql`role in ('admin', 'user')`)
    .execute()

  await db.schema
    .createTable('tasks')
    .addColumn('id', 'uuid', (column) => column.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (column) => column.notNull().references('users.id').onDelete('cascade'))
    .addColumn('title', 'varchar(160)', (column) => column.notNull())
    .addColumn('description', 'text')
    .addColumn('status', 'varchar(20)', (column) => column.notNull().defaultTo('pending'))
    .addColumn('due_date', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (column) => column.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull().defaultTo(sql`now()`))
    .addCheckConstraint('tasks_status_check', sql`status in ('pending', 'completed')`)
    .execute()

  await db.schema
    .createIndex('tasks_user_id_index')
    .on('tasks')
    .column('user_id')
    .execute()

  await db.schema
    .createIndex('tasks_status_index')
    .on('tasks')
    .column('status')
    .execute()
}

export async function down (db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('tasks').ifExists().execute()
  await db.schema.dropTable('users').ifExists().execute()
}
