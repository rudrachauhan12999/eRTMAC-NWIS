from motor.motor_asyncio import AsyncIOMotorDatabase

COLLECTION = "telemetry"


def _strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


async def insert_reading(db: AsyncIOMotorDatabase, reading: dict) -> None:
    await db[COLLECTION].insert_one(dict(reading))


async def history(db: AsyncIOMotorDatabase, well_id: str | None, limit: int = 50) -> list[dict]:
    query: dict = {"wellId": well_id} if well_id else {}
    cursor = db[COLLECTION].find(query).sort("timestamp", -1).limit(limit)
    return [_strip_id(doc) async for doc in cursor]
