"""Vector embedding + Chroma index (Phase 7). Both sentence-transformers and
chromadb are heavyish optional dependencies — if either isn't installed or
fails to load (e.g. no internet to pull the model weights on first run),
the RAG pipeline degrades to BM25-only lexical search rather than crashing
the app. That degradation is logged, not silent.
"""

from functools import lru_cache

from app.config import get_settings

_VECTOR_SEARCH_AVAILABLE = True
_disabled_reason: str | None = None


@lru_cache
def _get_embedder():
    from sentence_transformers import SentenceTransformer

    settings = get_settings()
    return SentenceTransformer(settings.EMBEDDING_MODEL)


@lru_cache
def _get_chroma_collection():
    import chromadb
    from chromadb.config import Settings as ChromaSettings

    settings = get_settings()
    client = chromadb.PersistentClient(
        path=settings.CHROMA_PATH,
        settings=ChromaSettings(anonymized_telemetry=False),
    )
    return client.get_or_create_collection("document_chunks")


def vector_search_available() -> bool:
    global _VECTOR_SEARCH_AVAILABLE, _disabled_reason
    if not _VECTOR_SEARCH_AVAILABLE:
        return False
    try:
        _get_embedder()
        _get_chroma_collection()
        return True
    except Exception as exc:  # pragma: no cover - environment dependent
        _VECTOR_SEARCH_AVAILABLE = False
        _disabled_reason = str(exc)
        return False


def disabled_reason() -> str | None:
    return _disabled_reason


def upsert_chunks(chunks: list[dict]) -> None:
    if not chunks or not vector_search_available():
        return
    embedder = _get_embedder()
    collection = _get_chroma_collection()
    texts = [c["text"] for c in chunks]
    embeddings = embedder.encode(texts, show_progress_bar=False).tolist()
    collection.upsert(
        ids=[c["chunkId"] for c in chunks],
        embeddings=embeddings,
        metadatas=[{"documentId": c["documentId"], "page": c["page"], "sourceType": c["sourceType"]} for c in chunks],
        documents=texts,
    )


def delete_chunk_ids(chunk_ids: list[str]) -> None:
    if not chunk_ids or not vector_search_available():
        return
    _get_chroma_collection().delete(ids=chunk_ids)


def query(text: str, top_k: int = 10) -> list[dict]:
    if not vector_search_available():
        return []
    embedder = _get_embedder()
    collection = _get_chroma_collection()
    embedding = embedder.encode([text], show_progress_bar=False).tolist()
    result = collection.query(query_embeddings=embedding, n_results=top_k)
    if not result["ids"] or not result["ids"][0]:
        return []
    return [
        {"chunkId": chunk_id, "distance": distance}
        for chunk_id, distance in zip(result["ids"][0], result["distances"][0])
    ]
