"""Celery application for heavy AI work (STT, summarize, embed, flashcards).

M0 wires the app + a healthcheck task; pipeline tasks land in M1–M3. Concurrency is bounded
(threat-model DoS control); results expire per JOB_RESULT_TTL_SECONDS.
"""
from __future__ import annotations

from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "eduflow_ai",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks"],
)

celery_app.conf.update(
    task_acks_late=True,
    worker_prefetch_multiplier=1,          # fair dispatch for long STT/LLM tasks
    task_time_limit=600,                   # hard cap (DoS control)
    task_soft_time_limit=540,
    result_expires=settings.job_result_ttl_seconds,
    task_default_queue="ai",
    broker_connection_retry_on_startup=True,
)


@celery_app.task(name="ai.ping")
def ping() -> str:
    """Smoke task to verify broker round-trip."""
    return "pong"


# M1+: from app.services.ai.pipelines import summarize, flashcards, ingest, transcribe  # noqa
# tasks: ai.summarize, ai.flashcards, ai.ingest, ai.transcribe
