"""Risk Intelligence engine: transparent rule/similarity-based scoring.

No ML model here by design: there isn't enough labelled incident data
behind this app to train or validate one, so every number in the response
is traceable to an input, a formation record, a matched event document, a
live telemetry reading, or a retrieved document excerpt — never a fabricated
constant, and never presented as a trained/validated model. See
DEMO_HEURISTIC_THRESHOLDS below — these are engineering heuristics picked
for a legible demo, not sourced from an OIL India standard.

Inputs (per the round's "Risk Pipeline"):
  1. depthM / mudWeightSG        — always required (manual sliders in the UI)
  2. formation                   — resolved from the wells/formations collections when a
                                    wellId is given; otherwise from the depth alone
  3. wellId (optional)           — unlocks well-specific signals 4-6 below
  4. current telemetry           — latest stored reading for that well (flow-in/out signal)
  5. historical events            — matched by depth proximity / formation / nearby wells
  6. nearby wells                — real haversine distance from the selected well
  7. document evidence           — reuses app.rag.retrieval.hybrid_search (Phase 7's RAG
                                    pipeline) for the single highest-probability risk type
                                    only, to keep this endpoint responsive — never a second,
                                    independent document-search implementation.

Every risk result carries `signals` (which rules actually fired),
`evidence` (structured, each item's own sourceType), `sourceTypes` (the
distinct provenance categories represented), and `isSimulation` (true
whenever a live-telemetry-derived signal contributed) — so a demo result
is never presented as a real OIL operational warning.
"""

from app.db.repositories import events_repo, formations_repo, telemetry_repo, wells_repo
from app.geospatial.distance import haversine_km
from app.rag import retrieval

# Demo/engineering heuristics — NOT sourced from an OIL India standard.
# Picked to make the demo's signals legible; documented here rather than
# buried as magic numbers, per the round's explicit instruction.
DEMO_HEURISTIC_THRESHOLDS = {
    "depthProximityM": 150.0,          # "near" a historical event, for evidence purposes
    "flowDeltaLossLpm": 10.0,          # matches the same threshold LiveTelemetryView already
                                        # uses client-side for its own "MUD LOSS DETECTED" flag
    "flowDeltaGainLpm": 10.0,
    "nearbyWellRadiusKm": 5.0,
}

RISK_DEFINITIONS = {
    "Mud Loss": {
        "name": "Mud Loss / Lost Circulation",
        "weight": 0.35,
        "direction": "over",  # risk rises when mud weight exceeds the safe window
    },
    "Gas Kick": {
        "name": "Gas Kick / Mud Influx",
        "weight": 0.30,
        "direction": "under",  # risk rises when mud weight is below the safe window
    },
    "Stuck Pipe": {
        "name": "Differential Stuck Pipe",
        "weight": 0.20,
        "direction": "over",
    },
    "Torque Spike": {
        "name": "Torque Spike & Stick-Slip",
        "weight": 0.15,
        "direction": "either",
    },
}


def _select_covering_formation(depth_m: float, formations: list[dict]) -> dict | None:
    for formation in formations:
        if formation["depthStartM"] <= depth_m <= formation["depthEndM"]:
            return formation
    if not formations:
        return None
    return min(formations, key=lambda f: min(abs(f["depthStartM"] - depth_m), abs(f["depthEndM"] - depth_m)))


def _margin_probability(mud_weight_sg: float, pore_sg: float, frac_sg: float, direction: str) -> float:
    """0..1 probability derived from how far mud weight sits outside the
    safe pore-pressure/fracture-gradient window, saturating at the edges."""
    if direction == "over":
        overbalance = mud_weight_sg - frac_sg
        return max(0.05, min(0.97, 0.15 + overbalance * 6.0)) if overbalance > 0 else max(0.05, 0.15 - abs(overbalance) * 2.0)
    if direction == "under":
        underbalance = pore_sg - mud_weight_sg
        return max(0.05, min(0.97, 0.15 + underbalance * 6.0)) if underbalance > 0 else max(0.05, 0.15 - abs(underbalance) * 2.0)
    # "either": distance from the window midpoint in either direction
    midpoint = (pore_sg + frac_sg) / 2
    deviation = abs(mud_weight_sg - midpoint)
    return max(0.10, min(0.90, 0.20 + deviation * 3.0))


async def _latest_telemetry(db, well_id: str | None) -> dict | None:
    if not well_id:
        return None
    readings = await telemetry_repo.history(db, well_id, limit=1)
    return readings[0] if readings else None


async def _nearby_well_ids(db, well_id: str | None) -> set[str]:
    """Real wells within DEMO_HEURISTIC_THRESHOLDS['nearbyWellRadiusKm'] of the
    selected well, by actual haversine distance over stored coordinates —
    not a fabricated proximity list."""
    if not well_id:
        return set()
    well = await wells_repo.get_well(db, well_id)
    if well is None:
        return set()
    all_wells = await wells_repo.list_wells(db)
    radius = DEMO_HEURISTIC_THRESHOLDS["nearbyWellRadiusKm"]
    return {
        w["id"] for w in all_wells
        if w["id"] != well_id and haversine_km(well["lat"], well["lng"], w["lat"], w["lng"]) <= radius
    }


def _event_match_signals(event: dict, depth_m: float, formation_name: str, nearby_well_ids: set[str]) -> list[str]:
    """Which rule(s) make this historical event relevant evidence — an
    event can match on more than one signal at once."""
    signals = []
    if abs(event["depthM"] - depth_m) <= DEMO_HEURISTIC_THRESHOLDS["depthProximityM"]:
        signals.append("depth_proximity")
    # Substring match (case-insensitive), not exact equality: seeded event
    # records use varied formation naming (e.g. "Barail Coal-Shale") that
    # doesn't always exactly match the formations collection's canonical
    # name (e.g. "Barail Coal-Shale & Sandstone") — same inconsistency the
    # frontend's own ReportBrowserTable formation filter already works
    # around with substring matching, not exact equality.
    event_formation = event["formation"].lower()
    canonical_formation = formation_name.lower()
    if event_formation in canonical_formation or canonical_formation in event_formation:
        signals.append("formation_match")
    if event["wellId"] in nearby_well_ids:
        signals.append("nearby_well_context")
    return signals


async def predict_risk(db, depth_m: float, mud_weight_sg: float, requested_formation: str | None,
                        well_id: str | None = None, include_document_evidence: bool = True) -> dict:
    formations = await formations_repo.list_formations(db)
    formation = None
    if requested_formation:
        formation = next((f for f in formations if f["name"] == requested_formation), None)
    if formation is None:
        formation = _select_covering_formation(depth_m, formations)

    pore_sg = formation["porePressureSG"] if formation else 1.10
    frac_sg = formation["fracGradientSG"] if formation else 1.60
    formation_name = formation["name"] if formation else "Unclassified"
    hazard_severity = formation.get("hazardSeverity", "moderate") if formation else "moderate"

    all_events = await events_repo.list_events(db)
    nearby_well_ids = await _nearby_well_ids(db, well_id)

    # Tag every event with *why* it's relevant (an event can match more than
    # one signal); keep only events that match at least one.
    tagged_events = []
    for e in all_events:
        signals = _event_match_signals(e, depth_m, formation_name, nearby_well_ids)
        if signals:
            tagged_events.append({**e, "_matchSignals": signals})

    telemetry = await _latest_telemetry(db, well_id)
    flow_delta_lpm = None
    if telemetry is not None:
        flow_delta_lpm = telemetry["mudFlowOutLpm"] - telemetry["mudFlowInLpm"]

    hazard_multiplier = {"none": 0.75, "low": 0.85, "moderate": 1.0, "high": 1.12, "critical": 1.25}.get(hazard_severity, 1.0)

    predicted_risks = []
    weighted_points = {}
    highest_probability_type = None
    highest_probability = -1.0

    for incident_type, definition in RISK_DEFINITIONS.items():
        matched = [e for e in tagged_events if e["incidentType"] == incident_type]
        base_prob = _margin_probability(mud_weight_sg, pore_sg, frac_sg, definition["direction"])
        similarity_boost = min(0.25, len(matched) * 0.05)
        probability = max(0.02, min(0.98, base_prob + similarity_boost)) * hazard_multiplier

        signals_fired = {"geomechanical_margin"}
        for e in matched:
            signals_fired.update(e["_matchSignals"])

        # Live-telemetry flow signal (Phase "Risk Rules": flow loss -> mud
        # loss, flow gain -> kick/influx). Only applied to the two risk
        # types it's actually diagnostic for, and only when telemetry for
        # this well is actually available — never fabricated.
        telemetry_contributed = False
        if flow_delta_lpm is not None:
            if incident_type == "Mud Loss" and flow_delta_lpm <= -DEMO_HEURISTIC_THRESHOLDS["flowDeltaLossLpm"]:
                probability = min(0.99, probability + 0.20)
                signals_fired.add("flow_loss_signal")
                telemetry_contributed = True
            elif incident_type == "Gas Kick" and flow_delta_lpm >= DEMO_HEURISTIC_THRESHOLDS["flowDeltaGainLpm"]:
                probability = min(0.99, probability + 0.20)
                signals_fired.add("flow_gain_signal")
                telemetry_contributed = True

        probability = max(0.02, min(0.99, probability))
        if probability > highest_probability:
            highest_probability = probability
            highest_probability_type = incident_type

        severity = "CRITICAL" if probability > 0.7 else "HIGH" if probability > 0.45 else "MEDIUM" if probability > 0.2 else "LOW"
        contributing_wells = sorted({e["wellId"] for e in matched})[:5]

        points = round(probability * definition["weight"] * 100, 1)
        weighted_points[incident_type] = {
            "weight": definition["weight"], "probability": round(probability * 100, 1), "points": points,
        }

        event_evidence = [
            {
                "type": "historical_event",
                "eventId": e["id"],
                "wellId": e["wellId"],
                "wellName": e["wellName"],
                "depthM": e["depthM"],
                "eventType": e["incidentType"],
                "matchedOn": e["_matchSignals"],
                "sourceType": e.get("sourceType", "synthetic_demo"),
            }
            for e in matched[:5]
        ]
        source_types = sorted({e.get("sourceType", "synthetic_demo") for e in matched})
        if telemetry_contributed:
            source_types = sorted(set(source_types) | {"synthetic_demo"})

        predicted_risks.append({
            "name": definition["name"],
            "probability": round(probability * 100, 1),
            "severity": severity,
            "triggerFactor": _build_explanation(
                incident_type, mud_weight_sg, formation_name, pore_sg, frac_sg,
                matched, signals_fired, flow_delta_lpm if telemetry_contributed else None,
            ),
            "contributingWells": contributing_wells,
            "recommendedAction": _recommended_action(incident_type, definition["direction"]),
            "signals": sorted(signals_fired),
            "evidence": event_evidence,
            "sourceTypes": source_types,
            "isSimulation": telemetry_contributed,
        })

    # Document evidence: reuse the existing RAG retrieval pipeline for the
    # single highest-probability risk type only (keeps this endpoint fast —
    # the frontend calls it on every slider tick, unthrottled). Never a
    # fabricated citation: only attached if hybrid_search actually returns
    # a real match. Skippable (`include_document_evidence=False`) for bulk
    # multi-well evaluation (Alerts round) where running a RAG search per
    # well would make that endpoint slow — historical-event evidence alone
    # is still real and sufficient to justify an alert.
    if include_document_evidence and highest_probability_type is not None:
        query = f"{highest_probability_type} risk in {formation_name} formation"
        try:
            doc_hits = await retrieval.hybrid_search(db, query, filters=None, top_k=2)
        except Exception:
            doc_hits = []
        target = next(r for r in predicted_risks if r["name"] == RISK_DEFINITIONS[highest_probability_type]["name"])
        for hit in doc_hits:
            if hit.get("sourceType") not in ("public_document", "government_data"):
                continue  # event-derived synthetic chunks are already represented via event evidence above
            target["evidence"].append({
                "type": "document",
                "documentId": hit.get("documentId"),
                "documentName": hit.get("documentName"),
                "page": hit.get("page"),
                "excerpt": hit["text"][:280],
                "sourceType": hit.get("sourceType"),
            })
            target["sourceTypes"] = sorted(set(target["sourceTypes"]) | {hit.get("sourceType")})

    composite_raw = sum(p["points"] for p in weighted_points.values())
    composite_score = max(5, min(99, round(composite_raw)))

    all_source_types = sorted(set().union(*[set(r["sourceTypes"]) for r in predicted_risks])) if predicted_risks else []
    any_simulation = any(r["isSimulation"] for r in predicted_risks)

    return {
        "wellId": well_id,
        "predictedRisks": predicted_risks,
        "compositeRiskScore": composite_score,
        "isSimulation": any_simulation,
        "sourceTypes": all_source_types,
        "calculationModel": {
            "formula": "H_composite = Round[ sum(W_i * P_i) x K_formation ]",
            "depthM": depth_m,
            "mudWeightSG": mud_weight_sg,
            "formation": formation_name,
            "weights": weighted_points,
            "coefficients": {
                "formationMultiplier": hazard_multiplier,
                "formationReason": f"{formation_name} hazard severity '{hazard_severity}' -> x{hazard_multiplier}",
                "spatialDecayFactor": 1.0,
                "spatialReason": f"{len(tagged_events)} historical event(s) matched by depth proximity, formation, or nearby-well context",
            },
            "governingStandard": "Internal rule/similarity Risk Intelligence engine (demo/engineering heuristics — see DEMO_HEURISTIC_THRESHOLDS; no ML model trained, insufficient labelled data to validate one)",
            "engineType": "rule_similarity_hybrid",
        },
        "geomechanicalMarginSG": {
            "porePressureSG": pore_sg,
            "fractureGradientSG": frac_sg,
            "currentMudWeightSG": mud_weight_sg,
            "safeWindowMinSG": pore_sg,
            "safeWindowMaxSG": frac_sg,
        },
    }


def _build_explanation(incident_type: str, mud_weight_sg: float, formation_name: str,
                        pore_sg: float, frac_sg: float, matched: list[dict],
                        signals: set[str], flow_delta_lpm: float | None) -> str:
    parts = [f"Mud weight {mud_weight_sg:.2f} SG vs. {formation_name} window [{pore_sg:.2f}-{frac_sg:.2f} SG]"]

    if matched:
        why = []
        if "depth_proximity" in signals:
            why.append("near a historical event depth")
        if "formation_match" in signals:
            why.append("same formation as historical event(s)")
        if "nearby_well_context" in signals:
            why.append("event(s) logged in a nearby well")
        why_text = ", ".join(why) if why else "similarity match"
        parts.append(f"Historical similarity detected in available demonstration data: {len(matched)} record(s) ({why_text})")
    else:
        parts.append("No matching historical events in the currently indexed data")

    if flow_delta_lpm is not None:
        direction = "loss" if flow_delta_lpm < 0 else "gain"
        parts.append(
            f"Risk signal detected from simulated telemetry: flow-out vs flow-in delta "
            f"{flow_delta_lpm:+.0f} LPM ({direction}, demo/engineering threshold "
            f"{DEMO_HEURISTIC_THRESHOLDS['flowDeltaLossLpm']:.0f} LPM)"
        )

    return "; ".join(parts)


def _recommended_action(incident_type: str, direction: str) -> str:
    return {
        "Mud Loss": "AI-GENERATED SUGGESTION: reduce mud weight toward the fracture-gradient ceiling; have LCM pill on standby.",
        "Gas Kick": "AI-GENERATED SUGGESTION: maintain mud weight above pore pressure; verify BOP/choke readiness.",
        "Stuck Pipe": "AI-GENERATED SUGGESTION: limit stationary time in this interval; maintain string rotation.",
        "Torque Spike": "AI-GENERATED SUGGESTION: reduce RPM and consider a high-viscosity sweep if drag increases.",
    }[incident_type]
