"""Ingestion API (contract §5). Embeds lesson text supplied by the BFF (no server-side fetch).

RBAC: caller must be able to read the course (enrolled/owner/admin) — ingesting content the caller
can already access is not a privilege escalation. Idempotent per (lesson, embedding model).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models
from app.core.security import Principal, get_principal
from app.db.session import get_db
from app.schemas import IngestServiceIn
from app.serializers import job_out
from app.services.ai.providers.embeddings import get_embedding_provider
from app.worker import celery_app

router = APIRouter(prefix="/ai", tags=["ingest"])


@router.post("/ingest", response_model=None, status_code=status.HTTP_202_ACCEPTED)
def ingest(
    body: IngestServiceIn,
    principal: Principal = Depends(get_principal),
    db: Session = Depends(get_db),
):
    if not principal.can_read_course(body.courseId):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed to read this course")

    provider = get_embedding_provider()
    model = getattr(provider, "model", provider.name)
    if crud.lesson_is_embedded(db, body.lessonId, model):
        # Already indexed for this model — idempotent no-op (cheap path for repeated "ensure" calls).
        job = crud.create_job(
            db, kind=models.JobKind.INGEST, requested_by=principal.user_id,
            course_id=body.courseId, ref_id=body.lessonId,
        )
        crud.set_job_status(db, job, models.JobStatus.READY)
        db.commit()
        return job_out(job)

    job = crud.create_job(
        db, kind=models.JobKind.INGEST, requested_by=principal.user_id,
        course_id=body.courseId, ref_id=body.lessonId,
    )
    db.commit()
    celery_app.send_task("ai.ingest", args=[str(job.id), body.courseId, body.lessonId, body.content])
    return job_out(job)
