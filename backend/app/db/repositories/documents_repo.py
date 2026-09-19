from motor.motor_asyncio import AsyncIOMotorDatabase

COLLECTION = "documents"


def _strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


async def list_documents(db: AsyncIOMotorDatabase, source_type: str | None = None,
                          document_name: str | None = None) -> list[dict]:
    query: dict = {}
    if source_type:
        query["sourceType"] = source_type
    if document_name:
        query["documentName"] = {"$regex": document_name, "$options": "i"}
    cursor = db[COLLECTION].find(query)
    return [_strip_id(doc) async for doc in cursor]


async def get_document(db: AsyncIOMotorDatabase, document_id: str) -> dict | None:
    doc = await db[COLLECTION].find_one({"documentId": document_id})
    return _strip_id(doc) if doc else None


async def upsert_document(db: AsyncIOMotorDatabase, document: dict) -> None:
    await db[COLLECTION].update_one({"documentId": document["documentId"]}, {"$set": document}, upsert=True)


async def mark_indexed(db: AsyncIOMotorDatabase, document_id: str, chunk_count: int) -> None:
    await db[COLLECTION].update_one(
        {"documentId": document_id}, {"$set": {"indexed": True, "chunkCount": chunk_count}}
    )


async def get_document_by_hash(db: AsyncIOMotorDatabase, content_hash: str) -> dict | None:
    """Duplicate-detection lookup: same file content uploaded twice should
    resolve to the same document instead of creating a second copy."""
    doc = await db[COLLECTION].find_one({"contentHash": content_hash})
    return _strip_id(doc) if doc else None


async def delete_document(db: AsyncIOMotorDatabase, document_id: str) -> bool:
    result = await db[COLLECTION].delete_one({"documentId": document_id})
    return result.deleted_count > 0
