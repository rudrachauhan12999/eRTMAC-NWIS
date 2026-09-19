from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.repositories import events_repo
from app.dependencies import get_db
from app.schemas.risk import RiskHistoryResponse, RiskPredictRequest, RiskPredictResponse
from app.services import risk_engine

router = APIRouter(tags=["risk"])


@router.post("/risk/predict", response_model=RiskPredictResponse)
async def predict_risk(payload: RiskPredictRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    return await risk_engine.predict_risk(db, payload.depthM, payload.mudWeightSG, payload.formation, payload.wellId)


@router.get("/risk/history", response_model=RiskHistoryResponse)
async def get_risk_history(wellId: str | None = None, db: AsyncIOMotorDatabase = Depends(get_db)):
    events = await events_repo.list_events(db, well_id=wellId)
    total_npt = sum(e.get("nptHours", 0) for e in events)
    return {
        "days": [],
        "correlationMetrics": {
            "totalIncidents": len(events),
            "totalNptHours": total_npt,
            "note": "Derived from currently stored events; populated once Phase 5 seeding runs.",
        },
    }
