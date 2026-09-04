# TICKETS — EduFlow Certification Pipeline

## [TICKET-001] Cryptographic Certificate Hash Generator & Verifier
- **Blocked by**: None
- **Delivers**: Tamper-evident credential hashing and public verification endpoint.
- **Verification**: `src/lib/certificate-cryptographic-proof.test.ts`

## [TICKET-002] Course Curriculum Prerequisite DAG Validator
- **Blocked by**: TICKET-001
- **Delivers**: Server-side completion gate ensuring sequential module learning.
- **Verification**: DAG traversal unit tests asserting module lock states.
