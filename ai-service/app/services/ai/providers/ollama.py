"""Ollama-backed LLM provider (local-first). Uses the /api/generate endpoint."""
from __future__ import annotations

import httpx


class OllamaProvider:
    name = "ollama"

    def __init__(self, base_url: str, model: str, timeout: float = 120.0) -> None:
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._timeout = timeout

    @property
    def model(self) -> str:
        return self._model

    def generate(self, system: str, prompt: str, *, max_tokens: int = 512) -> str:
        resp = httpx.post(
            f"{self._base_url}/api/generate",
            json={
                "model": self._model,
                "system": system,
                "prompt": prompt,
                "stream": False,
                "options": {"num_predict": max_tokens, "temperature": 0.2},
            },
            timeout=self._timeout,
        )
        resp.raise_for_status()
        return (resp.json().get("response") or "").strip()
