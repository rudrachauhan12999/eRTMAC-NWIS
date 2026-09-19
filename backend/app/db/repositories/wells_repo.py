from motor.motor_asyncio import AsyncIOMotorDatabase

from app.geospatial.distance import bearing_deg, compass_direction, haversine_km

COLLECTION = "wells"


def _strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


async def list_wells(db: AsyncIOMotorDatabase, status: str | None = None,
                      field: str | None = None, formation: str | None = None) -> list[dict]:
    query: dict = {}
    if status:
        query["status"] = status
    if field:
        query["field"] = field
    if formation:
        query["formation"] = formation
    cursor = db[COLLECTION].find(query)
    return [_strip_id(doc) async for doc in cursor]


async def get_well(db: AsyncIOMotorDatabase, well_id: str) -> dict | None:
    doc = await db[COLLECTION].find_one({"id": well_id})
    return _strip_id(doc) if doc else None


async def nearby_wells(db: AsyncIOMotorDatabase, lat: float, lng: float, radius_km: float) -> list[dict]:
    all_wells = [_strip_id(doc) async for doc in db[COLLECTION].find({})]
    results = []
    for well in all_wells:
        distance = haversine_km(lat, lng, well["lat"], well["lng"])
        if distance <= radius_km:
            angle = bearing_deg(lat, lng, well["lat"], well["lng"])
            results.append({
                **well,
                "distanceKm": round(distance, 2),
                "angleDeg": round(angle, 1),
                "direction": compass_direction(angle),
            })
    results.sort(key=lambda w: w["distanceKm"])
    return results


async def upsert_wells(db: AsyncIOMotorDatabase, wells: list[dict]) -> None:
    for well in wells:
        await db[COLLECTION].update_one({"id": well["id"]}, {"$set": well}, upsert=True)
