from typing import Literal

from pydantic import BaseModel

from app.schemas.common import SourceType

RiskLevel = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class RagChatRequest(BaseModel):
    message: str
    conversationHistory: list[ChatTurn] | None = None
    activeDepth: float | None = None
    activeFormation: str | None = None


class Citation(BaseModel):
    reportId: str
    reportType: str | None = None
    wellName: str
    title: str | None = None
    page: int
    section: str
    ocrConfidence: float | None = None
    excerpt: str
    sourceType: SourceType


class RagChatResponse(BaseModel):
    summary: str
    nearbyWellsAnalysis: str
    rootCause: str
    recommendedMitigation: str
    confidenceScore: int
    riskLevel: RiskLevel
    isInsufficientInfo: bool
    reasoningSteps: list[str]
    citations: list[Citation]
    relatedWells: list[str] | None = None
    relatedEvents: list[str] | None = None


class SearchRequest(BaseModel):
    query: str
    filters: dict | None = None
    topK: int = 10


class SearchResultItem(BaseModel):
    documentId: str
    documentName: str
    page: int | None = None
    section: str | None = None
    excerpt: str
    score: float
    wellId: str | None = None
    formation: str | None = None
    source: str
    sourceType: SourceType


class SearchResponse(BaseModel):
    results: list[SearchResultItem]
