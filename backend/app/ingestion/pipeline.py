"""Document ingestion orchestration (Phase 4/6). Extracts, chunks, and
stores document_chunks with full provenance on every chunk. Vector
embedding into Chroma happens in app.rag.index (Phase 7) — this module's
job stops at producing clean, provenance-tagged text chunks in Mongo, so
Phase 7's indexer can embed from a single source of truth instead of
re-parsing PDFs.
"""

from app.db.repositories import chunks_repo, documents_repo
from app.ingestion.extract import chunk_page_text, extract_pages


async def index_document(db, doc: dict) -> int:
    storage_path = doc.get("storagePath")
    if not storage_path:
        raise ValueError(f"Document '{doc['documentId']}' has no storagePath to ingest from")

    pages = extract_pages(storage_path)

    chunks = []
    for page in pages:
        for chunk_index, piece in enumerate(chunk_page_text(page["text"], page["page"])):
            # Deterministic id (not random) so re-indexing the same document
            # overwrites its existing chunks/embeddings instead of
            # accumulating duplicates.
            chunk_id = f"{doc['documentId']}::p{piece['page']}::{chunk_index}"
            chunks.append({
                "chunkId": chunk_id,
                "documentId": doc["documentId"],
                "documentName": doc["documentName"],
                "page": piece["page"],
                "section": None,
                "text": piece["text"],
                "source": doc.get("source", "Unknown"),
                "sourceType": doc.get("sourceType", "derived"),
                "wellId": doc.get("wellId"),
                "wellName": doc.get("wellName"),
                "formation": doc.get("formation"),
            })

    count = await chunks_repo.insert_chunks(db, chunks)
    await documents_repo.mark_indexed(db, doc["documentId"], count)
    await db["documents"].update_one({"documentId": doc["documentId"]}, {"$set": {"pageCount": len(pages)}})
    return count
