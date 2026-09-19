import pytest


def _sample_event(suffix: str) -> dict:
    return {
        "id": f"test-event-{suffix}",
        "wellId": "well-test",
        "wellName": "TEST-WELL-01",
        "incidentType": "Mud Loss",
        "depthM": 3000,
        "formation": "Test Formation",
        "reservoir": "Test Reservoir",
        "date": "2026-01-01",
        "severity": "HIGH",
        "summary": "Test summary for automated CRUD test.",
        "rootCause": "Test root cause.",
        "recommendedMitigation": "Test mitigation.",
        "actionTaken": "Test action.",
        "nptHours": 5,
        "costImpactLakhs": 1.0,
        "similarityScore": 0.9,
        "drillingParams": {
            "mudWeightSG": 1.2, "ecdSG": 1.22, "rpm": 90, "torqueKNm": 12,
            "sppPsi": 2000, "wobTons": 10, "flowRateLpm": 2000,
        },
        "sourceReport": {
            "reportId": f"TEST-REPORT-{suffix}",
            "reportType": "WCR (Well Completion Report)",
            "title": f"Test Report {suffix}",
            "date": "2026-01-01",
            "page": 1,
            "section": "Test Section",
            "ocrConfidence": 0.95,
            "excerpt": "Test excerpt content for retrieval verification.",
        },
    }


@pytest.mark.asyncio
async def test_create_event_is_tagged_synthetic_demo(client):
    payload = _sample_event("create")
    response = await client.post("/api/events", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["sourceType"] == "synthetic_demo"
    assert body["id"] == "test-event-create"

    listing = await client.get("/api/events")
    ids = [e["id"] for e in listing.json()["events"]]
    assert "test-event-create" in ids

    await client.delete("/api/events/test-event-create")


@pytest.mark.asyncio
async def test_created_event_is_searchable_via_rag(client):
    payload = _sample_event("searchable")
    await client.post("/api/events", json=payload)
    try:
        search = await client.post("/api/search", json={"query": "Test summary for automated CRUD test", "topK": 5})
        assert search.status_code == 200
        doc_ids = [r["documentId"] for r in search.json()["results"]]
        assert "TEST-REPORT-searchable" in doc_ids
    finally:
        await client.delete("/api/events/test-event-searchable")


@pytest.mark.asyncio
async def test_delete_event_removes_it_and_its_chunk(client):
    payload = _sample_event("delete")
    await client.post("/api/events", json=payload)

    delete_response = await client.delete("/api/events/test-event-delete")
    assert delete_response.status_code == 204

    listing = await client.get("/api/events")
    ids = [e["id"] for e in listing.json()["events"]]
    assert "test-event-delete" not in ids

    doc = await client.get("/api/documents/TEST-REPORT-delete")
    assert doc.status_code == 404


@pytest.mark.asyncio
async def test_delete_nonexistent_event_returns_404(client):
    response = await client.delete("/api/events/does-not-exist")
    assert response.status_code == 404
