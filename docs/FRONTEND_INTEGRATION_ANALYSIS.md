# Frontend Integration Analysis — eRTMAC-NWIS

Phase 0 deliverable. Read-only inspection of the existing (locked) frontend. No backend
code has been written yet. This document is the source of truth for Phase 1 (API contract)
and all later phases.

## 0. Repository layout — deviation from the assumed structure

The task brief assumes a `frontend/` subfolder. **That folder does not exist.** This repo's
root *is* the frontend: a Vite + React 19 + TypeScript SPA with an Express dev/prod server
(`server.ts`) that already implements a thin, mock-backed API layer.

```
<repo root>/
├── src/                      # the actual "frontend/src" from the brief
│   ├── App.tsx
│   ├── components/           # 21 view/modal components
│   ├── data/                 # 3 hardcoded data modules (see §4)
│   ├── types/auth.ts
│   └── utils/generateDrillingPdf.ts
├── server.ts                 # Express app: 4 endpoints, all mock/synthetic + optional Gemini
├── public/                   # logo assets
├── data/raw/                 # real source material (see §9 — CRITICAL finding)
│   ├── oil_india/*.pdf       # 5 real PDFs, 2.6–84 MB each
│   ├── government/*.csv      # 1 real national aggregate table
│   └── geospatial/assam.pbf  # 1 real OSM basemap extract, 59 MB
├── package.json, vite.config.ts, tsconfig.json
└── .env.example              # GEMINI_API_KEY, APP_URL only
```

Consequence for later phases: the new `backend/` (Python/FastAPI) will be created as a
**sibling** of `src/`, not nested under a `frontend/` folder. `server.ts`'s existing Express
endpoints will need to be either proxied to the new FastAPI backend or retired once the
frontend is repointed — that's a Phase 14 decision, not Phase 0's.

This is a **Google AI Studio–generated app** (see `metadata.json`,
`majorCapabilities: ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]`). All well/incident/telemetry
data was synthesized by the AI Studio agent, not sourced from OIL India. See §9.

---

## 1. TypeScript interfaces / types (canonical shapes the backend must match)

### `src/data/wellsData.ts`
- `Well` — `id, name, shortCode, lat, lng, distanceKm, direction, angleDeg, depthM, targetDepthM, formation, reservoir, status('Active'|'Drilling'|'Completed'|'Suspended'|'Workover'|'Shut-in'), type('Exploration'|'Development'|'Delineation'|'Injection'), rigName, spudDate, incidentsCount, primaryRisk('High Loss'|'Gas Kick'|'Stuck Pipe'|'Overpressure'|'Stable'), colorTag`
- `FormationLayer` — `name, depthStartM, depthEndM, lithology, color, hazardSeverity('none'|'low'|'moderate'|'high'|'critical'), hazardDescription, porePressureSG, fracGradientSG, recommendedMudWeightSG`
- `HistoricalIncident` — `id, wellId, wellName, incidentType('Mud Loss'|'Gas Kick'|'Stuck Pipe'|'Torque Spike'|'Casing Problem'|'Packoff'|'Fishing'|'NPT Event'), depthM, formation, reservoir, date, severity('CRITICAL'|'HIGH'|'MEDIUM'|'LOW'), summary, rootCause, recommendedMitigation, actionTaken, nptHours, costImpactLakhs, similarityScore, drillingParams{mudWeightSG,ecdSG,rpm,torqueKNm,sppPsi,wobTons,flowRateLpm}, sourceReport{reportId,reportType('WCR'|'DDR'|'Mud Logging Master'|'Geological Prognosis'),title,date,page,section,ocrConfidence,excerpt,tableData?}`
- `AlertItem` — `id, severity('CRITICAL'|'HIGH'|'WARNING'|'INFO'), title, message, recommendation, depthM, formation, wellRef, timestamp, acknowledged, triggerCondition, mitigationSteps[]`
- `TelemetryReading` — `timestamp, depthM, ropMhr, wobTons, rpm, torqueKNm, sppPsi, mudFlowInLpm, mudFlowOutLpm, pitVolumeM3, gasUnits, mudWeightInSG, mudWeightOutSG`
- `OperationalScenario` — `id, title, badge, desc, query, depthTarget, formationTarget`

### `src/types/auth.ts`
- `UserProfile` — `id, name, email, role, department, badgeNumber, clearanceLevel, avatar?, isCustomAccount?`
- `PRESET_USERS: UserProfile[]` — 4 hardcoded operator accounts (used as the fake login directory)

### `src/data/historicalRiskTrends.ts`
- `HistoricalTrendDay` — `day, date, displayDate, depthM, formation, mudWeightSG, compositeHazardScore, rollingAvgScore, incidentCount, incidentType?, incidentName?, incidentSeverity?, nptHours?, lossVolumeBbl?, gasUnits?, offsetWellRef?, description?, mitigationApplied?`
- `CORRELATION_METRICS` (untyped object) — `pearsonR, rSquared, totalIncidents, totalNptHours, predictionAccuracyRate, leadTimeHoursAvg, falsePositiveRate, ...`

### `src/components/AiAssistantView.tsx` (defines the RAG response contract)
- `RagResponse` — `summary, nearbyWellsAnalysis, rootCause, recommendedMitigation, confidenceScore, riskLevel('CRITICAL'|'HIGH'|'MEDIUM'|'LOW'), isInsufficientInfo, reasoningSteps: string[], citations: Array<{reportId, reportType?, wellName, title?, page, section, ocrConfidence?, excerpt}>`

### `src/components/HeaderBar.tsx`
- `ActiveTab` — union `'dashboard'|'operations'|'ai-assistant'|'map'|'risk-prediction'|'historical-events'|'doc-library'|'telemetry'|'analytics'|'field-drills'|'docs'` — canonical tab id list, imported across the app.

### Untyped-but-inferable shapes (gaps in the frontend itself, not just for us)
- `/api/telemetry/current` response — consumed via `useState<any>` in `LiveTelemetryView.tsx`. Inferred shape: `{ timestamp, depthM, ropMhr, wobTons, rpm, torqueKNm, sppPsi, mudFlowInLpm, mudFlowOutLpm, pitVolumeM3, gasUnits, mudWeightInSG, mudWeightOutSG, activeFormation, hazardStatus }`.
- `/api/risk/predict` response — consumed via `useState<any>` in `RiskPredictionView.tsx` and `calculationModel?: any` in `HazardScoreModal.tsx`. Inferred shape: `{ compositeRiskScore, predictedRisks: [{name, triggerFactor, probability, severity, contributingWells: string[], recommendedAction}], calculationModel: { formula, depthM, mudWeightSG, formation, weights: {mudLoss|gasKick|stuckPipe|torqueSpike: {weight,probability,points}}, coefficients: {formationMultiplier, formationReason, spatialDecayFactor, spatialReason}, governingStandard }, geomechanicalMarginSG: {porePressureSG, fractureGradientSG, currentMudWeightSG, safeWindowMinSG, safeWindowMaxSG} }`.

---

## 2. API calls actually made by the frontend

**Only four endpoints are called anywhere in `src/`. No `axios`, no other `/api/*` paths.**

| Endpoint | Caller | Method | Trigger |
|---|---|---|---|
| `/api/telemetry/current` | `LiveTelemetryView.tsx` | GET | polled every 1500 ms while streaming |
| `/api/rag/chat` | `AiAssistantView.tsx` | POST | on user chat submit |
| `/api/risk/predict` | `RiskPredictionView.tsx` | POST | on mount + on every depth/mud-weight slider change (not debounced) |
| `/api/health` | *(none)* | — | not called from `src/`; only appears as display text in `systemDocumentation.ts`'s docker-compose sample |

One additional `fetch()` exists: `utils/generateDrillingPdf.ts` does `fetch('/oil_india_logo.png')` — a same-origin static asset load to embed the logo in a jsPDF export. Not a backend call.

**Everything else in the UI is a static import from `src/data/*.ts` or inline component state.**
This is the central integration fact: replacing mock data with real data means either (a)
routing more of the UI through new endpoints (preferred, per Phase 14), or (b) doing nothing
for components that are purely decorative/simulated by original design.

### Request/response payloads

**`POST /api/rag/chat`**
```json
// Request
{ "message": "string", "conversationHistory": "optional, currently unused by caller", "activeDepth": 3500, "activeFormation": "Barail Coal-Shale & Sandstone" }
// Response: RagResponse (see §1)
```
Current `server.ts` implementation: keyword-substring matching against the hardcoded
`HISTORICAL_INCIDENTS` array, an optional Gemini call (models `gemini-3.8-flash` →
`gemini-flash-latest` → `gemini-3.1-flash-lite` fallback chain, 2.5s timeout each) fed a
prompt built from the same hardcoded incidents, and a final hand-written deterministic
fallback with **hardcoded prose** ("NWIS-Calire-02 (1.4 km offset) experienced a 48 m³/hr
mud loss event..."). The "insufficient evidence" trigger is a keyword blocklist
(`basement`, `6800`, `selt-ow-08`, `weather in paris`, `bitcoin`, `football`), not real
retrieval-confidence scoring.

**`POST /api/risk/predict`**
```json
// Request
{ "depthM": 3500, "mudWeightSG": 1.24 }  // formation is sent by caller but ignored server-side today
// Response: see inferred shape in §1
```
Current implementation: a hand-tuned closed-form formula (sigmoid-ish thresholds on mud
weight vs. fixed pore-pressure/frac-gradient constants for "Barail"/"Tipam" depth bands).
Not ML. `contributingWells` arrays are **hardcoded string literals**, unrelated to the
request. This is a template for a Stage-1 rule-based risk engine (per Phase 10), not
something to preserve as-is.

**`GET /api/telemetry/current`**
No request body. Response is generated from a server-side sinusoidal function of
`Date.now()` plus a monotonically-incrementing `simulatedDepth` — a pure client-visible
simulation with no `is_simulation` flag in the payload today (the brief's demo-telemetry
labeling requirement is currently unmet).

---

## 3. Hardcoded / mock datasets (all in-repo, none from `data/raw/`)

| File / location | Contents |
|---|---|
| `src/data/wellsData.ts` | `ACTIVE_WELL` (1), `NEARBY_WELLS` (18, incl. active), `STRATIGRAPHIC_FORMATIONS` (8 layers), `HISTORICAL_INCIDENTS` (13 incidents w/ full synthetic WCR/DDR citations), `PREDICTIVE_ALERTS` (5), `INITIAL_TELEMETRY` (1 snapshot), `OPERATIONAL_SCENARIOS` (6) |
| `src/data/historicalRiskTrends.ts` | `HISTORICAL_RISK_30_DAYS` (30-day synthetic trend), `CORRELATION_METRICS` (fabricated stats: pearsonR 0.86, predictionAccuracyRate 92.4%, etc.) |
| `src/data/systemDocumentation.ts` | `SYSTEM_DOCUMENTATION` — aspirational architecture copy (Gemini 3.8 Flash, BM25+vector hybrid, ChromaDB, a full SQLite DDL that was never actually used) rendered verbatim in the "docs" tab. Documentation-as-marketing-copy, not a real schema — but useful as a signal of original design intent. **Do not treat its claimed accuracy numbers or architecture as fact.**
| `IntelligenceDashboardView.tsx` | `PIPELINE_STEPS`, `SCENARIOS` (4 fully scripted drilling scenarios with fake sensor params, auto-advancing every 4s client-side) |
| `StratigraphicAnalyticsView.tsx` | `comparedWells` (5 wells, fields don't match `Well` interface — independent hardcoded array) |
| `RadarProximityMap.tsx` | `displayWells` (7 entries with manually placed x/y % coordinates for the radial UI, independent risk/distance labels that can desync from `Well.primaryRisk`) |
| `CorrelationCenterPanel.tsx` | "View Evidence" always opens report `OIL-WCR-CAL-02-SEC4` regardless of which alert was clicked (bug/shortcut) |
| `InteractiveLeafletMap.tsx` | Synthesizes a fake incident on marker click: `severity: 'HIGH'` always, `page: 42`, `ocrConfidence: 98.6`, generic root-cause/mitigation text — none of this is real |
| `generateDrillingPdf.ts` + `DrillingSummaryPdfModal.tsx` | Duplicate, independently hardcoded hazard-probability table and 8 telemetry metric cards — **inconsistent with** `/api/risk/predict`'s live numbers (never called from here) |
| `DocLibraryView.tsx` | Entire "document library" CRUD is `localStorage` only (see §4) |
| `AddNewDocModal.tsx` | `PRESET_TEMPLATES` (2 canned incident templates); file picker reads only the filename, never the file content |

---

## 4. `localStorage` / `sessionStorage` usage

| Key | Written by | Contents |
|---|---|---|
| `ertmac_user` | `App.tsx` (`handleLogin`) | Full `UserProfile` JSON — session persistence for the fake login |
| `ertmac_doc_library` | `DocLibraryView.tsx` | Full `HistoricalIncident[]` JSON — user-added/removed "documents"; never touches a server |
| `ertmac_doc_library_saved` | `DocLibraryView.tsx` (read-only, legacy) | Fallback read path for an older key name |

No `sessionStorage` usage found anywhere.

---

## 5. Authentication assumptions

**There is no real authentication.** `AuthModal.tsx`:
- Sign-in: matches typed email against `PRESET_USERS` (4 hardcoded accounts); if no match,
  fabricates a new `UserProfile` from the email string itself (`name` derived from the
  local-part, `role: 'Drilling Operations Engineer'`, `badgeNumber: OIL-USER-${random}`,
  `clearanceLevel: 'Level 2 - Field Operations'`).
- Sign-up: same fabrication pattern, with clearance level guessed from a substring match on
  the entered role name (`'Director'`/`'Lead'` → Level 4, else Level 2).
- **No password is ever validated.** Any input succeeds.
- Session state lives in `App.tsx`'s `currentUser` React state, persisted only via the
  `ertmac_user` localStorage key — no token, no expiry, no server round-trip.

Roles seen in `PRESET_USERS`: "Lead Drilling Engineer", "Director of Drilling Operations",
"Chief Geologist & Petrophysicist", "Senior Drilling Fluids Specialist" — these are display
labels, not the `DRILLING_ENGINEER/GEOLOGIST/SUPERVISOR/ADMIN` enum the brief specifies for
Phase 13. The backend will need a mapping since **the `UserProfile.role` field must keep
displaying free-text role labels for the UI to render unchanged** (brief: preserve
interfaces, minimal changes only) — recommend adding a separate internal `roleGroup` enum
field rather than repurposing `role`.

---

## 6. Telemetry assumptions

- Poll-based, not push/websocket: `LiveTelemetryView.tsx` calls `GET /api/telemetry/current`
  every 1500 ms on an interval while a "streaming" toggle is on.
- Expects a flat JSON object (see inferred shape §1); a `history` array of up to 20 readings
  is kept in component state but doesn't appear to be rendered as a chart in the current
  build (looks like an unfinished/dead feature — worth preserving as an array the frontend
  could use, not worth building new UI for).
- No existing flag distinguishes simulated vs. real telemetry in the payload — Phase 11's
  `is_simulation` marker requirement means we're *adding* a field the frontend doesn't yet
  read, which is safe (extra JSON fields are ignored by the current consumer) but won't be
  visibly labeled in the UI without a (minimal, additive) component change.

---

## 7. RAG assumptions

- Single-turn only from the frontend's perspective: `conversationHistory` is passed in the
  request but there's no visible multi-turn state assembly in `AiAssistantView.tsx` beyond
  the initial prop; scenario 6 in `OPERATIONAL_SCENARIOS` ("Multi-Turn Decision Follow-Up")
  is aspirational copy, not implemented multi-turn logic.
- Frontend renders, per response: summary, nearby-wells analysis, root cause, mitigation,
  a 0–100 confidence score, a risk-level badge, a reasoning-steps list, and a citations grid.
  Clicking a citation currently opens the report modal with **hardcoded substitute fields**
  (`formation: 'Barail'`, `depthM: 3480`, `severity: 'HIGH'`) regardless of the citation's
  real content — a shortcut bug worth fixing once real citations exist, since real citations
  will carry their own formation/depth/severity metadata that should be threaded through
  instead of discarded.
- `isInsufficientInfo: true` responses render a distinct "insufficient evidence" UI state —
  this maps directly to Phase 8's `INSUFFICIENT EVIDENCE` requirement; the contract is
  already compatible, just needs real grounding instead of a keyword blocklist.

---

## 8. Risk prediction assumptions

- Two inputs only: `depthM`, `mudWeightSG` (formation is sent but currently ignored
  server-side — the frontend hardcodes `'Barail Coal-Shale'` as the formation string it
  sends, regardless of actual selected well/depth).
- Frontend expects **four** named risk categories every time: Mud Loss/Lost Circulation, Gas
  Kick/Mud Influx, Differential Stuck Pipe, Torque Spike/Stick-Slip — `HazardScoreModal.tsx`
  and `RiskPredictionView.tsx` are built around exactly these four cards. A real risk engine
  should keep these four as the baseline set (extending with more types is fine as
  *additional* array entries, but these four are load-bearing for the UI's layout).
- `HazardScoreModal.tsx` has full **client-side fallback formulas** that reproduce the
  4-factor weighted formula shown in `calculationModel` if the backend omits that nested
  object — meaning a minimally-compliant backend can return just `compositeRiskScore` +
  `predictedRisks[]` and the UI still renders correctly, but the "mathematical breakdown"
  section will silently substitute client math instead of showing what the backend actually
  computed. Recommend always populating `calculationModel` for demo fidelity/explainability
  (brief priority #6).

---

## 9. CRITICAL FINDING — real source data vs. frontend data requirements

This is the single most consequential fact for every later phase, so it's called out here
rather than buried in `docs/DATA_SOURCES.md` (Phase 18) alone.

**`data/raw/` contains three real, non-fabricated sources — and none of them contain
individual well records:**

1. **`data/raw/oil_india/*.pdf`** (5 files, 2.6–84 MB): filenames reference real Assam OIL
   India facility names — `1_OCS_Bhogpara`, `2_Doomdoma_Pengry`,
   `3_GCS_hebeda_FGGS_Chabua_GMS_Tengakhat_GCS`, `4_Ningru`, `11_Moran_1` (OCS = Oil
   Collection Station, GCS = Group Collection Station, FGGS = Flare Gas Gathering Station,
   GMS = Group Metering Station). These read as **facility-level public documents**
   (plausibly environmental/consent-type filings) — not well-level WCR/DDR drilling reports.
   Content has not yet been extracted (Phase 4); PDF text extraction tooling isn't installed
   yet (`pdftoppm`/poppler missing locally). **Do not assume these contain per-well
   coordinates, drilling depths, formation tops, or incident logs until Phase 4 extraction
   confirms what's actually inside them.**
2. **`data/raw/government/PNG_Statistics_2020-21_Table2.3_0.csv`** (23 lines): a **national
   aggregate** table of flowing-oil-well counts by operator (ONGC/OIL/PSC-RSC-CBM) and state
   (Gujarat, Rajasthan, Assam & Arunachal Pradesh, Tripura, etc.). Useful for a
   state/operator-level analytics widget at best — contains zero individual well identities,
   coordinates, or depths.
3. **`data/raw/geospatial/assam.pbf`** (59 MB): an OpenStreetMap extract for Assam — roads,
   settlements, admin boundaries, general basemap geography. **Contains no oil-well point
   data.** It's the base map layer, not a well database.

**Conclusion:** the `Well`, `HistoricalIncident`, `FormationLayer`, `AlertItem`, and
`TelemetryReading` records the frontend requires (coordinates, depths, formations,
incident narratives, WCR/DDR page citations) **cannot be sourced from the real data
provided.** They exist today purely as AI-Studio-fabricated fixtures in `wellsData.ts` /
`historicalRiskTrends.ts`.

Per the brief's own rule ("If you encounter ambiguity in the source data: DO NOT INVENT
THE ANSWER. Record the ambiguity and continue with a safe schema") and its Phase 3 policy
on synthetic data, this was raised with the team and resolved as follows (confirmed
2026-09-19):

- Seed MongoDB's `wells`, `formations`, `drilling_events`/incidents, and `alerts`
  collections from the **existing frontend fixture values verbatim** (so the map/UI keeps
  looking exactly as it does today — nothing is redesigned), but every such document is
  tagged `"source": "SIMULATED_DEMO_DATA"` / `"source_type": "synthetic_demo"` in the DB —
  never presented as genuine OIL India records.
- The **RAG pipeline's document corpus and citations are grounded only in the 5 real PDFs +
  1 CSV** in `data/raw/`. If a user query can't be answered from that real corpus, the
  system returns `INSUFFICIENT EVIDENCE` rather than falling back to the synthetic incident
  text — even though the synthetic incidents remain visible elsewhere in the UI (doc
  library, historical events tab) as clearly-labeled demo content.
- This will be spelled out precisely in `docs/DATA_SOURCES.md` (Phase 18) once Phase 4
  ingestion confirms what's actually extractable from the 5 PDFs.

---

## 10. Components that must eventually receive backend data

| Component | Tab | Data needed |
|---|---|---|
| `RadarProximityMap.tsx`, `InteractiveLeafletMap.tsx` | operations, map | `GET /api/wells`, `GET /api/wells/nearby` |
| `CrossSection3D.tsx` | operations | `GET /api/formations` (currently fully static SVG — `currentDepthM` prop unused) |
| `CorrelationCenterPanel.tsx` | operations | `GET /api/alerts`, well-to-report linkage |
| `ReportBrowserTable.tsx`, `DocLibraryView.tsx`, `AddNewDocModal.tsx` | operations, doc-library | `GET/POST /api/documents`, `POST /api/documents/upload` |
| `AiAssistantView.tsx` | ai-assistant | `POST /api/rag/chat` (already wired, needs real grounding) |
| `RiskPredictionView.tsx`, `HazardScoreModal.tsx` | risk-prediction | `POST /api/risk/predict` (already wired, needs real/labeled engine) |
| `HistoricalEventsView.tsx`, `DocumentViewerModal.tsx` | historical-events | `GET /api/events`, `GET /api/documents/{id}` |
| `LiveTelemetryView.tsx` | telemetry | `GET /api/telemetry/current` (already wired, needs `is_simulation` flag + real-data-ready mode) |
| `StratigraphicAnalyticsView.tsx` | analytics | `GET /api/analytics/formations`, `GET /api/analytics/correlation` |
| `HistoricalRiskCorrelationChart.tsx` | risk-prediction | `GET /api/risk/history` |
| `FieldDemosView.tsx` | field-drills | can stay static (`OPERATIONAL_SCENARIOS` are demo-script triggers, not data records) |
| `AuthModal.tsx`, `HeaderBar.tsx`, `LeftSidebarIndex.tsx` | global | `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| `SystemDocsView.tsx` | docs | stays static (it's documentation copy) or optionally regenerated from real backend config |

---

## Next step

Phase 1: `docs/BACKEND_API_CONTRACT.md`, built directly from the shapes captured in §1–§2
above (the frontend's existing four endpoints are the non-negotiable core of that contract;
new endpoints are additive).
