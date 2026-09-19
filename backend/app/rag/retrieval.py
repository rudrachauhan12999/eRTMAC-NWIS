"""Hybrid retrieval: BM25 (lexical) + vector search, merged, optionally
reranked with a cross-encoder. This is what backs both /api/search and
/api/rag/chat (Phase 7).

The corpus is dual per the team's decision (docs/BACKEND_API_CONTRACT.md):
chunks from the 5 real OIL India PDFs (+ government CSV) AND the existing
frontend's demo well/incident fixtures, ingested verbatim with
source_type="synthetic_demo". Every result keeps its sourceType so callers
can label evidence honestly — this module never hides or merges that
distinction away.
"""

from functools import lru_cache

from rank_bm25 import BM25Okapi

from app.db.repositories import chunks_repo
from app.rag import embeddings

RERANK_CANDIDATE_POOL = 25


def _tokenize(text: str) -> list[str]:
    return text.lower().split()


async def _bm25_search(db, query: str, top_k: int) -> list[tuple[str, float]]:
    chunks = await chunks_repo.all_chunks(db)
    if not chunks:
        return []
    corpus = [_tokenize(c["text"]) for c in chunks]
    bm25 = BM25Okapi(corpus)
    scores = bm25.get_scores(_tokenize(query))
    ranked = sorted(zip((c["chunkId"] for c in chunks), scores), key=lambda x: x[1], reverse=True)
    return ranked[:top_k]


@lru_cache
def _get_reranker():
    from sentence_transformers import CrossEncoder

    from app.config import get_settings

    return CrossEncoder(get_settings().RERANKER_MODEL)


def _rerank_available() -> bool:
    try:
        _get_reranker()
        return True
    except Exception:
        return False


async def hybrid_search(db, query: str, filters: dict | None = None, top_k: int = 10) -> list[dict]:
    filters = filters or {}

    bm25_hits = await _bm25_search(db, query, RERANK_CANDIDATE_POOL)
    bm25_scores = {chunk_id: score for chunk_id, score in bm25_hits}
    max_bm25 = max(bm25_scores.values()) if bm25_scores else 1.0

    vector_hits = embeddings.query(query, top_k=RERANK_CANDIDATE_POOL)
    # Chroma cosine distance: smaller is better. Convert to a 0..1 similarity.
    vector_scores = {hit["chunkId"]: max(0.0, 1.0 - hit["distance"]) for hit in vector_hits}

    candidate_ids = set(bm25_scores) | set(vector_scores)
    if not candidate_ids:
        return []

    all_chunks = {c["chunkId"]: c for c in await chunks_repo.all_chunks(db)}

    merged = []
    for chunk_id in candidate_ids:
        chunk = all_chunks.get(chunk_id)
        if chunk is None:
            continue
        if filters.get("wellId") and chunk.get("wellId") != filters["wellId"]:
            continue
        if filters.get("formation") and chunk.get("formation") != filters["formation"]:
            continue
        if filters.get("documentId") and chunk.get("documentId") != filters["documentId"]:
            continue

        bm25_norm = (bm25_scores.get(chunk_id, 0.0) / max_bm25) if max_bm25 else 0.0
        vector_norm = vector_scores.get(chunk_id, 0.0)
        combined = 0.5 * bm25_norm + 0.5 * vector_norm
        merged.append({**chunk, "score": combined})

    merged.sort(key=lambda c: c["score"], reverse=True)
    candidates = merged[:RERANK_CANDIDATE_POOL]

    if candidates and _rerank_available():
        reranker = _get_reranker()
        pairs = [(query, c["text"]) for c in candidates]
        rerank_scores = reranker.predict(pairs)
        for chunk, score in zip(candidates, rerank_scores):
            chunk["score"] = float(score)
        candidates.sort(key=lambda c: c["score"], reverse=True)

    return candidates[:top_k]
