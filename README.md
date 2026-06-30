# EduFlow

EduFlow is a full-stack Next.js learning platform with role dashboards for
Students, Lecturers, Teaching Assistants, and Admins. It runs locally against
Docker Postgres through Prisma, with registration-backed users, sourced
courses, and replaceable service integrations.

## What is included

- Course catalog with search, filters, pricing, ratings, details, syllabus, and reviews.
- Student learning dashboard, course player, notes, resources, quizzes, assignments, forums, grades, progress, and certificate verification.
- Lecturer workspace with course builder structure, modules, lesson ordering handles, grading, announcements, analytics, and live session scheduling.
- Teaching Assistant workspace for delegated rosters, grading, and forum moderation without content editing.
- Admin console for user management, course approvals, analytics, revenue, categories, and global settings.
- Prisma/PostgreSQL schema, migration, and seed script for the local data model.
- Prisma-backed registration and login with hashed passwords, persisted sessions, and an httpOnly session cookie.
- First-visit cookie preference banner and a dark-default theme with a light-mode toggle.
- In-app and email notifications for registration, assignment due dates, quiz submission, and assignment submission.
- Admin course CRUD for creating, editing, publishing, soft-deleting, restoring, and referencing courses.
- Five seeded courses with APA 7 source references from official education, accessibility, AI, assessment, and Kenya data-protection sources.
- Broad curriculum pack for 11 Secondary+ courses across STEM, digital skills, AI, humanities, law, and finance in `CURRICULUM_PACK.md`.
- Replaceable integrations for payments, email, storage, video playback, and certificates.

## Run locally

EduFlow needs a Postgres database. The quickest path uses Docker:

```bash
# Install dependencies, start Postgres, migrate, and seed sourced courses
npm install
docker compose up -d postgres
npm run prisma:generate
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `.env` already contains a
working local `DATABASE_URL` for development.

If you reset the database volume, re-run the migrations and seed command.

## Useful scripts

```bash
npm run lint
npm run test
npm run build
npm run prisma:generate
npm run prisma:seed
npx prisma validate
npx prisma migrate status
```

## Database setup

This project intentionally does not create or rely on `.env.example`. For local
development, edit the real ignored `.env` directly. It should include
`DATABASE_URL` for the Docker Postgres service. Email notifications use
`EMAIL_FROM` and, when configured, `EMAIL_WEBHOOK_URL`; without a webhook,
transactional email payloads are logged locally.

```bash
docker compose up -d postgres
npx prisma migrate dev
npm run prisma:seed
```

The current seed resets local LMS data and recreates locked platform staff
records for course ownership plus five published courses, modules, lessons,
resources, quiz/assignment content, and APA 7 references. It does not create
student/admin demo logins.

## Accounts

Create accounts from `/auth/register`. On a fresh seeded database, the first
active registered user becomes the platform Admin. After that, public
registration creates Student accounts only.

## Verification

```bash
npm run lint
npm test
npm run build
$env:NODE_OPTIONS='--use-system-ca'; npm audit --omit=dev
```

Browser smoke should confirm admin login persistence, admin route guards,
course create/edit/delete, seeded course references, and no failed remote video
asset requests.

## Vercel preview

Vercel installs run `prisma generate` automatically through `postinstall`.
The build does not require live database access, but the running application
does. Configure a hosted PostgreSQL `DATABASE_URL` in the Vercel preview
environment, apply `prisma/migrations`, and run `prisma/seed.mjs` before hosted
registration, login, catalog, or Admin smoke testing.

Do not use the local `localhost` database URL in Vercel. Keep production
promotion gated until the protected preview has passed the smoke checks listed
in `AUDIT_REPORT.md`.
