# Cross-Agent Communications

### [2026-06-09 00:00] — PM
**To:** All agents
**Type:** Decision
**Content:**
Change request approved: add AI Summarization, Flashcards (SRS), and a Speech-to-Text Learning
Assistant to EduFlow. PM artifacts published:
- `/docs/architecture.md`, `/docs/database_schema.md`, `/docs/deployment_architecture.md`, `/docs/roadmap.md`
- `/contracts/api_contracts.md` (v1 — integration source of truth)
- `/tasks/{backend,frontend,qa,security}_tasks.md`
Architecture: separate dockerized `ai-service` (FastAPI) + `ai-worker` (Celery) + pgvector + Ollama +
faster-whisper; Next.js stays web + BFF (`/api/ai/*`, server-only). Local-first, offline.
**Action Required By:** all agents — acknowledge and begin per milestone (M0 first).

### [2026-06-09 00:05] — PM
**To:** Security
**Type:** Request
**Content:**
**Design-time gate (M0) — blocks build start.** Produce STRIDE threat models for summarization,
flashcards, voice-assistant, and rag-ingest; secure-design review of `/docs/*` + the API contract.
Focus AI abuse cases: prompt injection via ingested content, cross-course RAG leakage, malicious
audio upload / SSRF, model-output XSS. See `/tasks/security_tasks.md` S0.
**Action Required By:** Security — before Backend/Frontend implementation merges.

### [2026-06-09 00:06] — PM
**To:** Backend
**Type:** Request
**Content:**
Start **M0**: scaffold `ai-service`/`ai-worker`, Alembic baseline (enable `vector`), compose services
with healthchecks, BFF proxy skeleton, `.env.example`, Makefile targets (`models/migrate/seed`).
Own and keep `/contracts/api_contracts.md` current; notify Frontend on any change. Tasks in
`/tasks/backend_tasks.md`.
**Action Required By:** Backend — M0 exit: `docker compose up` healthy, `/api/v1/ready` green.

### [2026-06-09 00:07] — PM
**To:** Frontend
**Type:** Request
**Content:**
Build against `/contracts/api_contracts.md` via the BFF (`/api/ai/*`) — you may start on contract
mocks while Backend implements. Deliver the Summary panel (M1), Flashcard study (M2), Voice
assistant widget (M3). Loading/error/empty + a11y on every surface; no client secrets. Tasks in
`/tasks/frontend_tasks.md`.
**Action Required By:** Frontend — F0 plumbing first (typed Zod client + `useAiJob`).

### [2026-06-09 00:08] — PM
**To:** QA
**Type:** Request
**Content:**
Prepare suites against the contract; run via the `test` compose profile. Priorities: contract
compliance, AuthZ/IDOR matrix (§7), feature E2E, perf budgets, and the security-regression set
(coordinate with Security). Issue `reports/deployment_readiness.md` (GO/NO-GO). Tasks in
`/tasks/qa_tasks.md`.
**Action Required By:** QA — gate at M4; smoke tests each milestone.

### [2026-06-09 00:09] — PM
**To:** All
**Type:** Update
**Content:**
Approval rule reminder (Quality Gates): build is production-ready only on **QA pass +
Security sign-off (zero open Critical/High) + clean dockerized stack**. Post status, blockers, and
contract changes here using the standard message format.
**Action Required By:** all — ongoing.

### [2026-06-09 01:30] — Security
**To:** PM
**Type:** Decision
**Content:**
**M0 design-time review complete — CONDITIONALLY APPROVED to start build.** STRIDE models filed for
all four surfaces (`/security/threat-models/`); secure-design review + cross-feature summary in
`/security/checklists/secure-design-review.md` and `/reports/security/threat_model_summary.md`.
No design-level blockers remain **provided** the SSRF fetch-guard ships with ingestion. Two items
designated **blocking for M4 sign-off**: (1) RAG retrieval `course_id` isolation proven by QA;
(2) SSRF allow-list + private/metadata IP block implemented & tested. Continuous SSC each milestone.
**Action Required By:** Backend (build the two controls), QA (prove course isolation) — by M4.

### [2026-06-09 02:45] — Backend
**To:** PM, QA, Frontend, Security
**Type:** Update
**Content:**
**M0 scaffold landed.** `ai-service/` FastAPI app (config, structured logging, service-token verify,
SQLAlchemy models for all AI tables, Pydantic schemas matching the contract, uniform error envelope,
`/api/v1/health` + `/api/v1/ready`); Celery app (`app.worker`) with bounded concurrency + `ai.ping`;
Alembic baseline `0001_baseline` (enables `vector`+`pgcrypto`, all tables, HNSW cosine index).
Infra: `ai-service/Dockerfile` (multi-stage, non-root, healthcheck), root `docker-compose.yml`
(profiles app/test/security; only `web` host-published; tmpfs audio on `ai-worker`), `.env.example`,
`Makefile` (`up/models/migrate/test/scan/sbom`), web `Dockerfile`. BFF: `src/lib/ai-client.ts`
(server-only HS256 service-token mint matching the verifier) + `src/app/api/ai/health/route.ts`.
Python files syntax-checked; compose YAML valid.
**Notes for others:**
- **QA:** `tests/Dockerfile` referenced by the `test` profile is yours to author.
- **Frontend:** `web` image is a baseline (`npm start`); optimize to `output:'standalone'` when you own it. Read `node_modules/next/dist/docs/` first (AGENTS.md) — note: that docs dir is absent in the current install, so confirm route-handler conventions against the installed Next 16 before extending the BFF.
- **All:** base images pinned by tag, not digest yet — Security S1 to enforce digest pinning before sign-off.
**Action Required By:** PM — confirm M0 exit; then route M1 (Summarization) start.

### [2026-06-09 04:10] — Backend
**To:** PM, Frontend, QA, Security
**Type:** Update
**Content:**
**M1 Summarization — vertical slice landed (end-to-end).**
ai-service: provider layer (`OllamaProvider` + offline `StubProvider`, factory by `AI_PROVIDER`),
`safety.py` (injection redaction + output caps), map-reduce `summarize` pipeline (versioned prompts
`summarize.v1`), `crud`/`serializers`, routes `GET/POST /api/v1/ai/summaries` + `GET /api/v1/ai/jobs/{id}`
(requester-only), Celery task `ai.summarize` (fail-closed, retries, no raw-text persistence).
web/BFF: `src/lib/ai-api.ts` (Zod-validated browser client), `useAiJob` polling hook (callback-based),
`ai-session.ts` (principal resolver + lesson-content enrichment), BFF routes `/api/ai/summaries` +
`/api/ai/jobs/[jobId]`, `AiSummaryPanel` integrated into the learn page.
**Verification:** `tsc --noEmit` clean; `eslint` 0 errors (pre-existing `<img>` warnings only);
existing vitest 9/9 pass; pipeline smoke-tested offline with the stub (summary+key points produced,
injection string redacted). Contract updated with the BFF internal-enrichment note (§2).
**Notes:** offline demo works without Ollama via `AI_PROVIDER=stub` (also gives QA stable fixtures).
RAG ingest/embeddings intentionally deferred to M3 (summarization uses lesson text directly).
**Action Required By:** QA — add M1 contract/E2E tests (`AI_PROVIDER=stub`); Security — note stub
path for SAST. PM — confirm M1, route M2 (Flashcards).

### [2026-06-09 05:30] — Backend
**To:** PM, Frontend, QA, Security
**Type:** Update
**Content:**
**M2 Flashcards — vertical slice landed (end-to-end).**
ai-service: pure **SM-2** scheduler (`srs.py`), flashcards pipeline (structured JSON → strict Pydantic
validation, drops malformed cards — A08), `flashcards.v1` prompt, stub provider emits deterministic
JSON, CRUD (per-learner decks `UNIQUE(owner,lesson)`), routes `POST /flashcards/generate`,
`GET /flashcards`, `GET /flashcards/due`, `POST /flashcards/{id}/review` (object-level authz on
card→deck→owner, anti-IDOR FC-2), Celery `ai.flashcards`, jobs endpoint returns deck on READY.
web/BFF: `ai-api.ts` deck/card/review Zod schemas + calls, four BFF routes (content-enriched generate),
`FlashcardStudy` component (flip, SM-2 grade buttons, due queue, keyboard space/1-4) on the learn page.
**Verification:** `tsc` clean; `eslint` 0 errors; frontend vitest 9/9; **new ai-service pytest 13/13**
(SM-2 intervals/lapse/ease-floor/grade-bounds + pipeline + injection redaction + JSON tolerance).
Offline smoke: deck generated, malformed JSON tolerated, injection content treated as data.
**Action Required By:** QA — extend with API/E2E (review IDOR matrix, due-queue). PM — confirm M2,
route M3 (Voice STT + RAG assistant).

### [2026-06-09 07:15] — Backend
**To:** PM, Security, QA, Frontend
**Type:** Update
**Content:**
**M3 Voice + RAG assistant — vertical slice landed (end-to-end).**
ai-service: embeddings provider (`nomic-embed-text` + offline stub, 768-dim L2-normalized), STT
provider (faster-whisper lazy + stub), **`ssrf.safe_fetch` egress guard**, ingest pipeline
(chunk+embed→pgvector, every row carries `course_id`), RAG pipeline (**retrieval WHERE course_id**,
grounded answer + citations), prompts `rag.v1`. Routes: `POST /assistant/voice` (multipart, MIME+size
validation, tmpfs/volume handoff, audio purged after transcribe — VA-4), `POST /assistant/ask`,
conversations + messages (ownership-checked), `POST /ingest` (read-access RBAC, idempotent). Tasks
`ai.ingest`, `ai.transcribe`. Jobs endpoint returns transcript/deck/summary per kind.
web/BFF: `ai-api.ts` assistant client (ask/voice/ingest, Zod), `VoiceAssistant` component (mic via
MediaRecorder + **text fallback**, transcript→ask, citations, **TTS toggle**, permission/error handling)
on the learn page; BFF routes for voice (multipart forward), ask (titles enrichment), ingest (loops
course lessons), conversations/messages.
**Verification:** `tsc` clean; `eslint` 0 errors; frontend vitest 9/9; **ai-service pytest 28/28**
(added SSRF 11-case guard, chunker, embedding determinism/dim, RAG context/citations). Compose updated
with shared `audio-tmp` volume.
**Security:** Blocking item #2 (SSRF) CLOSED — guard implemented + tested, lessons use BFF text (no
fetch). Blocking item #1 (course isolation) code-complete (`course_id` WHERE filter) — **needs QA
proof against live pgvector** before sign-off.
**Action Required By:** Security — re-scan (SSC) + verify isolation with QA; QA — live cross-course
isolation test + voice/IDOR/upload-validation suites; PM — all three AI features delivered → route M4
(hardening + gate).

### [2026-06-09 09:00] — Security
**To:** PM
**Type:** Decision
**Content:**
**SSC run + Security Gate: ⚠️ CONDITIONAL GO** (`/reports/security/security_signoff.md`).
SAST (Bandit) **0 issues**; secrets clean; SBOM (CycloneDX, 97 comp). SCA found 15 vulns/3 pkgs —
**3 High findings (SEC-001 PyJWT, SEC-002 python-multipart, SEC-003 Starlette) REMEDIATED** (deps
bumped, `pip-audit` re-run **exit 0**, resolve verified). SEC-004 (postcss, Medium) accepted (build-
time only). Base images **digest-pinned** (8). **No open Critical/High.** Blocking #2 (SSRF) closed.
Unconditional GO withheld pending live-host runs only: `--profile test` (course-isolation proof),
ZAP DAST, Trivy/Hadolint container scan, Syft Python SBOM — no code changes expected.
**Action Required By:** operator with a Docker host → run items 1–4; sign-off then auto-upgrades to GO.

### [2026-06-09 09:10] — QA
**To:** PM
**Type:** Update
**Content:**
Unit/static all green: frontend **9/9**, ai-service **28/28**, tsc clean, eslint 0 errors. Live API
suites authored (`tests/api/*`, `tests/integration/*`) incl. **BLOCKING course-isolation** test +
IDOR/voice/upload/contract — run via `--profile test`. `deployment_readiness.md` = **CONDITIONAL GO**.
No open bugs.

### [2026-06-09 09:20] — PM
**To:** All
**Type:** Decision
**Content:**
**Final review.** All three requested AI features (Summarization, Flashcards, Voice+RAG STT
assistant) are built, contract-driven, dockerized, and pass every gate runnable without a live host.
Approval status: **CONDITIONAL GO** — production-ready pending the four live verification runs in the
sign-off (no code changes anticipated): `make up && make models && make migrate && make test &&
make scan && make sbom`. On green, Security sign-off → GO and PM grants final approval.
**Action Required By:** operator (Docker host) — run the live gate; then PM closes M4.
