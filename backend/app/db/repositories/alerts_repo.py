from motor.motor_asyncio import AsyncIOMotorDatabase

COLLECTION = "alerts"


def _strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


async def list_alerts(db: AsyncIOMotorDatabase, well_id: str | None = None,
                       acknowledged: bool | None = None) -> list[dict]:
    query: dict = {}
    if well_id:
        # Real per-well alerts (this round) carry a proper wellId field;
        # the original seeded fixture alerts only had a free-text wellRef
        # display string, so match either for backward compatibility.
        query["$or"] = [{"wellId": well_id}, {"wellRef": {"$regex": well_id, "$options": "i"}}]
    if acknowledged is not None:
        query["acknowledged"] = acknowledged
    cursor = db[COLLECTION].find(query)
    return [_strip_id(doc) async for doc in cursor]


async def get_alert(db: AsyncIOMotorDatabase, alert_id: str) -> dict | None:
    doc = await db[COLLECTION].find_one({"id": alert_id})
    return _strip_id(doc) if doc else None


async def acknowledge_alert(db: AsyncIOMotorDatabase, alert_id: str) -> dict | None:
    await db[COLLECTION].update_one({"id": alert_id}, {"$set": {"acknowledged": True, "status": "acknowledged"}})
    doc = await db[COLLECTION].find_one({"id": alert_id})
    return _strip_id(doc) if doc else None


async def resolve_alert(db: AsyncIOMotorDatabase, alert_id: str) -> dict | None:
    await db[COLLECTION].update_one({"id": alert_id}, {"$set": {"acknowledged": True, "status": "resolved"}})
    doc = await db[COLLECTION].find_one({"id": alert_id})
    return _strip_id(doc) if doc else None


async def upsert_alerts(db: AsyncIOMotorDatabase, alerts: list[dict]) -> None:
    for alert in alerts:
        await db[COLLECTION].update_one({"id": alert["id"]}, {"$set": alert}, upsert=True)


async def upsert_generated_alert(db: AsyncIOMotorDatabase, alert: dict) -> None:
    """Upsert a backend-generated alert without clobbering a user's prior
    acknowledge/resolve action on it — re-evaluation refreshes the
    evidence/message/severity, but `acknowledged`/`status` only get their
    initial values on first creation (`$setOnInsert`), never overwritten
    on subsequent syncs."""
    await db[COLLECTION].update_one(
        {"id": alert["id"]},
        {
            "$set": alert,
            "$setOnInsert": {"acknowledged": False, "status": "active"},
        },
        upsert=True,
    )


async def remove_stale_generated_alerts(db: AsyncIOMotorDatabase, evaluated_well_ids: set[str],
                                         still_valid_ids: set[str]) -> int:
    """Delete auto-generated alerts for the evaluated wells whose
    underlying condition no longer holds — except ones a user has
    resolved, which stay as a historical record rather than being
    silently reopened or deleted out from under that decision."""
    if not evaluated_well_ids:
        return 0
    result = await db[COLLECTION].delete_many({
        "wellId": {"$in": list(evaluated_well_ids)},
        "id": {"$nin": list(still_valid_ids)},
        "status": {"$ne": "resolved"},
        "generated": True,
    })
    return result.deleted_count
