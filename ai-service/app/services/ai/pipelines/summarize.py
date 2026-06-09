"""Summarization pipeline: sanitize -> chunk -> map -> reduce -> parse (summary + key points).

Map-reduce keeps long lessons within model context (threat-model SUM-6 DoS control) and is provider-
agnostic. Returns a structured result the API persists to `lecture_summary`.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from app.services.ai import prompts, safety
from app.services.ai.providers.base import LLMProvider

# ~ average reading speed for the "time saved" badge
WORDS_PER_MINUTE = 200
CHUNK_CHARS = 4_000


@dataclass
class SummaryResult:
    summary: str
    key_points: list[str]
    reading_seconds: int
    prompt_version: str


def _chunk(text: str, size: int = CHUNK_CHARS) -> list[str]:
    text = text.strip()
    if len(text) <= size:
        return [text] if text else []
    # split on paragraph boundaries, packing up to `size`
    paras = [p for p in re.split(r"\n{2,}", text) if p.strip()]
    chunks: list[str] = []
    buf = ""
    for p in paras:
        if len(buf) + len(p) + 2 > size and buf:
            chunks.append(buf)
            buf = p
        else:
            buf = f"{buf}\n\n{p}" if buf else p
    if buf:
        chunks.append(buf)
    return chunks


def _parse_reduce(raw: str) -> tuple[str, list[str]]:
    summary, points = raw, []
    m = re.search(r"SUMMARY:\s*(.+?)(?:\n\s*KEY_POINTS:|$)", raw, re.DOTALL | re.IGNORECASE)
    if m:
        summary = m.group(1).strip()
    kp = re.search(r"KEY_POINTS:\s*(.+)$", raw, re.DOTALL | re.IGNORECASE)
    if kp:
        for line in kp.group(1).splitlines():
            line = line.strip().lstrip("-*•").strip()
            if line:
                points.append(line)
    return summary.strip(), points[:8]


def summarize(text: str, provider: LLMProvider) -> SummaryResult:
    clean = safety.sanitize_content(text or "")
    word_count = len(clean.split())
    reading_seconds = round(word_count / WORDS_PER_MINUTE * 60)

    chunks = _chunk(clean)
    if not chunks:
        return SummaryResult("", [], 0, prompts.SUMMARIZE_VERSION)

    # MAP
    partials = [
        provider.generate(prompts.SUMMARIZE_SYSTEM, prompts.SUMMARIZE_MAP.format(chunk=c), max_tokens=256)
        for c in chunks
    ]
    joined = "\n".join(f"- {p}" for p in partials if p)

    # REDUCE
    raw = provider.generate(
        prompts.SUMMARIZE_SYSTEM,
        prompts.SUMMARIZE_REDUCE.format(joined=joined),
        max_tokens=512,
    )
    summary, points = _parse_reduce(safety.cap_output(raw))
    if not summary:
        summary = safety.cap_output(joined)
    return SummaryResult(summary, points, reading_seconds, prompts.SUMMARIZE_VERSION)
