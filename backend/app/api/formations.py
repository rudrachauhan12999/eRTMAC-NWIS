from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.repositories import formations_repo, wells_repo
from app.dependencies import get_db
from app.schemas.formations import FormationListResponse

router = APIRouter(tags=["formations"])


@router.get("/formations", response_model=FormationListResponse)
async def get_formations(db: AsyncIOMotorDatabase = Depends(get_db)):
    formations = await formations_repo.list_formations(db)
    return {"formations": formations}


@router.get("/wells/{well_id}/formations", response_model=FormationListResponse)
async def get_well_formations(well_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    well = await wells_repo.get_well(db, well_id)
    if well is None:
        raise HTTPException(404, detail=f"Well '{well_id}' not found")
    formations = await formations_repo.formations_for_well(db, well)
    return {"formations": formations}
