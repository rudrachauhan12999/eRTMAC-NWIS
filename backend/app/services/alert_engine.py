"""Alerts Intelligence: generates alert documents from the existing Risk
Intelligence engine (app.services.risk_engine) — this module is deliberately
NOT a second risk model. It calls risk_engine.predict_risk() per well and
turns any sufficiently severe, evidence-backed result into a persisted
MongoDB alert. There is one source of truth for risk calculations.

Design (per the round's "Alert Generation" pipeline):
    telemetry (latest reading, if any) -> risk_engine.predict_risk()
        -> alert rule evaluation (severity threshold + evidence required)
        -> evidence carried through unchanged -> alert document

Deduplication: an alert's id is deterministic — f"{wellId}:{riskTypeKey}" —
so re-evaluating the same well+risk-type always updates the same document
instead of inserting a new one (app.db.repositories.alerts_repo.
upsert_generated_alert preserves any acknowledge/resolve state a user
already set). Alerts whose condition no longer holds are removed on the
next evaluation pass, except ones a user has resolved.

Alerts are only evaluated for wells whose status suggests active drilling
(ALERT_ELIGIBLE_STATUSES below) — a deliberate, documented scope choice to
keep GET /api/alerts responsive (bulk multi-well risk evaluation across all
18 seeded wells, each with a real DB query set, is otherwise unnecessarily
slow for wells that aren't currently operating), not an arbitrary cut.
"""

import time

from app.db.repositories import alerts_repo, telemetry_repo, wells_repo
from app.services import risk_engine

ALERT_ELIGIBLE_STATUSES = {"Drilling", "Active"}
# Only CRITICAL/HIGH risk-engine severities become alerts — MEDIUM/LOW are
# routine background readings, not alert-worthy (avoids alert fatigue from
# constantly-present baseline risk).
ALERT_SEVERITY_THRESHOLD = {"CRITICAL", "HIGH"}
# Matches the Risk Intelligence panel's own default demo mud weight — used
# only when a well has no telemetry reading yet to derive one from.
DEFAULT_DEMO_MUD_WEIGHT_SG = 1.24

_RISK_TYPE_BY_NAME = {v["name"]: k for k, v in risk_engine.RISK_DEFINITIONS.items()}


async def _telemetry_context(db, well_id: str) -> tuple[float | None, float | None]:
    readings = await telemetry_repo.history(db, well_id, limit=1)
    if readings:
        reading = readings[0]
        return reading["depthM"], reading["mudWeightInSG"]
    return None, None


async def _evaluate_well(db, well: dict) -> list[dict]:
    depth_m, mud_weight_sg = await _telemetry_context(db, well["id"])
    if depth_m is None:
        depth_m = well["depthM"]
    if mud_weight_sg is None:
        mud_weight_sg = DEFAULT_DEMO_MUD_WEIGHT_SG

    result = await risk_engine.predict_risk(
        db, depth_m, mud_weight_sg, well.get("formation"), well["id"],
        include_document_evidence=False,
    )

    alerts = []
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    for risk in result["predictedRisks"]:
        if risk["severity"] not in ALERT_SEVERITY_THRESHOLD:
            continue
        if not risk["evidence"]:
            continue  # "If no meaningful evidence exists: DO NOT CREATE THE ALERT."

        risk_type_key = _RISK_TYPE_BY_NAME[risk["name"]]
        alerts.append({
            "id": f"{well['id']}:{risk_type_key}",
            "generated": True,
            "wellId": well["id"],
            "wellRef": well["name"],
            "type": risk_type_key,
            "severity": risk["severity"],
            "title": f"ALERT: {risk['name']} risk detected in {well['name']}",
            "message": risk["triggerFactor"],
            "recommendation": risk["recommendedAction"],
            "depthM": depth_m,
            "formation": result["calculationModel"]["formation"],
            "timestamp": now_iso,
            "triggerCondition": (
                f"Risk Intelligence severity {risk['severity']} with supporting evidence "
                f"(signals: {', '.join(risk['signals'])})"
            ),
            "mitigationSteps": [risk["recommendedAction"]],
            "signals": risk["signals"],
            "evidence": risk["evidence"],
            "sourceTypes": risk["sourceTypes"],
            "isSimulation": risk["isSimulation"],
        })
    return alerts


async def evaluate_and_sync_alerts(db, well_id: str | None = None) -> None:
    """Re-evaluates alerts for the given well (or every eligible well) and
    reconciles the alerts collection: upserts currently-valid alerts,
    removes ones that no longer hold (except resolved ones)."""
    if well_id:
        well = await wells_repo.get_well(db, well_id)
        wells = [well] if well else []
    else:
        all_wells = await wells_repo.list_wells(db)
        wells = [w for w in all_wells if w.get("status") in ALERT_ELIGIBLE_STATUSES]

    still_valid_ids: set[str] = set()
    for well in wells:
        for alert in await _evaluate_well(db, well):
            still_valid_ids.add(alert["id"])
            await alerts_repo.upsert_generated_alert(db, alert)

    evaluated_well_ids = {w["id"] for w in wells}
    await alerts_repo.remove_stale_generated_alerts(db, evaluated_well_ids, still_valid_ids)
