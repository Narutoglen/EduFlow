"""Flashcards API (contract §3). Per-learner decks; SM-2 review. Object-level authz (anti-IDOR)."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app import crud, models
from app.core.security import Principal, get_principal
from app.db.session import get_db
from app.schemas import (
    DueListOut,
    FlashcardGenerateServiceIn,
    FlashcardsListOut,
    ReviewIn,
    ReviewOut,
)
from app.serializers import card_out, flashcards_list_out, job_out
from app.services.ai.prompts import FLASHCARDS_VERSION
from app.services.ai.providers import get_llm_provider
from app.services.ai.srs import SrsState, schedule
from app.worker import celery_app

router = APIRouter(prefix="/ai", tags=["flashcards"])


@router.post("/flashcards/generate", response_model=None, status_code=status.HTTP_202_ACCEPTED)
def generate(
    body: FlashcardGenerateServiceIn,
    response: Response,
    principal: Principal = Depends(get_principal),
    db: Session = Depends(get_db),
):
    if not principal.can_read_course(body.courseId):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed to read this course")

    existing = crud.get_deck_for_owner(db, principal.user_id, body.lessonId)
    if existing is not None:
        # Idempotent: deck already generated for this learner+lesson.
        response.status_code = status.HTTP_200_OK
        return flashcards_list_out(existing, crud.list_cards(db, existing.id))

    job = crud.create_job(
        db,
        kind=models.JobKind.FLASHCARDS,
        requested_by=principal.user_id,
        course_id=body.courseId,
        ref_id=body.lessonId,
    )
    db.commit()
    celery_app.send_task(
        "ai.flashcards",
        args=[
            str(job.id),
            principal.user_id,
            body.lessonId,
            body.courseId,
            body.title,
            body.content,
            body.count,
        ],
    )
    return job_out(job)


@router.get("/flashcards", response_model=FlashcardsListOut)
def list_deck(
    lessonId: str = Query(...),
    principal: Principal = Depends(get_principal),
    db: Session = Depends(get_db),
) -> FlashcardsListOut:
    deck = crud.get_deck_for_owner(db, principal.user_id, lessonId)
    if deck is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No deck yet")
    return flashcards_list_out(deck, crud.list_cards(db, deck.id))


@router.get("/flashcards/due", response_model=DueListOut)
def due(
    lessonId: str = Query(...),
    limit: int = Query(default=20, ge=1, le=100),
    principal: Principal = Depends(get_principal),
    db: Session = Depends(get_db),
) -> DueListOut:
    deck = crud.get_deck_for_owner(db, principal.user_id, lessonId)
    if deck is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No deck yet")
    now = datetime.now(timezone.utc)
    cards = crud.list_due_cards(db, deck.id, now, limit)
    return DueListOut(items=[card_out(c) for c in cards], nextCursor=None)


@router.post("/flashcards/{card_id}/review", response_model=ReviewOut)
def review(
    card_id: uuid.UUID,
    body: ReviewIn,
    principal: Principal = Depends(get_principal),
    db: Session = Depends(get_db),
) -> ReviewOut:
    card = crud.get_card(db, card_id)
    if card is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Card not found")
    deck = crud.get_deck(db, card.deck_id)
    # Object-level authz: the card's deck must belong to the caller (anti-IDOR, FC-2).
    if deck is None or (not principal.is_admin and deck.owner_id != principal.user_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Card not found")

    next_state = schedule(
        SrsState(ease=card.ease, interval_days=card.interval_days, repetitions=card.repetitions),
        body.grade,
    )
    card.ease = next_state.ease
    card.interval_days = next_state.interval_days
    card.repetitions = next_state.repetitions
    card.last_grade = body.grade
    card.due_at = datetime.now(timezone.utc) + timedelta(days=next_state.interval_days)
    db.add(card)
    db.add(models.FlashcardReview(card_id=card.id, grade=body.grade))
    db.commit()

    return ReviewOut(
        id=card.id,
        ease=card.ease,
        interval=card.interval_days,
        repetitions=card.repetitions,
        dueAt=card.due_at,
    )
