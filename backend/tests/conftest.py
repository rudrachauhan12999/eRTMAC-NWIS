import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.db.mongodb import close_mongo_connection, connect_to_mongo
from app.main import app


@pytest_asyncio.fixture
async def client():
    await connect_to_mongo()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    await close_mongo_connection()
