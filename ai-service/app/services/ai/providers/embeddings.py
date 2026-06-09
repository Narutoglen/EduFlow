"""Embedding providers (768-dim). Ollama `nomic-embed-text` + a deterministic offline stub.

The stub hashes tokens into a fixed-width vector and L2-normalizes, so cosine similarity is stable and
offline — good enough to exercise retrieval mechanics and prove course-scoping in tests.
"""
from __future__ import annotations

import hashlib
import math
import re
from functools import lru_cache

import httpx

from app.core.config import get_settings

EMBED_DIM = 768
_TOKEN = re.compile(r"[a-z0-9]+")


class StubEmbeddings:
    name = "stub"
    model = "stub-hash-embed"
    dim = EMBED_DIM

    def embed(self, texts: list[str]) -> list[list[float]]:
        return [self._one(t) for t in texts]

    def _one(self, text: str) -> list[float]:
        vec = [0.0] * EMBED_DIM
        for tok in _TOKEN.findall(text.lower()):
            h = int.from_bytes(hashlib.blake2b(tok.encode(), digest_size=8).digest(), "big")
            idx = h % EMBED_DIM
            sign = 1.0 if (h >> 63) & 1 else -1.0
            vec[idx] += sign
        norm = math.sqrt(sum(v * v for v in vec)) or 1.0
        return [v / norm for v in vec]


class OllamaEmbeddings:
    name = "ollama"
    dim = EMBED_DIM

    def __init__(self, base_url: str, model: str, timeout: float = 60.0) -> None:
        self._base_url = base_url.rstrip("/")
        self.model = model
        self._timeout = timeout

    def embed(self, texts: list[str]) -> list[list[float]]:
        out: list[list[float]] = []
        for t in texts:
            resp = httpx.post(
                f"{self._base_url}/api/embeddings",
                json={"model": self.model, "prompt": t},
                timeout=self._timeout,
            )
            resp.raise_for_status()
            out.append(resp.json()["embedding"])
        return out


@lru_cache
def get_embedding_provider():
    settings = get_settings()
    if settings.ai_provider.lower() == "ollama":
        return OllamaEmbeddings(base_url=settings.ollama_url, model=settings.embed_model)
    return StubEmbeddings()
