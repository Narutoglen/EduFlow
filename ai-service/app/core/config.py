"""Application settings, loaded from environment (12-factor). See /docs/deployment_architecture.md §5."""
from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Infra
    database_url: str = Field(
        default="postgresql+psycopg://eduflow:eduflow@postgres:5432/eduflow",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://redis:6379/0", alias="REDIS_URL")
    ollama_url: str = Field(default="http://ollama:11434", alias="OLLAMA_URL")

    # Models
    llm_model: str = Field(default="llama3.1:8b", alias="LLM_MODEL")
    embed_model: str = Field(default="nomic-embed-text", alias="EMBED_MODEL")
    whisper_model: str = Field(default="small", alias="WHISPER_MODEL")
    ai_provider: str = Field(default="ollama", alias="AI_PROVIDER")  # ollama | openai

    # Service token (BFF -> ai-service). Symmetric HS256, short TTL, rotated.
    service_token_secret: str = Field(default="dev-only-change-me", alias="AI_SERVICE_TOKEN_SECRET")
    service_token_audience: str = Field(default="ai-service", alias="AI_SERVICE_TOKEN_AUD")

    # Limits / policy (enforce threat-model controls)
    max_audio_mb: int = Field(default=25, alias="MAX_AUDIO_MB")
    max_audio_seconds: int = Field(default=300, alias="MAX_AUDIO_SECONDS")
    rate_limit_voice_per_min: int = Field(default=6, alias="RATE_LIMIT_VOICE_PER_MIN")
    job_result_ttl_seconds: int = Field(default=86400, alias="JOB_RESULT_TTL_SECONDS")
    transcript_retention_days: int = Field(default=30, alias="TRANSCRIPT_RETENTION_DAYS")
    max_question_chars: int = Field(default=2000, alias="MAX_QUESTION_CHARS")

    # Shared audio hand-off dir between ai-service (writer) and ai-worker (reader+purger).
    audio_dir: str = Field(default="/data/audio", alias="AUDIO_DIR")
    allowed_audio_mime: tuple[str, ...] = (
        "audio/webm",
        "audio/ogg",
        "audio/mp4",
        "audio/mpeg",
        "audio/wav",
        "audio/x-wav",
    )

    environment: str = Field(default="development", alias="ENVIRONMENT")


@lru_cache
def get_settings() -> Settings:
    return Settings()
