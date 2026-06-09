"""Summaries API (contract §2). RBAC: caller must be able to read the course (enrolled/owner/admin)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app import crud, models
from app.core.security import Principal, get_principal
from app.serializers import summary_out
from app.schemas import SummaryGenerateServiceIn, SummaryOut
from app.services.ai.providers import get_llm_provider
from app.services.ai.prompts import SUMMARIZE_VERSION
from app.db.session import get_db
from app.worker import celery_app

router = APIRouter(prefix="/ai", tags=["summaries"])


@router.get("/summaries", response_model=SummaryOut)
def get_summary(
    lessonId: str | None = Query(default=None),
    resourceId: str | None = Query(default=None),
    principal: Principal = Depends(get_principal),
    db: Session = Depends(get_db),
) -> SummaryOut:
    if (lessonId is None) == (resourceId is None):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Provide exactly one of lessonId|resourceId")

    row = (
        crud.get_summary_by_lesson(db, lessonId)
        if lessonId
        else crud.get_summary_by_resource(db, resourceId)  # type: ignore[arg-type]
    )
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No summary generated yet")
    if not principal.can_read_course(row.course_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed to read this course")
    return summary_out(row)


@router.post("/summaries", response_model=None, status_code=status.HTTP_202_ACCEPTED)
def generate_summary(
    body: SummaryGenerateServiceIn,
    response: Response,
    principal: Principal = Depends(get_principal),
    db: Session = Depends(get_db),
):
    if (body.lessonId is None) == (body.resourceId is None):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Provide exactly one of lessonId|resourceId")
    if not principal.can_read_course(body.courseId):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed to read this course")

    provider = get_llm_provider()
    model = getattr(provider, "model", provider.name)

    existing = (
        crud.get_summary_by_lesson(db, body.lessonId)
        if body.lessonId
        else crud.get_summary_by_resource(db, body.resourceId)  # type: ignore[arg-type]
    )
    if existing and existing.status == models.JobStatus.READY:
        response.status_code = status.HTTP_200_OK
        return summary_out(existing)

    if existing is None:
        source_type = models.SummarySource.LESSON if body.lessonId else models.SummarySource.RESOURCE
        existing = crud.create_pending_summary(
            db,
            source_type=source_type,
            lesson_id=body.lessonId,
            resource_id=body.resourceId,
            course_id=body.courseId,
            model=model,
            prompt_version=SUMMARIZE_VERSION,
        )

    job = crud.create_job(
        db,
        kind=models.JobKind.SUMMARIZE,
        requested_by=principal.user_id,
        course_id=body.courseId,
        ref_id=body.lessonId or body.resourceId,
        result_id=existing.id,
    )
    db.commit()

    # Content is passed through the broker (not persisted) to avoid duplicating lesson text / PII.
    celery_app.send_task(
        "ai.summarize",
        args=[str(job.id), str(existing.id), body.content, body.title],
    )
    from app.serializers import job_out

    return job_out(job)
