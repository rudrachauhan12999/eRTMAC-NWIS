from pydantic import BaseModel

from app.schemas.common import SourceType


class DocumentMeta(BaseModel):
    documentId: str
    documentName: str
    source: str
    sourceType: SourceType
    pageCount: int
    uploadedAt: str
    indexed: bool


class DocumentListResponse(BaseModel):
    documents: list[DocumentMeta]


class DocumentUploadResponse(BaseModel):
    documentId: str
    documentName: str
    sourceType: SourceType


class DocumentIndexRequest(BaseModel):
    documentId: str


class DocumentIndexResponse(BaseModel):
    documentId: str
    status: str
    chunkCount: int | None = None
