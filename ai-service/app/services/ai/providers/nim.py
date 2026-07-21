"""OpenAI-compatible ``chat/completions`` provider for NVIDIA NIM and remote OpenAI-style backends."""
from __future__ import annotations

import httpx

from app.services.ai.providers.base import LLMProvider


class NimProvider:
    name = "nim"

    def __init__(self, base_url: str, model: str, *, api_key: str | None = None, timeout: float = 120.0) -> None:
        if not model:
            raise ValueError("nim provider requires an LLM model, e.g. deepseek-ai/deepseek-r1 or your NIM-deployed model id")
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._api_key = api_key
        self._timeout = timeout

    @property
    def model(self) -> str:
        return self._model

    def generate(self, system: str, prompt: str, *, max_tokens: int = 512) -> str:
        headers = {"content-type": "application/json"}
        if self._api_key:
            headers["authorization"] = f"Bearer {self._api_key}"

        resp = httpx.post(
            f"{self._base_url}/chat/completions",
            headers=headers,
            json={
                "model": self._model,
                "temperature": 0.2,
                "max_tokens": max_tokens,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
            },
            timeout=self._timeout,
        )
        resp.raise_for_status()
        payload = resp.json()
        content = payload.get("choices", [{}])[0].get("message", {}).get("content")
        return (content or "").strip()
