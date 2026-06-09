"""baseline: AI-owned tables + pgvector

Revision ID: 0001_baseline
Revises:
Create Date: 2026-06-09
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector

revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None

JOB_STATUS = ("PENDING", "RUNNING", "READY", "FAILED", "CANCELLED")
JOB_KIND = ("SUMMARIZE", "FLASHCARDS", "TRANSCRIBE", "INGEST", "RAG")
SOURCE = ("LESSON", "RESOURCE")
DIFFICULTY = ("EASY", "MEDIUM", "HARD")
ROLE = ("USER", "ASSISTANT")


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    job_status = sa.Enum(*JOB_STATUS, name="ai_job_status")
    job_kind = sa.Enum(*JOB_KIND, name="ai_job_kind")
    source = sa.Enum(*SOURCE, name="summary_source")
    difficulty = sa.Enum(*DIFFICULTY, name="card_difficulty")
    msg_role = sa.Enum(*ROLE, name="message_role")
    for e in (job_status, job_kind, source, difficulty, msg_role):
        e.create(op.get_bind(), checkfirst=True)

    ts = lambda: sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    uts = lambda: sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)

    op.create_table(
        "ai_job",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("kind", job_kind, nullable=False),
        sa.Column("status", job_status, nullable=False, server_default="PENDING"),
        sa.Column("requested_by", sa.String(), nullable=False),
        sa.Column("course_id", sa.String()),
        sa.Column("ref_id", sa.String()),
        sa.Column("idempotency_key", sa.String(), unique=True),
        sa.Column("error", sa.Text()),
        sa.Column("result_id", sa.Uuid()),
        sa.Column("duration_ms", sa.Integer()),
        sa.Column("tokens_in", sa.Integer()),
        sa.Column("tokens_out", sa.Integer()),
        ts(), uts(),
    )
    op.create_index("ix_ai_job_requester", "ai_job", ["requested_by", "created_at"])

    op.create_table(
        "lecture_summary",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("source_type", source, nullable=False),
        sa.Column("lesson_id", sa.String()),
        sa.Column("resource_id", sa.String()),
        sa.Column("course_id", sa.String(), nullable=False),
        sa.Column("summary", sa.Text()),
        sa.Column("key_points", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("reading_seconds", sa.Integer()),
        sa.Column("model", sa.String(), nullable=False),
        sa.Column("prompt_version", sa.String(), nullable=False),
        sa.Column("status", job_status, nullable=False, server_default="PENDING"),
        ts(), uts(),
        sa.CheckConstraint("num_nonnulls(lesson_id, resource_id) = 1", name="one_source"),
        sa.UniqueConstraint("lesson_id", "resource_id", "model", "prompt_version", name="uq_summary_source"),
    )
    op.create_index("ix_summary_lesson", "lecture_summary", ["lesson_id"])
    op.create_index("ix_summary_course", "lecture_summary", ["course_id"])

    op.create_table(
        "content_embedding",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("course_id", sa.String(), nullable=False),
        sa.Column("lesson_id", sa.String()),
        sa.Column("resource_id", sa.String()),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("chunk_text", sa.Text(), nullable=False),
        sa.Column("token_count", sa.Integer()),
        sa.Column("embedding", Vector(768), nullable=False),
        sa.Column("model", sa.String(), nullable=False),
        ts(),
    )
    op.create_index("ix_embed_course", "content_embedding", ["course_id"])
    op.execute(
        "CREATE INDEX ix_embed_vec ON content_embedding "
        "USING hnsw (embedding vector_cosine_ops)"
    )

    op.create_table(
        "flashcard_deck",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("owner_id", sa.String(), nullable=False),
        sa.Column("course_id", sa.String(), nullable=False),
        sa.Column("lesson_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("source", source, nullable=False, server_default="LESSON"),
        sa.Column("model", sa.String(), nullable=False),
        sa.Column("prompt_version", sa.String(), nullable=False),
        ts(),
        sa.UniqueConstraint("owner_id", "lesson_id", name="uq_deck_owner_lesson"),
    )
    op.create_index("ix_deck_owner", "flashcard_deck", ["owner_id"])

    op.create_table(
        "flashcard",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("deck_id", sa.Uuid(), sa.ForeignKey("flashcard_deck.id", ondelete="CASCADE"), nullable=False),
        sa.Column("front", sa.Text(), nullable=False),
        sa.Column("back", sa.Text(), nullable=False),
        sa.Column("hint", sa.Text()),
        sa.Column("difficulty", difficulty, nullable=False, server_default="MEDIUM"),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("ease", sa.Float(), nullable=False, server_default="2.5"),
        sa.Column("interval_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("repetitions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("due_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_grade", sa.SmallInteger()),
        ts(),
    )
    op.create_index("ix_card_deck", "flashcard", ["deck_id"])
    op.create_index("ix_card_due", "flashcard", ["deck_id", "due_at"])

    op.create_table(
        "flashcard_review",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("card_id", sa.Uuid(), sa.ForeignKey("flashcard.id", ondelete="CASCADE"), nullable=False),
        sa.Column("grade", sa.SmallInteger(), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_review_card", "flashcard_review", ["card_id", "reviewed_at"])

    op.create_table(
        "transcription_job",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("course_id", sa.String()),
        sa.Column("status", job_status, nullable=False, server_default="PENDING"),
        sa.Column("audio_key", sa.String(), nullable=False),
        sa.Column("mime_type", sa.String(), nullable=False),
        sa.Column("duration_sec", sa.Float()),
        sa.Column("language", sa.String()),
        sa.Column("transcript", sa.Text()),
        sa.Column("error", sa.Text()),
        ts(), uts(),
    )
    op.create_index("ix_tx_user", "transcription_job", ["user_id", "created_at"])

    op.create_table(
        "assistant_conversation",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("course_id", sa.String(), nullable=False),
        sa.Column("title", sa.String()),
        ts(),
    )
    op.create_index("ix_conv_user", "assistant_conversation", ["user_id", "created_at"])

    op.create_table(
        "assistant_message",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("conversation_id", sa.Uuid(), sa.ForeignKey("assistant_conversation.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", msg_role, nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("citations", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("source_audio_id", sa.Uuid(), sa.ForeignKey("transcription_job.id")),
        sa.Column("tokens", sa.Integer()),
        ts(),
    )
    op.create_index("ix_msg_conv", "assistant_message", ["conversation_id", "created_at"])


def downgrade() -> None:
    for t in (
        "assistant_message", "assistant_conversation", "transcription_job",
        "flashcard_review", "flashcard", "flashcard_deck",
        "content_embedding", "lecture_summary", "ai_job",
    ):
        op.drop_table(t)
    for name in ("message_role", "card_difficulty", "summary_source", "ai_job_kind", "ai_job_status"):
        sa.Enum(name=name).drop(op.get_bind(), checkfirst=True)
    op.execute("DROP EXTENSION IF EXISTS vector")
