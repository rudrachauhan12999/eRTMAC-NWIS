"""DEMO telemetry simulator (Phase 11, mode DEMO_SIMULATION).

This is explicitly labeled simulated data end-to-end: every reading it
produces carries isSimulation=true, mode="DEMO_SIMULATION", and
sourceType="synthetic_demo" so it is never mistaken for real OIL India
eRTMAC telemetry (brief Phase 3/11 policy). There is no live eRTMAC feed
available to this project, so mode="REAL_DATA" is a defined-but-
unimplemented contract stub — it must never be filled with fabricated
numbers.

State is kept **per well_id** (not one shared global counter) so that
selecting different wells never mixes their telemetry — each well's
simulated depth starts near that well's own real depthM (from the wells
collection) and advances independently.
"""

import math
import time
from datetime import datetime, timezone

_states: dict[str, dict] = {}


def next_reading(well_id: str, start_depth_m: float, active_formation: str) -> dict:
    state = _states.setdefault(well_id, {"depth_m": start_depth_m})
    state["depth_m"] = round(state["depth_m"] + 0.05, 2)
    depth = state["depth_m"]
    now_ms = time.time() * 1000

    hazard_zone = depth >= 3480

    return {
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S UTC"),
        "wellId": well_id,
        "depthM": depth,
        "ropMhr": round(6.8 + math.sin(now_ms / 8000) * 1.5, 1),
        "wobTons": round(11.5 + math.cos(now_ms / 6000) * 1.2, 1),
        "rpm": round(105 + math.sin(now_ms / 5000) * 10),
        "torqueKNm": round(14.5 + math.sin(now_ms / 7000) * 2.8, 1),
        "sppPsi": round(2640 + math.cos(now_ms / 9000) * 80),
        "mudFlowInLpm": 1850,
        "mudFlowOutLpm": round(1845 + math.sin(now_ms / 4000) * 15),
        "pitVolumeM3": round(45.2 - (0.4 if hazard_zone else 0.05), 1),
        "gasUnits": round(14 + (25 if depth >= 3490 else 5)),
        "mudWeightInSG": 1.24,
        "mudWeightOutSG": 1.23,
        "activeFormation": active_formation,
        "hazardStatus": "CRITICAL_HAZARD_ZONE" if hazard_zone else "MONITORING",
        "isSimulation": True,
        "mode": "DEMO_SIMULATION",
        "sourceType": "synthetic_demo",
    }


def reset(well_id: str, start_depth_m: float = 3500.2) -> None:
    _states[well_id] = {"depth_m": start_depth_m}
