"""Flashcard generation: sanitize -> LLM structured output -> strict validation (A08 integrity).

The model is asked for a JSON array; we extract the first array, validate each item with Pydantic,
drop malformed entries, and cap to the requested count. Never persists unvalidated model output.
"""
from __future__ import annotations

import json
import re
from typing import Literal

from pydantic import BaseModel, Field, ValidationError

from app.services.ai import prompts, safety
from app.services.ai.providers.base import LLMProvider


class GeneratedCard(BaseModel):
    front: str = Field(min_length=1, max_length=500)
    back: str = Field(min_length=1, max_length=2000)
    hint: str | None = Field(default=None, max_length=300)
    difficulty: Literal["EASY", "MEDIUM", "HARD"] = "MEDIUM"


def _extract_json_array(raw: str) -> list:
    # Be lenient: grab the first [...] block even if the model adds prose.
    m = re.search(r"\[.*\]", raw, re.DOTALL)
    if not m:
        return []
    try:
        data = json.loads(m.group(0))
        return data if isinstance(data, list) else []
    except json.JSONDecodeError:
        return []


def generate_cards(text: str, count: int, provider: LLMProvider) -> list[GeneratedCard]:
    clean = safety.sanitize_content(text or "")
    raw = provider.generate(
        prompts.FLASHCARDS_SYSTEM,
        prompts.FLASHCARDS_GENERATE.format(count=count, content=clean),
        max_tokens=1024,
    )
    items = _extract_json_array(safety.cap_output(raw))
    cards: list[GeneratedCard] = []
    for item in items:
        try:
            cards.append(GeneratedCard.model_validate(item))
        except ValidationError:
            continue  # drop malformed cards; never persist invalid output
        if len(cards) >= count:
            break
    return cards
