---
project: EduFlow
type: qa-checklist
status: active
updated: 2026-06-16
tags:
  - eduflow
  - qa
---

# EduFlow QA Checklist

## Local Checks

```bash
npm run lint
npm test
npm run build
npm audit --omit=dev
```

Optional dead-code check:

```bash
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/eduflow
npx knip --no-progress --no-exit-code
```

PowerShell version:

```powershell
$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5432/eduflow'
npx knip --no-progress --no-exit-code
```

## Smoke Test Pages
- `/`
- `/courses`
- `/courses/ai-powered-teaching`
- `/dashboard`
- `/learn/course-ai-teaching/lesson-ai-3`
- `/lecturer`
- `/ta`
- `/admin`
- `/auth/login`
- `/auth/reset`
- `/verify/EDU-2026-DATA-9K2`

## API Smoke Tests
- `GET /api/resources/res-ai-4`
- `POST /api/progress`
- `POST /api/quizzes/submit`
- `POST /api/assignments/submit`
- `GET /api/payments/checkout?courseId=course-ai-teaching`
- `POST /api/auth/session`

## UX Checks
- Student nav shows courses, my learning, sign in.
- Student dashboard has a clear continue action.
- Lesson page has lesson content and learning tools grouped.
- Locked lessons do not use dead links.
- Resource downloads return useful files.
- Quiz and assignment submissions redirect with a notice.
- Admin approval actions show meaningful status.
- Lecturer new course action shows useful state.
- TA grading action shows useful state.
- Login and reset flows do not expose internal wording.

## Content Checks
Search for dead or internal wording:

```bash
rg -n 'href="#"|url: "#"|api/auth/demo|mock-enrollment|MVP|placeholders|not implemented|TODO|FIXME' src README.md
```

Search for tracked generated Python files:

```bash
git ls-files | rg '__pycache__|\.pyc$'
```

## Production Preview Checks
- Preview URL opens.
- Static assets load.
- Remote images load.
- No browser console errors on core routes.
- Form redirects work on preview.
- Environment variables are present.
- AI routes either work or fail gracefully.
