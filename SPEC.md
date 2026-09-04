# SPEC 001: Curriculum Integrity & Tamper-Proof Certificate Engine

## Problem Statement
Universities and bootcamps face credential counterfeiting and struggle to ensure students genuinely complete foundational coursework.

## Solution
A course platform with strict DAG-based prerequisite enforcement and instant public QR certificate verification.

## User Stories
1. As an employer, I want to scan a certificate QR code and instantly verify its authenticity, so that I know the candidate's credential is valid.
2. As an instructor, I want students blocked from skipping forward to exams, so that learning outcomes are maintained.

## Implementation Decisions
- Prerequisite validation in `src/lib/prerequisites.ts`.
- Cryptographic proof generation in `src/lib/certificates.ts`.

## Testing Decisions
- Seam: `src/lib/certificate-cryptographic-proof.test.ts`.
- Verify cryptographic signature validation and tamper detection on modified student records.
