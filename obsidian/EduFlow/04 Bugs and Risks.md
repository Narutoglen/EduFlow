---
project: EduFlow
type: risks
status: active
updated: 2026-06-16
tags:
  - eduflow
  - risks
---

# EduFlow Bugs And Risks

## Open Risks

### Deployment Scope Is Not Final
Risk:
It is not yet confirmed whether deployment includes only the Next app or also the Python AI service.

Impact:
AI routes may fail in production if the app deploys without an available AI service and required secrets.

Mitigation:
Decide deployment scope before production deploy. For first preview, clearly mark AI-dependent routes as non-blocking or configure the AI service URL and token.

### Production Data Is Not Wired Yet
Risk:
The app currently uses seeded in-memory data for the LMS experience.

Impact:
Data will not persist like a real production LMS.

Mitigation:
Use Prisma and PostgreSQL when moving beyond preview/demo deployment.

### Python Test Environment Is Missing Dependencies
Risk:
`python -m pytest ai-service/tests` did not run because local Python lacks dependencies such as `pydantic` and `httpx`.

Impact:
AI service unit tests are not verified in this Windows global Python environment.

Mitigation:
Use a virtual environment or container with `ai-service/requirements.txt` installed before AI service deployment.

### Current Changes Are Not Committed
Risk:
The working tree contains many modified and deleted files from cleanup.

Impact:
Deployment from GitHub will not include these improvements until committed and pushed.

Mitigation:
Review, commit, and push before deploying.

## Recently Resolved

### SWC Package 404
Resolved:
Next dependency was pinned to a stable available version, avoiding the missing SWC preview package issue.

### User-Facing Dead Links
Resolved:
Resource `#` links were replaced with real resource routes.

### Prototype/Internal Wording
Resolved:
Visible wording such as demo/MVP/mock was removed from learner-facing experience.

### Tracked Python Bytecode
Resolved:
Tracked `__pycache__` and `.pyc` files were removed and ignored.

## Watch List
- Form submissions should keep returning useful notice states.
- Catalog review counts should stay aligned with visible reviews.
- Certificate verification should remain easy to smoke test.
- Role navigation should not expose unrelated role dashboards to normal users.
- AI routes should fail gracefully when AI service is unavailable.
