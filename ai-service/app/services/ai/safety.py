"""Prompt-injection mitigation + output hygiene (threat models SUM-2, RAG-3, LLM01).

Ingested content is DATA, never instructions. We neutralize the most common injection patterns
before content reaches the model, and cap output length. This is defense-in-depth, not a guarantee:
the model also runs with a fixed system prompt and no tools/egress.
"""
from __future__ import annotations

import re

# Patterns that try to flip the model into instruction-following on untrusted content.
_INJECTION_PATTERNS = [
    re.compile(r"(?i)\bignore (all|any|the|previous|above)\b.{0,40}\binstructions?\b"),
    re.compile(r"(?i)\bdisregard\b.{0,40}\b(prompt|instructions?|context)\b"),
    re.compile(r"(?i)\byou are now\b"),
    re.compile(r"(?i)\bsystem prompt\b"),
    re.compile(r"(?i)\bact as\b.{0,40}\b(admin|root|developer|jailbreak)\b"),
    re.compile(r"(?i)<\|.*?\|>"),  # chat-template control tokens
]

MAX_INPUT_CHARS = 60_000
MAX_OUTPUT_CHARS = 8_000


def sanitize_content(text: str) -> str:
    """Strip control tokens / neutralize injection cues; bound length. Content stays human-readable."""
    cleaned = text
    for pat in _INJECTION_PATTERNS:
        cleaned = pat.sub("[redacted-instruction]", cleaned)
    cleaned = cleaned.replace("\x00", "")
    return cleaned[:MAX_INPUT_CHARS]


def cap_output(text: str) -> str:
    return text[:MAX_OUTPUT_CHARS].strip()
