"""Celery tasks. Registered via celery_app(include=["app.tasks"]) in app.worker."""
from __future__ import annotations

import logging
import time

from app import crud, models
from app.db.session import SessionLocal
from app.services.ai.pipelines import flashcards as flashcards_pipeline
from app.services.ai.pipelines import ingest as ingest_pipeline
from app.services.ai.pipelines import summarize as summarize_pipeline
from app.services.ai.prompts import FLASHCARDS_VERSION
from app.services.ai.providers import get_llm_provider
from app.services.ai.providers.stt import get_stt_provider
from app.worker import celery_app

logger = logging.getLogger("ai.tasks")


@celery_app.task(name="ai.summarize", bind=True, max_retries=2, default_retry_delay=10)
def summarize_task(self, job_id: str, summary_id: str, content: str, title: str) -> str:
    """Run the summarize pipeline and persist results. Idempotent on re-delivery via job status."""
    started = time.monotonic()
    db = SessionLocal()
    try:
        import uuid

        job = crud.get_job(db, uuid.UUID(job_id))
        summary = db.get(models.LectureSummary, uuid.UUID(summary_id))
        if job is None or summary is None:
            logger.error("summarize: missing job/summary", extra={"job_id": job_id})
            return "missing"
        if job.status in (models.JobStatus.READY, models.JobStatus.CANCELLED):
            return job.status.value

        crud.set_job_status(db, job, models.JobStatus.RUNNING)
        summary.status = models.JobStatus.RUNNING
        db.commit()

        provider = get_llm_provider()
        result = summarize_pipeline.summarize(content, provider)

        summary.summary = result.summary
        summary.key_points = result.key_points
        summary.reading_seconds = result.reading_seconds
        summary.prompt_version = result.prompt_version
        summary.model = getattr(provider, "model", provider.name)
        summary.status = models.JobStatus.READY
        crud.set_job_status(
            db, job, models.JobStatus.READY, duration_ms=int((time.monotonic() - started) * 1000)
        )
        db.commit()
        return "ready"
    except Exception as exc:  # noqa: BLE001 — fail-closed, record generic error
        db.rollback()
        try:
            import uuid

            job = crud.get_job(db, uuid.UUID(job_id))
            summary = db.get(models.LectureSummary, uuid.UUID(summary_id))
            if job is not None:
                crud.set_job_status(db, job, models.JobStatus.FAILED, error="summarization failed")
            if summary is not None:
                summary.status = models.JobStatus.FAILED
            db.commit()
        except Exception:  # noqa: BLE001
            db.rollback()
        logger.exception("summarize failed", extra={"job_id": job_id})
        raise self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task(name="ai.flashcards", bind=True, max_retries=2, default_retry_delay=10)
def flashcards_task(
    self,
    job_id: str,
    owner_id: str,
    lesson_id: str,
    course_id: str,
    title: str,
    content: str,
    count: int,
) -> str:
    """Generate + persist a per-learner deck. Validated cards only (A08)."""
    import uuid

    db = SessionLocal()
    try:
        job = crud.get_job(db, uuid.UUID(job_id))
        if job is None or job.status in (models.JobStatus.READY, models.JobStatus.CANCELLED):
            return "skip"

        # Race guard: deck may already exist (idempotent on owner+lesson).
        existing = crud.get_deck_for_owner(db, owner_id, lesson_id)
        if existing is not None:
            crud.set_job_status(db, job, models.JobStatus.READY)
            job.result_id = existing.id
            db.commit()
            return "exists"

        crud.set_job_status(db, job, models.JobStatus.RUNNING)
        db.commit()

        provider = get_llm_provider()
        cards = flashcards_pipeline.generate_cards(content, count, provider)
        if not cards:
            crud.set_job_status(db, job, models.JobStatus.FAILED, error="no cards generated")
            db.commit()
            return "empty"

        deck = crud.create_deck_with_cards(
            db,
            owner_id=owner_id,
            course_id=course_id,
            lesson_id=lesson_id,
            title=title or "Flashcards",
            model=getattr(provider, "model", provider.name),
            prompt_version=FLASHCARDS_VERSION,
            cards=[c.model_dump() for c in cards],
        )
        job.result_id = deck.id
        crud.set_job_status(db, job, models.JobStatus.READY)
        db.commit()
        return "ready"
    except Exception as exc:  # noqa: BLE001 — fail-closed
        db.rollback()
        try:
            import uuid

            job = crud.get_job(db, uuid.UUID(job_id))
            if job is not None:
                crud.set_job_status(db, job, models.JobStatus.FAILED, error="flashcard generation failed")
                db.commit()
        except Exception:  # noqa: BLE001
            db.rollback()
        logger.exception("flashcards failed", extra={"job_id": job_id})
        raise self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task(name="ai.ingest", bind=True, max_retries=2, default_retry_delay=10)
def ingest_task(self, job_id: str, course_id: str, lesson_id: str, content: str) -> str:
    """Chunk + embed lesson text into pgvector (every row carries course_id — RAG-5)."""
    import uuid

    db = SessionLocal()
    try:
        job = crud.get_job(db, uuid.UUID(job_id))
        if job is None or job.status in (models.JobStatus.READY, models.JobStatus.CANCELLED):
            return "skip"
        crud.set_job_status(db, job, models.JobStatus.RUNNING)
        db.commit()

        chunks = ingest_pipeline.build_chunks(content)
        vectors, model = ingest_pipeline.embed_chunks(chunks)
        count = crud.replace_lesson_embeddings(
            db, course_id=course_id, lesson_id=lesson_id, model=model, chunks=chunks, vectors=vectors
        )
        crud.set_job_status(db, job, models.JobStatus.READY)
        db.commit()
        return f"embedded:{count}"
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        _mark_failed(db, job_id, "ingestion failed")
        logger.exception("ingest failed", extra={"job_id": job_id})
        raise self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task(name="ai.transcribe", bind=True, max_retries=1, default_retry_delay=5)
def transcribe_task(self, job_id: str, tx_id: str, path: str, mime: str) -> str:
    """Transcribe audio, persist transcript, then PURGE the audio file (VA-4)."""
    import os
    import uuid

    db = SessionLocal()
    try:
        job = crud.get_job(db, uuid.UUID(job_id))
        tx = crud.get_transcription(db, uuid.UUID(tx_id))
        if job is None or tx is None:
            return "missing"
        if job.status in (models.JobStatus.READY, models.JobStatus.CANCELLED):
            return job.status.value

        crud.set_job_status(db, job, models.JobStatus.RUNNING)
        tx.status = models.JobStatus.RUNNING
        db.commit()

        provider = get_stt_provider()
        result = provider.transcribe(path, mime)
        tx.transcript = result.text
        tx.language = result.language
        tx.duration_sec = result.duration_sec
        tx.status = models.JobStatus.READY
        crud.set_job_status(db, job, models.JobStatus.READY)
        db.commit()
        return "ready"
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        _mark_failed(db, job_id, "transcription failed")
        logger.exception("transcribe failed", extra={"job_id": job_id})
        raise self.retry(exc=exc)
    finally:
        # Always remove the raw audio — never persist voice to disk (VA-4).
        try:
            if os.path.exists(path):
                os.remove(path)
        except OSError:
            pass
        db.close()


def _mark_failed(db, job_id: str, message: str) -> None:
    import uuid

    try:
        job = crud.get_job(db, uuid.UUID(job_id))
        if job is not None:
            crud.set_job_status(db, job, models.JobStatus.FAILED, error=message)
            db.commit()
    except Exception:  # noqa: BLE001
        db.rollback()
