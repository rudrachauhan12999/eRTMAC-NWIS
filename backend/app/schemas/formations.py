from typing import Literal

from pydantic import BaseModel

from app.schemas.common import SourceType

HazardSeverity = Literal["none", "low", "moderate", "high", "critical"]


class FormationLayer(BaseModel):
    name: str
    depthStartM: float
    depthEndM: float
    lithology: str
    color: str
    hazardSeverity: HazardSeverity
    hazardDescription: str
    porePressureSG: float
    fracGradientSG: float
    recommendedMudWeightSG: float
    source: str
    sourceType: SourceType


class FormationListResponse(BaseModel):
    formations: list[FormationLayer]
