import React, { useEffect, useState } from 'react';
import { Layers, AlertTriangle, ShieldAlert, Clock, IndianRupee, FileText, Search, ChevronRight } from 'lucide-react';
import { HistoricalIncident } from '../data/wellsData.ts';
import { fetchEvents, EventsApiError } from '../services/eventsApi.ts';

interface HistoricalEventsViewProps {
  onOpenReportModal: (incident: HistoricalIncident) => void;
  onAskCopilot?: (query: string) => void;
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  public_document: 'Real Oil India Document',
  government_data: 'Government Dataset',
  geospatial_data: 'Geospatial Dataset',
  derived: 'Derived Record',
  synthetic_demo: 'Synthetic Demo Data',
};

export const HistoricalEventsView: React.FC<HistoricalEventsViewProps> = ({
  onOpenReportModal,
  onAskCopilot,
}) => {
  const [filterType, setFilterType] = useState<string>('All');
  const [search, setSearch] = useState<string>('');

  // Events now come from the backend (GET /api/events) instead of the
  // wellsData.ts fixture — see docs/EVENT_INTEGRATION_ANALYSIS.md.
  const [incidents, setIncidents] = useState<HistoricalIncident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    fetchEvents()
      .then((data) => setIncidents(data))
      .catch((err) => setLoadError(err instanceof EventsApiError ? err.message : 'Could not reach the backend to load historical events.'))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = incidents.filter((inc) => {
    const matchesType = filterType === 'All' || inc.incidentType === filterType;
    const matchesSearch =
      !search ||
      inc.wellName.toLowerCase().includes(search.toLowerCase()) ||
      inc.formation.toLowerCase().includes(search.toLowerCase()) ||
      inc.rootCause.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalNpt = filtered.reduce((acc, curr) => acc + (curr.nptHours || 0), 0);
  const totalCost = filtered.reduce((acc, curr) => acc + (curr.costImpactLakhs || 0), 0);

  return (
    <div className="flex-1 p-4 max-w-7xl mx-auto w-full select-none flex flex-col gap-4">
      {/* Top Banner */}
      <div className="bg-[#463d35] text-white p-4 rounded-lg border-2 border-[#352d26] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold font-['Chakra_Petch',sans-serif] tracking-wide">
              Historical Drilling Incident Catalog (Assam-Arakan Basin)
            </h2>
            <span className="bg-amber-600 text-black text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold">
              300+ Digitized Events
            </span>
          </div>
          <p className="text-xs text-stone-300 mt-1">
            Historical loss of circulation, differential sticking, gas influxes, and wellbore stability events.
          </p>
        </div>

        {/* NPT and Financial Impact Summary */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-[#2e261f] px-3 py-1.5 rounded border border-[#524436]">
            <span className="text-[#a89985]">Cumulative NPT: </span>
            <strong className="text-red-400 font-bold">{totalNpt} Hours</strong>
          </div>
          <div className="bg-[#2e261f] px-3 py-1.5 rounded border border-[#524436]">
            <span className="text-[#a89985]">Economic Loss: </span>
            <strong className="text-amber-400 font-bold">₹{totalCost.toFixed(1)} Lakhs</strong>
          </div>
        </div>
      </div>

      {/* Backend Load State */}
      {isLoading && (
        <div className="p-3 bg-[#ebdcc8] border border-[#c4b5a2] text-[#5c5247] rounded-lg text-xs font-mono text-center">
          Loading historical events from backend…
        </div>
      )}
      {!isLoading && loadError && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-lg text-xs font-mono text-center">
          {loadError}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#f5ede1] p-3 rounded-lg border-2 border-[#8f7d6a] flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          {['All', 'Mud Loss', 'Gas Kick', 'Stuck Pipe', 'Torque Spike', 'Casing Problem'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`text-xs px-3 py-1 rounded font-mono font-medium transition-colors ${
                filterType === type
                  ? 'bg-[#463d35] text-white shadow-xs'
                  : 'bg-[#ebdcc8] text-[#332b23] hover:bg-[#decaba]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search well or root cause..."
            className="w-full bg-[#fdfaf5] border border-[#a89985] rounded px-3 py-1 text-xs text-[#1c1815] placeholder-[#7d6f5f] focus:outline-none focus:ring-1 focus:ring-amber-600 font-sans"
          />
          <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7d6f5f]" />
        </div>
      </div>

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((inc) => (
          <div
            key={inc.id}
            className="bg-[#fcf8f2] rounded-lg border-2 border-[#5c4f42] p-4 flex flex-col justify-between shadow-sm hover:border-amber-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                <span className="font-mono font-bold text-sm text-[#1c1815] flex items-center gap-1.5">
                  {inc.wellName}
                  {inc.sourceType && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      inc.sourceType === 'synthetic_demo'
                        ? 'bg-amber-200 text-amber-900 border border-amber-400'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                    }`}>
                      {SOURCE_TYPE_LABELS[inc.sourceType] || inc.sourceType}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  inc.severity === 'CRITICAL'
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {inc.severity} • {inc.incidentType}
                </span>
              </div>

              <div className="text-xs text-[#695c4d] font-mono mb-2">
                Depth: <strong className="text-red-700">{inc.depthM} m</strong> • Formation: <strong>{inc.formation}</strong>
              </div>

              <p className="text-xs text-[#2b241d] leading-relaxed mb-3">
                {inc.summary}
              </p>

              <div className="bg-[#ebdcc8] p-2.5 rounded border border-[#c4b5a2] text-xs space-y-1 font-mono text-[#332b23]">
                <div>
                  <strong>Root Cause:</strong> {inc.rootCause}
                </div>
                <div className="text-emerald-900">
                  <strong>Action Taken:</strong> {inc.actionTaken}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-[#c4b5a2] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3 text-[#554a3e]">
                <span>NPT: <strong>{inc.nptHours}h</strong></span>
                <span>Cost: <strong>₹{inc.costImpactLakhs}L</strong></span>
              </div>

              <button
                onClick={() => onOpenReportModal(inc)}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#2c241d] hover:bg-[#1a1612] text-amber-300 font-bold transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View WCR Report</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
