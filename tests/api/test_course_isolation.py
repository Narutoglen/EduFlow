"""BLOCKING (Security #1): prove RAG retrieval never crosses course boundaries (threat VA-3/RAG-5).

Strategy (deterministic, provider-agnostic): ingest a unique marker token into course B only, then ask
that exact marker as a question scoped to course A. Because retrieval filters by course_id in SQL, no
course-B chunk can be returned for a course-A query — so no citation may reference a course-B lesson.
Requires the live stack (AI_PROVIDER=stub gives stable embeddings).
"""
import uuid

import httpx
import pytest

from conftest import AI_BASE_URL, auth, mint_token

pytestmark = pytest.mark.live


def test_retrieval_is_scoped_to_course():
    course_a = f"course-A-{uuid.uuid4().hex[:6]}"
    course_b = f"course-B-{uuid.uuid4().hex[:6]}"
    lesson_a = f"{course_a}-lesson"
    lesson_b = f"{course_b}-lesson"
    marker = f"ztoken{uuid.uuid4().hex[:8]}"  # appears ONLY in course B

    # Admin can read/ingest both courses.
    admin = mint_token(user_id="u-admin", role="ADMIN")

    with httpx.Client(timeout=30) as c:
        # Ingest distinct content per course.
        for course, lesson, text in [
            (course_a, lesson_a, "Course A covers photosynthesis and chlorophyll in plants."),
            (course_b, lesson_b, f"Course B secret topic about {marker} and quantum entanglement."),
        ]:
            r = c.post(
                f"{AI_BASE_URL}/api/v1/ai/ingest",
                headers=auth(admin),
                json={"courseId": course, "lessonId": lesson, "title": lesson, "content": text},
            )
            assert r.status_code in (200, 202), r.text

        # Ask course A about course B's unique marker.
        r = c.post(
            f"{AI_BASE_URL}/api/v1/ai/assistant/ask",
            headers=auth(admin),
            json={"courseId": course_a, "question": f"Tell me about {marker}",
                  "conversationId": None, "titles": {lesson_a: "A", lesson_b: "B"}},
        )
        assert r.status_code == 200, r.text
        body = r.json()

        # ISOLATION ASSERTIONS: no citation may reference course B's lesson.
        cited_lessons = {cit.get("lessonId") for cit in body["citations"]}
        assert lesson_b not in cited_lessons, f"cross-course leak: {body['citations']}"
        assert all(l in {lesson_a, None} for l in cited_lessons), cited_lessons
        # And the marker text (course B only) must not surface in the answer.
        assert marker not in body["answer"]
