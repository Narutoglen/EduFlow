"""Liveness + readiness probes (deployment §4). /ready checks db, redis, ollama reachability."""
from __future__ import annotations

import httpx
import redis
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.schemas import HealthOut, ReadyOut

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthOut)
def health() -> HealthOut:
    """Liveness — process is up. Never touches dependencies."""
    return HealthOut()


@router.get("/ready", response_model=ReadyOut)
def ready(db: Session = Depends(get_db), settings: Settings = Depends(get_settings)) -> ReadyOut:
    """Readiness — dependencies reachable. Used by compose healthcheck gating."""
    db_ok = _check_db(db)
    redis_ok = _check_redis(settings.redis_url)
    ollama_ok = _check_ollama(settings.ollama_url)
    return ReadyOut(db=db_ok, redis=redis_ok, ollama=ollama_ok)


def _check_db(db: Session) -> bool:
    try:
        db.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


def _check_redis(url: str) -> bool:
    try:
        client = redis.Redis.from_url(url, socket_connect_timeout=1)
        return bool(client.ping())
    except Exception:
        return False


def _check_ollama(url: str) -> bool:
    try:
        resp = httpx.get(f"{url}/api/tags", timeout=2.0)
        return resp.status_code == 200
    except Exception:
        return False
