---
project: EduFlow
type: codex-skills-plan
status: draft
updated: 2026-06-16
tags:
  - eduflow
  - codex
  - skills
---

# EduFlow Codex Skills

## Purpose
Use skills to make Codex behave consistently across EduFlow work and future projects.

## Recommended Skills

### `eduflow-project-manager`
Use when:
- asking for project status
- planning deployment
- auditing readiness
- turning engineering state into a project report

Skill behavior:
- read Obsidian handoff notes first
- check git status
- identify current step
- separate completed, blocked, and next actions
- update Obsidian notes after major work

### `nextjs-deployment-checklist`
Use when:
- preparing a Next.js deployment
- debugging build, lint, npm, or hosting issues
- checking preview readiness

Skill behavior:
- run lint, tests, build, audit
- check env vars
- check app routes
- inspect hosting config
- produce deployment report

### `product-audit`
Use when:
- reviewing UX
- finding dead ends
- improving dashboards, course pages, forms, and flows

Skill behavior:
- inspect user journeys by role
- identify confusing copy
- find placeholder or internal language
- recommend fixes by severity
- implement fixes when asked

## Draft Skill: EduFlow Project Manager

```md
---
name: eduflow-project-manager
description: Use when working on EduFlow planning, audits, deployment readiness, roadmap reports, status checks, or project-manager style reviews. Read EduFlow Obsidian notes, inspect project state, identify current step, and report completed work, blockers, risks, and next actions.
---

# EduFlow Project Manager

Start by reading:
- `obsidian/EduFlow/05 Codex Handoff.md`
- `obsidian/EduFlow/02 Deployment.md`
- `obsidian/EduFlow/04 Bugs and Risks.md`

Then inspect:
- `git status --short --branch`
- `package.json`
- recent changed files relevant to the request

For deployment work, verify:
- `npm run lint`
- `npm test`
- `npm run build`
- `npm audit --omit=dev`

Always report:
- current step
- completed work
- blockers
- risks
- next recommended action

After major work, update the relevant Obsidian notes.
```

## Draft Skill: Next.js Deployment Checklist

```md
---
name: nextjs-deployment-checklist
description: Use when preparing, validating, troubleshooting, or reporting on deployment for a Next.js app. Covers dependency checks, lint, tests, production build, environment variables, smoke tests, preview deployment, and production readiness.
---

# Next.js Deployment Checklist

Run:
- `npm install`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm audit --omit=dev`

Check:
- Next version and lockfile health
- required environment variables
- image domains
- route handlers
- form actions
- redirects
- hosting config

Smoke test:
- home page
- primary user dashboard
- key dynamic pages
- changed API routes

Report:
- pass/fail summary
- deployment blockers
- exact next step
```

## Where To Install Skills
Recommended location:

```text
C:\Users\Jeruto\.codex\skills
```

Each skill should be its own folder with a `SKILL.md` file.
