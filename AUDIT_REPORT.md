# EduFlow Audit Report

Updated: 2026-06-30

## Executive Status

Status: **Preview build passed; production is not ready for promotion.**

EduFlow now builds successfully on Vercel from a clean Git clone. The original Vercel failure was caused by Prisma Client not being generated during dependency installation. A second clean-build issue was caused by database access during Next.js route collection and home-page prerendering. Both are resolved in code.

The current preview is protected by Vercel account SSO, and the Vercel project has not been verified with a reachable hosted PostgreSQL `DATABASE_URL`. Full registration, admin-session, and course-CRUD smoke testing therefore remains blocked. Production has not been promoted.

## Deployment Snapshot

- Provider: Vercel for the Next.js preview.
- Branch: `codex/deployment-cleanup-2026-06-29`.
- Verified commit: `d8cb860` (`Decouple Vercel builds from database runtime`).
- Preview: `https://edu-flow-git-codex-deployment-clean-1e32ee-narutoglens-projects.vercel.app`.
- Vercel build status: passed on 2026-06-30.
- Preview access: protected; all anonymous route checks redirect to Vercel SSO.
- Production: not promoted.
- Local `.env`: retained as requested; no `.env.example` was created.

## Changes Verified

- Added `postinstall: prisma generate` so Vercel always generates the schema-specific Prisma Client.
- Added an explicit `CourseRecord[]` return boundary for admin course records.
- Made Prisma configuration generation-safe when deployment credentials are unavailable during install.
- Made Prisma Client initialization lazy so Next.js can inspect route modules without opening a database connection.
- Marked the database-backed home page as dynamic so catalog queries do not run during static prerendering.
- Excluded generated `.netlify/` output from ESLint.
- Preserved runtime safety: the first real database operation still throws a clear error when neither `DATABASE_URL` nor `NETLIFY_DB_URL` is configured.

## Verification

Passed on 2026-06-30:

```powershell
npm run lint
npm test
npm run build
$env:NODE_OPTIONS='--use-system-ca'; npm audit --omit=dev
```

Results:

- ESLint: passed.
- Vitest: 5 files and 31 tests passed.
- Next.js 16.2.7 production build: passed.
- Clean Vercel-style install and build with no local `.env`: passed.
- Production dependency audit: 0 vulnerabilities.
- Vercel preview build for `d8cb860`: passed.

Previously verified locally:

- Prisma migrations and seed against Docker PostgreSQL.
- First-user Admin bootstrap and later Student registration.
- Admin session persistence after refresh.
- Admin does not fall back to Student mode.
- Admin course create, edit, publish, soft-delete, and restore behavior.
- Five seeded sourced courses and APA 7 references.

## P0 Blockers

### P0: Hosted database is not verified

The real ignored `.env` points to local Docker PostgreSQL at `localhost`, which Vercel cannot reach. Vercel needs a hosted PostgreSQL connection string in `DATABASE_URL`, followed by migration and seed execution against that database.

Impact: registration, login, sessions, catalog queries, admin access, and course CRUD cannot be accepted on the hosted preview until this is complete.

### P0: Preview smoke is blocked by Vercel SSO

Anonymous requests to `/`, `/courses`, `/auth/register`, `/auth/login`, and `/api/ai/health` return `302` to Vercel SSO.

Impact: automated browser smoke cannot reach EduFlow. Preview protection must be disabled temporarily or a Vercel deployment-bypass credential must be provided for testing.

## P1 Risks

### P1: Former local database password exists in Git history

A stale README command contained a literal local PostgreSQL password. It has been removed from the current tree, and the active README now uses Docker Compose plus the ignored `.env`.

Impact: the old value is still recoverable from public Git history. Do not reuse it for any hosted or production service; rotate it locally if it is still active.

### P1: Production email delivery is not configured

Notifications work in-app and through the local console adapter. Inbox delivery still requires a real `EMAIL_WEBHOOK_URL` and production-safe `EMAIL_FROM` value.

### P1: AI service deployment is separate

Core LMS deployment can proceed without the Python AI service, but AI routes require a reachable service URL and matching token values before those flows can pass smoke testing.

### P1: Remaining mock-backed workflows

Some lecturer, teaching-assistant, certificate, review, and support paths still use legacy mock or non-persistent helpers. They should not be represented as fully production-backed yet.

### P1: Due-date reminders are not scheduled

Enrollment creates due-date notifications, but recurring reminders such as 24-hour notices still need a scheduled job.

## Security And Access

- Demo login shortcuts and seeded Student/Admin demo accounts are removed.
- Passwords and session tokens are hashed with Node crypto.
- Sessions are persisted and delivered through an httpOnly cookie.
- Public registration cannot choose a privileged role.
- The first active account becomes Admin only on a database with no existing Admin; later registrations become Student.
- Admin routes use server-side role guards.

## Required Next Actions

1. Provision or select hosted PostgreSQL for the Vercel preview.
2. Set Vercel preview variables: `DATABASE_URL`, `ENVIRONMENT`, `EMAIL_FROM`, and optional email/AI values.
3. Run Prisma migrations and `prisma/seed.mjs` against the hosted preview database.
4. Allow smoke access by disabling preview SSO temporarily or creating a deployment bypass.
5. Smoke registration, Admin persistence, role redirects, five seeded courses, references, and course CRUD.
6. Promote to production only if every preview smoke check passes.
