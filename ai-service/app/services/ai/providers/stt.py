"""Speech-to-text providers. faster-whisper (local, CPU int8) + an offline stub.

faster-whisper is imported lazily so the API process and offline tests don't require the model.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

from app.core.config import get_settings


@dataclass
class Transcript:
    text: str
    language: str
    duration_sec: float


class StubSTT:
    name = "stub"

    def transcribe(self, path: str, mime: str) -> Transcript:
        # Deterministic placeholder — real transcription requires the whisper model.
        size = os.path.getsize(path) if os.path.exists(path) else 0
        return Transcript(
            text="Can you explain the key idea from this lesson?",
            language="en",
            duration_sec=round(size / 16000, 2),
        )


class WhisperSTT:
    name = "faster-whisper"

    def __init__(self, model_name: str) -> None:
        self._model_name = model_name
        self._model = None

    def _ensure(self):
        if self._model is None:
            from faster_whisper import WhisperModel  # lazy import

            self._model = WhisperModel(self._model_name, device="cpu", compute_type="int8")
        return self._model

    def transcribe(self, path: str, mime: str) -> Transcript:
        model = self._ensure()
        segments, info = model.transcribe(path, beam_size=1)
        text = " ".join(seg.text.strip() for seg in segments).strip()
        return Transcript(text=text, language=info.language, duration_sec=float(info.duration))


@lru_cache
def get_stt_provider():
    settings = get_settings()
    if settings.ai_provider.lower() == "ollama":  # "real" stack uses whisper alongside ollama
        return WhisperSTT(settings.whisper_model)
    return StubSTT()
