# CONTEXT.md — Ubiquitous Domain Language (EduFlow)

## Core Entities
- **EnrollmentRecord**: Active student engagement within an educational course.
- **PrerequisiteDag**: Directed acyclic graph defining mandatory learning module completion order.
- **TamperProofCertificate**: Verifiable credential signed with cryptographic SHA-256 payload hash.
- **AssessmentRubric**: Automated scoring criteria evaluating multiple-choice and short-answer answers.

## Domain Invariants
- A student cannot attempt an assessment unless all prerequisite modules in the DAG are complete.
- Certificate hashes must be mathematically verifiable against student enrollment parameters.

## Forbidden Terminology
- Do not call courses "products"; use "Course" or "Curriculum".
- Do not call credentials "badges"; use "Certificate".
