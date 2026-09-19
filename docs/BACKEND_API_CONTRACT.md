# Backend API Contract — eRTMAC-NWIS

Phase 1 deliverable. Defines every endpoint the FastAPI backend must expose. Built directly
from `docs/FRONTEND_INTEGRATION_ANALYSIS.md` (Phase 0) — the four endpoints already called
by the frontend (`/api/health`, `/api/telemetry/current`, `/api/rag/chat`,
`/api/risk/predict`) are **non-negotiable**: their request/response shapes below match
exactly what `server.ts` and the React components already send/expect, so no frontend
changes are needed for those four. Every other endpoint below is new plumbing the frontend
does not yet call — wiring it in is Phase 14, done component-by-component, additively.

Base URL: `/api`. All responses `application/json`. All list endpoints support `?limit=` and
`?offset=` (default `limit=50`, max `200`) unless noted. Timestamps are ISO-8601 UTC strings.

Every well/formation/incident/alert/telemetry document returned by any endpoint carries a
`source` and `source_type` field (see `docs/DATA_SOURCES.md`). `source_type` is one of:
`"public_document"`, `"government_data"`, `"geospatial_data"`, `"derived"`,
`"synthetic_demo"`. The frontend does not read these fields today — adding them is additive
and safe (see Phase 0 §6).

---

## Auth

`POST /api/auth/login`
```json
// Request
{ "email": "string", "password": "string" }
// Response 200
{
  "token": "jwt-string",
  "user": { "id": "...", "name": "...", "email": "...", "role": "...", "department": "...",
            "badgeNumber": "...", "clearanceLevel": "...", "roleGroup": "DRILLING_ENGINEER" }
}
// Response 401: { "error": "invalid_credentials" }
```
`user` matches the frontend's `UserProfile` interface field-for-field (Phase 0 §1) so
`AuthModal.tsx` needs no interface changes — only its submit handler is rewired (Phase 14) to
call this endpoint instead of fabricating a `UserProfile` locally. `roleGroup` is a **new**
field, additive: one of `DRILLING_ENGINEER | GEOLOGIST | SUPERVISOR | ADMIN`, derived
server-side from the account's actual role, kept separate from the free-text `role` display
label the UI already renders (Phase 0 §5 — `role` must keep its current display strings).

`POST /api/auth/register` — **added during Phase 14** (not in the original brief's minimum
list): `AuthModal.tsx`'s "Create Operator Account" tab is a fully built, already-wired-up
registration form with no backend of its own to call — omitting a register endpoint would
mean deleting working UI, which the lock forbids. Request:
`{ "name", "email", "password", "role", "department" }`; response is the same shape as
`/api/auth/login` (`{ token, user }`) so the frontend can log the new user straight in.
`roleGroup` is derived from the free-text `role` via the same
Director/Lead-gets-higher-clearance heuristic the frontend used to apply client-side —
self-registration never grants `ADMIN`.

`GET /api/auth/me` — Bearer token required. Returns the same `user` object as above, or 401.

`POST /api/auth/logout` — Bearer token required. Invalidates the token (server-side
denylist or short-lived JWT + refresh, implementation detail of Phase 13). Returns `204`.

Roles: `ADMIN` and `SUPERVISOR` may call document upload/index and delete endpoints;
`DRILLING_ENGINEER`/`GEOLOGIST` are read + chat/risk/telemetry only. Enforced via FastAPI
dependency, not by the frontend (which has no role gating UI today — that's fine, it's not
required to add any).

---

## Wells

`GET /api/wells` — list all wells. Query: `?status=`, `?field=`, `?formation=`.
```json
{ "wells": [ /* Well[], see Phase 0 §1 shape, + source/source_type */ ], "total": 18 }
```

`GET /api/wells/{well_id}` — single well by `id` (matches `Well.id`, e.g. `well-calire-02`).
Returns `Well` or `404`.

`GET /api/wells/nearby?latitude=&longitude=&radius_km=` — returns wells within radius,
computed via real haversine distance (mirrors the client-side Haversine already implemented
ad hoc in `InteractiveLeafletMap.tsx` — this endpoint replaces that duplicate logic once
wired in Phase 14). Adds computed `distanceKm`, `direction`, `angleDeg` per result (same
fields `Well` already carries, now server-computed instead of pre-baked).
```json
{ "wells": [ /* Well[] with recomputed distanceKm/direction/angleDeg */ ], "center": {"lat":..,"lng":..}, "radiusKm": 3 }
```

---

## Formations

`GET /api/formations` — all stratigraphic layers, matches `FormationLayer[]` (Phase 0 §1).

`GET /api/wells/{well_id}/formations` — formation tops actually penetrated by this well
(subset/reordering of the above, well-specific). `404` if well not found.

---

## Events (historical incidents)

`GET /api/events` — matches `HistoricalIncident[]` (Phase 0 §1). Query: `?wellId=`,
`?incidentType=`, `?severity=`, `?formation=`.

`GET /api/wells/{well_id}/events` — incidents for one well.

These power `HistoricalEventsView.tsx`, `ReportBrowserTable.tsx`, `DocLibraryView.tsx`. Note
Phase 0 §4: `DocLibraryView.tsx` currently does its own client-side add/delete via
`localStorage`. Once wired to real endpoints (Phase 14), those actions move to:

`POST /api/documents/upload` / `DELETE /api/documents/{document_id}` — see Documents below.
The "document" a user adds via `AddNewDocModal.tsx` becomes a real `documents` +
`document_chunks` record, not a fabricated `HistoricalIncident`. This is a deliberate
schema shift explained in `docs/DATA_SOURCES.md`.

---

## Documents

`GET /api/documents` — list ingested source documents (the 5 OIL India PDFs + government
CSV, plus any user-uploaded docs). Query: `?source_type=`, `?document_name=`.
```json
{ "documents": [
  { "document_id": "...", "document_name": "1_OCS_Bhogpara_0.pdf", "source": "Oil India Limited",
    "source_type": "public_document", "page_count": 0, "uploaded_at": "...", "indexed": true }
] }
```

`GET /api/documents/{document_id}` — full metadata + (optionally) a signed/proxied URL or
page range for the Document Viewer Modal (`DocumentViewerModal.tsx`, Phase 15) to render the
specific cited page.

`POST /api/documents/upload` — `multipart/form-data`, `ADMIN`/`SUPERVISOR` only. Stores the
raw file, creates a `documents` record with `source_type: "derived"` (or
`"synthetic_demo"` if explicitly flagged as a demo doc), returns the new `document_id`.
Does **not** auto-index — matches the brief's split between upload and index.

`POST /api/documents/index` — `{ "document_id": "..." }`, `ADMIN`/`SUPERVISOR` only. Runs
the Phase 4 ingestion pipeline (extract → chunk → embed → store in Chroma + Mongo) on an
already-uploaded document. Returns `202` with a job status, or synchronous `200` with chunk
count for small files.

---

## Search / RAG

`POST /api/search` — raw hybrid retrieval without LLM synthesis (used internally by
`/api/rag/chat`, exposed standalone for debugging/evaluation).
```json
// Request
{ "query": "string", "filters": { "wellId?": "...", "formation?": "...", "documentId?": "..." }, "topK": 10 }
// Response
{ "results": [ { "document_id", "document_name", "page", "section", "excerpt", "score",
                 "well_id?", "formation?", "source", "source_type" } ] }
```

`POST /api/rag/chat` — **exact existing contract**, unchanged (Phase 0 §2, §7):
```json
// Request
{ "message": "string", "conversationHistory": "ChatTurn[] (optional)", "activeDepth": 3500, "activeFormation": "string" }
// Response = RagResponse (Phase 0 §1):
{
  "summary": "string", "nearbyWellsAnalysis": "string", "rootCause": "string",
  "recommendedMitigation": "string", "confidenceScore": 0, "riskLevel": "CRITICAL|HIGH|MEDIUM|LOW",
  "isInsufficientInfo": false, "reasoningSteps": ["..."],
  "citations": [ { "reportId": "...", "reportType?": "...", "wellName": "...", "title?": "...",
                    "page": 0, "section": "...", "ocrConfidence?": 0, "excerpt": "..." } ]
}
```
Behavior change from today's mock (Phase 7/8): retrieval is real hybrid search (vector +
BM25 + rerank) over `document_chunks`. Per the team's decision, the retrieval corpus is
**dual**: the 5 real OIL India PDFs + government CSV (`source_type: "public_document"` /
`"government_data"`) **and** the existing frontend demo wells/incidents, ingested verbatim
into `document_chunks` with `source_type: "synthetic_demo"`. Every citation always carries
its `source_type` so the caller can distinguish real evidence from labeled demo evidence —
nothing is ever presented as real OIL data that isn't. `isInsufficientInfo: true` is set when
reranked top evidence (across *both* corpora) falls below a confidence threshold — not a
keyword blocklist. `citations[].reportId` maps to a real `document_id`/page so
`DocumentViewerModal.tsx` can eventually open the actual source (Phase 15), same shape as
today so no frontend interface change is required. `related_wells`/`related_events` (brief's
Phase 8 example) are added as **optional** additive fields — the current `RagResponse`
interface doesn't declare them, so the frontend simply ignores them until Phase 14 adds
rendering for them; do not require them.

**LLM provider**: synthesis uses **Groq** (OpenAI-compatible API, `GROQ_API_KEY`), not
Gemini — despite `metadata.json`/`systemDocumentation.ts` referencing Gemini, that was the
original AI-Studio scaffold's choice, not a constraint. The provider is abstracted behind a
`services/llm_provider.py`-style interface so swapping providers later touches no retrieval
code. If `GROQ_API_KEY` is absent, the pipeline still does full real retrieval/rerank and
falls back to templated (non-LLM) answer synthesis from the top evidence — mirroring
`server.ts`'s existing optional-Gemini/deterministic-fallback pattern.

---

## Risk

`POST /api/risk/predict` — **exact existing contract**, unchanged (Phase 0 §2, §8):
```json
// Request
{ "depthM": 3500, "mudWeightSG": 1.24, "formation?": "string" }
// Response — same shape server.ts already returns (compositeRiskScore, predictedRisks[4],
// calculationModel{...}, geomechanicalMarginSG{...}) — see Phase 0 §1/§8 for full shape.
```
Behavior change (Phase 10): `formation` becomes load-bearing server-side (today it's sent
but ignored); the four `predictedRisks` entries (Mud Loss, Gas Kick, Stuck Pipe, Torque
Spike — this exact set is load-bearing for `HazardScoreModal.tsx`'s layout, Phase 0 §8) are
computed from a transparent rule/similarity engine over real+demo incident data instead of
the current hand-tuned constant formula, and `contributingWells` becomes real nearest-offset
well IDs instead of hardcoded literals. `calculationModel` is always populated (Phase 0 §8
notes the frontend silently falls back to client math if it's missing — don't let that
happen).

`GET /api/risk/history?wellId=` — powers `HistoricalRiskCorrelationChart.tsx`. Returns
`{ "days": HistoricalTrendDay[], "correlationMetrics": {...} }` matching
`historicalRiskTrends.ts`'s existing shape (Phase 0 §1) so the chart component needs no
changes when wired in Phase 14 — only its data source moves from a static import to a fetch.

---

## Telemetry

`GET /api/telemetry/current?wellId=` — **exact existing contract**, unchanged shape (Phase 0
§2/§6), plus additive fields:
```json
{
  "timestamp": "...", "depthM": 0, "ropMhr": 0, "wobTons": 0, "rpm": 0, "torqueKNm": 0,
  "sppPsi": 0, "mudFlowInLpm": 0, "mudFlowOutLpm": 0, "pitVolumeM3": 0, "gasUnits": 0,
  "mudWeightInSG": 0, "mudWeightOutSG": 0, "activeFormation": "string", "hazardStatus": "string",
  "isSimulation": true, "mode": "DEMO_SIMULATION"
}
```
`isSimulation`/`mode` are new, additive (Phase 11 requirement: simulated telemetry must be
explicitly labeled). `mode` is `"DEMO_SIMULATION"` or `"REAL_DATA"` — the latter is a stub
until/unless real eRTMAC telemetry feed access materializes; never fabricate that mode's data.

`GET /api/telemetry/history?wellId=&limit=` — array of recent readings (backs the `history`
state already declared but unused in `LiveTelemetryView.tsx`, Phase 0 §6 — enabling this
lets that dead feature become a real chart in Phase 14, optional).

---

## Alerts

`GET /api/alerts?wellId=&acknowledged=` — matches `AlertItem[]` (Phase 0 §1).

`POST /api/alerts/{alert_id}/acknowledge` — `{}` body, returns updated `AlertItem`. Replaces
`CorrelationCenterPanel.tsx`'s current client-only acknowledge toggle (Phase 0 §3) once wired.

Alerts are generated server-side per Phase 12's rule (depth approaching historical problem
depth + matching formation + similar historical event + telemetry anomaly), not user-created.

---

## Analytics

`GET /api/analytics/correlation` — cross-well correlation summary backing
`CorrelationCenterPanel.tsx` and the correlation metrics shown in the risk chart.

`GET /api/analytics/formations` — per-formation aggregate stats (incident counts, average
NPT, hazard severity distribution) backing `StratigraphicAnalyticsView.tsx`. Response fields
are **new** (that component's `comparedWells` array today has its own ad hoc shape, Phase 0
§3) — Phase 14 will decide whether to reshape the component's expectations minimally or map
server fields to the existing shape; default to the smallest frontend diff.

---

## Health

`GET /api/health` — **exact existing contract**, unchanged (Phase 0 §2):
```json
{ "status": "ok", "system": "eRTMAC-NWIS", "basin": "Assam-Arakan (Upper Assam Shelf)",
  "operator": "Oil India Limited", "llmEnabled": true, "llmProvider": "groq",
  "indexedWells": 18, "indexedReports": 0 }
```
`llmEnabled`/`llmProvider` replace the mock's `geminiEnabled` (renamed since the provider is
Groq, not Gemini — the frontend never reads this field today, so renaming it is safe).
`indexedReports` becomes the real count of ingested/indexed documents (today hardcoded
`1250`) once Phase 4/6 are live — never left as a fabricated constant.

---

## Error shape (all endpoints)

```json
{ "error": "machine_readable_code", "message": "human readable", "detail": {} }
```
`404` for missing resources, `401`/`403` for auth, `422` for validation (FastAPI/Pydantic
default), `500` only for genuine server faults — never used to mask "insufficient evidence,"
which is always a `200` with `isInsufficientInfo: true` (RAG) or an explicit empty result
array (search/wells/events), per the brief's anti-hallucination priority.

---

## Next step

Phase 2: scaffold `backend/` (FastAPI app skeleton, Pydantic schemas mirroring this contract,
MongoDB connection, empty routers per section above) as a sibling of `src/` at repo root.
