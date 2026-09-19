from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.repositories import telemetry_repo, wells_repo
from app.dependencies import get_db
from app.schemas.telemetry import TelemetryHistoryResponse, TelemetryReading
from app.telemetry import simulator

router = APIRouter(tags=["telemetry"])

DEFAULT_WELL_ID = "well-active-01"


@router.get("/telemetry/current", response_model=TelemetryReading)
async def get_current_telemetry(wellId: str | None = None, db: AsyncIOMotorDatabase = Depends(get_db)):
    target_well_id = wellId or DEFAULT_WELL_ID
    well = await wells_repo.get_well(db, target_well_id)
    if well is None:
        raise HTTPException(404, detail=f"Well '{target_well_id}' not found — cannot simulate telemetry for an unknown well")

    reading = simulator.next_reading(
        well_id=target_well_id,
        start_depth_m=well["depthM"],
        active_formation=well["formation"],
    )
    await telemetry_repo.insert_reading(db, dict(reading))
    return reading


@router.get("/telemetry/history", response_model=TelemetryHistoryResponse)
async def get_telemetry_history(wellId: str | None = None, limit: int = 50,
                                 db: AsyncIOMotorDatabase = Depends(get_db)):
    readings = await telemetry_repo.history(db, wellId, limit)
    return {"readings": readings}
