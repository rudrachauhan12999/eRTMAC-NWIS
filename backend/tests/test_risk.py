import pytest


@pytest.mark.asyncio
async def test_risk_predict_shape(client):
    response = await client.post("/api/risk/predict", json={"depthM": 3500, "mudWeightSG": 1.24})
    assert response.status_code == 200
    body = response.json()
    assert len(body["predictedRisks"]) == 4
    names = {r["name"] for r in body["predictedRisks"]}
    assert names == {
        "Mud Loss / Lost Circulation",
        "Gas Kick / Mud Influx",
        "Differential Stuck Pipe",
        "Torque Spike & Stick-Slip",
    }
    assert 0 <= body["compositeRiskScore"] <= 99
    assert "calculationModel" in body
    for risk in body["predictedRisks"]:
        assert risk["recommendedAction"].startswith("AI-GENERATED SUGGESTION:")


@pytest.mark.asyncio
async def test_risk_predict_higher_mud_weight_increases_loss_probability(client):
    low = await client.post("/api/risk/predict", json={"depthM": 3500, "mudWeightSG": 1.10})
    high = await client.post("/api/risk/predict", json={"depthM": 3500, "mudWeightSG": 1.40})
    low_loss = next(r for r in low.json()["predictedRisks"] if r["name"] == "Mud Loss / Lost Circulation")
    high_loss = next(r for r in high.json()["predictedRisks"] if r["name"] == "Mud Loss / Lost Circulation")
    assert high_loss["probability"] > low_loss["probability"]
