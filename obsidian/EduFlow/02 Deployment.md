---
project: EduFlow
type: deployment-status
status: pre-deployment
updated: 2026-06-16
tags:
  - eduflow
  - deployment
---

# EduFlow Deployment

## Current Step
Pre-deployment cleanup is complete locally. The next deployment step is to commit the current changes, push to GitHub, then connect or trigger the hosting deployment.

## Completed Locally
- Dead code audit completed.
- User-facing dead ends cleaned up.
- Role-aware navigation implemented.
- Student next-action card added.
- Learning page grouped with a right-side tools area.
- Resource links now resolve through `/api/resources/[resourceId]`.
- Old `/api/auth/demo` route removed.
- Unused `src/lib/auth.ts` removed.
- Generated Python bytecode files removed from tracking.
- `server-only` dependency added explicitly.
- PostCSS override added to resolve npm audit issue.

## Last Known Verification
Run date: 2026-06-13

```bash
npm run lint
npm test
npm run build
npx knip
npm audit --omit=dev
```

Results:
- Lint passed.
- Vitest passed: 2 files, 9 tests.
- Next production build passed.
- Knip dead-code scan passed with no findings after cleanup.
- npm audit passed with 0 vulnerabilities after PostCSS override.
- Browser smoke check passed for dashboard, lesson tools, auth, redirects, resource downloads, and no console errors.

## Not Yet Done
- Current changes are not committed.
- Current changes are not pushed to GitHub.
- Hosting provider is not confirmed in these notes.
- Production environment variables are not configured in these notes.
- Preview deployment has not been verified in these notes.
- AI service deployment target is not confirmed.

## Deployment Sequence
1. Review working tree.
2. Commit cleanup and UX changes.
3. Push branch to GitHub.
4. Choose deployment target.
5. Configure environment variables.
6. Deploy preview.
7. Smoke test preview.
8. Promote to production only after preview passes.

## Commands

```bash
git status --short --branch
npm run lint
npm test
npm run build
npm audit --omit=dev
```

## Smoke Test Routes
- `/`
- `/courses`
- `/courses/ai-powered-teaching`
- `/dashboard`
- `/learn/course-ai-teaching/lesson-ai-3`
- `/lecturer`
- `/ta`
- `/admin`
- `/auth/login`
- `/api/resources/res-ai-4`

## Environment Variables To Confirm
- `DATABASE_URL`
- AI service URL and token values, if deploying AI routes.
- Auth provider secrets, if replacing local auth flow.
- Payment provider keys, if enabling paid checkout.
- Storage provider credentials, if enabling real uploads.

## Deployment Decision Needed
Choose one:
- Deploy only the Next app first.
- Deploy Next app plus AI service.
- Deploy full stack with database and AI service.

Recommended next move:
Deploy the Next app preview first, with AI-dependent routes either configured against a hosted AI service or treated as non-blocking for the first preview.
