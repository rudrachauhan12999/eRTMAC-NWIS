# Telemetry Integration Analysis

Telemetry round. Inspection performed before code changes.

## 1. Existing telemetry interfaces

None, formally — `LiveTelemetryView.tsx` typed its state as `useState<any>(null)` for both
the current reading and the history array. No `TelemetryReading` TypeScript interface existed
in the frontend (only in `src/data/wellsData.ts` as an unused-here type and, coincidentally,
already in the backend's Pydantic schema). This round adds a proper
`src/services/telemetryApi.ts` `TelemetryReading` interface, matching the backend response
field-for-field, so the component is no longer untyped.

## 2. Existing parameters (all preserved, none added or removed)

`depthM, ropMhr, wobTons, rpm (fetched but not rendered), torqueKNm, sppPsi, mudFlowInLpm,
mudFlowOutLpm, pitVolumeM3 (fetched but not rendered), gasUnits, mudWeightInSG/OutSG (fetched
but not rendered), activeFormation, hazardStatus`. `flowDelta` is client-computed
(`mudFlowOutLpm - mudFlowInLpm`), unchanged.

## 3. Existing chart expectations

**None.** `history` state was already being accumulated (`useState<any[]>([])`, appended on
every poll, capped at 20) but was **never rendered anywhere** — no chart library
(Recharts, used elsewhere in the app) is imported in this component. This is a pre-existing
dead/unfinished feature, not something this round's changes touch or remove — `history` is
still collected exactly as before, still unused for display. Building a chart for it would be
a UI addition beyond "integrate the backend," so it was left as-is.

## 4. Existing mock data

The component itself generated no mock data — the *simulation* lived entirely in the backend
`server.ts` Express endpoint it called. The frontend's own contribution to "mock-ness" was its
**null-state fallback values**: every KPI card rendered a hardcoded literal (e.g. `'3500.2 m'`,
`'6.8 m/h'`, `'11.5 T'`) whenever `telemetry` was `null` — i.e. on first load before the first
poll resolved, and silently forever if the fetch ever failed (the old catch block only did
`console.error`, never surfaced an error to the UI or stopped showing those fake numbers).
This is precisely the anti-pattern the round's brief prohibits ("Do not fabricate fallback
telemetry when the API fails") — **fixed this round**: null states now render `—` and a
visible error banner appears on fetch failure, per §8 below.

## 5. Existing refresh/update behavior

`setInterval` polling every 1500ms while `isStreaming` is true, driven by a Play/Pause toggle.
Unchanged this round — same interval, same toggle, same UX.

## 6. Existing API expectations

`fetch('/api/telemetry/current')` — a **relative** path. Before this round that request hit
`server.ts`'s own Express mock endpoint (same origin, port 3000), never the FastAPI backend on
port 8000. This round repoints it to the real backend via the same `apiFetch`/`API_BASE_URL`
helper already used by every other integrated component (Auth, Wells, Documents, RAG, Events).

## 7. Backend telemetry schema

Already existed from the Phase 2 scaffold (`app/api/telemetry.py`,
`app/telemetry/simulator.py`, `app/schemas/telemetry.py`) — reused, not rebuilt, per the
round's "do not create duplicate endpoints" instruction:

- `GET /api/telemetry/current?wellId=` → one `TelemetryReading`
- `GET /api/telemetry/history?wellId=&limit=` → `{ readings: TelemetryReading[] }`

**Two real gaps were found and fixed in the existing backend code this round** (not part of
the "reuse as-is" plan, but necessary for correctness — see "Fixes" below).

## 8. Which values are real vs. simulated

**All of it is simulated.** There is no live OIL India eRTMAC feed available to this project
(brief Phase 3/11 policy, restated explicitly in this round's brief). Every reading is
produced by `app/telemetry/simulator.py`'s deterministic sine/cosine functions of wall-clock
time, seeded per-well from that well's *real* stored `depthM`/`formation` (from the `wells`
collection) so the starting point is grounded in the one real fact available (the well's
current depth), but the parameter oscillations themselves are synthetic. Every reading now
carries `isSimulation: true`, `mode: "DEMO_SIMULATION"`, and `sourceType: "synthetic_demo"` —
and the frontend now visibly displays a "SIMULATED DEMO TELEMETRY" badge whenever a reading
with `isSimulation: true` is shown (§ Frontend changes below). `mode: "REAL_DATA"` remains a
defined-but-unimplemented contract value in the schema — it must never be filled with
fabricated numbers if a real feed is never connected.

## Backend fixes made this round

1. **Per-well simulator state.** The simulator previously kept **one global** depth counter
   (`_state["depth_m"]`) shared across every well — selecting a different well would have
   shown the *same* depth progression as whichever well was polled most recently, violating
   "do not mix telemetry between wells." Fixed: `_states: dict[str, dict]` keyed by `well_id`,
   each well's depth seeded from and advancing independently of every other well's.
   Verified with a new test (`test_telemetry_does_not_mix_wells`).
2. **Added `wellId` and `sourceType` to the response.** Previously `wellId` was written to
   Mongo but never echoed back in the API response, so the frontend couldn't display which
   well a reading belonged to without separately tracking it. `sourceType` didn't exist on the
   schema at all. Both added as required fields, sourced from the real request/simulator, not
   invented.
3. `GET /api/telemetry/current` now 404s for an unknown `wellId` instead of silently
   simulating a nonexistent well.
4. Cleared 31 stale pre-existing `telemetry` documents in MongoDB left over from earlier
   rounds' manual API testing — they predated the new required fields and would have failed
   the response schema on `GET /api/telemetry/history`.

## Frontend changes made this round

- `src/services/telemetryApi.ts` (new): typed `fetchCurrentTelemetry`/`fetchTelemetryHistory`
  wrapping `apiFetch` (the same backend-pointing helper every other round has used).
- `LiveTelemetryView.tsx`: repointed to the real backend; accepts optional `wellId`/`wellName`
  props (wired from `App.tsx`'s existing `selectedWell` state — the same state Wells/Map and
  Historical Events already use, no new selection mechanism introduced); resets its displayed
  reading when the selected well changes (so a stale reading from well A is never shown while
  well B is loading); replaced literal fallback numbers with `—` plus a visible error banner
  on fetch failure; added the "SIMULATED DEMO TELEMETRY" badge (small, next to the existing
  "LIVE RIG DATA" badge — unobtrusive per the brief, but always visible whenever a simulated
  reading is shown).
- `App.tsx`: passes `wellId`/`wellName` (from `selectedWell`) into `LiveTelemetryView`.

## Not touched

Risk, Alerts, Analytics, and everything already integrated in prior rounds (Auth, Wells/Map,
Documents, RAG, Historical Events) — no files outside the telemetry path were modified.
