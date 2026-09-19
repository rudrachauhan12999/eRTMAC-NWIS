/**
 * One-off export: dumps the frontend's hardcoded demo fixtures
 * (src/data/wellsData.ts, src/data/historicalRiskTrends.ts) to JSON so the
 * Python backend's seed script (backend/app/db/seed.py, Phase 5) can load
 * them into MongoDB without hand-retyping hundreds of fields.
 *
 * This does NOT modify the frontend — it only reads its existing exports.
 * Every record produced here is tagged sourceType: "synthetic_demo" by the
 * Python seed script that consumes this file (see docs/DATA_SOURCES.md) —
 * never presented as real Oil India data.
 *
 * Run with: npx tsx scripts/export_frontend_fixtures.ts
 */
import { writeFileSync } from 'fs';
import {
  NEARBY_WELLS,
  STRATIGRAPHIC_FORMATIONS,
  HISTORICAL_INCIDENTS,
  PREDICTIVE_ALERTS,
} from '../src/data/wellsData.ts';
import { HISTORICAL_RISK_30_DAYS, CORRELATION_METRICS } from '../src/data/historicalRiskTrends.ts';

const output = {
  wells: NEARBY_WELLS,
  formations: STRATIGRAPHIC_FORMATIONS,
  events: HISTORICAL_INCIDENTS,
  alerts: PREDICTIVE_ALERTS,
  historicalRisk30Days: HISTORICAL_RISK_30_DAYS,
  correlationMetrics: CORRELATION_METRICS,
};

writeFileSync(
  new URL('../backend/app/db/seed_data/frontend_fixtures.json', import.meta.url),
  JSON.stringify(output, null, 2),
);

console.log(
  `Exported ${output.wells.length} wells, ${output.formations.length} formations, ` +
  `${output.events.length} events, ${output.alerts.length} alerts, ` +
  `${output.historicalRisk30Days.length} risk-trend days to backend/app/db/seed_data/frontend_fixtures.json`
);
