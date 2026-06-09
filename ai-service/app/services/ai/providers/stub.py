"""Deterministic offline provider — extractive, no model weights required.

Keeps the whole pipeline runnable offline (local-first) and gives QA stable fixtures. Selected with
AI_PROVIDER=stub. It mimics the prompt protocol: for the reduce step it emits SUMMARY/KEY_POINTS.
"""
from __future__ import annotations

import json
import re

_SENT = re.compile(r"(?<=[.!?])\s+")
_WORD = re.compile(r"[A-Za-z][A-Za-z'-]{3,}")
_STOP = {
    "this", "that", "with", "from", "your", "have", "will", "they", "their", "about",
    "which", "would", "there", "these", "those", "into", "than", "then", "what", "when",
    "lesson", "section", "content", "summary",
}


def _sentences(text: str) -> list[str]:
    return [s.strip() for s in _SENT.split(text.strip()) if s.strip()]


class StubProvider:
    name = "stub"
    model = "stub-extractive"

    def generate(self, system: str, prompt: str, *, max_tokens: int = 512) -> str:
        # Pull the text between <content> tags (matches our prompt templates).
        m = re.search(r"<content>\n?(.*?)\n?</content>", prompt, re.DOTALL)
        text = (m.group(1) if m else prompt).strip()

        if "JSON array" in prompt or "flashcards" in prompt.lower():
            return self._flashcards(text, prompt)
        if "KEY_POINTS:" in prompt or "key takeaways" in prompt.lower():
            return self._reduce(text)
        return self._map(text)

    def _flashcards(self, text: str, prompt: str) -> str:
        count_m = re.search(r"exactly (\d+) flashcards", prompt)
        count = int(count_m.group(1)) if count_m else 8
        sents = [s for s in _sentences(text) if len(s.split()) >= 4]
        cards = []
        for s in sents[:count]:
            words = _WORD.findall(s)
            topic = next((w for w in words if w.lower() not in _STOP), "this concept")
            cards.append(
                {
                    "front": f"What does the lesson say about {topic.lower()}?",
                    "back": s.strip(),
                    "hint": topic,
                    "difficulty": "MEDIUM",
                }
            )
        if not cards:
            cards.append(
                {"front": "Review this lesson's main idea.", "back": text[:200], "hint": None, "difficulty": "EASY"}
            )
        return json.dumps(cards)

    def _map(self, text: str) -> str:
        sents = _sentences(text)
        return " ".join(sents[:2]) if sents else text[:280]

    def _reduce(self, text: str) -> str:
        sents = _sentences(text)
        summary = " ".join(sents[:3]) if sents else text[:400]
        # key points = most frequent meaningful words turned into short phrases
        freq: dict[str, int] = {}
        for w in (m.lower() for m in _WORD.findall(text)):
            if w not in _STOP:
                freq[w] = freq.get(w, 0) + 1
        top = [w for w, _ in sorted(freq.items(), key=lambda kv: kv[1], reverse=True)[:6]]
        points = "\n".join(f"- Understand the role of {w}" for w in top) or "- Review the lesson material"
        return f"SUMMARY:\n{summary}\n\nKEY_POINTS:\n{points}"
