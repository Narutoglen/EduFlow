"""SQLAlchemy ORM models — AI-owned tables. Mirrors /docs/database_schema.md.

Loose coupling: userId/courseId/lessonId/resourceId are plain indexed strings (no cross-service FK).
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    CheckConstraint,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import DateTime

from app.db.base import Base, TimestampMixin


class JobStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    READY = "READY"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class JobKind(str, enum.Enum):
    SUMMARIZE = "SUMMARIZE"
    FLASHCARDS = "FLASHCARDS"
    TRANSCRIBE = "TRANSCRIBE"
    INGEST = "INGEST"
    RAG = "RAG"


class SummarySource(str, enum.Enum):
    LESSON = "LESSON"
    RESOURCE = "RESOURCE"


class CardDifficulty(str, enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


class MessageRole(str, enum.Enum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"


_status = Enum(JobStatus, name="ai_job_status")
_kind = Enum(JobKind, name="ai_job_kind")
_source = Enum(SummarySource, name="summary_source")
_difficulty = Enum(CardDifficulty, name="card_difficulty")
_role = Enum(MessageRole, name="message_role")


class AIJob(Base, TimestampMixin):
    __tablename__ = "ai_job"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    kind: Mapped[JobKind] = mapped_column(_kind)
    status: Mapped[JobStatus] = mapped_column(_status, default=JobStatus.PENDING)
    requested_by: Mapped[str] = mapped_column(String, index=True)
    course_id: Mapped[str | None] = mapped_column(String, nullable=True)
    ref_id: Mapped[str | None] = mapped_column(String, nullable=True)
    idempotency_key: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    result_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tokens_in: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tokens_out: Mapped[int | None] = mapped_column(Integer, nullable=True)

    __table_args__ = (Index("ix_ai_job_requester", "requested_by", "created_at"),)


class LectureSummary(Base, TimestampMixin):
    __tablename__ = "lecture_summary"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    source_type: Mapped[SummarySource] = mapped_column(_source)
    lesson_id: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    resource_id: Mapped[str | None] = mapped_column(String, nullable=True)
    course_id: Mapped[str] = mapped_column(String, index=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_points: Mapped[list] = mapped_column(JSONB, default=list)
    reading_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    model: Mapped[str] = mapped_column(String)
    prompt_version: Mapped[str] = mapped_column(String)
    status: Mapped[JobStatus] = mapped_column(_status, default=JobStatus.PENDING)

    __table_args__ = (
        CheckConstraint("num_nonnulls(lesson_id, resource_id) = 1", name="one_source"),
        UniqueConstraint("lesson_id", "resource_id", "model", "prompt_version", name="uq_summary_source"),
    )


class ContentEmbedding(Base):
    __tablename__ = "content_embedding"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    course_id: Mapped[str] = mapped_column(String, index=True)
    lesson_id: Mapped[str | None] = mapped_column(String, nullable=True)
    resource_id: Mapped[str | None] = mapped_column(String, nullable=True)
    chunk_index: Mapped[int] = mapped_column(Integer)
    chunk_text: Mapped[str] = mapped_column(Text)
    token_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    embedding: Mapped[list[float]] = mapped_column(Vector(768))
    model: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class FlashcardDeck(Base):
    __tablename__ = "flashcard_deck"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[str] = mapped_column(String, index=True)
    course_id: Mapped[str] = mapped_column(String)
    lesson_id: Mapped[str] = mapped_column(String)
    title: Mapped[str] = mapped_column(String)
    source: Mapped[SummarySource] = mapped_column(_source, default=SummarySource.LESSON)
    model: Mapped[str] = mapped_column(String)
    prompt_version: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    cards: Mapped[list["Flashcard"]] = relationship(back_populates="deck", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint("owner_id", "lesson_id", name="uq_deck_owner_lesson"),)


class Flashcard(Base):
    __tablename__ = "flashcard"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    deck_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("flashcard_deck.id", ondelete="CASCADE"), index=True)
    front: Mapped[str] = mapped_column(Text)
    back: Mapped[str] = mapped_column(Text)
    hint: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulty: Mapped[CardDifficulty] = mapped_column(_difficulty, default=CardDifficulty.MEDIUM)
    order_index: Mapped[int] = mapped_column(Integer)
    # SM-2 state
    ease: Mapped[float] = mapped_column(Float, default=2.5)
    interval_days: Mapped[int] = mapped_column(Integer, default=0)
    repetitions: Mapped[int] = mapped_column(Integer, default=0)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_grade: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    deck: Mapped[FlashcardDeck] = relationship(back_populates="cards")

    __table_args__ = (Index("ix_card_due", "deck_id", "due_at"),)


class FlashcardReview(Base):
    __tablename__ = "flashcard_review"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    card_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("flashcard.id", ondelete="CASCADE"), index=True)
    grade: Mapped[int] = mapped_column(SmallInteger)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TranscriptionJob(Base, TimestampMixin):
    __tablename__ = "transcription_job"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(String, index=True)
    course_id: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[JobStatus] = mapped_column(_status, default=JobStatus.PENDING)
    audio_key: Mapped[str] = mapped_column(String)  # scoped tmpfs key, never a public URL
    mime_type: Mapped[str] = mapped_column(String)
    duration_sec: Mapped[float | None] = mapped_column(Float, nullable=True)
    language: Mapped[str | None] = mapped_column(String, nullable=True)
    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)


class AssistantConversation(Base):
    __tablename__ = "assistant_conversation"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(String, index=True)
    course_id: Mapped[str] = mapped_column(String)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    messages: Mapped[list["AssistantMessage"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan"
    )


class AssistantMessage(Base):
    __tablename__ = "assistant_message"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("assistant_conversation.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[MessageRole] = mapped_column(_role)
    content: Mapped[str] = mapped_column(Text)
    citations: Mapped[list] = mapped_column(JSONB, default=list)
    source_audio_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("transcription_job.id"), nullable=True
    )
    tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    conversation: Mapped[AssistantConversation] = relationship(back_populates="messages")
