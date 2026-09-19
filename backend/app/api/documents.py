import hashlib
import time
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile

from app.config import get_settings
from app.db.repositories import chunks_repo, documents_repo
from app.dependencies import get_db, require_roles
from app.rag import embeddings
from app.schemas.common import SourceType
from app.schemas.documents import (
    DocumentIndexRequest,
    DocumentIndexResponse,
    DocumentListResponse,
    DocumentMeta,
    DocumentUploadResponse,
)

router = APIRouter(tags=["documents"])


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(sourceType: str | None = None, documentName: str | None = None, db=Depends(get_db)):
    docs = await documents_repo.list_documents(db, source_type=sourceType, document_name=documentName)
    return {"documents": docs}


@router.get("/documents/{document_id}", response_model=DocumentMeta)
async def get_document(document_id: str, db=Depends(get_db)):
    doc = await documents_repo.get_document(db, document_id)
    if doc is None:
        raise HTTPException(404, detail=f"Document '{document_id}' not found")
    return doc


@router.post("/documents/upload", response_model=DocumentUploadResponse,
             dependencies=[Depends(require_roles("ADMIN", "SUPERVISOR"))])
async def upload_document(file: UploadFile, db=Depends(get_db)):
    contents = await file.read()
    content_hash = hashlib.sha256(contents).hexdigest()

    # Duplicate detection: the same file content uploaded again resolves to
    # the already-registered document instead of creating a second copy.
    existing = await documents_repo.get_document_by_hash(db, content_hash)
    if existing is not None:
        return {
            "documentId": existing["documentId"],
            "documentName": existing["documentName"],
            "sourceType": existing["sourceType"],
        }

    settings = get_settings()
    storage_dir = Path(settings.DOCUMENT_STORAGE_PATH)
    storage_dir.mkdir(parents=True, exist_ok=True)

    document_id = str(uuid.uuid4())
    dest_path = storage_dir / f"{document_id}_{file.filename}"
    dest_path.write_bytes(contents)

    doc = {
        "documentId": document_id,
        "documentName": file.filename,
        "source": "User upload",
        "sourceType": SourceType.DERIVED.value,
        "pageCount": 0,
        "uploadedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "indexed": False,
        "storagePath": str(dest_path),
        "contentHash": content_hash,
    }
    await documents_repo.upsert_document(db, doc)
    return {"documentId": document_id, "documentName": file.filename, "sourceType": SourceType.DERIVED}


@router.delete("/documents/{document_id}", status_code=204,
               dependencies=[Depends(require_roles("ADMIN", "SUPERVISOR"))])
async def delete_document(document_id: str, db=Depends(get_db)):
    doc = await documents_repo.get_document(db, document_id)
    if doc is None:
        raise HTTPException(404, detail=f"Document '{document_id}' not found")

    chunk_ids = await chunks_repo.chunk_ids_for_document(db, document_id)
    embeddings.delete_chunk_ids(chunk_ids)
    await chunks_repo.delete_chunks_for_document(db, document_id)

    storage_path = doc.get("storagePath")
    if storage_path:
        Path(storage_path).unlink(missing_ok=True)

    await documents_repo.delete_document(db, document_id)
    return None


@router.post("/documents/index", response_model=DocumentIndexResponse,
             dependencies=[Depends(require_roles("ADMIN", "SUPERVISOR"))])
async def index_document(payload: DocumentIndexRequest, db=Depends(get_db)):
    doc = await documents_repo.get_document(db, payload.documentId)
    if doc is None:
        raise HTTPException(404, detail=f"Document '{payload.documentId}' not found")

    from app.ingestion.pipeline import index_document as run_index

    chunk_count = await run_index(db, doc)
    return {"documentId": payload.documentId, "status": "indexed", "chunkCount": chunk_count}
