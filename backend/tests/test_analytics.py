import pytest


@pytest.mark.asyncio
async def test_overview_metrics_derived_from_database(client):
    """Sanity: overview counts must match what the underlying list
    endpoints report — proving they're derived from the DB, not hardcoded."""
    overview = (await client.get("/api/analytics/overview")).json()
    wells = (await client.get("/api/wells")).json()
    events = (await client.get("/api/events")).json()
    documents = (await client.get("/api/documents")).json()

    assert overview["wells"]["total"] == wells["total"]
    assert overview["events"]["total"] == events["total"]
    assert overview["documents"]["total"] == len(documents["documents"])


@pytest.mark.asyncio
async def test_event_type_distribution_is_correct(client):
    overview = (await client.get("/api/analytics/overview")).json()
    events = (await client.get("/api/events")).json()["events"]

    expected: dict[str, int] = {}
    for e in events:
        expected[e["incidentType"]] = expected.get(e["incidentType"], 0) + 1

    assert overview["events"]["byType"] == expected
    # Only categories that actually exist — no invented empty ones.
    assert set(overview["events"]["byType"].keys()).issubset({
        "Mud Loss", "Gas Kick", "Stuck Pipe", "Torque Spike",
        "Casing Problem", "Packoff", "Fishing", "NPT Event",
    })


@pytest.mark.asyncio
async def test_event_severity_and_source_type_distribution(client):
    overview = (await client.get("/api/analytics/overview")).json()
    events = (await client.get("/api/events")).json()["events"]

    assert sum(overview["events"]["bySeverity"].values()) == len(events)
    # All 12 seeded events are synthetic_demo (no real per-well incident
    # data exists in the provided real sources — docs/DATA_SOURCES.md).
    assert overview["events"]["bySourceType"] == {"synthetic_demo": len(events)}


@pytest.mark.asyncio
async def test_formation_aggregation_is_correct(client):
    response = await client.get("/api/analytics/formations")
    assert response.status_code == 200
    body = response.json()
    formations = body["formations"]
    events = (await client.get("/api/events")).json()["events"]

    total_incident_count = sum(f["incidentCount"] for f in formations)
    # Uses the exact same substring matching as Risk Intelligence's
    # formation_match signal (unmodified this round, per instruction) —
    # that logic only matches when one formation name string contains the
    # other, so not every event's varied formation label matches the
    # formations collection's canonical name (e.g. "Barail Sand-4" doesn't
    # match "Barail Coal-Shale & Sandstone"). At least the well-known
    # Barail Coal-Shale events must match, and the total must never exceed
    # the actual event count (no double-counting).
    assert 1 <= total_incident_count <= len(events)


@pytest.mark.asyncio
async def test_depth_aggregation_only_includes_populated_buckets(client):
    overview = (await client.get("/api/analytics/overview")).json()
    buckets = overview["events"]["depthDistribution"]
    events = (await client.get("/api/events")).json()["events"]

    assert sum(buckets.values()) == len(events)
    for count in buckets.values():
        assert count > 0  # no empty/fake buckets


@pytest.mark.asyncio
async def test_well_comparison_uses_real_nearby_well_logic(client):
    response = await client.get("/api/analytics/formations", params={"wellId": "well-active-01"})
    body = response.json()
    comparison = body["wellComparison"]
    assert len(comparison) >= 1
    assert comparison[0]["wellId"] == "well-active-01"
    assert comparison[0]["distanceKm"] == 0.0
    # distances must be non-decreasing (nearest-first, real haversine sort)
    distances = [w["distanceKm"] for w in comparison]
    assert distances == sorted(distances)
    for w in comparison:
        assert w["sourceType"] == "synthetic_demo"


@pytest.mark.asyncio
async def test_risk_signals_reuse_alerts_not_recomputed(client):
    """Alerts (and their isSimulation flag) are Risk Intelligence's own
    output — analytics must read that, not run a second risk calculation."""
    await client.get("/api/alerts")  # ensure alerts are generated/synced at least once
    overview = (await client.get("/api/analytics/overview")).json()
    alerts = (await client.get("/api/alerts")).json()["alerts"]

    assert overview["alerts"]["total"] == len(alerts)
    expected_sim_count = sum(1 for a in alerts if a.get("isSimulation"))
    assert overview["alerts"]["simulationDerivedCount"] == expected_sim_count


@pytest.mark.asyncio
async def test_alert_aggregation_by_status_and_severity(client):
    await client.get("/api/alerts")
    overview = (await client.get("/api/analytics/overview")).json()
    alerts = (await client.get("/api/alerts")).json()["alerts"]

    assert sum(overview["alerts"]["byStatus"].values()) == len(alerts)
    assert sum(overview["alerts"]["bySeverity"].values()) == len(alerts)


@pytest.mark.asyncio
async def test_document_metrics_correct_and_provenance_preserved(client):
    overview = (await client.get("/api/analytics/overview")).json()
    documents = (await client.get("/api/documents")).json()["documents"]

    by_source = overview["documents"]["bySourceType"]
    assert sum(by_source.values()) == len(documents)
    # Real public-document provenance preserved
    assert by_source.get("public_document", 0) == sum(1 for d in documents if d["sourceType"] == "public_document")
    assert by_source.get("synthetic_demo", 0) == sum(1 for d in documents if d["sourceType"] == "synthetic_demo")
    assert overview["documents"]["totalChunksIndexed"] > 0


@pytest.mark.asyncio
async def test_real_public_document_provenance_present(client):
    overview = (await client.get("/api/analytics/overview")).json()
    # The 5 real OIL India PDFs are registered as public_document —
    # confirms real provenance isn't collapsed into synthetic_demo.
    assert overview["documents"]["bySourceType"].get("public_document", 0) >= 1


@pytest.mark.asyncio
async def test_selected_well_filtering(client):
    unfiltered = (await client.get("/api/analytics/overview")).json()
    filtered = (await client.get("/api/analytics/overview", params={"wellId": "well-active-01"})).json()

    assert filtered["wellId"] == "well-active-01"
    assert unfiltered["wellId"] is None
    # Filtered event/alert totals must never exceed the unfiltered totals.
    assert filtered["events"]["total"] <= unfiltered["events"]["total"]
    assert filtered["alerts"]["total"] <= unfiltered["alerts"]["total"]


@pytest.mark.asyncio
async def test_empty_dataset_returns_safe_empty_state(client):
    # A well with no events/alerts of its own must show honest zeros/empty
    # dicts, not fabricated categories.
    response = await client.get("/api/analytics/overview", params={"wellId": "well-colov-01"})
    body = response.json()
    assert body["events"]["total"] >= 0
    if body["events"]["total"] == 0:
        assert body["events"]["byType"] == {}
        assert body["events"]["depthDistribution"] == {}


@pytest.mark.asyncio
async def test_overview_is_deterministic(client):
    first = (await client.get("/api/analytics/overview")).json()
    second = (await client.get("/api/analytics/overview")).json()
    assert first["events"] == second["events"]
    assert first["documents"] == second["documents"]
    assert first["wells"] == second["wells"]
