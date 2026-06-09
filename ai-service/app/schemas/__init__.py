"""Pydantic v2 request/response schemas — must match /contracts/api_contracts.md exactly."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


# ---- Error envelope (contract §0) ----
class ErrorBody(BaseModel):
    code: str
    message: str
    requestId: str


class ErrorResponse(BaseModel):
    error: ErrorBody


# ---- Job (shared) ----
class JobOut(BaseModel):
    jobId: uuid.UUID
    kind: Literal["SUMMARIZE", "FLASHCARDS", "TRANSCRIBE", "INGEST", "RAG"]
    status: Literal["PENDING", "RUNNING", "READY", "FAILED", "CANCELLED"]
    resultId: uuid.UUID | None = None
    error: str | None = None
    createdAt: datetime
    updatedAt: datetime
    result: dict[str, Any] | None = None


# ---- Health ----
class HealthOut(BaseModel):
    status: Literal["ok"] = "ok"


class ReadyOut(BaseModel):
    db: bool
    redis: bool
    ollama: bool


# ---- Summaries (contract §2) ----
class SummaryGenerateIn(BaseModel):
    lessonId: str | None = None
    resourceId: str | None = None


class SummaryGenerateServiceIn(BaseModel):
    """Internal shape: the BFF enriches the public {lessonId} request with the source text it owns.

    The browser never sends `content`/`title` — only the trusted Next.js BFF (server-to-server) does,
    since the LMS content lives in the web app. See /contracts/api_contracts.md §2 (internal note).
    """
    lessonId: str | None = None
    resourceId: str | None = None
    courseId: str
    title: str = ""
    content: str = ""


class SummaryOut(BaseModel):
    id: uuid.UUID
    sourceType: Literal["LESSON", "RESOURCE"]
    lessonId: str | None = None
    resourceId: str | None = None
    courseId: str
    summary: str | None = None
    keyPoints: list[str] = Field(default_factory=list)
    readingSeconds: int | None = None
    model: str
    promptVersion: str
    status: str
    updatedAt: datetime


# ---- Flashcards (contract §3) ----
class FlashcardGenerateIn(BaseModel):
    lessonId: str
    count: int = Field(default=10, ge=1, le=30)


class FlashcardGenerateServiceIn(BaseModel):
    """Internal: BFF enriches {lessonId,count} with the lesson content it owns."""
    lessonId: str
    courseId: str
    title: str = ""
    content: str = ""
    count: int = Field(default=10, ge=1, le=30)


class CardOut(BaseModel):
    id: uuid.UUID
    front: str
    back: str
    hint: str | None = None
    difficulty: Literal["EASY", "MEDIUM", "HARD"]
    dueAt: datetime
    interval: int
    repetitions: int


class DeckOut(BaseModel):
    id: uuid.UUID
    lessonId: str
    title: str
    cardCount: int


class FlashcardsListOut(BaseModel):
    deck: DeckOut
    cards: list[CardOut]


class DueListOut(BaseModel):
    items: list[CardOut]
    nextCursor: str | None = None


class ReviewIn(BaseModel):
    grade: int = Field(ge=0, le=5)


class ReviewOut(BaseModel):
    id: uuid.UUID
    ease: float
    interval: int
    repetitions: int
    dueAt: datetime


# ---- Assistant (contract §4) ----
class AskIn(BaseModel):
    conversationId: uuid.UUID | None = None
    courseId: str
    question: str = Field(min_length=1, max_length=2000)
    sourceAudioId: uuid.UUID | None = None


class AskServiceIn(AskIn):
    """Internal: BFF adds a lessonId->title map (LMS-owned) so citations carry titles."""
    titles: dict[str, str] = Field(default_factory=dict)


class Citation(BaseModel):
    lessonId: str | None = None
    title: str
    chunkIndex: int
    score: float


class AskOut(BaseModel):
    conversationId: uuid.UUID
    answer: str
    citations: list[Citation] = Field(default_factory=list)
    messageId: uuid.UUID


class ConversationOut(BaseModel):
    id: uuid.UUID
    title: str | None = None
    createdAt: datetime


class ConversationListOut(BaseModel):
    items: list[ConversationOut]
    nextCursor: str | None = None


class MessageOut(BaseModel):
    id: uuid.UUID
    role: Literal["USER", "ASSISTANT"]
    content: str
    citations: list[Citation] = Field(default_factory=list)
    createdAt: datetime


class MessageListOut(BaseModel):
    items: list[MessageOut]
    nextCursor: str | None = None


class TranscriptResult(BaseModel):
    transcript: str
    language: str | None = None
    durationSec: float | None = None


# ---- Ingest (contract §5) ----
class IngestIn(BaseModel):
    courseId: str
    lessonId: str | None = None
    resourceId: str | None = None


class IngestServiceIn(BaseModel):
    """Internal: BFF supplies the lesson text it owns (no server-side fetch -> SSRF-safe)."""
    courseId: str
    lessonId: str
    title: str = ""
    content: str = ""
