"""ORM -> response-schema mappers (contract shapes)."""
from __future__ import annotations

from app import models
from app.schemas import CardOut, DeckOut, FlashcardsListOut, JobOut, SummaryOut


def summary_out(row: models.LectureSummary) -> SummaryOut:
    return SummaryOut(
        id=row.id,
        sourceType=row.source_type.value,
        lessonId=row.lesson_id,
        resourceId=row.resource_id,
        courseId=row.course_id,
        summary=row.summary,
        keyPoints=list(row.key_points or []),
        readingSeconds=row.reading_seconds,
        model=row.model,
        promptVersion=row.prompt_version,
        status=row.status.value,
        updatedAt=row.updated_at,
    )


def card_out(card: models.Flashcard) -> CardOut:
    return CardOut(
        id=card.id,
        front=card.front,
        back=card.back,
        hint=card.hint,
        difficulty=card.difficulty.value,
        dueAt=card.due_at,
        interval=card.interval_days,
        repetitions=card.repetitions,
    )


def deck_out(deck: models.FlashcardDeck, card_count: int) -> DeckOut:
    return DeckOut(id=deck.id, lessonId=deck.lesson_id, title=deck.title, cardCount=card_count)


def flashcards_list_out(deck: models.FlashcardDeck, cards: list[models.Flashcard]) -> FlashcardsListOut:
    return FlashcardsListOut(deck=deck_out(deck, len(cards)), cards=[card_out(c) for c in cards])


def job_out(job: models.AIJob, *, result: dict | None = None) -> JobOut:
    return JobOut(
        jobId=job.id,
        kind=job.kind.value,
        status=job.status.value,
        resultId=job.result_id,
        error=job.error,
        createdAt=job.created_at,
        updatedAt=job.updated_at,
        result=result,
    )
