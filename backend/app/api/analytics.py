from collections import Counter

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.repositories import alerts_repo, chunks_repo, documents_repo, events_repo, formations_repo, wells_repo
from app.dependencies import get_db
from app.geospatial.distance import haversine_km

router = APIRouter(tags=["analytics"])

DEFAULT_ACTIVE_WELL_ID = "well-active-01"
# Same radius already used elsewhere in the app (InteractiveLeafletMap's
# default offset radius) — reused, not a new invented threshold.
DEFAULT_NEARBY_RADIUS_KM = 5.0


def _formation_matches(event_formation: str, canonical_formation_name: str) -> bool:
    """Same substring (case-insensitive) matching risk_engine.py's
    formation_match signal uses — seeded event records use varied
    formation naming (e.g. "Barail Coal-Shale") that doesn't always
    exactly match the formations collection's canonical name (e.g.
    "Barail Coal-Shale & Sandstone")."""
    a, b = event_formation.lower(), canonical_formation_name.lower()
    return a in b or b in a


def _depth_buckets(depths: list[float], bucket_size: float = 500.0) -> dict[str, int]:
    """Only buckets that actually contain at least one record are
    returned — no empty/fake categories."""
    counts: Counter = Counter()
    for d in depths:
        lo = int(d // bucket_size) * int(bucket_size)
        counts[f"{lo}-{lo + int(bucket_size)}m"] += 1
    return dict(sorted(counts.items(), key=lambda kv: int(kv[0].split("-")[0])))


@router.get("/analytics/overview")
async def get_overview(wellId: str | None = None, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Aggregates real project data only — see docs/DATA_SOURCES.md for
    which records are real (public_document/government_data) vs.
    synthetic_demo. Nothing here is fabricated to fill a category; a
    category with zero matching records is simply omitted or shows 0,
    never invented.
    """
    wells = await wells_repo.list_wells(db)
    events = await events_repo.list_events(db, well_id=wellId)
    alerts = await alerts_repo.list_alerts(db, well_id=wellId)
    documents = await documents_repo.list_documents(db)
    total_chunks = await chunks_repo.chunk_count(db)

    events_by_type = Counter(e["incidentType"] for e in events)
    events_by_severity = Counter(e["severity"] for e in events)
    events_by_source_type = Counter(e.get("sourceType", "synthetic_demo") for e in events)
    events_by_formation = Counter(e["formation"] for e in events)
    depth_distribution = _depth_buckets([e["depthM"] for e in events])

    def _alert_status(a: dict) -> str:
        if a.get("status"):
            return a["status"]
        return "acknowledged" if a.get("acknowledged") else "active"

    alerts_by_status = Counter(_alert_status(a) for a in alerts)
    alerts_by_severity = Counter(a["severity"] for a in alerts)
    alerts_by_type = Counter(a["type"] for a in alerts if a.get("type"))
    alerts_by_source_type = Counter(st for a in alerts for st in (a.get("sourceTypes") or []))
    # "risk signals currently detected" — reuses the already-computed alert
    # state (Risk Intelligence's own output) rather than re-running the
    # risk engine here, per the round's explicit "do not duplicate
    # expensive calculations per chart" instruction.
    simulation_derived_alerts = sum(1 for a in alerts if a.get("isSimulation"))

    documents_by_source_type = Counter(d["sourceType"] for d in documents)

    return {
        "wellId": wellId,
        "wells": {
            "total": len(wells),
            "byStatus": dict(Counter(w["status"] for w in wells)),
            "note": "MongoDB fixture wells — synthetic_demo, not real Oil India operational wells (see docs/DATA_SOURCES.md).",
        },
        "events": {
            "total": len(events),
            "byType": dict(events_by_type),
            "bySeverity": dict(events_by_severity),
            "bySourceType": dict(events_by_source_type),
            "byFormation": dict(events_by_formation),
            "depthDistribution": depth_distribution,
            "note": "Available demonstration records only — not representative of Oil India's complete historical drilling population.",
        },
        "alerts": {
            "total": len(alerts),
            "byStatus": dict(alerts_by_status),
            "bySeverity": dict(alerts_by_severity),
            "byType": dict(alerts_by_type),
            "bySourceType": dict(alerts_by_source_type),
            "simulationDerivedCount": simulation_derived_alerts,
            "note": "Reads current Alerts Intelligence state; does not recompute risk here.",
        },
        "documents": {
            "total": len(documents),
            "bySourceType": dict(documents_by_source_type),
            "totalChunksIndexed": total_chunks,
            "note": "Indexed public documents available to this project — not the complete Oil India document repository.",
        },
    }


@router.get("/analytics/correlation")
async def get_correlation(db: AsyncIOMotorDatabase = Depends(get_db)):
    events = await events_repo.list_events(db)
    by_type = Counter(e["incidentType"] for e in events)
    total_npt = sum(e.get("nptHours", 0) for e in events)
    return {
        "totalIncidents": len(events),
        "totalNptHours": round(total_npt, 1),
        "incidentsByType": dict(by_type),
        "note": "Computed directly from stored events collection — no fabricated accuracy statistics.",
    }


@router.get("/analytics/formations")
async def get_formation_analytics(wellId: str | None = None, db: AsyncIOMotorDatabase = Depends(get_db)):
    formations = await formations_repo.list_formations(db)
    events = await events_repo.list_events(db)

    stats = []
    for formation in formations:
        matched = [e for e in events if _formation_matches(e["formation"], formation["name"])]
        severity_counts = Counter(e["severity"] for e in matched)
        stats.append({
            "formation": formation["name"],
            "depthStartM": formation["depthStartM"],
            "depthEndM": formation["depthEndM"],
            "hazardSeverity": formation["hazardSeverity"],
            "incidentCount": len(matched),
            "totalNptHours": round(sum(e.get("nptHours", 0) for e in matched), 1),
            "severityDistribution": dict(severity_counts),
        })

    # Well-to-well comparison (backs StratigraphicAnalyticsView's existing
    # column chart): the selected well (or the app's default active well)
    # plus its real nearest neighbors by actual stored coordinates —
    # reusing the same nearby-well logic GET /api/wells/nearby already
    # uses, not a new proximity implementation.
    center_well_id = wellId or DEFAULT_ACTIVE_WELL_ID
    center_well = await wells_repo.get_well(db, center_well_id)
    well_comparison = []
    if center_well is not None:
        all_wells = await wells_repo.list_wells(db)
        candidates = [center_well]
        others = [
            {**w, "_distanceKm": haversine_km(center_well["lat"], center_well["lng"], w["lat"], w["lng"])}
            for w in all_wells if w["id"] != center_well_id
        ]
        others.sort(key=lambda w: w["_distanceKm"])
        candidates += [w for w in others if w["_distanceKm"] <= DEFAULT_NEARBY_RADIUS_KM][:4]

        barail = next((f for f in formations if "barail" in f["name"].lower()), None)
        for well in candidates:
            well_events = [e for e in events if e["wellId"] == well["id"]]
            well_comparison.append({
                "wellId": well["id"],
                "wellName": well["name"],
                "distanceKm": round(well.get("_distanceKm", 0.0), 2),
                "targetDepthM": well["targetDepthM"],
                "formationDepthStartM": barail["depthStartM"] if barail else None,
                "formationDepthEndM": barail["depthEndM"] if barail else None,
                "hasMudLossEvent": any(e["incidentType"] == "Mud Loss" for e in well_events),
                "sourceType": well.get("sourceType", "synthetic_demo"),
            })

    return {"formations": stats, "wellComparison": well_comparison}
