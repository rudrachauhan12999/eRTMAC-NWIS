from typing import Literal

from pydantic import BaseModel

from app.schemas.common import SourceType

RiskSeverity = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]


class RiskPredictRequest(BaseModel):
    depthM: float
    mudWeightSG: float
    formation: str | None = None
    wellId: str | None = None


class RiskEvidenceItem(BaseModel):
    type: Literal["historical_event", "document"]
    sourceType: SourceType
    # historical_event fields
    eventId: str | None = None
    wellId: str | None = None
    wellName: str | None = None
    depthM: float | None = None
    eventType: str | None = None
    matchedOn: list[str] | None = None
    # document fields
    documentId: str | None = None
    documentName: str | None = None
    page: int | None = None
    excerpt: str | None = None


class PredictedRisk(BaseModel):
    name: str
    probability: float
    severity: RiskSeverity
    triggerFactor: str
    contributingWells: list[str]
    recommendedAction: str
    signals: list[str]
    evidence: list[RiskEvidenceItem]
    sourceTypes: list[SourceType]
    isSimulation: bool


class RiskWeightBreakdown(BaseModel):
    weight: float
    probability: float
    points: float


class RiskCoefficients(BaseModel):
    formationMultiplier: float
    formationReason: str
    spatialDecayFactor: float
    spatialReason: str


class CalculationModel(BaseModel):
    formula: str
    depthM: float
    mudWeightSG: float
    formation: str
    weights: dict[str, RiskWeightBreakdown]
    coefficients: RiskCoefficients
    governingStandard: str
    engineType: Literal["rule_similarity_hybrid", "ml_model"] = "rule_similarity_hybrid"


class GeomechanicalMargin(BaseModel):
    porePressureSG: float
    fractureGradientSG: float
    currentMudWeightSG: float
    safeWindowMinSG: float
    safeWindowMaxSG: float


class RiskPredictResponse(BaseModel):
    wellId: str | None = None
    predictedRisks: list[PredictedRisk]
    compositeRiskScore: int
    isSimulation: bool
    sourceTypes: list[SourceType]
    calculationModel: CalculationModel
    geomechanicalMarginSG: GeomechanicalMargin


class RiskHistoryResponse(BaseModel):
    days: list[dict]
    correlationMetrics: dict
