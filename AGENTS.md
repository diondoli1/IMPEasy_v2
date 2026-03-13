# Impeasy ERP

Manufacturing ERP application with a NestJS API backend (`apps/api`) and Next.js web frontend (`apps/web`), using Prisma ORM with PostgreSQL.

## Cursor Cloud specific instructions

### Prerequisites

- PostgreSQL must be running: `sudo service postgresql start`
- Database `impeasy` must exist: `sudo -u postgres createdb impeasy` (safe to re-run; errors if already exists)
- Database credentials for local dev: `postgres:postgres@localhost:5432/impeasy`

### Project structure

- **Monorepo** using npm workspaces: `apps/api` (NestJS API, port 3000) and `apps/web` (Next.js frontend, port 3001)
- Prisma schema lives at `apps/api/prisma/schema.prisma`
- Root `package.json` has workspace-level seed scripts (`seed:mvp-*`) and test shortcuts (`test:api`, `test:web`)
- Seed scripts (`seed-mvp-*.mjs`) in the workspace root exercise the API endpoints and some use Prisma client directly

### Running services

- **API**: `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/impeasy" npm --workspace @impeasy/api run start:dev`
- **Web**: `npm --workspace @impeasy/web run dev` (defaults to port 3001, fetches from API at `http://localhost:3000`)

### Gotchas

- Seed scripts that use Prisma directly (e.g., `seed-mvp-030-demo.mjs`, `seed-mvp-040-demo.mjs`) need `DATABASE_URL` set in the environment in addition to the API running.
- `seed-mvp-040-cleanup.sql` is actually a JavaScript file despite the `.sql` extension.
- After Prisma schema changes, kill and restart the API dev server -- `--watch` mode may not pick up a regenerated Prisma client.
- Delete `apps/web/.next` if you see stale cache errors after changes.
