---
project: EduFlow
type: roadmap
status: active
updated: 2026-06-16
tags:
  - eduflow
  - roadmap
---

# EduFlow Roadmap

## Now
- Finish pre-deployment cleanup.
- Commit the current audit and UX improvements.
- Push changes to GitHub.
- Connect deployment provider.
- Configure required environment variables.
- Deploy preview.
- Smoke test preview.

## Next
- Replace local seeded data with database-backed data where needed.
- Connect real auth provider or production-ready Auth.js flow.
- Decide production hosting split:
  - Next app hosting
  - AI service hosting
  - database hosting
  - file storage
- Add end-to-end checks for primary learner, lecturer, TA, and admin flows.
- Add production observability basics: errors, logs, uptime, deployment status.

## Later
- Real payment integration.
- Real file uploads and assignment storage.
- Certificate rendering and durable verification.
- Rich course authoring workflow.
- Live session integration.
- Production AI service with durable jobs, model configuration, and monitoring.

## Product Quality Themes
- Role-aware navigation.
- Clear next action on every dashboard.
- Less crowded lesson workspace.
- No learner-facing internal wording.
- More actionable admin, lecturer, and TA flows.
- Stronger course catalog confidence.
- Better trust signals and review consistency.

## Definition Of Done For Deployment Readiness
- `npm run lint` passes.
- `npm test` passes.
- `npm run build` passes.
- `npm audit --omit=dev` has no vulnerabilities or known accepted exceptions.
- No `href="#"` or user-facing dead ends remain in the Next app.
- All changed form actions either complete, redirect, or show useful state.
- Preview deployment URL opens successfully.
- Core routes pass smoke test.
