"""Provider-agnostic LLM interface. Retrieval is kept separate from generation (charter AI rule)."""
from __future__ import annotations

from typing import Protocol


class LLMProvider(Protocol):
    name: str

    def generate(self, system: str, prompt: str, *, max_tokens: int = 512) -> str:
        """Single-turn completion. Implementations must be synchronous (called from Celery worker)."""
        ...
