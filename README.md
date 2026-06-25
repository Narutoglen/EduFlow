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
# 1. Start Postgres (published on localhost:5432)
docker run -d --name eduflow-db \
  -e POSTGRES_USER=eduflow \
  -e POSTGRES_PASSWORD=MpzKHkylmLWFIGqH39GlloUC \
  -e POSTGRES_DB=eduflow \
  -p 5432:5432 postgres:16-alpine

# 2. Install deps, create tables, seed demo accounts
npm install
docker compose up -d postgres
npm run prisma:generate
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `.env` already contains a
working `DATABASE_URL` and `SESSION_SECRET` for local development.

If you restart the database container, re-run `npm run prisma:push` and
`npm run prisma:seed`.

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
