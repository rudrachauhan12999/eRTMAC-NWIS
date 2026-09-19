from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import get_settings
from app.dependencies import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(db: AsyncIOMotorDatabase = Depends(get_db)):
    settings = get_settings()
    indexed_wells = await db["wells"].count_documents({})
    indexed_reports = await db["documents"].count_documents({"indexed": True})
    return {
        "status": "ok",
        "system": "eRTMAC-NWIS",
        "basin": "Assam-Arakan (Upper Assam Shelf)",
        "operator": "Oil India Limited",
        "llmEnabled": bool(settings.GROQ_API_KEY),
        "llmProvider": "groq",
        "indexedWells": indexed_wells,
        "indexedReports": indexed_reports,
    }
