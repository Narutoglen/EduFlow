"""Thin data-access helpers shared by API routes and Celery tasks."""
from __future__ import annotations

import uuid

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app import models


# ---- Jobs ----
def get_job(db: Session, job_id: uuid.UUID) -> models.AIJob | None:
    return db.get(models.AIJob, job_id)


def create_job(
    db: Session,
    *,
    kind: models.JobKind,
    requested_by: str,
    course_id: str | None,
    ref_id: str | None,
    result_id: uuid.UUID | None = None,
) -> models.AIJob:
    job = models.AIJob(
        kind=kind,
        status=models.JobStatus.PENDING,
        requested_by=requested_by,
        course_id=course_id,
        ref_id=ref_id,
        result_id=result_id,
    )
    db.add(job)
    db.flush()
    return job


def set_job_status(
    db: Session,
    job: models.AIJob,
    status: models.JobStatus,
    *,
    error: str | None = None,
    duration_ms: int | None = None,
) -> None:
    job.status = status
    if error is not None:
        job.error = error
    if duration_ms is not None:
        job.duration_ms = duration_ms
    db.add(job)


# ---- Summaries ----
def get_summary_by_lesson(db: Session, lesson_id: str) -> models.LectureSummary | None:
    stmt = (
        select(models.LectureSummary)
        .where(models.LectureSummary.lesson_id == lesson_id)
        .order_by(models.LectureSummary.updated_at.desc())
    )
    return db.scalars(stmt).first()


def get_summary_by_resource(db: Session, resource_id: str) -> models.LectureSummary | None:
    stmt = (
        select(models.LectureSummary)
        .where(models.LectureSummary.resource_id == resource_id)
        .order_by(models.LectureSummary.updated_at.desc())
    )
    return db.scalars(stmt).first()


def create_pending_summary(
    db: Session,
    *,
    source_type: models.SummarySource,
    lesson_id: str | None,
    resource_id: str | None,
    course_id: str,
    model: str,
    prompt_version: str,
) -> models.LectureSummary:
    row = models.LectureSummary(
        source_type=source_type,
        lesson_id=lesson_id,
        resource_id=resource_id,
        course_id=course_id,
        model=model,
        prompt_version=prompt_version,
        status=models.JobStatus.PENDING,
        key_points=[],
    )
    db.add(row)
    db.flush()
    return row


# ---- Flashcards ----
def get_deck_for_owner(db: Session, owner_id: str, lesson_id: str) -> models.FlashcardDeck | None:
    stmt = select(models.FlashcardDeck).where(
        models.FlashcardDeck.owner_id == owner_id,
        models.FlashcardDeck.lesson_id == lesson_id,
    )
    return db.scalars(stmt).first()


def get_deck(db: Session, deck_id: uuid.UUID) -> models.FlashcardDeck | None:
    return db.get(models.FlashcardDeck, deck_id)


def list_cards(db: Session, deck_id: uuid.UUID) -> list[models.Flashcard]:
    stmt = (
        select(models.Flashcard)
        .where(models.Flashcard.deck_id == deck_id)
        .order_by(models.Flashcard.order_index)
    )
    return list(db.scalars(stmt))


def list_due_cards(db: Session, deck_id: uuid.UUID, now, limit: int) -> list[models.Flashcard]:
    stmt = (
        select(models.Flashcard)
        .where(models.Flashcard.deck_id == deck_id, models.Flashcard.due_at <= now)
        .order_by(models.Flashcard.due_at)
        .limit(limit)
    )
    return list(db.scalars(stmt))


def get_card(db: Session, card_id: uuid.UUID) -> models.Flashcard | None:
    return db.get(models.Flashcard, card_id)


def create_deck_with_cards(
    db: Session,
    *,
    owner_id: str,
    course_id: str,
    lesson_id: str,
    title: str,
    model: str,
    prompt_version: str,
    cards: list[dict],
) -> models.FlashcardDeck:
    deck = models.FlashcardDeck(
        owner_id=owner_id,
        course_id=course_id,
        lesson_id=lesson_id,
        title=title,
        model=model,
        prompt_version=prompt_version,
    )
    db.add(deck)
    db.flush()
    for i, c in enumerate(cards):
        db.add(
            models.Flashcard(
                deck_id=deck.id,
                front=c["front"],
                back=c["back"],
                hint=c.get("hint"),
                difficulty=models.CardDifficulty(c.get("difficulty", "MEDIUM")),
                order_index=i,
            )
        )
    db.flush()
    return deck


# ---- Embeddings / ingest ----
def lesson_is_embedded(db: Session, lesson_id: str, model: str) -> bool:
    stmt = select(models.ContentEmbedding.id).where(
        models.ContentEmbedding.lesson_id == lesson_id,
        models.ContentEmbedding.model == model,
    ).limit(1)
    return db.scalars(stmt).first() is not None


def replace_lesson_embeddings(
    db: Session,
    *,
    course_id: str,
    lesson_id: str,
    model: str,
    chunks: list[str],
    vectors: list[list[float]],
) -> int:
    # Idempotent: drop existing chunks for this lesson+model, then insert fresh.
    db.execute(
        delete(models.ContentEmbedding).where(
            models.ContentEmbedding.lesson_id == lesson_id,
            models.ContentEmbedding.model == model,
        )
    )
    for i, (text, vec) in enumerate(zip(chunks, vectors)):
        db.add(
            models.ContentEmbedding(
                course_id=course_id,
                lesson_id=lesson_id,
                chunk_index=i,
                chunk_text=text,
                token_count=len(text.split()),
                embedding=vec,
                model=model,
            )
        )
    db.flush()
    return len(chunks)


# ---- Conversations / messages ----
def get_conversation(db: Session, conv_id: uuid.UUID) -> models.AssistantConversation | None:
    return db.get(models.AssistantConversation, conv_id)


def create_conversation(db: Session, *, user_id: str, course_id: str, title: str | None) -> models.AssistantConversation:
    conv = models.AssistantConversation(user_id=user_id, course_id=course_id, title=title)
    db.add(conv)
    db.flush()
    return conv


def list_conversations(db: Session, user_id: str, course_id: str, limit: int) -> list[models.AssistantConversation]:
    stmt = (
        select(models.AssistantConversation)
        .where(
            models.AssistantConversation.user_id == user_id,
            models.AssistantConversation.course_id == course_id,
        )
        .order_by(models.AssistantConversation.created_at.desc())
        .limit(limit)
    )
    return list(db.scalars(stmt))


def list_messages(db: Session, conv_id: uuid.UUID, limit: int) -> list[models.AssistantMessage]:
    stmt = (
        select(models.AssistantMessage)
        .where(models.AssistantMessage.conversation_id == conv_id)
        .order_by(models.AssistantMessage.created_at)
        .limit(limit)
    )
    return list(db.scalars(stmt))


def add_message(
    db: Session,
    *,
    conversation_id: uuid.UUID,
    role: models.MessageRole,
    content: str,
    citations: list | None = None,
    source_audio_id: uuid.UUID | None = None,
) -> models.AssistantMessage:
    msg = models.AssistantMessage(
        conversation_id=conversation_id,
        role=role,
        content=content,
        citations=citations or [],
        source_audio_id=source_audio_id,
    )
    db.add(msg)
    db.flush()
    return msg


# ---- Transcription ----
def create_transcription(
    db: Session, *, user_id: str, course_id: str | None, audio_key: str, mime_type: str
) -> models.TranscriptionJob:
    tx = models.TranscriptionJob(
        user_id=user_id, course_id=course_id, audio_key=audio_key, mime_type=mime_type
    )
    db.add(tx)
    db.flush()
    return tx


def get_transcription(db: Session, tx_id: uuid.UUID) -> models.TranscriptionJob | None:
    return db.get(models.TranscriptionJob, tx_id)
