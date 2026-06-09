"""Voice upload validation (threat VA-2/VA-8; contract §4). Requires the live stack."""
import httpx
import pytest

from conftest import AI_BASE_URL, auth, mint_token

pytestmark = pytest.mark.live

COURSE = "course-data-literacy"


def _client():
    return httpx.Client(timeout=30)


def test_rejects_non_audio_mime():
    token = mint_token(user_id="u-voice", role="STUDENT", enrolled=[COURSE])
    with _client() as c:
        r = c.post(
            f"{AI_BASE_URL}/api/v1/ai/assistant/voice",
            headers=auth(token),
            files={"audio": ("evil.exe", b"MZ\x90\x00", "application/octet-stream")},
            data={"courseId": COURSE},
        )
        assert r.status_code == 415
        assert r.json()["error"]["code"] == "UNSUPPORTED_MEDIA_TYPE"


def test_rejects_unenrolled_course():
    token = mint_token(user_id="u-voice2", role="STUDENT", enrolled=[])
    with _client() as c:
        r = c.post(
            f"{AI_BASE_URL}/api/v1/ai/assistant/voice",
            headers=auth(token),
            files={"audio": ("q.webm", b"\x1aE\xdf\xa3", "audio/webm")},
            data={"courseId": COURSE},
        )
        assert r.status_code == 403


def test_question_length_validation():
    token = mint_token(user_id="u-voice3", role="STUDENT", enrolled=[COURSE])
    with _client() as c:
        r = c.post(
            f"{AI_BASE_URL}/api/v1/ai/assistant/ask",
            headers=auth(token),
            json={"courseId": COURSE, "question": "x" * 5000, "conversationId": None, "titles": {}},
        )
        assert r.status_code == 422  # exceeds max_question_chars
