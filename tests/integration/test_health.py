"""Smoke: the AI service is up and dependencies are reachable."""
import httpx
import pytest

from conftest import AI_BASE_URL

pytestmark = pytest.mark.live


def test_health_ok():
    r = httpx.get(f"{AI_BASE_URL}/api/v1/health", timeout=5)
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_ready_reports_dependencies():
    r = httpx.get(f"{AI_BASE_URL}/api/v1/ready", timeout=10)
    assert r.status_code == 200
    body = r.json()
    assert set(body) == {"db", "redis", "ollama"}
    assert body["db"] is True  # DB must be reachable for the stack to be ready
