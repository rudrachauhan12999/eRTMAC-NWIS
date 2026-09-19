from motor.motor_asyncio import AsyncIOMotorDatabase

COLLECTION = "drilling_events"


def _strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


async def list_events(db: AsyncIOMotorDatabase, well_id: str | None = None,
                       incident_type: str | None = None, severity: str | None = None,
                       formation: str | None = None) -> list[dict]:
    query: dict = {}
    if well_id:
        query["wellId"] = well_id
    if incident_type:
        query["incidentType"] = incident_type
    if severity:
        query["severity"] = severity
    if formation:
        query["formation"] = formation
    cursor = db[COLLECTION].find(query)
    return [_strip_id(doc) async for doc in cursor]


async def upsert_events(db: AsyncIOMotorDatabase, events: list[dict]) -> None:
    for event in events:
        await db[COLLECTION].update_one({"id": event["id"]}, {"$set": event}, upsert=True)


async def get_event(db: AsyncIOMotorDatabase, event_id: str) -> dict | None:
    doc = await db[COLLECTION].find_one({"id": event_id})
    return _strip_id(doc) if doc else None


async def delete_event(db: AsyncIOMotorDatabase, event_id: str) -> bool:
    result = await db[COLLECTION].delete_one({"id": event_id})
    return result.deleted_count > 0
