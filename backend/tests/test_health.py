import pytest


@pytest.mark.asyncio
async def test_health_endpoint(client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["system"] == "eRTMAC-NWIS"
    assert "llmEnabled" in body
    assert "indexedWells" in body
