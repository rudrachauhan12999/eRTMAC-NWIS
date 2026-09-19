from typing import Literal

from pydantic import BaseModel

from app.schemas.common import SourceType

IncidentType = Literal[
    "Mud Loss", "Gas Kick", "Stuck Pipe", "Torque Spike",
    "Casing Problem", "Packoff", "Fishing", "NPT Event",
]
Severity = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
ReportType = Literal[
    "WCR (Well Completion Report)", "DDR (Daily Drilling Report)",
    "Mud Logging Master", "Geological Prognosis",
]


class DrillingParams(BaseModel):
    mudWeightSG: float
    ecdSG: float
    rpm: float
    torqueKNm: float
    sppPsi: float
    wobTons: float
    flowRateLpm: float


class SourceReport(BaseModel):
    reportId: str
    reportType: ReportType
    title: str
    date: str
    page: int
    section: str
    ocrConfidence: float
    excerpt: str
    tableData: list[dict[str, str | float]] | None = None


class HistoricalIncident(BaseModel):
    id: str
    wellId: str
    wellName: str
    incidentType: IncidentType
    depthM: float
    formation: str
    reservoir: str
    date: str
    severity: Severity
    summary: str
    rootCause: str
    recommendedMitigation: str
    actionTaken: str
    nptHours: float
    costImpactLakhs: float
    similarityScore: float
    drillingParams: DrillingParams
    sourceReport: SourceReport
    source: str
    sourceType: SourceType


class EventListResponse(BaseModel):
    events: list[HistoricalIncident]
    total: int


class EventCreateRequest(BaseModel):
    """Shape sent by AddNewDocModal.tsx when a user adds a document to the
    Document Library. Identical to HistoricalIncident minus source/sourceType
    (the backend sets those — user-typed submissions are always tagged
    synthetic_demo, since no PDF content is actually extracted here; see
    docs/DATA_SOURCES.md).
    """

    id: str
    wellId: str
    wellName: str
    incidentType: IncidentType
    depthM: float
    formation: str
    reservoir: str
    date: str
    severity: Severity
    summary: str
    rootCause: str
    recommendedMitigation: str
    actionTaken: str
    nptHours: float
    costImpactLakhs: float
    similarityScore: float
    drillingParams: DrillingParams
    sourceReport: SourceReport
