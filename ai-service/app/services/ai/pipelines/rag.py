"""RAG answer pipeline: embed question -> course-scoped retrieval -> grounded generation + citations.

COURSE ISOLATION INVARIANT (threat models VA-3, RAG-5; Security blocking item): retrieval is filtered
by `course_id` in the SQL WHERE clause — never by ranking alone. Chunks from other courses are
unreachable. `build_context` is pure and unit-tested; `retrieve` runs against pgvector.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from app.services.ai import prompts, safety
from app.services.ai.providers import get_llm_provider
from app.services.ai.providers.embeddings import get_embedding_provider

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

TOP_K = 5


@dataclass
class RetrievedChunk:
    lesson_id: str | None
    chunk_index: int
    chunk_text: str
    score: float


def retrieve(db: "Session", course_id: str, question: str, k: int = TOP_K) -> list[RetrievedChunk]:
    """Cosine-nearest chunks WITHIN a single course. The course_id filter is mandatory."""
    from sqlalchemy import select  # lazy: keeps pure helpers importable without the DB driver

    from app import models

    provider = get_embedding_provider()
    qvec = provider.embed([safety.sanitize_content(question)])[0]
    distance = models.ContentEmbedding.embedding.cosine_distance(qvec)
    stmt = (
        select(
            models.ContentEmbedding.lesson_id,
            models.ContentEmbedding.chunk_index,
            models.ContentEmbedding.chunk_text,
            distance.label("distance"),
        )
        .where(models.ContentEmbedding.course_id == course_id)  # <-- isolation invariant
        .order_by(distance)
        .limit(k)
    )
    rows = db.execute(stmt).all()
    return [
        RetrievedChunk(lesson_id=r.lesson_id, chunk_index=r.chunk_index, chunk_text=r.chunk_text,
                       score=round(1.0 - float(r.distance), 4))
        for r in rows
    ]


def build_context(chunks: list[RetrievedChunk], titles: dict[str, str]) -> tuple[str, list[dict]]:
    """Build the grounded context block + structured citations. Pure (no DB / no model)."""
    lines: list[str] = []
    citations: list[dict] = []
    for c in chunks:
        title = titles.get(c.lesson_id or "", "Lesson")
        lines.append(f"[{title}] {c.chunk_text}")
        citations.append(
            {"lessonId": c.lesson_id, "title": title, "chunkIndex": c.chunk_index, "score": c.score}
        )
    return "\n\n".join(lines), citations


def answer(question: str, context: str) -> str:
    provider = get_llm_provider()
    if not context.strip():
        return "I don't have enough information from this course's material to answer that."
    raw = provider.generate(
        prompts.RAG_SYSTEM,
        prompts.RAG_ANSWER.format(question=safety.sanitize_content(question), context=context),
        max_tokens=512,
    )
    return safety.cap_output(raw)
