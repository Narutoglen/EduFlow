# EduFlow

<<<<<<< HEAD
EduFlow is a full-stack Next.js LMS with role dashboards for Students,
Lecturers, Teaching Assistants, and Admins. It runs on a **real PostgreSQL
database** with **real authentication** — accounts, scrypt-hashed passwords,
and signed session cookies — plus seeded catalog content for the courses,
quizzes, assignments, and certificates.
=======
EduFlow is a full-stack Next.js learning platform with role dashboards for
Students, Lecturers, Teaching Assistants, and Admins. It runs locally without
external credentials by using seeded in-memory data and replaceable service
integrations.
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a

## What is included

- Course catalog with search, filters, pricing, ratings, details, syllabus, and reviews.
- Student learning dashboard, course player, notes, resources, quizzes, assignments, forums, grades, progress, and certificate verification.
- Lecturer workspace with course builder structure, modules, lesson ordering handles, grading, announcements, analytics, and live session scheduling.
- Teaching Assistant workspace for delegated rosters, grading, and forum moderation without content editing.
- Admin console for user management, course approvals, analytics, revenue, categories, and global settings.
- Prisma/PostgreSQL schema and seed script for the production data model.
- Replaceable integrations for payments, email, storage, video playback, certificates, and Auth.js-compatible JWT sessions.

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
npm run prisma:generate
npm run prisma:push      # creates the tables from prisma/schema.prisma
npm run prisma:seed      # creates the demo accounts (prints credentials)

# 3. Run the app
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
```

## Database setup

<<<<<<< HEAD
`.env` is configured for the Docker Postgres above. To point at a different
database, edit `DATABASE_URL` in `.env`:
=======
Copy `.env.example` to `.env` and set `DATABASE_URL` when you want to use
PostgreSQL and Prisma instead of the local seeded data.
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a

```bash
DATABASE_URL="postgresql://eduflow:<password>@localhost:5432/eduflow?schema=public"
SESSION_SECRET="<32-byte hex secret used to sign session cookies>"
```

Prisma 7 connects through the `pg` driver adapter (see `src/lib/prisma.ts`).

## Demo accounts

These accounts are created in the database by `npm run prisma:seed`. Sign in at
[`/auth/login`](http://localhost:3000/auth/login) — each lands on its own role
workspace.

<<<<<<< HEAD
| Role              | Email                          | Password       |
| ----------------- | ------------------------------ | -------------- |
| Student           | `amina@student.eduflow.test`   | `Student123!`  |
| Lecturer          | `mateo@lecturer.eduflow.test`  | `Lecturer123!` |
| Teaching Assistant| `leah@ta.eduflow.test`         | `Assistant123!`|
| Admin             | `noah@admin.eduflow.test`      | `Admin123!`    |

You can also self-register a new learner account at `/auth/register`.

Authentication is real: passwords are scrypt-hashed in Postgres, sessions are
signed HttpOnly cookies, and every role route is guarded server-side.
=======
The local auth pages expose the intended flows while avoiding real OAuth,
email, and credential setup during local review.
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
