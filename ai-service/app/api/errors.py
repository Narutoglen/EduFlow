"""Uniform error envelope + handlers (contract §0, fail-closed A10:2025)."""
from __future__ import annotations

import logging
import uuid

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("ai.errors")

_STATUS_CODE = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    413: "PAYLOAD_TOO_LARGE",
    415: "UNSUPPORTED_MEDIA_TYPE",
    422: "BAD_REQUEST",
    429: "RATE_LIMITED",
    502: "UPSTREAM_UNAVAILABLE",
    503: "UPSTREAM_UNAVAILABLE",
}


def _envelope(code: str, message: str, request_id: str) -> dict:
    return {"error": {"code": code, "message": message, "requestId": request_id}}


def _request_id(request: Request) -> str:
    return request.headers.get("x-request-id") or f"req_{uuid.uuid4().hex[:12]}"


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    rid = _request_id(request)
    code = _STATUS_CODE.get(exc.status_code, "INTERNAL")
    return JSONResponse(status_code=exc.status_code, content=_envelope(code, str(exc.detail), rid))


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    rid = _request_id(request)
    # Do not echo internal validation internals verbatim beyond field hints
    msg = "; ".join(f"{'.'.join(str(p) for p in e['loc'][1:])}: {e['msg']}" for e in exc.errors()[:5])
    return JSONResponse(status_code=422, content=_envelope("BAD_REQUEST", msg or "Invalid request", rid))


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    rid = _request_id(request)
    logger.exception("unhandled error", extra={"request_id": rid})
    # Generic external message — no stack/secret leakage
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=_envelope("INTERNAL", "Internal server error", rid),
    )
