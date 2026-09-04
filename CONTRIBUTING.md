# Contributing to EduFlow

Thanks for helping improve EduFlow. This guide covers local setup, the quality
gates every change must pass, and the conventions we follow.

## Stack

- **Web app**: Next.js 16 (App Router) · React 19 · TypeScript · Prisma 7
  (PostgreSQL) · Zod · Tailwind CSS 4 · Vitest.
- **AI service** (`ai-service/`): Python (FastAPI-style) · SQLAlchemy · Alembic ·
  Celery/Redis · pytest.

## Getting started

```bash
# 1. Install dependencies (also runs `prisma generate` via postinstall)
npm install

# 2. Configure environment
cp .env.example .env
#   Fill in DATABASE_URL and the AI_SERVICE_* secrets at minimum.

# 3. Bring up Postgres (and the AI stack) with Docker Compose
docker compose up -d

# 4. Apply migrations and seed
npx prisma migrate deploy
npm run prisma:seed

# 5. Run the app
npm run dev
```

Every environment variable the code reads is documented in `.env.example`
(both the Next.js app and the Python `ai-service`).

## Quality gates

Run these before opening a PR. CI should enforce the same set (see the workflow
snippet in the PR that introduces it).

```bash
npx tsc --noEmit      # typecheck
npm run lint          # eslint
npx prisma validate   # schema is valid
npx prisma format     # schema is canonically formatted
npm run test          # vitest (unit/pure tests, no DB required)
npm run build         # production build (decoupled from a live DB)
```

For `ai-service`:

```bash
cd ai-service
pip install -r requirements.txt
pytest                # pure suites run standalone
# IDOR/contract suites are marked @pytest.mark.live and need the running stack:
#   docker compose --profile test up
```

## Conventions

- **Security first**: derive identity only from the signed session cookie, never
  from request bodies or query strings. Every route that acts on an id from the
  client must perform an object-level authorization check (see `src/lib/authz.ts`
  and `src/lib/api-auth.ts`). Add a regression test for any authz fix.
- **Validation**: validate mutation input (Zod where practical) and return 4xx,
  not 500, on bad input. Guard `request.json()` so a malformed body is a 400.
- **Database**: prefer a single query with `select`/`include` over per-row
  queries (avoid N+1). Add an `@@index` for any new hot filter/sort column and a
  matching migration.
- **Tests**: keep pure logic in DB-free modules so it can be unit-tested with
  Vitest. Name test files `*.test.ts` beside the code they cover.
- **Diffs**: keep them small and single-purpose. Do not mass-reformat files you
  did not otherwise change.

## Branches & PRs

- Never commit secrets or a real `.env`.
- Branch from `main`; open focused PRs. Describe what/why, list the gates you ran,
  and flag anything that needs infra (DB, external services) to verify.
