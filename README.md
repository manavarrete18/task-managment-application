# Task Management Application

Full-stack task management app built with React, Fastify, PostgreSQL, Kysely, JWT, and Zod.

## Stack

- Frontend: React, Vite, TypeScript, shadcn/ui, Tailwind CSS, TanStack Query
- Backend: Fastify, TypeScript, JWT, Zod
- Database: PostgreSQL with Kysely migrations
- Tooling: Docker Compose, ESLint, backend tests with Node test runner

## Project Structure

```text
.
├── backend
│   ├── src
│   │   ├── config
│   │   ├── db
│   │   ├── plugins
│   │   ├── routes
│   │   └── types
│   └── test
├── frontend
│   └── src
│       ├── components
│       ├── lib
│       └── ...
└── docker-compose.yml
```

The app is split into `backend` and `frontend` so each side has its own dependencies, scripts, and build process while keeping the repository simple.

## Environment

Backend environment variables are documented in `backend/.env.example`.

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/task_management
JWT_SECRET=local-development-jwt-secret
```

For local development, copy it to `backend/.env` if you want to override defaults.

## Run Locally

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Install backend dependencies and run migrations:

```bash
cd backend
npm install
npm run db:migrate
npm start
```

The API runs at:

```text
http://localhost:3000
```

Install frontend dependencies and start Vite:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

## Run With Docker

Build and start all services:

```bash
docker compose up --build
```

Run migrations after the backend container is available:

```bash
cd backend
npm run db:migrate
```

Services:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

## Scripts

Backend:

```bash
npm run build:ts
npm test
npm run db:migrate
npm run db:rollback
npm start
```

Frontend:

```bash
npm run lint
npm run build
npm run dev
```

## API

### Health

```http
GET /health
```

Returns API and database status.

### Auth

```http
POST /auth/register
```

Body:

```json
{
  "name": "Marcela",
  "email": "marcela@example.com",
  "password": "password123"
}
```

```http
POST /auth/login
```

Body:

```json
{
  "email": "marcela@example.com",
  "password": "password123"
}
```

Both endpoints return:

```json
{
  "user": {
    "id": "uuid",
    "name": "Marcela",
    "email": "marcela@example.com",
    "role": "user"
  },
  "token": "jwt"
}
```

### Tasks

All task endpoints require:

```http
Authorization: Bearer <token>
```

List tasks:

```http
GET /tasks?page=1&limit=10&status=pending
```

`status` is optional and accepts `pending` or `completed`.

Create task:

```http
POST /tasks
```

Body:

```json
{
  "title": "Finish technical test",
  "description": "Polish README and verify the app"
}
```

Get task:

```http
GET /tasks/:id
```

Update task:

```http
PATCH /tasks/:id
```

Body can include any of:

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "completed"
}
```

Delete task:

```http
DELETE /tasks/:id
```

## Roles

Users have one of two roles:

- `user`
- `admin`

Regular users can only access their assigned tasks. Admin users can list, view, update, and delete tasks across users.

New registrations always create `user` accounts. Admin accounts should be created manually in the database for review/testing.

## Architecture Decisions

- Fastify plugins are used for reusable API concerns such as config, database, JWT, auth guard, and sensible HTTP errors.
- Kysely keeps database queries typed while avoiding a heavy ORM layer.
- Zod validates environment variables and request payloads.
- JWT payload uses `sub` for the user id and `role` for authorization decisions.
- Tasks are always scoped by the authenticated user unless the role is `admin`.
- Server-side pagination keeps task listing efficient.
- TanStack Query manages server state in React, including loading, refetching, cache, and invalidation after mutations.
- shadcn/ui keeps the UI consistent without introducing a heavy component framework.
- Docker Compose provides a reproducible local PostgreSQL setup and optional full-app containerization.

## Verification

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Notes

Frontend unit tests are not included yet. Backend tests cover authentication, authorization guard, database plugin, health check, and task listing behavior.

## Future Improvements

- Add an admin UI to manage user roles instead of assigning admins manually in the database.
- Add frontend unit tests with Vitest and React Testing Library.
- Add refresh tokens for longer-lived sessions.
- Add task due date editing in the frontend.
- Add production-grade secrets management for Docker deployments.
