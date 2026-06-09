# EduFlow

EduFlow is a full-stack Next.js LMS MVP with role dashboards for Students,
Lecturers, Teaching Assistants, and Admins. The first milestone is runnable
without external credentials by using seeded in-memory demo data and mock
service adapters.

## What is included

- Course catalog with search, filters, pricing, ratings, details, syllabus, and reviews.
- Student learning dashboard, course player, notes, resources, quizzes, assignments, forums, grades, progress, and certificate verification.
- Lecturer workspace with course builder structure, modules, lesson ordering handles, grading, announcements, analytics, and live session placeholders.
- Teaching Assistant workspace for delegated rosters, grading, and forum moderation without content editing.
- Admin console for user management, course approvals, analytics, revenue, categories, and global settings.
- Prisma/PostgreSQL schema and seed script for the production data model.
- Mock adapters for payments, email, storage, video playback, certificates, and Auth.js-compatible JWT sessions.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful scripts

```bash
npm run lint
npm run test
npm run build
npm run prisma:generate
npm run prisma:seed
```

## Database setup

Copy `.env.example` to `.env` and set `DATABASE_URL` when you want to use
PostgreSQL and Prisma instead of the local demo data.

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eduflow"
```

## Demo accounts

- Student: `amina@student.eduflow.test`
- Lecturer: `mateo@lecturer.eduflow.test`
- Teaching Assistant: `leah@ta.eduflow.test`
- Admin: `noah@admin.eduflow.test`

The local auth pages expose the intended flows while avoiding real OAuth,
email, and credential setup during MVP review.
