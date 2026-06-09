"""AuthN/AuthZ + IDOR matrix (contract §7; threat models FC-2, VA-1). Requires the live stack."""
import httpx
import pytest

from conftest import AI_BASE_URL, auth, mint_token, poll_job

pytestmark = pytest.mark.live

COURSE = "course-data-literacy"
LESSON = "lesson-data-1"  # adjust to a seeded lesson id


def _client():
    return httpx.Client(timeout=30)


def test_missing_token_is_unauthorized():
    with _client() as c:
        r = c.get(f"{AI_BASE_URL}/api/v1/ai/summaries?lessonId={LESSON}")
        assert r.status_code == 401
        assert r.json()["error"]["code"] == "UNAUTHORIZED"


def test_tampered_token_is_unauthorized():
    with _client() as c:
        r = c.get(
            f"{AI_BASE_URL}/api/v1/ai/summaries?lessonId={LESSON}",
            headers={"authorization": "Bearer not.a.jwt"},
        )
        assert r.status_code == 401


def test_student_not_enrolled_is_forbidden():
    token = mint_token(user_id="u-outsider", role="STUDENT", enrolled=[])
    with _client() as c:
        r = c.post(
            f"{AI_BASE_URL}/api/v1/ai/summaries",
            headers=auth(token),
            json={"lessonId": LESSON, "courseId": COURSE, "title": "x", "content": "hello"},
        )
        assert r.status_code == 403


def test_idor_job_not_visible_to_other_user():
    owner = mint_token(user_id="u-owner", role="STUDENT", enrolled=[COURSE])
    attacker = mint_token(user_id="u-attacker", role="STUDENT", enrolled=[COURSE])
    with _client() as c:
        r = c.post(
            f"{AI_BASE_URL}/api/v1/ai/summaries",
            headers=auth(owner),
            json={"lessonId": LESSON, "courseId": COURSE, "title": "x", "content": "alpha beta gamma " * 20},
        )
        assert r.status_code in (200, 202)
        if r.status_code == 202:
            job_id = r.json()["jobId"]
            # Attacker must not be able to read the owner's job.
            r2 = c.get(f"{AI_BASE_URL}/api/v1/ai/jobs/{job_id}", headers=auth(attacker))
            assert r2.status_code == 404


def test_idor_flashcard_review_other_users_card():
    """A user cannot review (mutate SM-2 state of) another user's card."""
    owner = mint_token(user_id="u-owner2", role="STUDENT", enrolled=[COURSE])
    attacker = mint_token(user_id="u-attacker2", role="STUDENT", enrolled=[COURSE])
    with _client() as c:
        r = c.post(
            f"{AI_BASE_URL}/api/v1/ai/flashcards/generate",
            headers=auth(owner),
            json={"lessonId": LESSON, "courseId": COURSE, "title": "x",
                  "content": "The mean is the average. The median is the middle value.", "count": 3},
        )
        assert r.status_code in (200, 202)
        if r.status_code == 202:
            job = poll_job(c, owner, r.json()["jobId"])
            assert job["status"] == "READY"
            cards = job["result"]["cards"]
        else:
            cards = r.json()["cards"]
        card_id = cards[0]["id"]
        r2 = c.post(
            f"{AI_BASE_URL}/api/v1/ai/flashcards/{card_id}/review",
            headers=auth(attacker),
            json={"grade": 5},
        )
        assert r2.status_code == 404  # not found for non-owner (no existence leak)
