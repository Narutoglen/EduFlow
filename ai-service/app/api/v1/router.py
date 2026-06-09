"""v1 API router aggregation.

M0 ships health/ready. Feature routers (summaries, flashcards, assistant, jobs, ingest) are added
in M1–M3 against /contracts/api_contracts.md. Stubs are registered here as they land.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import assistant, flashcards, health, ingest, jobs, summaries

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(summaries.router)   # M1: /ai/summaries
api_router.include_router(flashcards.router)  # M2: /ai/flashcards
api_router.include_router(assistant.router)   # M3: /ai/assistant/*
api_router.include_router(ingest.router)      # M3: /ai/ingest
api_router.include_router(jobs.router)        # /ai/jobs/{id}
