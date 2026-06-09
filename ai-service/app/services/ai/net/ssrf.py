"""SSRF egress guard (Security blocking item; threat models RAG-2, SUM-5; OWASP A01:2025).

Any server-side fetch of a user-influenced URL MUST go through `safe_fetch`. It:
  * allows only http/https,
  * resolves the host and blocks private / loopback / link-local / multicast / reserved ranges
    and the cloud metadata IP (169.254.169.254),
  * disables redirects (so a public URL can't bounce to an internal one),
  * caps response size and time.

NOTE: EduFlow lesson ingestion uses BFF-provided text (no fetch), so this guard exists primarily for
resource-URL ingestion and is unit-tested independently. Fail-closed: anything uncertain is rejected.
"""
from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse

import httpx

ALLOWED_SCHEMES = {"http", "https"}
METADATA_IPS = {"169.254.169.254", "fd00:ec2::254"}
MAX_BYTES = 10 * 1024 * 1024  # 10 MB
TIMEOUT_SEC = 10.0


class SsrfBlocked(ValueError):
    """Raised when a URL is rejected by the egress guard."""


def _ip_is_blocked(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return True  # unparseable -> block
    return (
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local
        or addr.is_multicast
        or addr.is_reserved
        or addr.is_unspecified
        or ip in METADATA_IPS
    )


def validate_url(url: str) -> str:
    """Validate a URL for safe server-side fetching. Returns the resolved host or raises SsrfBlocked."""
    parsed = urlparse(url)
    if parsed.scheme not in ALLOWED_SCHEMES:
        raise SsrfBlocked(f"scheme not allowed: {parsed.scheme!r}")
    host = parsed.hostname
    if not host:
        raise SsrfBlocked("missing host")
    if host in METADATA_IPS:
        raise SsrfBlocked("metadata host blocked")

    # Resolve ALL addresses; block if any is internal (DNS-rebinding resistant).
    try:
        infos = socket.getaddrinfo(host, parsed.port or (443 if parsed.scheme == "https" else 80))
    except socket.gaierror as exc:
        raise SsrfBlocked("host resolution failed") from exc
    for info in infos:
        ip = info[4][0]
        if _ip_is_blocked(ip):
            raise SsrfBlocked(f"resolves to blocked address: {ip}")
    return host


def safe_fetch(url: str) -> bytes:
    """Fetch a validated URL with redirects disabled and size/time caps. Fail-closed on any issue."""
    validate_url(url)
    with httpx.Client(follow_redirects=False, timeout=TIMEOUT_SEC) as client:
        resp = client.get(url)
        if resp.is_redirect:
            raise SsrfBlocked("redirects are not allowed")
        resp.raise_for_status()
        content = resp.content
        if len(content) > MAX_BYTES:
            raise SsrfBlocked("response too large")
        return content
