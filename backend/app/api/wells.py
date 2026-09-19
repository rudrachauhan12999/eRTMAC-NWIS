from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.repositories import wells_repo
from app.dependencies import get_db
from app.schemas.wells import NearbyWellsResponse, Well, WellListResponse

router = APIRouter(tags=["wells"])


@router.get("/wells", response_model=WellListResponse)
async def get_wells(status: str | None = None, field: str | None = None,
                     formation: str | None = None, db: AsyncIOMotorDatabase = Depends(get_db)):
    wells = await wells_repo.list_wells(db, status=status, field=field, formation=formation)
    return {"wells": wells, "total": len(wells)}


@router.get("/wells/nearby", response_model=NearbyWellsResponse)
async def get_nearby_wells(latitude: float, longitude: float, radius_km: float = 5.0,
                            db: AsyncIOMotorDatabase = Depends(get_db)):
    wells = await wells_repo.nearby_wells(db, latitude, longitude, radius_km)
    return {"wells": wells, "center": {"lat": latitude, "lng": longitude}, "radiusKm": radius_km}


@router.get("/wells/{well_id}", response_model=Well)
async def get_well(well_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    well = await wells_repo.get_well(db, well_id)
    if well is None:
        raise HTTPException(404, detail=f"Well '{well_id}' not found")
    return well
