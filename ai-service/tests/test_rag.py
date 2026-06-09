"""RAG pipeline pure-logic + embedding tests (course-isolation is proven against live pgvector by QA)."""
from app.services.ai.pipelines.ingest import chunk_text
from app.services.ai.pipelines.rag import RetrievedChunk, build_context
from app.services.ai.providers.embeddings import EMBED_DIM, StubEmbeddings


def test_chunker_splits_with_overlap():
    text = "word " * 1000  # ~5000 chars
    chunks = chunk_text(text, size=1200, overlap=150)
    assert len(chunks) > 1
    assert all(len(c) <= 1200 for c in chunks)


def test_chunker_empty():
    assert chunk_text("   ") == []


def test_stub_embeddings_dim_and_determinism():
    emb = StubEmbeddings()
    a = emb.embed(["the mean is the average"])[0]
    b = emb.embed(["the mean is the average"])[0]
    c = emb.embed(["completely different tokens here"])[0]
    assert len(a) == EMBED_DIM
    assert a == b                      # deterministic
    assert a != c                      # distinct inputs differ
    norm = sum(x * x for x in a) ** 0.5
    assert abs(norm - 1.0) < 1e-6      # L2-normalized


def test_build_context_carries_titles_and_citations():
    chunks = [
        RetrievedChunk(lesson_id="lesson-1", chunk_index=0, chunk_text="Mean is the average.", score=0.9),
        RetrievedChunk(lesson_id="lesson-2", chunk_index=3, chunk_text="P-values quantify evidence.", score=0.7),
    ]
    titles = {"lesson-1": "Statistics", "lesson-2": "Hypothesis testing"}
    context, citations = build_context(chunks, titles)
    assert "Statistics" in context and "Hypothesis testing" in context
    assert citations[0] == {"lessonId": "lesson-1", "title": "Statistics", "chunkIndex": 0, "score": 0.9}
    assert citations[1]["title"] == "Hypothesis testing"
