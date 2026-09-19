# Historical Events Integration Analysis

Phase 14 deliverable (Historical Events round). Inspection performed before any code changes,
per the round's instructions.

## 1. Existing event type/interface

`HistoricalIncident` in `src/data/wellsData.ts` (unchanged this round — still the canonical
frontend type, still exported for components that need it):

```ts
interface HistoricalIncident {
  id: string; wellId: string; wellName: string;
  incidentType: 'Mud Loss'|'Gas Kick'|'Stuck Pipe'|'Torque Spike'|'Casing Problem'|'Packoff'|'Fishing'|'NPT Event';
  depthM: number; formation: string; reservoir: string; date: string;
  severity: 'CRITICAL'|'HIGH'|'MEDIUM'|'LOW';
  summary: string; rootCause: string; recommendedMitigation: string; actionTaken: string;
  nptHours: number; costImpactLakhs: number; similarityScore: number;
  drillingParams: { mudWeightSG, ecdSG, rpm, torqueKNm, sppPsi, wobTons, flowRateLpm };
  sourceReport: { reportId, reportType, title, date, page, section, ocrConfidence, excerpt, tableData? };
}
```

This is the exact shape the backend's `GET /api/events` already returns (built in the Wells+Map
round's contract, wired for real in the Document Library round) — `source`/`sourceType` are the
only additive fields, already present on every backend record.

## 2. Existing fields — all present in backend records; nothing new needed here.

## 3. Existing mock data

`HISTORICAL_INCIDENTS` (12 records) in `wellsData.ts`. Already migrated into MongoDB's
`drilling_events` collection during the Document Library round (`app/db/seed.py`), tagged
`sourceType: "synthetic_demo"`. This round replaces the remaining **direct runtime imports**
of the array — the array itself stays in `wellsData.ts` (types + any future demo-seeding still
reference it; the brief says not to delete it while other things depend on its types).

## 4. Existing UI components using `HISTORICAL_INCIDENTS` directly (before this round)

| Component | Usage |
|---|---|
| `HistoricalEventsView.tsx` | Main event catalog tab — client-side filter by `incidentType` + free-text search over well/formation/rootCause |
| `ReportBrowserTable.tsx` | Operations Console's "Interactive Report Browser" — client-side filter by search/formation/depth-slider/incidentType |
| `App.tsx` | Two lookup call sites: `CorrelationCenterPanel`'s `onSelectAlert`/`onOpenReport` callbacks resolve an alert's `wellRef` or a `reportId` string back to a full incident to open in `DocumentViewerModal`; `RiskPredictionView`'s `onOpenReportModal` does the same by `wellName`/`reportId` string |
| `IntelligenceDashboardView.tsx` | Imports `HISTORICAL_INCIDENTS` but **never actually uses it** (dead import, pre-existing) — left untouched, out of scope |
| `DocLibraryView.tsx` | Already migrated off this import in the previous (Document Library) round |

Not in scope this round (per explicit instruction) even though they touch event-shaped data:
`AiAssistantView.tsx` (RAG citations — already wired), `DocumentViewerModal.tsx` (generic
viewer, consumes whatever `HistoricalIncident` it's given — needs no change either way),
`CorrelationCenterPanel.tsx` (alerts — untouched, still reads `PREDICTIVE_ALERTS`).

## 5. Existing filtering behavior

Both `HistoricalEventsView` and `ReportBrowserTable` filter **entirely client-side** over
whatever array they're given — no filter params are sent to any API today (there was no API
call at all). Dataset size is small (12 events), so per the round's own instruction
("If filtering is currently client-side and the dataset is small, client-side filtering is
acceptable"), client-side filtering is kept — only the *data source* changes, not the filter
mechanism.

## 6. Existing API expectations — none (zero network calls from either component before this round).

## 7. Backend event schema

Already built (Wells+Map / Document Library rounds), unchanged this round:

- `GET /api/events?wellId=&incidentType=&severity=&formation=` → `{ events: HistoricalIncident[], total }`
- `GET /api/wells/{well_id}/events` → `{ events: HistoricalIncident[], total }`

No new endpoints were added — both match the round's "Do NOT invent additional endpoints
unless necessary" instruction exactly. No `depth`/`sourceType` query params exist server-side;
both stay client-side filters (see §5), and `sourceType` has no filter UI at all (only a
display badge — see §9).

## 8. Fields actually supported by real data / 9. Fields unavailable

**Every field in `HistoricalIncident` is populated for all 12 currently-seeded events** — there
is no partial/null-field scenario today, because all 12 come from the same source (the
frontend's own pre-existing fixture, migrated verbatim). Nothing was invented to fill gaps.

The unresolved gap is at the **corpus** level, not the field level: the 5 real OIL India PDFs
are facility/environmental-compliance documents (confirmed by actually indexing and querying
them in the RAG round), not well-level WCR/DDR incident reports. **Zero of the 12 events are
`sourceType: "public_document"`** — none of them were extracted from real OIL India well
records, because no such per-well incident data exists in the provided real sources. This is
stated plainly here rather than glossed over, per the round's "IMPORTANT REAL-DATA LIMITATION"
section. If a future data drop includes real WCR/DDR documents, the ingestion pipeline
(`app/ingestion/`) and event schema already support adding `public_document`-tagged events
without any frontend change — the UI already renders whatever `sourceType` it's given.

## Implementation summary (this round)

- `HistoricalEventsView.tsx`, `ReportBrowserTable.tsx`: now fetch from `GET /api/events`
  (via the existing `src/services/eventsApi.ts` from the Document Library round — reused,
  not duplicated) instead of importing `HISTORICAL_INCIDENTS`. Loading/error states added
  (additive only). A small `sourceType` badge was added to each card/row, matching the
  pattern already established on RAG citations in the previous round.
- `App.tsx`: the two `HISTORICAL_INCIDENTS.find(...)` lookups (for `CorrelationCenterPanel`
  and `RiskPredictionView`'s report-opening callbacks) now search the fetched backend event
  list instead of the static import. Neither `CorrelationCenterPanel.tsx` nor
  `RiskPredictionView.tsx` were touched — only what App.tsx searches through changed.
- **Well Intelligence integration**: no existing component implemented a "select a well → see
  its events" flow before this round (`ReportBrowserTable` received no well-context prop at
  all). Added one small additive optional prop (`activeWellId`/`activeWellName`) so that when
  a well is selected on the map (App.tsx's pre-existing `selectedWell` state from the
  Wells+Map round), `ReportBrowserTable` calls `GET /api/wells/{well_id}/events` and shows a
  small dismissible "Filtered to: <well>" chip; clearing it returns to the full `GET
  /api/events` list. This is additive wiring, not a redesign — the table/filter layout is
  unchanged, and with no well selected, behavior is pixel-identical to before.
