from typing import Literal

from pydantic import BaseModel

from app.schemas.common import SourceType

TelemetryMode = Literal["DEMO_SIMULATION", "REAL_DATA"]


class TelemetryReading(BaseModel):
    timestamp: str
    wellId: str
    depthM: float
    ropMhr: float
    wobTons: float
    rpm: float
    torqueKNm: float
    sppPsi: float
    mudFlowInLpm: float
    mudFlowOutLpm: float
    pitVolumeM3: float
    gasUnits: float
    mudWeightInSG: float
    mudWeightOutSG: float
    activeFormation: str
    hazardStatus: str
    isSimulation: bool
    mode: TelemetryMode
    sourceType: SourceType


class TelemetryHistoryResponse(BaseModel):
    readings: list[TelemetryReading]
