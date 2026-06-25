# EduFlow Audit Report

Updated: 2026-06-22

## Current Implementation Snapshot

This report reflects the current working tree after the registration, cookie, notification, and theme pass.

- Demo login shortcuts and prefilled seeded credentials have been removed from the auth UI.
- `prisma/seed.mjs` no longer creates student/admin demo logins, demo passwords, enrollments, certificates, quiz attempts, assignment submissions, or demo notifications.
- The seed still creates locked platform staff records needed for seeded course ownership and assistance. These records have no password hash and cannot sign in through the normal password flow.
- Public registration is implemented at `/auth/register` with `/api/auth/register`.
- First active registered user becomes `ADMIN` on a fresh seeded database; later public registrations become `STUDENT`.
- Registration creates a Prisma user, hashes the password, creates a persisted session, sets the httpOnly session cookie, creates an in-app notification, and sends a best-effort email notification.
- Users can opt into email notifications during registration. Email sending uses the existing local console adapter or `EMAIL_WEBHOOK_URL` if configured.
- `.env` contains local `EMAIL_FROM` and blank `EMAIL_WEBHOOK_URL` values; set the webhook to a real mail provider endpoint to deliver to inboxes.
- Assignment due-date notifications are created when a student enrolls in a course.
- Quiz/exam submission and assignment submission now write to Prisma and create in-app plus email notifications.
- Student dashboard now reads notifications, quiz attempts, and assignment submissions from Prisma instead of mock data.
- First-visit cookie consent banner is implemented with "Essential only" and "Accept cookies" choices.
- Dark mode remains default. A user-facing light/dark toggle now stores preference in `localStorage` and applies a class-based Tailwind dark mode.
- README has been updated to remove demo-account instructions and describe registration.

## Verification

Passed:

```powershell
$env:NODE_OPTIONS='--use-system-ca'; npx prisma validate
$env:NODE_OPTIONS='--use-system-ca'; npx prisma generate
$env:NODE_OPTIONS='--use-system-ca'; npm run lint
$env:NODE_OPTIONS='--use-system-ca'; npm test
$env:NODE_OPTIONS='--use-system-ca'; npm run build
$env:NODE_OPTIONS='--use-system-ca'; npm audit --omit=dev
```

Results:

- Prisma schema is valid.
- Prisma Client generated successfully.
- ESLint passed.
- Vitest passed: 2 files, 9 tests.
- Next production build passed and includes `/api/auth/register`.
- npm audit reported 0 vulnerabilities.
- Text scan found no remaining `eduflow.test`, quick-role login, seeded demo login, or prefilled auth email strings in active app, seed, or README surfaces: `README.md`, `prisma/seed.mjs`, and `src`.

Blocked:

```powershell
docker compose up -d postgres
$env:NODE_OPTIONS='--use-system-ca'; npx prisma migrate dev
$env:NODE_OPTIONS='--use-system-ca'; npx prisma migrate status
$env:NODE_OPTIONS='--use-system-ca'; npm run prisma:seed
```

Docker Desktop is not running or not reachable from this shell:

```text
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
```

Because of that, the new migration and updated seed have not been applied to the local Docker Postgres database in this pass.

## P0 Findings

### P0: Demo accounts in active login flow
- Status: Resolved in code.
- Fix: Removed quick-role access buttons, removed prefilled login/reset emails, removed seeded demo users/passwords from `prisma/seed.mjs`, and removed old `eduflow.test` fixture emails.
- Verification: Static scan found no remaining demo-account login strings.
- Remaining verification: Apply migration and seed once Docker Desktop is running.

### P0: Registration was static/nonfunctional
- Status: Resolved.
- Fix: Added `/api/auth/register`, real Prisma user creation, password hashing, session creation, cookie setting, and registration notification.
- Security choice: Public registration creates only `STUDENT` accounts after bootstrap. The first active registered user becomes Admin only when no Admin exists.
- Verification: Build and TypeScript passed.

### P0: Submission confirmations were non-persistent
- Status: Resolved for quiz/exam and assignment submissions.
- Fix: `/api/quizzes/submit` and `/api/assignments/submit` now use Prisma, create records, and send in-app/email confirmations.
- Verification: Build and TypeScript passed.

## P1 Findings

### P1: Database migration/seed not applied locally
- Status: Blocked by Docker Desktop.
- Impact: The code and migration are present, but local Postgres still needs `migrate dev` and `prisma:seed` after Docker is started.
- Fix once unblocked:

```powershell
docker compose up -d postgres
$env:NODE_OPTIONS='--use-system-ca'; npx prisma migrate dev
$env:NODE_OPTIONS='--use-system-ca'; npm run prisma:seed
```

### P1: Email delivery is local/webhook-based
- Status: Implemented as best-effort infrastructure.
- Details: Without `EMAIL_WEBHOOK_URL`, emails are logged through the console adapter. With `EMAIL_WEBHOOK_URL`, EduFlow posts transactional email payloads to that webhook.
- Recommended next step: Configure a real email provider or webhook before production.

### P1: Cookie consent is preference capture, not full compliance suite
- Status: Implemented for first-visit choice.
- Details: Users can choose essential-only or accepted cookies. The implementation stores the choice in a first-party cookie and localStorage.
- Recommended next step: Add a privacy/cookie policy page before production.

## P2 Findings

### P2: Theme coverage needs browser smoke when DB is available
- Status: Code complete, build verified.
- Details: Dark is the default; light mode toggle is implemented and persisted.
- Recommended next step: Browser smoke after Docker is running to visually inspect light and dark pages.

### P2: Lecturer/TA/certificate flows still have mock-backed areas
- Status: Existing follow-up.
- Details: This pass fixed auth, registration, student notifications, quiz submissions, assignment submissions, and dashboard notification data. Some lecturer, TA, certificate verification, and review paths still depend on legacy mock helpers.
- Recommended next step: Convert remaining staff/certificate workflows to Prisma.

### P2: Assignment due-date reminders are not scheduled yet
- Status: Partially implemented.
- Details: EduFlow now creates in-app/email due-date notifications when a student enrolls in a course that has assignments. It does not yet run a background reminder job for reminders such as 24 hours before a due date.
- Recommended next step: Add a scheduled worker or cron-backed route before production reminder guarantees are promised.

## P3 Findings

### P3: Working tree remains mixed with previous unrelated cleanup
- Status: Existing condition.
- Details: The working tree still includes earlier deleted in-repo Obsidian mirror files plus the previous Prisma/auth/admin work.
- Recommendation: Keep review/staging intentional and do not revert unrelated deletions unless explicitly requested.

## Next Actions

1. Start Docker Desktop.
2. Run Prisma migrate and seed to apply `emailNotifications` and remove demo accounts from the local database.
3. Register the first real account through `/auth/register` and confirm it becomes Admin.
4. Register a second account and confirm it becomes Student.
5. Enroll the Student in a course and verify assignment due-date notification.
6. Submit a quiz and assignment and verify dashboard notifications plus console/webhook email output.
7. Browser-smoke cookie consent and light/dark mode.
