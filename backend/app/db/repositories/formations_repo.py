from motor.motor_asyncio import AsyncIOMotorDatabase

COLLECTION = "formations"


def _strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


async def list_formations(db: AsyncIOMotorDatabase) -> list[dict]:
    cursor = db[COLLECTION].find({}).sort("depthStartM", 1)
    return [_strip_id(doc) async for doc in cursor]


async def formations_for_well(db: AsyncIOMotorDatabase, well_doc: dict) -> list[dict]:
    """Formation tops actually spanned by a given well's depth range."""
    cursor = db[COLLECTION].find({"depthStartM": {"$lte": well_doc.get("targetDepthM", 0)}}).sort("depthStartM", 1)
    return [_strip_id(doc) async for doc in cursor]


async def upsert_formations(db: AsyncIOMotorDatabase, formations: list[dict]) -> None:
    for formation in formations:
        await db[COLLECTION].update_one({"name": formation["name"]}, {"$set": formation}, upsert=True)
