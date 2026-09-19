from typing import Literal

from pydantic import BaseModel

from app.schemas.common import SourceType

WellStatus = Literal["Active", "Drilling", "Completed", "Suspended", "Workover", "Shut-in"]
WellType = Literal["Exploration", "Development", "Delineation", "Injection"]
PrimaryRisk = Literal["High Loss", "Gas Kick", "Stuck Pipe", "Overpressure", "Stable"]


class Well(BaseModel):
    id: str
    name: str
    shortCode: str
    lat: float
    lng: float
    distanceKm: float
    direction: str
    angleDeg: float
    depthM: float
    targetDepthM: float
    formation: str
    reservoir: str
    status: WellStatus
    type: WellType
    rigName: str
    spudDate: str
    incidentsCount: int
    primaryRisk: PrimaryRisk
    colorTag: str
    source: str
    sourceType: SourceType


class WellListResponse(BaseModel):
    wells: list[Well]
    total: int


class NearbyWellsResponse(BaseModel):
    wells: list[Well]
    center: dict[str, float]
    radiusKm: float
