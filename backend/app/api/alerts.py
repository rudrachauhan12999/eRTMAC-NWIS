from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.repositories import alerts_repo
from app.dependencies import get_db
from app.schemas.alerts import AlertItem, AlertListResponse
from app.services import alert_engine

router = APIRouter(tags=["alerts"])


@router.get("/alerts", response_model=AlertListResponse)
async def get_alerts(wellId: str | None = None, acknowledged: bool | None = None,
                      db: AsyncIOMotorDatabase = Depends(get_db)):
    # Re-evaluate against the current Risk Intelligence output before
    # listing — telemetry -> risk -> alert, kept fresh on each read rather
    # than via a separate background scheduler (no task runner exists in
    # this app yet, and adding one is out of scope for this round).
    await alert_engine.evaluate_and_sync_alerts(db, well_id=wellId)
    alerts = await alerts_repo.list_alerts(db, well_id=wellId, acknowledged=acknowledged)
    return {"alerts": alerts}


@router.post("/alerts/{alert_id}/acknowledge", response_model=AlertItem)
async def acknowledge_alert(alert_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    alert = await alerts_repo.acknowledge_alert(db, alert_id)
    if alert is None:
        raise HTTPException(404, detail=f"Alert '{alert_id}' not found")
    return alert


@router.post("/alerts/{alert_id}/resolve", response_model=AlertItem)
async def resolve_alert(alert_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    alert = await alerts_repo.resolve_alert(db, alert_id)
    if alert is None:
        raise HTTPException(404, detail=f"Alert '{alert_id}' not found")
    return alert
