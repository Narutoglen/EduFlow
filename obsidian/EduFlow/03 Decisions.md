---
project: EduFlow
type: decisions
status: active
updated: 2026-06-16
tags:
  - eduflow
  - decisions
---

# EduFlow Decisions

## Decision Log

### 2026-06-13 - Keep Nested `EduFlow/` Clone, Ignore From Parent Project
Decision:
The nested `EduFlow/` directory is a separate clean Git clone with its own remote. Do not delete it from the parent workspace. Ignore it from parent project tooling.

Reason:
Deleting a separate clone could remove useful independent state. Ignoring it prevents lint and dead-code tools from scanning duplicate stale files.

Files:
- `.gitignore`
- `eslint.config.mjs`

### 2026-06-13 - Replace Dead Resource Links With Download Route
Decision:
Resource URLs should point to `/api/resources/[resourceId]` instead of `#`.

Reason:
Learners should never click a resource and land nowhere.

Files:
- `src/lib/mock-data.ts`
- `src/lib/eduflow.ts`
- `src/app/api/resources/[resourceId]/route.ts`

### 2026-06-13 - Move Auth Flow To `/api/auth/session`
Decision:
Use `/api/auth/session` for local login and reset flows. Remove old `/api/auth/demo`.

Reason:
The old route name exposed prototype wording and was less production-like.

Files:
- `src/app/api/auth/session/route.ts`
- `src/app/auth/login/page.tsx`
- `src/app/auth/reset/page.tsx`

### 2026-06-13 - Make User Actions Redirect Back To Useful UI State
Decision:
Progress, quiz, assignment, checkout, and auth actions should redirect or return useful JSON instead of ending at raw API responses.

Reason:
Form actions should feel complete to learners and reviewers.

Files:
- `src/app/api/progress/route.ts`
- `src/app/api/quizzes/submit/route.ts`
- `src/app/api/assignments/submit/route.ts`
- `src/app/api/payments/checkout/route.ts`
- `src/app/api/auth/session/route.ts`

### 2026-06-13 - Add PostCSS Override
Decision:
Override `postcss` to `8.5.15`.

Reason:
npm audit reported a moderate PostCSS issue under Next's dependency tree. The override resolved the audit without downgrading Next.

Files:
- `package.json`
- `package-lock.json`

## Pending Decisions
- Hosting provider for Next app.
- Hosting provider for AI service.
- Database provider.
- Auth provider.
- Payment provider.
- Whether first deployment includes the AI service or only the core LMS app.
