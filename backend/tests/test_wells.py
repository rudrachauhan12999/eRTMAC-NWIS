import pytest


@pytest.mark.asyncio
async def test_list_wells_after_seed(client):
    response = await client.get("/api/wells")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == len(body["wells"])
    if body["wells"]:
        well = body["wells"][0]
        assert well["sourceType"] == "synthetic_demo"
        assert "lat" in well and "lng" in well


@pytest.mark.asyncio
async def test_get_well_not_found(client):
    response = await client.get("/api/wells/does-not-exist")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_nearby_wells(client):
    response = await client.get("/api/wells/nearby", params={"latitude": 27.3389, "longitude": 95.3195, "radius_km": 50})
    assert response.status_code == 200
    body = response.json()
    assert body["radiusKm"] == 50
    for well in body["wells"]:
        assert well["distanceKm"] <= 50
