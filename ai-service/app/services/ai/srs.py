"""SM-2 spaced-repetition scheduling (pure, dependency-free → unit-testable in isolation).

Grades 0-5 (SuperMemo SM-2). q < 3 is a lapse: repetitions reset and the card is reviewed again
the next day; q >= 3 advances the interval. Ease factor floored at 1.3.
"""
from __future__ import annotations

from dataclasses import dataclass

EASE_MIN = 1.3
EASE_START = 2.5


@dataclass(frozen=True)
class SrsState:
    ease: float
    interval_days: int
    repetitions: int


def schedule(state: SrsState, grade: int) -> SrsState:
    if not 0 <= grade <= 5:
        raise ValueError("grade must be 0..5")

    if grade < 3:
        repetitions = 0
        interval = 1
    else:
        repetitions = state.repetitions + 1
        if repetitions == 1:
            interval = 1
        elif repetitions == 2:
            interval = 6
        else:
            interval = round(state.interval_days * state.ease)

    ease = state.ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    ease = max(EASE_MIN, ease)
    return SrsState(ease=round(ease, 4), interval_days=interval, repetitions=repetitions)
