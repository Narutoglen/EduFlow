"""Service-token verification (BFF -> ai-service) and the authenticated principal.

The Next.js BFF validates the EduFlow session, then mints a short-lived HS256 token carrying the
caller's identity and role. ai-service verifies it and performs object-level authz downstream
(anti-IDOR, contract §7). Fail-closed: any error -> 401.
"""
from __future__ import annotations

from dataclasses import dataclass

import jwt
from fastapi import Depends, Header, HTTPException, status

from app.core.config import Settings, get_settings

ROLES = {"STUDENT", "LECTURER", "TA", "ADMIN"}


@dataclass(frozen=True)
class Principal:
    user_id: str
    role: str
    # course memberships the BFF asserts (enrolled / owned / assisted), used for object-level authz
    enrolled_course_ids: frozenset[str]
    owned_course_ids: frozenset[str]

    @property
    def is_admin(self) -> bool:
        return self.role == "ADMIN"

    def can_read_course(self, course_id: str) -> bool:
        return self.is_admin or course_id in self.enrolled_course_ids or course_id in self.owned_course_ids

    def can_manage_course(self, course_id: str) -> bool:
        return self.is_admin or course_id in self.owned_course_ids


def get_principal(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> Principal:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    token = authorization.split(" ", 1)[1]
    try:
        claims = jwt.decode(
            token,
            settings.service_token_secret,
            algorithms=["HS256"],
            audience=settings.service_token_audience,
        )
    except jwt.PyJWTError:
        # Generic error — never leak why (A10:2025)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")

    role = claims.get("role")
    user_id = claims.get("sub")
    if role not in ROLES or not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")

    return Principal(
        user_id=user_id,
        role=role,
        enrolled_course_ids=frozenset(claims.get("enrolled", [])),
        owned_course_ids=frozenset(claims.get("owned", [])),
    )
