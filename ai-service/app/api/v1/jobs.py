"""Jobs API (contract §6). Requester-only access (anti-IDOR, A01). Populates `result` when READY."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models
from app.core.security import Principal, get_principal
from app.db.session import get_db
from app.serializers import flashcards_list_out, job_out, summary_out

router = APIRouter(prefix="/ai", tags=["jobs"])


@router.get("/jobs/{job_id}")
def get_job(
    job_id: uuid.UUID,
    principal: Principal = Depends(get_principal),
    db: Session = Depends(get_db),
):
    job = crud.get_job(db, job_id)
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    if not principal.is_admin and job.requested_by != principal.user_id:
        # Do not reveal existence to non-owners
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")

    result = None
    if job.status == models.JobStatus.READY and job.result_id is not None:
        if job.kind == models.JobKind.SUMMARIZE:
            row = db.get(models.LectureSummary, job.result_id)
            if row is not None:
                result = summary_out(row).model_dump(mode="json")
        elif job.kind == models.JobKind.FLASHCARDS:
            deck = db.get(models.FlashcardDeck, job.result_id)
            if deck is not None:
                cards = crud.list_cards(db, deck.id)
                result = flashcards_list_out(deck, cards).model_dump(mode="json")
        elif job.kind == models.JobKind.TRANSCRIBE:
            tx = db.get(models.TranscriptionJob, job.result_id)
            if tx is not None:
                result = {
                    "transcript": tx.transcript,
                    "language": tx.language,
                    "durationSec": tx.duration_sec,
                }
    return job_out(job, result=result)
