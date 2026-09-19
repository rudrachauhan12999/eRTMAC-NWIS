import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Layers, Info, Compass, FileText, ShieldAlert, CheckCircle2 } from 'lucide-react';
import {
  fetchAnalyticsOverview,
  fetchFormationAnalytics,
  AnalyticsApiError,
  AnalyticsOverview,
  WellComparisonEntry,
} from '../services/analyticsApi.ts';

interface StratigraphicAnalyticsViewProps {
  // Optional well context (Well Intelligence integration, same pattern
  // used elsewhere) — when set, analytics are scoped to that well.
  wellId?: string;
  wellName?: string;
}

export const StratigraphicAnalyticsView: React.FC<StratigraphicAnalyticsViewProps> = ({ wellId, wellName }) => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [comparedWells, setComparedWells] = useState<WellComparisonEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    Promise.all([fetchAnalyticsOverview(wellId), fetchFormationAnalytics(wellId)])
      .then(([overviewData, formationData]) => {
        setOverview(overviewData);
        setComparedWells(formationData.wellComparison);
      })
      .catch((err) => setLoadError(err instanceof AnalyticsApiError ? err.message : 'Could not reach the backend to load analytics.'))
      .finally(() => setIsLoading(false));
  }, [wellId]);

  return (
    <div className="flex-1 p-4 max-w-7xl mx-auto w-full select-none flex flex-col gap-4">
      {/* Top Banner */}
      <div className="bg-[#463d35] text-white p-4 rounded-lg border-2 border-[#352d26] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold font-['Chakra_Petch',sans-serif] tracking-wide">
              Cross-Well Subsurface Stratigraphic Correlation
            </h2>
            <span className="bg-emerald-600 text-white text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold">
              Structural Geological Dip
            </span>
          </div>
          <p className="text-xs text-stone-300 mt-1">
            Correlates marker horizons across fault blocks to anticipate formation tops and loss intervals
            {wellName ? ` for ${wellName}` : ''}.
          </p>
        </div>

        <div className="text-xs font-mono text-amber-300 bg-[#2b241d] px-3 py-1.5 rounded border border-[#524436]">
          Dip: 4.2° SSE toward Naga Thrust Belt
        </div>
      </div>

      {/* Backend Load State */}
      {isLoading && (
        <div className="p-3 bg-[#ebdcc8] border border-[#c4b5a2] text-[#5c5247] rounded-lg text-xs font-mono text-center">
          Loading analytics from backend…
        </div>
      )}
      {!isLoading && loadError && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-lg text-xs font-mono text-center">
          {loadError}
        </div>
      )}

      {/* Available Demonstration/Indexed Data Summary Strip */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-[#c4b5a2] bg-[#f8f3eb] shadow-xs">
            <div className="w-8 h-8 rounded-md bg-[#e2d5c3] flex items-center justify-center text-[#524436] shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-[#786b5e] uppercase">Wells (demo fixture)</div>
              <div className="text-lg font-bold text-[#1a1613] font-['Chakra_Petch',sans-serif] leading-tight">{overview.wells.total}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-[#c4b5a2] bg-[#f8f3eb] shadow-xs">
            <div className="w-8 h-8 rounded-md bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-[#786b5e] uppercase">Available Demo Events</div>
              <div className="text-lg font-bold text-[#1a1613] font-['Chakra_Petch',sans-serif] leading-tight">{overview.events.total}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-[#c4b5a2] bg-[#f8f3eb] shadow-xs">
            <div className="w-8 h-8 rounded-md bg-red-100 flex items-center justify-center text-red-800 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-[#786b5e] uppercase">Alerts (active / resolved)</div>
              <div className="text-lg font-bold text-[#1a1613] font-['Chakra_Petch',sans-serif] leading-tight">
                {overview.alerts.byStatus.active || 0} / {overview.alerts.byStatus.resolved || 0}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-[#c4b5a2] bg-[#f8f3eb] shadow-xs">
            <div className="w-8 h-8 rounded-md bg-[#dce6f2] flex items-center justify-center text-[#1e40af] shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-[#786b5e] uppercase">Indexed Documents / Chunks</div>
              <div className="text-lg font-bold text-[#1a1613] font-['Chakra_Petch',sans-serif] leading-tight">
                {overview.documents.total} / {overview.documents.totalChunksIndexed}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Type & Document Provenance Breakdown */}
      {overview && (overview.events.total > 0 || overview.documents.total > 0) && (
        <div className="bg-[#fcf8f2] border-2 border-[#5c4f42] rounded-lg p-4 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(overview.events.byType).length > 0 && (
            <div>
              <div className="text-xs font-bold text-[#3d3227] font-['Chakra_Petch',sans-serif] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                <span>Event Types (Available Demonstration Records)</span>
              </div>
              <div className="space-y-1.5">
                {Object.entries(overview.events.byType).map(([type, count]: [string, number]) => (
                  <div key={type} className="flex items-center gap-2 text-xs font-mono">
                    <span className="w-32 truncate text-[#4a3f33]">{type}</span>
                    <div className="flex-1 h-2 bg-black/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded-full"
                        style={{ width: `${(count / overview.events.total) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right font-bold text-[#1c1815]">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(overview.documents.bySourceType).length > 0 && (
            <div>
              <div className="text-xs font-bold text-[#3d3227] font-['Chakra_Petch',sans-serif] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-700" />
                <span>Document Provenance</span>
              </div>
              <div className="space-y-1.5">
                {Object.entries(overview.documents.bySourceType).map(([sourceType, count]) => (
                  <div key={sourceType} className="flex items-center gap-2 text-xs font-mono">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        sourceType === 'synthetic_demo' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                    <span className="flex-1 truncate text-[#4a3f33]">
                      {sourceType === 'public_document' ? 'Real Oil India Document' : sourceType === 'synthetic_demo' ? 'Synthetic Demo Data' : sourceType}
                    </span>
                    <span className="font-bold text-[#1c1815]">{count}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#786b5e] mt-2 italic">{overview.documents.note}</p>
            </div>
          )}
        </div>
      )}

      {/* Multi-Well Stratigraphic Comparison Bars */}
      <div className="bg-[#fcf8f2] border-2 border-[#5c4f42] rounded-lg p-5 shadow-sm">
        <div className="text-xs font-bold text-[#3d3227] font-['Chakra_Petch',sans-serif] uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>Well-to-Well Lithology Correlation Panel (Upper Assam Shelf)</span>
          <span className="text-xs font-mono text-red-700 font-bold">Red Band = Barail High Risk Interval</span>
        </div>

        {!isLoading && comparedWells.length === 0 && !loadError && (
          <div className="text-center text-xs font-mono text-[#786b5e] py-8">
            No wells available for comparison.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {comparedWells.map((well) => (
            <div key={well.wellId} className="flex flex-col items-center">
              <div className="text-xs font-bold font-['Chakra_Petch',sans-serif] text-[#1c1815] text-center mb-1 h-8 flex items-center justify-center gap-1">
                <span>{well.wellName}{well.distanceKm > 0 ? ` (${well.distanceKm} km)` : ' (Active)'}</span>
              </div>
              <div className="mb-1">
                <span
                  className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    well.sourceType === 'synthetic_demo'
                      ? 'bg-amber-200 text-amber-900 border border-amber-400'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                  }`}
                >
                  {well.sourceType === 'synthetic_demo' ? 'Synthetic Demo Data' : well.sourceType}
                </span>
              </div>

              {/* Stratigraphic Column Graphic */}
              <div className="w-full h-80 rounded border-2 border-[#463d35] bg-[#ebdcc8] flex flex-col overflow-hidden relative shadow-inner">
                {/* Dhekiajuli / Alluvium */}
                <div className="h-[20%] bg-[#d4a373] flex items-center justify-center text-[9px] font-mono text-[#2c241c] border-b border-[#463d35]/30">
                  Dhekiajuli
                </div>

                {/* Girujan Clay */}
                <div className="h-[25%] bg-[#9381ff]/40 flex items-center justify-center text-[9px] font-mono text-[#2c241c] border-b border-[#463d35]/30">
                  Girujan
                </div>

                {/* Tipam Sandstone */}
                <div className="h-[20%] bg-[#f4a261] flex items-center justify-center text-[9px] font-mono text-[#2c241c] border-b border-[#463d35]/30">
                  Tipam
                </div>

                {/* Barail Hazard Interval (Correlated Red Band) */}
                <div
                  className={`h-[25%] flex flex-col items-center justify-center text-[9px] font-mono font-bold border-y-2 border-black/40 shadow-sm ${
                    well.hasMudLossEvent ? 'bg-[#b91c1c] text-amber-200' : 'bg-[#c47a3f] text-amber-100'
                  }`}
                >
                  <span>Barail</span>
                  <span className="text-[8px] text-white/90">{well.hasMudLossEvent ? 'Mud Loss Logged' : 'No Mud Loss Logged'}</span>
                </div>

                {/* Deep Formations */}
                <div className="h-[10%] bg-[#457b9d] flex items-center justify-center text-[9px] font-mono text-white">
                  Kopili
                </div>

                {/* Depth Top Marker */}
                {well.formationDepthStartM != null && (
                  <div className="absolute top-[65%] right-1 text-[9px] font-mono bg-black text-amber-300 px-1 rounded font-bold">
                    {well.formationDepthStartM}m
                  </div>
                )}
              </div>

              <div className="mt-2 text-center text-[10px] font-mono text-[#5c4f42]">
                TD: <strong>{well.targetDepthM}m</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
