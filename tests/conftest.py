"""Shared QA fixtures. Tests run against the LIVE ai-service (compose `test` profile).

There is no real browser session in these API tests, so QA mints the same short-lived HS256 service
token the BFF would mint (matching ai-service/app/core/security.py). This lets us drive the AuthN/AuthZ
and IDOR matrices directly.
"""
from __future__ import annotations

import os
import time
import uuid

import jwt
import pytest

AI_BASE_URL = os.environ.get("AI_BASE_URL", "http://localhost:8000")
TOKEN_SECRET = os.environ.get("AI_SERVICE_TOKEN_SECRET", "x")
TOKEN_AUD = os.environ.get("AI_SERVICE_TOKEN_AUD", "ai-service")


def mint_token(
    *,
    user_id: str,
    role: str = "STUDENT",
    enrolled: list[str] | None = None,
    owned: list[str] | None = None,
    ttl: int = 300,
) -> str:
    now = int(time.time())
    return jwt.encode(
        {
            "sub": user_id,
            "role": role,
            "enrolled": enrolled or [],
            "owned": owned or [],
            "aud": TOKEN_AUD,
            "iat": now,
            "exp": now + ttl,
        },
        TOKEN_SECRET,
        algorithm="HS256",
    )


def auth(token: str) -> dict[str, str]:
    return {"authorization": f"Bearer {token}"}


def poll_job(client, token: str, job_id: str, timeout: float = 30.0) -> dict:
    """Poll a job to a terminal state and return the final job body."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        r = client.get(f"{AI_BASE_URL}/api/v1/ai/jobs/{job_id}", headers=auth(token))
        r.raise_for_status()
        body = r.json()
        if body["status"] in ("READY", "FAILED", "CANCELLED"):
            return body
        time.sleep(0.5)
    raise AssertionError(f"job {job_id} did not finish within {timeout}s")


@pytest.fixture
def base_url() -> str:
    return AI_BASE_URL


@pytest.fixture
def rid() -> str:
    return uuid.uuid4().hex[:8]
