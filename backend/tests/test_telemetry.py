import pytest


@pytest.mark.asyncio
async def test_telemetry_current_is_labeled_simulation(client):
    response = await client.get("/api/telemetry/current")
    assert response.status_code == 200
    body = response.json()
    assert body["isSimulation"] is True
    assert body["mode"] == "DEMO_SIMULATION"
    assert body["sourceType"] == "synthetic_demo"
    assert body["wellId"] == "well-active-01"
    assert "depthM" in body


@pytest.mark.asyncio
async def test_telemetry_unknown_well_returns_404(client):
    response = await client.get("/api/telemetry/current", params={"wellId": "does-not-exist"})
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_telemetry_does_not_mix_wells(client):
    a1 = (await client.get("/api/telemetry/current", params={"wellId": "well-active-01"})).json()
    b1 = (await client.get("/api/telemetry/current", params={"wellId": "well-calire-02"})).json()
    a2 = (await client.get("/api/telemetry/current", params={"wellId": "well-active-01"})).json()

    assert a1["wellId"] == "well-active-01"
    assert b1["wellId"] == "well-calire-02"
    # Each well's depth progresses independently from its own seed —
    # well-active-01's second reading should be exactly one simulator
    # step ahead of its first, unaffected by the other well's request.
    assert round(a2["depthM"] - a1["depthM"], 2) == 0.05


@pytest.mark.asyncio
async def test_telemetry_history_returns_readings_after_polling(client):
    await client.get("/api/telemetry/current")
    await client.get("/api/telemetry/current")
    response = await client.get("/api/telemetry/history", params={"wellId": "well-active-01"})
    assert response.status_code == 200
    assert len(response.json()["readings"]) >= 1
