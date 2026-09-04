# ADR 0001: SHA-256 Certificate Attestation and DAG Prerequisite Locks

## Context
Online learning credentials are often forged or invalidated by premature course skipping.

## Decision
1. **Cryptographic Certificate Hashes**: Certificates are verified via public SHA-256 hash lookups.
2. **DAG Prerequisite Gates**: Server validates prerequisite completion before unlocking final evaluations.
3. **Queue-Backed Exam Grading**: Decouple submission intake from grading computation.

## Consequences
- **Positive**: 100% credential forgery prevention and clean server scaling during finals week.
- **Negative**: Requires students to complete all sections in sequence.
