"""Contract compliance for summaries + jobs (contract §2, §6). Requires the live stack."""
import httpx
import pytest

from conftest import AI_BASE_URL, auth, mint_token, poll_job

pytestmark = pytest.mark.live

COURSE = "course-data-literacy"
LESSON = "lesson-data-1"


def _client():
    return httpx.Client(timeout=30)


def test_get_summary_404_before_generation():
    token = mint_token(user_id="u-c1", role="STUDENT", enrolled=[COURSE])
    with _client() as c:
        r = c.get(f"{AI_BASE_URL}/api/v1/ai/summaries?lessonId=never-{LESSON}", headers=auth(token))
        assert r.status_code == 404
        assert r.json()["error"]["code"] == "NOT_FOUND"


def test_generate_then_poll_then_fetch():
    token = mint_token(user_id="u-c2", role="STUDENT", enrolled=[COURSE])
    content = (
        "The mean is the average of values. The median is the middle value when data is ordered. "
        "Variance measures spread. A p-value quantifies evidence against the null hypothesis."
    )
    with _client() as c:
        r = c.post(
            f"{AI_BASE_URL}/api/v1/ai/summaries",
            headers=auth(token),
            json={"lessonId": LESSON, "courseId": COURSE, "title": "Stats", "content": content},
        )
        assert r.status_code in (200, 202)
        if r.status_code == 202:
            job = poll_job(c, token, r.json()["jobId"])
            assert job["status"] == "READY"
            assert job["result"]["summary"]
        # Now the cached GET must return a READY summary with the contract shape.
        r2 = c.get(f"{AI_BASE_URL}/api/v1/ai/summaries?lessonId={LESSON}", headers=auth(token))
        assert r2.status_code == 200
        body = r2.json()
        for key in ("id", "sourceType", "courseId", "summary", "keyPoints", "model", "status"):
            assert key in body


def test_summary_requires_exactly_one_source():
    token = mint_token(user_id="u-c3", role="STUDENT", enrolled=[COURSE])
    with _client() as c:
        r = c.post(
            f"{AI_BASE_URL}/api/v1/ai/summaries",
            headers=auth(token),
            json={"lessonId": LESSON, "resourceId": "res-1", "courseId": COURSE, "content": "x"},
        )
        assert r.status_code == 400
