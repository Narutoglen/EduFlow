"""Unit tests for SM-2 scheduling (business logic owned by Backend)."""
import pytest

from app.services.ai.srs import EASE_MIN, EASE_START, SrsState, schedule


def test_first_reviews_use_fixed_intervals():
    s = schedule(SrsState(EASE_START, 0, 0), 4)
    assert (s.interval_days, s.repetitions) == (1, 1)
    s = schedule(s, 4)
    assert (s.interval_days, s.repetitions) == (6, 2)


def test_third_review_scales_by_ease():
    s = SrsState(ease=2.5, interval_days=6, repetitions=2)
    s = schedule(s, 5)
    assert s.repetitions == 3
    assert s.interval_days == round(6 * 2.5)


def test_lapse_resets_repetitions_and_lowers_ease():
    s = SrsState(ease=2.5, interval_days=20, repetitions=4)
    s2 = schedule(s, 1)
    assert s2.repetitions == 0
    assert s2.interval_days == 1
    assert s2.ease < s.ease


def test_ease_never_below_floor():
    s = schedule(SrsState(EASE_MIN, 10, 5), 0)
    assert s.ease == EASE_MIN


@pytest.mark.parametrize("grade", [-1, 6, 99])
def test_invalid_grade_raises(grade):
    with pytest.raises(ValueError):
        schedule(SrsState(EASE_START, 0, 0), grade)
