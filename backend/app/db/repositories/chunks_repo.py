from motor.motor_asyncio import AsyncIOMotorDatabase

COLLECTION = "document_chunks"


def _strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


async def insert_chunks(db: AsyncIOMotorDatabase, chunks: list[dict]) -> int:
    if not chunks:
        return 0
    await db[COLLECTION].delete_many({"documentId": chunks[0]["documentId"]})
    result = await db[COLLECTION].insert_many(chunks)
    return len(result.inserted_ids)


async def all_chunks(db: AsyncIOMotorDatabase, source_type: str | None = None) -> list[dict]:
    query: dict = {"sourceType": source_type} if source_type else {}
    cursor = db[COLLECTION].find(query)
    return [_strip_id(doc) async for doc in cursor]


async def chunk_count(db: AsyncIOMotorDatabase) -> int:
    return await db[COLLECTION].count_documents({})


async def chunk_ids_for_document(db: AsyncIOMotorDatabase, document_id: str) -> list[str]:
    cursor = db[COLLECTION].find({"documentId": document_id}, {"chunkId": 1})
    return [doc["chunkId"] async for doc in cursor]


async def delete_chunks_for_document(db: AsyncIOMotorDatabase, document_id: str) -> int:
    result = await db[COLLECTION].delete_many({"documentId": document_id})
    return result.deleted_count
