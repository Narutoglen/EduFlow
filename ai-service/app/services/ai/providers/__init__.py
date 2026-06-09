"""Provider factory. Selects the LLM backend from settings (local-first, pluggable)."""
from __future__ import annotations

from functools import lru_cache

from app.core.config import get_settings
from app.services.ai.providers.base import LLMProvider
from app.services.ai.providers.ollama import OllamaProvider
from app.services.ai.providers.stub import StubProvider


@lru_cache
def get_llm_provider() -> LLMProvider:
    settings = get_settings()
    provider = settings.ai_provider.lower()
    if provider == "stub":
        return StubProvider()
    if provider == "ollama":
        return OllamaProvider(base_url=settings.ollama_url, model=settings.llm_model)
    # Unknown provider -> fail-closed to the offline stub rather than crash.
    return StubProvider()
