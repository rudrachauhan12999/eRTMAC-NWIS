from typing import Literal

from pydantic import BaseModel

from app.schemas.common import SourceType
from app.schemas.risk import RiskEvidenceItem

AlertSeverity = Literal["CRITICAL", "HIGH", "WARNING", "INFO"]
AlertStatus = Literal["active", "acknowledged", "resolved"]


class AlertItem(BaseModel):
    id: str
    severity: AlertSeverity
    title: str
    message: str
    recommendation: str
    depthM: float
    formation: str
    wellRef: str
    timestamp: str
    acknowledged: bool
    triggerCondition: str
    mitigationSteps: list[str]
    isSimulation: bool
    # Additive fields (Alerts Intelligence round) — real backend-generated
    # alerts populate these; the 5 original seeded fixture alerts predate
    # them, so they're optional rather than backfilled with invented values.
    wellId: str | None = None
    type: str | None = None
    status: AlertStatus | None = None
    signals: list[str] | None = None
    evidence: list[RiskEvidenceItem] | None = None
    sourceTypes: list[SourceType] | None = None
    generated: bool | None = None


class AlertListResponse(BaseModel):
    alerts: list[AlertItem]
