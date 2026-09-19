from motor.motor_asyncio import AsyncIOMotorDatabase

COLLECTION = "users"


def _strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


async def get_user_by_email(db: AsyncIOMotorDatabase, email: str) -> dict | None:
    doc = await db[COLLECTION].find_one({"email": email})
    return _strip_id(doc) if doc else None


async def create_user(db: AsyncIOMotorDatabase, user: dict) -> dict:
    await db[COLLECTION].update_one({"id": user["id"]}, {"$set": user}, upsert=True)
    return user


async def seed_users_if_empty(db: AsyncIOMotorDatabase, users: list[dict]) -> None:
    count = await db[COLLECTION].count_documents({})
    if count == 0 and users:
        await db[COLLECTION].insert_many(users)
