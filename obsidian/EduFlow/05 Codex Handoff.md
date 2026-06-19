---
project: EduFlow
type: codex-handoff
status: active
updated: 2026-06-16
tags:
  - eduflow
  - codex
  - handoff
---

# EduFlow Codex Handoff

## Current State
EduFlow has completed local cleanup and product polish work. The app builds locally and the main Next.js checks passed during the last audit. The project is not yet deployed from the latest changes because the working tree still needs review, commit, and push.

## Current Deployment Step
Commit and push the current cleanup changes, then create or trigger a preview deployment.

## Most Recent Work Completed
- Role-aware navigation.
- Student dashboard next-action card.
- Lesson page grouped with a right-side learning tools area.
- Learner-facing prototype/internal wording removed.
- Admin, lecturer, and TA flows made more actionable.
- Catalog confidence improved.
- Trust signals strengthened.
- Resource links made real.
- Dead routes and unused auth helper removed.
- Python bytecode artifacts removed from tracking.
- npm audit resolved with PostCSS override.

## Known Verification
Passed:

```bash
npm run lint
npm test
npm run build
npm audit --omit=dev
npx knip
```

Browser checks passed for:
- dashboard next action
- role-aware nav
- lesson learning tools
- no dead `#` links
- auth redirect
- progress redirect
- quiz redirect
- assignment redirect
- checkout redirect
- resource download

## Known Blockers
- Python AI service tests need a proper Python environment with dependencies installed.
- Deployment provider and target scope are not recorded here yet.
- Latest changes are not committed or pushed.

## Start Every Codex Session With
1. Read this file.
2. Read `02 Deployment.md`.
3. Run:

```bash
git status --short --branch
```

4. If deployment work is requested, run:

```bash
npm run lint
npm test
npm run build
npm audit --omit=dev
```

## User Preference
Act like a project manager and senior engineer:
- identify the current step
- keep the next action clear
- avoid vague status
- fix what can be fixed
- report what passed and what is blocked

## Next Best Action
Review the working tree, commit the cleanup changes, push to GitHub, then connect or trigger preview deployment.
