---
project: EduFlow
type: project-brief
status: active
updated: 2026-06-16
tags:
  - eduflow
  - project
  - lms
---

# EduFlow Project Brief

## One-Line Summary
EduFlow is a full-stack learning platform with role-aware experiences for students, lecturers, teaching assistants, and administrators.

## Product Goal
Build a polished LMS experience that helps learners continue coursework, instructors manage content and grading, TAs support learners, and admins oversee quality, users, approvals, revenue, and platform health.

## Core Roles
- Student: discovers courses, continues lessons, submits quizzes and assignments, views grades, earns certificates.
- Lecturer: manages courses, announcements, grading, sessions, and course analytics.
- Teaching Assistant: supports delegated courses, moderates discussions, and grades assigned submissions.
- Admin: manages users, approvals, categories, metrics, revenue, and platform settings.

## Current Product Direction
- Make the application feel like a real learning product, not a prototype.
- Remove dead ends, placeholder actions, and developer-facing wording from learner-facing screens.
- Keep dashboards focused on clear next actions.
- Keep navigation role-aware.
- Improve catalog trust with outcomes, effort, level, reviews, and certificate proof.

## Technical Shape
- Frontend and BFF: Next.js app router.
- UI: React, Tailwind CSS, lucide-react icons.
- Local app data: seeded in-memory data in `src/lib/mock-data.ts`.
- Future production data model: Prisma and PostgreSQL.
- AI service: Python FastAPI service under `ai-service`.

## Important Paths
- App root: `C:\Users\Jeruto\OneDrive\Documents\EduFlow`
- Next app source: `src`
- AI service source: `ai-service`
- Prisma schema: `prisma/schema.prisma`
- Obsidian notes bundle: `obsidian/EduFlow`

## Working Agreement With Codex
Before major work, Codex should read:
- `05 Codex Handoff.md`
- `02 Deployment.md`
- `04 Bugs and Risks.md`
- the relevant source files

After major work, Codex should update:
- `05 Codex Handoff.md`
- `02 Deployment.md` when deployment status changes
- `03 Decisions.md` when a product or technical decision is made
- `04 Bugs and Risks.md` when a new risk appears or is resolved
