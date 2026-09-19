from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.repositories import chunks_repo
from app.dependencies import get_db
from app.rag import retrieval, synthesize
from app.schemas.rag import RagChatRequest, RagChatResponse, SearchRequest, SearchResponse

router = APIRouter(tags=["rag"])


@router.post("/search", response_model=SearchResponse)
async def search(payload: SearchRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    hits = await retrieval.hybrid_search(db, payload.query, payload.filters, payload.topK)
    results = [
        {
            "documentId": h.get("documentId"),
            "documentName": h.get("documentName"),
            "page": h.get("page"),
            "section": h.get("section"),
            "excerpt": h["text"][:400],
            "score": h["score"],
            "wellId": h.get("wellId"),
            "formation": h.get("formation"),
            "source": h.get("source", "Unknown"),
            "sourceType": h.get("sourceType", "derived"),
        }
        for h in hits
    ]
    return {"results": results}


@router.post("/rag/chat", response_model=RagChatResponse)
async def rag_chat(payload: RagChatRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    total_chunks = await chunks_repo.chunk_count(db)
    reasoning_steps = [f"Ran hybrid BM25 + vector retrieval across {total_chunks} indexed chunk(s)."]

    filters = {}
    if payload.activeFormation:
        filters["formation"] = payload.activeFormation

    evidence = await retrieval.hybrid_search(db, payload.message, filters, top_k=6)
    if not evidence and filters:
        # Retry without the formation filter before giving up — a formation
        # mismatch shouldn't be the reason a clearly relevant document is missed.
        evidence = await retrieval.hybrid_search(db, payload.message, None, top_k=6)
        reasoning_steps.append("Initial formation-filtered search returned nothing; retried unfiltered.")

    reasoning_steps.append(f"Selected {len(evidence)} top-ranked evidence item(s) after merge/rerank.")

    response = await synthesize.synthesize(payload.message, evidence, reasoning_steps)
    return response
