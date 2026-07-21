"""Provider factory. Selects the LLM backend from settings (local-first, pluggable)."""
from __future__ import annotations

from functools import lru_cache

from app.core.config import get_settings
from app.services.ai.providers.base import LLMProvider
from app.services.ai.providers.nim import NimProvider
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
    if provider in {"nim", "openai", "nvidia"}:
        token = settings.openai_api_key
        base = settings.openai_base_url.strip()
        if not token or not base:
            raise RuntimeError(
                "OPENAI_API_KEY and OPENAI_BASE_URL must be set to use provider "
                f"{provider!r}; current base={base!r} key_present={bool(token)}"
            )
        return NimProvider(base_url=base, model=settings.llm_model, api_key=token)
    # Unknown provider -> fail-closed to the offline stub so tests/env mismatches remain runnable.
    return StubProvider()
