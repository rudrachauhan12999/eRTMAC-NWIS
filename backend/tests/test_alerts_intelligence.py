"""Alerts Intelligence tests. Most scenarios monkeypatch
app.services.risk_engine.predict_risk (the ALERT engine's only dependency
on risk calculation — it is not a second risk model) so each test controls
severity/evidence/signals directly and deterministically, independent of
the risk formula's own tuning (already covered by test_risk_intelligence.py).
A couple of tests exercise the real end-to-end wiring against seeded data.
"""

import pytest
import pytest_asyncio

from app.db.mongodb import get_database
from app.services import alert_engine, risk_engine


@pytest_asyncio.fixture(autouse=True)
async def _clean_generated_alerts(client):
    """Generated alerts (unlike most test fixtures elsewhere in this repo)
    are deliberately persistent across evaluations — a resolved alert is
    protected from automatic deletion by design (see alerts_repo.
    remove_stale_generated_alerts). That means leftovers from one test run
    can otherwise survive into the next `pytest` invocation against the
    same real MongoDB. Start and end each test with a clean slate."""
    db = get_database()
    await db["alerts"].delete_many({"generated": True})
    yield
    await db["alerts"].delete_many({"generated": True})


def _risk(name="Mud Loss / Lost Circulation", severity="HIGH", evidence=None,
          signals=None, sourceTypes=None, isSimulation=False):
    return {
        "name": name,
        "probability": 60.0,
        "severity": severity,
        "triggerFactor": f"Mocked trigger factor for {name}",
        "contributingWells": ["well-calire-02"] if evidence else [],
        "recommendedAction": "AI-GENERATED SUGGESTION: mocked mitigation.",
        "signals": signals or ["geomechanical_margin"],
        "evidence": evidence or [],
        "sourceTypes": sourceTypes or [],
        "isSimulation": isSimulation,
    }


def _fake_predict_risk_factory(risks: list[dict], formation="Barail Coal-Shale & Sandstone"):
    async def fake(db, depth_m, mud_weight_sg, requested_formation, well_id=None, include_document_evidence=False):
        return {"predictedRisks": risks, "calculationModel": {"formation": formation}}
    return fake


@pytest.mark.asyncio
async def test_no_signal_no_alert(client, monkeypatch):
    monkeypatch.setattr(risk_engine, "predict_risk", _fake_predict_risk_factory(
        [_risk(severity="MEDIUM", evidence=[{"type": "historical_event", "sourceType": "synthetic_demo"}])]
    ))
    response = await client.get("/api/alerts", params={"wellId": "well-active-01"})
    assert response.status_code == 200
    generated = [a for a in response.json()["alerts"] if a.get("generated")]
    assert generated == []


@pytest.mark.asyncio
async def test_no_evidence_no_alert(client, monkeypatch):
    # High severity but zero evidence must still not produce an alert.
    monkeypatch.setattr(risk_engine, "predict_risk", _fake_predict_risk_factory(
        [_risk(severity="CRITICAL", evidence=[])]
    ))
    response = await client.get("/api/alerts", params={"wellId": "well-active-01"})
    generated = [a for a in response.json()["alerts"] if a.get("generated")]
    assert generated == []


@pytest.mark.asyncio
async def test_flow_loss_signal_creates_mud_loss_alert(client, monkeypatch):
    evidence = [{"type": "historical_event", "sourceType": "synthetic_demo", "wellId": "well-active-01"}]
    monkeypatch.setattr(risk_engine, "predict_risk", _fake_predict_risk_factory(
        [_risk(name="Mud Loss / Lost Circulation", severity="HIGH", evidence=evidence,
               signals=["geomechanical_margin", "flow_loss_signal"],
               sourceTypes=["synthetic_demo"], isSimulation=True)]
    ))
    response = await client.get("/api/alerts", params={"wellId": "well-active-01"})
    alerts = [a for a in response.json()["alerts"] if a.get("generated")]
    assert len(alerts) == 1
    assert alerts[0]["type"] == "Mud Loss"
    assert alerts[0]["severity"] == "HIGH"
    assert "flow_loss_signal" in alerts[0]["signals"]
    assert alerts[0]["isSimulation"] is True


@pytest.mark.asyncio
async def test_flow_gain_signal_creates_kick_alert(client, monkeypatch):
    evidence = [{"type": "historical_event", "sourceType": "synthetic_demo", "wellId": "well-colive-04"}]
    monkeypatch.setattr(risk_engine, "predict_risk", _fake_predict_risk_factory(
        [_risk(name="Gas Kick / Mud Influx", severity="HIGH", evidence=evidence,
               signals=["geomechanical_margin", "flow_gain_signal"],
               sourceTypes=["synthetic_demo"], isSimulation=True)]
    ))
    response = await client.get("/api/alerts", params={"wellId": "well-colive-04"})
    alerts = [a for a in response.json()["alerts"] if a.get("generated")]
    assert len(alerts) == 1
    assert alerts[0]["type"] == "Gas Kick"
    assert "flow_gain_signal" in alerts[0]["signals"]


@pytest.mark.asyncio
async def test_depth_proximity_creates_historical_alert(client, monkeypatch):
    evidence = [{"type": "historical_event", "sourceType": "synthetic_demo", "wellId": "well-calire-02",
                 "wellName": "NWIS-Calire-02", "depthM": 3480, "eventType": "Mud Loss",
                 "matchedOn": ["depth_proximity"]}]
    monkeypatch.setattr(risk_engine, "predict_risk", _fake_predict_risk_factory(
        [_risk(severity="HIGH", evidence=evidence, signals=["geomechanical_margin", "depth_proximity"],
               sourceTypes=["synthetic_demo"])]
    ))
    response = await client.get("/api/alerts", params={"wellId": "well-active-01"})
    alerts = [a for a in response.json()["alerts"] if a.get("generated")]
    assert len(alerts) == 1
    assert "depth_proximity" in alerts[0]["signals"]
    assert alerts[0]["evidence"][0]["matchedOn"] == ["depth_proximity"]


@pytest.mark.asyncio
async def test_formation_match_creates_alert(client, monkeypatch):
    evidence = [{"type": "historical_event", "sourceType": "synthetic_demo", "wellId": "well-calire-02",
                 "wellName": "NWIS-Calire-02", "depthM": 3480, "eventType": "Mud Loss",
                 "matchedOn": ["formation_match"]}]
    monkeypatch.setattr(risk_engine, "predict_risk", _fake_predict_risk_factory(
        [_risk(severity="HIGH", evidence=evidence, signals=["geomechanical_margin", "formation_match"],
               sourceTypes=["synthetic_demo"])]
    ))
    response = await client.get("/api/alerts", params={"wellId": "well-active-01"})
    alerts = [a for a in response.json()["alerts"] if a.get("generated")]
    assert "formation_match" in alerts[0]["signals"]


@pytest.mark.asyncio
async def test_nearby_well_relevance_creates_alert(client, monkeypatch):
    evidence = [{"type": "historical_event", "sourceType": "synthetic_demo", "wellId": "well-selt-ow-05",
                 "wellName": "Selt-OW-05", "depthM": 250, "eventType": "Stuck Pipe",
                 "matchedOn": ["nearby_well_context"]}]
    monkeypatch.setattr(risk_engine, "predict_risk", _fake_predict_risk_factory(
        [_risk(name="Differential Stuck Pipe", severity="HIGH", evidence=evidence,
               signals=["geomechanical_margin", "nearby_well_context"], sourceTypes=["synthetic_demo"])]
    ))
    response = await client.get("/api/alerts", params={"wellId": "well-selt-ow-06"})
    alerts = [a for a in response.json()["alerts"] if a.get("generated")]
    assert len(alerts) == 1
    assert "nearby_well_context" in alerts[0]["signals"]


@pytest.mark.asyncio
async def test_multiple_signals_severity_passthrough(client, monkeypatch):
    """Alerts must reuse the risk engine's own severity for combined
    signals, not invent a separate combination formula."""
    evidence = [{"type": "historical_event", "sourceType": "synthetic_demo", "wellId": "well-calire-02"}]
    monkeypatch.setattr(risk_engine, "predict_risk", _fake_predict_risk_factory(
        [_risk(severity="CRITICAL", evidence=evidence,
               signals=["geomechanical_margin", "depth_proximity", "formation_match", "flow_loss_signal"],
               sourceTypes=["synthetic_demo"], isSimulation=True)]
    ))
    response = await client.get("/api/alerts", params={"wellId": "well-active-01"})
    alerts = [a for a in response.json()["alerts"] if a.get("generated")]
    assert alerts[0]["severity"] == "CRITICAL"
    assert len(alerts[0]["signals"]) == 4


@pytest.mark.asyncio
async def test_synthetic_provenance_labeled(client, monkeypatch):
    evidence = [{"type": "historical_event", "sourceType": "synthetic_demo", "wellId": "well-calire-02"}]
    monkeypatch.setattr(risk_engine, "predict_risk", _fake_predict_risk_factory(
        [_risk(severity="HIGH", evidence=evidence, sourceTypes=["synthetic_demo"], isSimulation=True)]
    ))
    response = await client.get("/api/alerts", params={"wellId": "well-active-01"})
    alerts = [a for a in response.json()["alerts"] if a.get("generated")]
    assert alerts[0]["sourceTypes"] == ["synthetic_demo"]
    assert alerts[0]["isSimulation"] is True


@pytest.mark.asyncio
async def test_real_document_provenance_preserved(client, monkeypatch):
    evidence = [
        {"type": "historical_event", "sourceType": "synthetic_demo", "wellId": "well-calire-02"},
        {"type": "document", "sourceType": "public_document", "documentId": "doc-1",
         "documentName": "4_Ningru_0.pdf", "page": 12, "excerpt": "real excerpt"},
    ]
    monkeypatch.setattr(risk_engine, "predict_risk", _fake_predict_risk_factory(
        [_risk(severity="HIGH", evidence=evidence, sourceTypes=["synthetic_demo", "public_document"])]
    ))
    response = await client.get("/api/alerts", params={"wellId": "well-active-01"})
    alerts = [a for a in response.json()["alerts"] if a.get("generated")]
    assert "public_document" in alerts[0]["sourceTypes"]
    doc_evidence = [e for e in alerts[0]["evidence"] if e["type"] == "document"]
    assert doc_evidence[0]["documentName"] == "4_Ningru_0.pdf"
    assert doc_evidence[0]["sourceType"] == "public_document"


@pytest.mark.asyncio
async def test_well_isolation(client, monkeypatch):
    async def fake(db, depth_m, mud_weight_sg, requested_formation, well_id=None, include_document_evidence=False):
        if well_id == "well-active-01":
            risks = [_risk(name="Mud Loss / Lost Circulation", severity="HIGH",
                            evidence=[{"type": "historical_event", "sourceType": "synthetic_demo"}])]
        else:
            risks = [_risk(name="Gas Kick / Mud Influx", severity="HIGH",
                            evidence=[{"type": "historical_event", "sourceType": "synthetic_demo"}])]
        return {"predictedRisks": risks, "calculationModel": {"formation": "Barail Coal-Shale & Sandstone"}}
    monkeypatch.setattr(risk_engine, "predict_risk", fake)

    resp_a = await client.get("/api/alerts", params={"wellId": "well-active-01"})
    resp_b = await client.get("/api/alerts", params={"wellId": "well-colive-04"})

    alerts_a = [a for a in resp_a.json()["alerts"] if a.get("generated")]
    alerts_b = [a for a in resp_b.json()["alerts"] if a.get("generated")]
    assert all(a["wellId"] == "well-active-01" for a in alerts_a)
    assert all(a["wellId"] == "well-colive-04" for a in alerts_b)
    assert {a["type"] for a in alerts_a} == {"Mud Loss"}
    assert {a["type"] for a in alerts_b} == {"Gas Kick"}


@pytest.mark.asyncio
async def test_deterministic_alert_content(client, monkeypatch):
    evidence = [{"type": "historical_event", "sourceType": "synthetic_demo", "wellId": "well-calire-02"}]
    monkeypatch.setattr(risk_engine, "predict_risk", _fake_predict_risk_factory(
        [_risk(severity="HIGH", evidence=evidence, sourceTypes=["synthetic_demo"])]
    ))
    first = (await client.get("/api/alerts", params={"wellId": "well-active-01"})).json()["alerts"]
    second = (await client.get("/api/alerts", params={"wellId": "well-active-01"})).json()["alerts"]

    def _content(alerts):
        return [
            {k: v for k, v in a.items() if k != "timestamp"}
            for a in alerts if a.get("generated")
        ]
    assert _content(first) == _content(second)


@pytest.mark.asyncio
async def test_duplicate_prevention_single_document_per_signal(client, monkeypatch):
    evidence = [{"type": "historical_event", "sourceType": "synthetic_demo", "wellId": "well-calire-02"}]
    monkeypatch.setattr(risk_engine, "predict_risk", _fake_predict_risk_factory(
        [_risk(severity="HIGH", evidence=evidence, sourceTypes=["synthetic_demo"])]
    ))
    await client.get("/api/alerts", params={"wellId": "well-active-01"})
    await client.get("/api/alerts", params={"wellId": "well-active-01"})
    response = await client.get("/api/alerts", params={"wellId": "well-active-01"})
    alerts = [a for a in response.json()["alerts"] if a.get("generated")]
    assert len(alerts) == 1  # not 3


@pytest.mark.asyncio
async def test_acknowledge_persists_across_reevaluation(client, monkeypatch):
    evidence = [{"type": "historical_event", "sourceType": "synthetic_demo", "wellId": "well-calire-02"}]
    monkeypatch.setattr(risk_engine, "predict_risk", _fake_predict_risk_factory(
        [_risk(severity="HIGH", evidence=evidence, sourceTypes=["synthetic_demo"])]
    ))
    first = (await client.get("/api/alerts", params={"wellId": "well-active-01"})).json()["alerts"]
    alert_id = next(a["id"] for a in first if a.get("generated"))

    ack_response = await client.post(f"/api/alerts/{alert_id}/acknowledge")
    assert ack_response.status_code == 200
    assert ack_response.json()["acknowledged"] is True

    # Re-evaluate (as a fresh GET /api/alerts would trigger) — must not
    # reset the acknowledged flag.
    second = (await client.get("/api/alerts", params={"wellId": "well-active-01"})).json()["alerts"]
    alert = next(a for a in second if a["id"] == alert_id)
    assert alert["acknowledged"] is True
    assert alert["status"] == "acknowledged"


@pytest.mark.asyncio
async def test_resolve_persists_and_survives_condition_clearing(client, monkeypatch):
    evidence = [{"type": "historical_event", "sourceType": "synthetic_demo", "wellId": "well-calire-02"}]
    monkeypatch.setattr(risk_engine, "predict_risk", _fake_predict_risk_factory(
        [_risk(severity="HIGH", evidence=evidence, sourceTypes=["synthetic_demo"])]
    ))
    first = (await client.get("/api/alerts", params={"wellId": "well-active-01"})).json()["alerts"]
    alert_id = next(a["id"] for a in first if a.get("generated"))

    resolve_response = await client.post(f"/api/alerts/{alert_id}/resolve")
    assert resolve_response.status_code == 200
    assert resolve_response.json()["status"] == "resolved"

    # Condition clears entirely (no more qualifying risk) — a resolved
    # alert must survive the stale-alert cleanup, not be deleted.
    monkeypatch.setattr(risk_engine, "predict_risk", _fake_predict_risk_factory(
        [_risk(severity="LOW", evidence=[])]
    ))
    second = (await client.get("/api/alerts", params={"wellId": "well-active-01"})).json()["alerts"]
    alert = next((a for a in second if a["id"] == alert_id), None)
    assert alert is not None, "resolved alert must not be deleted by re-evaluation"
    assert alert["status"] == "resolved"
    assert alert["acknowledged"] is True
