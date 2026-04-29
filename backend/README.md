# Task Management API

Backend for a task management application built with Fastify, TypeScript, PostgreSQL, Kysely, JWT, and Zod.

## Requirements

- Node.js
- PostgreSQL

## Environment

Create a local `.env` file using `.env.example` as reference.

## Scripts

```powershell
npm.cmd run dev
```

Start the API in development mode.

```powershell
npm.cmd run build:ts
```

Compile TypeScript.

```powershell
npm.cmd test
```

Run tests.

```powershell
npm.cmd run db:migrate
```

Run database migrations.

```powershell
npm.cmd run db:rollback
```

Rollback the latest migration.

## Endpoints

- `GET /`
- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /tasks`
- `POST /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`
