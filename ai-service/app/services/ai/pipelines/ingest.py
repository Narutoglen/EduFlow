"""Ingestion pipeline: sanitize -> chunk -> embed -> upsert into pgvector (content_embedding).

Idempotent per (lesson_id, model): re-ingesting a lesson replaces its chunks. Every row carries
`course_id` — the invariant that makes course-scoped retrieval possible (threat model RAG-5).
"""
from __future__ import annotations

import re

from app.services.ai import safety
from app.services.ai.providers.embeddings import get_embedding_provider

CHUNK_CHARS = 1200
OVERLAP = 150


def chunk_text(text: str, size: int = CHUNK_CHARS, overlap: int = OVERLAP) -> list[str]:
    clean = re.sub(r"\s+", " ", (text or "").strip())
    if not clean:
        return []
    if len(clean) <= size:
        return [clean]
    chunks: list[str] = []
    start = 0
    while start < len(clean):
        end = min(start + size, len(clean))
        chunks.append(clean[start:end])
        if end == len(clean):
            break
        start = end - overlap
    return chunks


def build_chunks(text: str) -> list[str]:
    return chunk_text(safety.sanitize_content(text or ""))


def embed_chunks(chunks: list[str]) -> tuple[list[list[float]], str]:
    """Return (vectors, model_name)."""
    provider = get_embedding_provider()
    vectors = provider.embed(chunks) if chunks else []
    return vectors, getattr(provider, "model", provider.name)
