# EduFlow Code Review

Author: contribution review (collaborator `TatiShayo`)
Date: 2026-07-18
Base: `origin/main` @ `3947740`

This review **builds on** the existing `AUDIT_REPORT.md` (deployment/infra focus) rather than
replacing it. `AUDIT_REPORT.md` covers Vercel build, hosted-DB provisioning, and preview SSO
blockers. This document adds an application-layer review of **authorization/IDOR, reliability,
performance, and DX** in the route handlers, libraries, and the Python `ai-service`.

Fixes are split across four independent PRs, each cut fresh from `origin/main`:

| PR | Theme |
|----|-------|
| `pr/security-hardening` | authz/IDOR gates, rate limiting, CSP, headers |
| `pr/reliability` | JSON-parse guards (400 not 500), transactions, payment idempotency, graceful upstream failure |
| `pr/performance` | N+1 fixes, DB indexes (+ migration), catalog query |
| `pr/tests-and-dx` | regression tests, `.env.example`, `CONTRIBUTING.md`, CI snippet |

## Gate status (run locally on Windows, no live Postgres available)

- `npx tsc --noEmit` — PASS on `main` and on each branch.
- `npm run lint` (eslint) — PASS.
- `npx prisma validate` / `prisma format` — PASS.
- `npm run test` (vitest) — PASS (31 baseline + new regression tests; all DB-free/pure).
- `npm run build` — decoupled from DB but requires network/font access in this sandbox; see per-PR notes.
- `ai-service` `pytest` — the API/IDOR suites are marked `@pytest.mark.live` and need the running
  compose stack (Postgres + Redis + ai-service). Not runnable here; reviewed statically. Pure
  suites (`tests/test_srs.py`, `test_ssrf.py`) are runnable.

## Findings (severity-ranked)

| # | Sev | Area | File:line | Problem | Fix | PR |
|---|-----|------|-----------|---------|-----|----|
| 1 | **Critical** | AuthZ / payment bypass | `src/app/api/progress/route.ts:37-60` | POST upserts `lessonProgress` **and** `enrollment` for any `courseId`/`lessonId`. The `create` branch of the enrollment upsert lets a signed-in student **self-enroll in any course (including paid) without paying** and mark progress on courses they never joined. No enrollment check. | Require an existing enrollment (`isEnrolled`) before writing progress; return 403 otherwise. Never auto-create an enrollment here. | security |
| 2 | **High** | AuthZ / IDOR | `src/app/api/quizzes/submit/route.ts:14-55` | `requireRole("STUDENT")` only. Any student can submit a quiz attempt against **any quiz in any course** they are not enrolled in (horizontal data injection). The DB-free scorer in `assessments.ts` already gates on enrollment, but this handler bypasses it. | Add `isEnrolled(student.id, quiz.courseId)` gate → 403. | security |
| 3 | **High** | AuthZ / IDOR | `src/app/api/assignments/submit/route.ts:15-33` | Same class as #2: creates an `AssignmentSubmission` for any assignment without an enrollment check. | Add `isEnrolled` gate on `assignment.courseId` → 403. | security |
| 4 | **High** | Reliability | multiple route handlers | `await request.json()` with no `.catch` in `auth/register`, `auth/session`, `quizzes/submit`, `assignments/submit`, `progress`. A malformed body throws → **500** instead of 400. | Guard JSON parsing; return a 400 envelope. (register/session guards land in security since it also touches them; the rest in reliability.) | security + reliability |
| 5 | **High** | Reliability / payments | `src/app/api/payments/checkout/route.ts`, `src/app/api/enrollments/route.ts` | No `Payment` row is ever written; the `Payment` model + `PaymentStatus` exist but are unused. "Checkout" just redirects to `?checkout=success`. No idempotency key, no atomic enroll+pay. | Record a `Payment` (idempotent on `providerRef`) and wrap enroll+pay in `prisma.$transaction`. Marked partial — real PSP integration is NEEDS HUMAN. | reliability |
| 6 | **Medium** | Reliability / atomicity | `src/app/api/progress/route.ts`, `src/app/api/admin/courses/route.ts` | Multiple dependent writes run sequentially without a transaction; a mid-sequence failure leaves partial state. | Wrap related writes in `prisma.$transaction`. | reliability |
| 7 | **Medium** | Rate limiting | `src/app/api/auth/session/route.ts`, `src/app/api/auth/register/route.ts` | No rate limiting on login/registration → credential stuffing / account-enumeration brute force. | Add a lightweight fixed-window limiter (per-instance, best-effort) on auth POSTs; return 429. Distributed limiter is NEEDS HUMAN. | security |
| 8 | **Medium** | Performance / N+1 | `src/lib/course-data.ts:216-225` | `getEnrollmentsForStudentFromDb` calls `getEnrollmentFromDb` per row; each does a deep `findUnique` + a `lessonProgress.findMany`. Dashboard load is O(enrollments) round-trips. | Batch: one query for enrollments+course lessons, one for completed progress, assemble in memory. | performance |
| 9 | **Medium** | Performance / indexes | `prisma/schema.prisma` | Hot filter columns lack indexes: `Enrollment.courseId`, `LessonProgress` (student/completed lookups), `QuizAttempt.studentId`/`quizId`, `AssignmentSubmission.studentId`/`assignmentId`/`status`, `Notification.userId`, `Payment.studentId`/`courseId`, `Course.lecturerId`, `CourseAssistant.userId`, `Review.studentId`. | Add `@@index`es + a migration. | performance |
| 10 | **Medium** | Performance / pagination | `src/lib/course-data.ts:311-340` (`filterCoursesFromDb`) | Loads **all** published courses with the full deep `courseInclude`, then filters/sorts in memory. Grows unbounded; no pagination on the catalog. | Push filters to SQL where cheap; add `take`/`skip` pagination. Full rewrite noted; PR adds pagination + a lean list select. | performance |
| 11 | **Low** | Security headers / CSP | `next.config.ts:16-17` | `script-src 'unsafe-inline'` and `style-src 'unsafe-inline'` weaken XSS defense; no nonce pipeline. | Documented as accepted risk; tighten `Permissions-Policy`, keep CSP. Nonce pipeline is NEEDS HUMAN. | security |
| 12 | **Low** | ai-service rate limit | `ai-service/app/core/config.py:34` | `rate_limit_voice_per_min` is configured but **never enforced** in `assistant.py upload_voice`. | Enforce the per-user voice limit (or document unenforced). Left as static finding + note; no live stack to test. | (noted) |
| 13 | **Info** | DX | repo root | No `.env.example` despite many `process.env` reads across app + ai-service; no `CONTRIBUTING.md`; CI not present. | Add `.env.example`, `CONTRIBUTING.md`, CI snippet (NEEDS HUMAN — token lacks `workflow` scope). | tests-and-dx |

## What was verified positively (no change needed)

- Session cookies are `httpOnly`, `sameSite=lax`, `secure` in production, path-scoped (`session.ts`).
- Session tokens stored as SHA-256 hashes; passwords are PBKDF2-SHA256 (120k iters) with `timingSafeEqual`.
- Object-level authz for grading/certificates is correctly centralized (`authz.ts`, `grading-rules.ts`)
  and the certificate IDOR (`?studentId=`) is already fixed.
- `safeNext` blocks open redirects; `proxy.ts` is a defense-in-depth pre-check, not the source of truth.
- `ai-service` verifies HS256 service tokens with audience, fails closed, and enforces
  `can_read_course` / ownership on every endpoint reviewed.

## NEEDS HUMAN (consolidated)

1. Provision hosted Postgres and run the new index migration (`prisma migrate deploy`); if two PRs'
   migrations land together, renumber trivially (timestamps already sort).
2. Set env vars per `.env.example` (`DATABASE_URL`, `AI_SERVICE_TOKEN_SECRET`, `EMAIL_*`, etc.).
3. Add CI workflow (snippet in `pr/tests-and-dx` body) — token lacks `workflow` scope.
4. Replace the mock checkout with a real PSP + webhook; the reliability PR only adds the
   `Payment`-row + idempotency scaffolding.
5. Rate limiting is per-instance/in-memory; move to a shared store (Redis) for multi-instance deploys.
6. Enforce `ai-service` voice rate limit and run the `@pytest.mark.live` IDOR suite against the stack.
7. CSP still allows `unsafe-inline`; add a nonce pipeline to remove it.
