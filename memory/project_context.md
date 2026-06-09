# Project Context — EduFlow AI Layer

**Living document.** Updated after every significant decision.

## Mission
Extend EduFlow (Next.js 16 LMS) with three AI features — **lecture/resource summarization**,
**flashcard generation (SRS)**, and a **speech-to-text learning assistant** — fully dockerized,
local-first, through the QA + Security gates.

## Tech stack (current + additions)
- **Existing:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind v4, Prisma 7 + Postgres, mock service adapters, demo in-memory data.
- **New AI service:** FastAPI (Py 3.12), SQLAlchemy 2 + Alembic, Celery + Redis, **pgvector** in the shared Postgres, Ollama (`llama3.1:8b`, `nomic-embed-text`), faster-whisper (STT), PyMuPDF/python-pptx (extraction).
- **Integration:** Next.js stays web + **BFF**; browser → `/api/ai/*` (BFF, server-only) → `ai-service` `/api/v1/ai/*`.

## Key decisions (see /docs/architecture.md §1)
- D1 Separate `ai-service`, not ML-in-Next.js. · D2 BFF-only egress (no browser→ai-service). · D3 Local-first models, pluggable provider. · D4 RAG via pgvector, AI-owned tables, loose coupling by ID. · D5 Heavy work in Celery (202+jobId). · D6 Contract-driven.

## Boundaries
- Frontend: UI only, consumes contract via BFF, no secrets client-side.
- Backend: ai-service + worker + BFF proxy + migrations; owns the contract file.
- QA: validate only; runs security-regression, escalates new vulns.
- Security: threat models + scans + sign-off; routes remediation via PM; no code patches.

## Open items / risks
- [ ] **Prompt injection** via ingested lesson/resource content (Security S0 abuse case) — owner: Security/Backend.
- [ ] **Cross-course RAG leakage** — retrieval must be scoped by `course_id`; verify in tests.
- [ ] Whisper CPU latency on long clips — capped at 5 min / 25 MB; GPU split deferred (post-MVP).
- [ ] Transcript **retention** = 30 days unless saved to a conversation (TRANSCRIPT_RETENTION_DAYS).
- [ ] Prisma typing for AI read models deferred — source of truth is ai-service API, not Prisma.
- [ ] AGENTS.md warns EduFlow uses a non-standard Next.js 16 — Frontend must read `node_modules/next/dist/docs/` before BFF route work.

## Accepted risks
- _(none yet — Security to record at sign-off)_

## Status
- **PM artifacts:** complete (architecture, schema, deployment, contract, roadmap, tasks).
- **Security S0 (M0 gate):** ✅ complete — **conditionally approved**. Threat models for all 4 surfaces,
  secure-design review, threat-model summary filed. Blocking-for-sign-off items: RAG `course_id`
  isolation (QA-proven) + SSRF fetch-guard (Backend-built).
- **Backend M0:** ✅ scaffold landed — `ai-service` FastAPI (health/ready, models, schemas, errors,
  service-token verify), Celery worker, Alembic baseline (pgvector + HNSW), Dockerfiles,
  `docker-compose.yml` (app/test/security profiles), `.env.example`, `Makefile`, BFF `ai-client.ts`
  + `/api/ai/health`. Python syntax-checked; compose YAML valid.

## Build-time verification ledger (for M4 Security Gate)
- [ ] **BLOCKING:** RAG retrieval filters by `course_id` (no cross-course leakage) — QA proves.
- [ ] **BLOCKING:** SSRF fetch-guard (storage allow-list + private/metadata IP block) — Backend ships w/ ingestion.
- [ ] Base images pinned by **digest** (currently by tag) — Security S1.
- [ ] `tests/Dockerfile` authored — QA.
- [ ] Service-token TTL ≤5 min + rotation verified (currently 300s in `ai-client.ts`).

- **M1 Summarization:** ✅ end-to-end. ai-service provider layer (Ollama + offline **stub**), safety
  guard, map-reduce pipeline (`summarize.v1`), `GET/POST /summaries` + `GET /jobs/{id}`, Celery
  `ai.summarize`. web BFF (`ai-api.ts` Zod client, `useAiJob`, `ai-session.ts`), `AiSummaryPanel` on
  the learn page. tsc clean · eslint 0 errors · vitest 9/9 · offline smoke test OK.
  - Decision: **`AI_PROVIDER=stub`** runs the full pipeline with no model weights (offline demo + QA
    fixtures). Real summaries use Ollama. RAG ingest/embeddings deferred to M3.
  - Decision: BFF enriches `{lessonId}` → `{lessonId,courseId,title,content}` server-to-server;
    ai-service never reads the LMS DB and does not persist raw lesson text (contract §2 note).

- **M2 Flashcards:** ✅ end-to-end. SM-2 scheduler (`srs.py`), generation pipeline (strict JSON
  validation, A08), `flashcards.v1`, per-learner decks, routes generate/list/due/review (object-level
  authz anti-IDOR), Celery `ai.flashcards`. web BFF (4 routes) + `FlashcardStudy` (flip, SM-2 grades,
  due queue, keyboard) on the learn page. tsc clean · eslint 0 errors · frontend 9/9 · **ai-service
  pytest 13/13** (added `tests/test_srs.py`, `tests/test_pipelines.py`, `pytest.ini`).

- **M3 Voice + RAG assistant:** ✅ end-to-end. Embeddings (nomic + stub) + STT (whisper lazy + stub),
  **SSRF guard** (`net/ssrf.py`), ingest→pgvector (course_id on every row), RAG retrieval **WHERE
  course_id** + citations (`rag.v1`), voice upload (MIME/size validation, audio purged), assistant
  ask + conversations/messages, ingest. web BFF (voice/ask/ingest/conversations) + `VoiceAssistant`
  (mic + text fallback + citations + TTS) on the learn page. tsc clean · eslint 0 · frontend 9/9 ·
  **ai-service pytest 28/28**. Compose: shared `audio-tmp` volume.
  - Security: **blocking #2 (SSRF) CLOSED** (guard + 11 tests; lessons use BFF text, no fetch).
    **blocking #1 (course isolation)** code-complete (`course_id` SQL filter) — **open pending QA
    live-pgvector proof.**

- **M4 Hardening + gate:** ⚠️ **CONDITIONAL GO**. SAST (Bandit) 0 issues; SCA — 3 **High** dep
  findings (PyJWT/python-multipart/Starlette) **remediated** (`pip-audit` exit 0, resolve verified),
  postcss Medium accepted; secrets clean; base images **digest-pinned (8)**; CycloneDX SBOM (97);
  QA unit 9/9 + 28/28, live API suites authored (incl. BLOCKING course-isolation). Findings +
  `security_signoff.md` + `deployment_readiness.md` written.
  - **Remaining for unconditional GO (live Docker host, no code changes):** `make up/models/migrate`,
    `make test` (course-isolation proof = Blocking #1), `make scan` (ZAP DAST + Trivy/Hadolint),
    `make sbom` (Syft Python SBOM).

## Status: all three AI features delivered (M1 Summaries, M2 Flashcards, M3 Voice+RAG). M4 = Conditional GO.

## INVESTOR-GRADE checklist
- [x] Scalable folder/module structure · [x] Security hardened (authz, validation, rate limits, SSRF guard)
- [x] Performance patterns (async jobs, caching, pgvector HNSW, DB indexes)
- [x] Fully dockerized (compose config valid; digest-pinned, non-root, healthchecked) — *live up pending host*
- [x] Test coverage (unit green; live suites authored) · [x] Docs (architecture/schema/deploy/contract/threat models)
- [x] STRIDE threat models · [x] OWASP review · [x] SBOM · [x] Secrets clean · [~] Sign-off (conditional)
