import React, { useState, useMemo, useEffect } from 'react';
import { Search, MoreHorizontal, Filter, FileText, ChevronDown, ExternalLink, X } from 'lucide-react';
import { HistoricalIncident } from '../data/wellsData.ts';
import { fetchEvents, fetchWellEvents, EventsApiError } from '../services/eventsApi.ts';

const SOURCE_TYPE_LABELS: Record<string, string> = {
  public_document: 'Real Oil India Document',
  government_data: 'Government Dataset',
  geospatial_data: 'Geospatial Dataset',
  derived: 'Derived Record',
  synthetic_demo: 'Synthetic Demo Data',
};

interface ReportBrowserTableProps {
  onSelectIncident: (incident: HistoricalIncident) => void;
  onOpenReportModal: (incident: HistoricalIncident) => void;
  // Optional well context (Well Intelligence integration): when set, the
  // table loads that well's events from GET /api/wells/{well_id}/events
  // instead of the full GET /api/events list. Omitting these props keeps
  // this component's behavior identical to before this round.
  activeWellId?: string;
  activeWellName?: string;
  onClearWellFilter?: () => void;
}

export const ReportBrowserTable: React.FC<ReportBrowserTableProps> = ({
  onSelectIncident,
  onOpenReportModal,
  activeWellId,
  activeWellName,
  onClearWellFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFormation, setSelectedFormation] = useState<string>('All');
  const [depthRange, setDepthRange] = useState<number>(3500);
  const [incidentTypeFilter, setIncidentTypeFilter] = useState<string>('All');

  // Events now come from the backend instead of the wellsData.ts fixture —
  // see docs/EVENT_INTEGRATION_ANALYSIS.md.
  const [incidents, setIncidents] = useState<HistoricalIncident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    const request = activeWellId ? fetchWellEvents(activeWellId) : fetchEvents();
    request
      .then((data) => setIncidents(data))
      .catch((err) => setLoadError(err instanceof EventsApiError ? err.message : 'Could not reach the backend to load reports.'))
      .finally(() => setIsLoading(false));
  }, [activeWellId]);

  const formationsList = [
    'All',
    'Formation',
    'Barail Coal-Shale',
    'Tipam Sandstone',
    'Dhekiajuli',
    'Alluvium Gravels',
    'Girujan Clay',
    'Surma Group',
    'Kopili Shale',
  ];

  // Filter incidents based on search query, formation, and depth
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // Search term
      const matchesSearch =
        !searchQuery ||
        inc.wellName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.incidentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.formation.toLowerCase().includes(searchQuery.toLowerCase());

      // Formation filter
      const matchesFormation =
        selectedFormation === 'All' ||
        selectedFormation === 'Formation' ||
        inc.formation.toLowerCase().includes(selectedFormation.toLowerCase());

      // Depth filter (within reasonable range of slider)
      const matchesDepth = inc.depthM <= depthRange + 500;

      // Incident type filter
      const matchesType =
        incidentTypeFilter === 'All' || inc.incidentType === incidentTypeFilter;

      return matchesSearch && matchesFormation && matchesDepth && matchesType;
    });
  }, [incidents, searchQuery, selectedFormation, depthRange, incidentTypeFilter]);

  return (
    <div className="rounded-lg border-2 border-[#5c4f42] bg-[#f5ede1] shadow-md overflow-hidden flex flex-col h-full">
      {/* Dark Header Strip matching screenshot */}
      <div className="bg-[#463d35] text-white px-3.5 py-2 flex items-center justify-between border-b border-[#352d26]">
        <h2 className="text-sm font-bold tracking-wide font-['Chakra_Petch',sans-serif]">
          Interactive Report Browser
        </h2>
        <span className="text-[11px] font-mono text-amber-300">
          WCR / DDR OCR Archive
        </span>
      </div>

      {/* Main Content Area */}
      <div className="p-3 bg-[#f5ede1] flex-1 flex flex-col gap-2.5 overflow-hidden select-none">
        {/* Well Intelligence Filter Chip (only shown when a well is selected on the map) */}
        {activeWellId && (
          <div className="flex items-center gap-1.5 bg-[#463d35] text-amber-200 text-[11px] font-mono px-2.5 py-1 rounded w-fit">
            <span>Filtered to: <strong>{activeWellName || activeWellId}</strong></span>
            {onClearWellFilter && (
              <button type="button" onClick={onClearWellFilter} className="hover:text-white cursor-pointer" title="Clear well filter">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Backend Load State */}
        {isLoading && (
          <div className="p-2.5 bg-[#ebdcc8] border border-[#c4b5a2] text-[#5c5247] rounded text-[11px] font-mono text-center">
            Loading reports from backend…
          </div>
        )}
        {!isLoading && loadError && (
          <div className="p-2.5 bg-red-50 border border-red-300 text-red-800 rounded text-[11px] font-mono text-center">
            {loadError}
          </div>
        )}

        {/* Search Bar matching screenshot */}
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full bg-[#fdfbf7] border border-[#a89985] rounded-md px-3 py-1.5 pr-9 text-xs text-[#1c1815] placeholder-[#7d6f5f] focus:outline-none focus:ring-1 focus:ring-amber-600 focus:border-amber-600 font-sans shadow-inner"
          />
          <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6e5f4f] hover:text-[#1c1815]">
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Formation Dropdown and Depth Range Slider matching screenshot */}
        <div className="grid grid-cols-2 gap-3 items-center">
          {/* Formation Filter Dropdown */}
          <div>
            <label className="block text-xs font-bold text-[#2d251d] mb-1 font-['Chakra_Petch',sans-serif]">
              Formation:
            </label>
            <div className="relative">
              <select
                value={selectedFormation}
                onChange={(e) => setSelectedFormation(e.target.value)}
                className="w-full appearance-none bg-[#fdfbf7] border border-[#a89985] rounded-md px-2.5 py-1 text-xs text-[#1c1815] focus:outline-none focus:ring-1 focus:ring-amber-600 font-sans pr-7 shadow-xs cursor-pointer"
              >
                {formationsList.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#5c4f42]" />
            </div>
          </div>

          {/* Depth Range Slider matching screenshot: 1500 --------- 5500 */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#2d251d] mb-1 font-['Chakra_Petch',sans-serif]">
              <span>Depth Range:</span>
              <span className="font-mono text-[11px] font-semibold text-amber-900">
                &le; {depthRange}m
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#5c4f42]">1500</span>
              <input
                type="range"
                min={200}
                max={5500}
                step={100}
                value={depthRange}
                onChange={(e) => setDepthRange(Number(e.target.value))}
                className="w-full accent-[#8b5e34] h-1.5 bg-[#d4c4b0] rounded cursor-pointer"
              />
              <span className="text-[10px] font-mono text-[#5c4f42]">5500</span>
            </div>
          </div>
        </div>

        {/* Results Table Header matching screenshot */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-xs font-bold text-[#1c1815] font-['Chakra_Petch',sans-serif]">
            Results: <span className="text-[#6e5f4f] font-normal font-mono">({filteredIncidents.length} entries)</span>
          </div>

          {/* Quick Category Badges */}
          <div className="flex items-center gap-1">
            {['All', 'Mud Loss', 'Stuck Pipe', 'Gas Kick'].map((cat) => (
              <button
                key={cat}
                onClick={() => setIncidentTypeFilter(cat)}
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium transition-colors ${
                  incidentTypeFilter === cat
                    ? 'bg-[#463d35] text-white'
                    : 'bg-[#e2d5c3] text-[#3d3227] hover:bg-[#d0c0ac]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Table matching the exact screenshot structure and columns */}
        <div className="flex-1 rounded border border-[#a89985] bg-[#fdfbf7] overflow-y-auto max-h-[360px] shadow-inner">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#e8dccb] sticky top-0 z-10 border-b border-[#a89985] text-[#2c241c] font-['Chakra_Petch',sans-serif] font-bold">
              <tr>
                <th className="py-1.5 px-2.5">Incident Type</th>
                <th className="py-1.5 px-2">Well</th>
                <th className="py-1.5 px-2 font-mono">Depth</th>
                <th className="py-1.5 px-2">Summary/Action</th>
                <th className="py-1.5 px-2 text-center w-8">···</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4d6c4] text-[#1c1815]">
              {filteredIncidents.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => {
                    onSelectIncident(item);
                    onOpenReportModal(item);
                  }}
                  className="hover:bg-[#f3e7d7] cursor-pointer transition-colors group"
                >
                  {/* Column 1: Incident Type */}
                  <td className="py-2 px-2.5 font-medium whitespace-nowrap">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        item.incidentType === 'Mud Loss'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : item.incidentType === 'Gas Kick'
                          ? 'bg-red-100 text-red-900 border border-red-300'
                          : item.incidentType === 'Casing Problem'
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : 'bg-orange-100 text-orange-900 border border-orange-300'
                      }`}
                    >
                      {item.incidentType}
                    </span>
                  </td>

                  {/* Column 2: Well */}
                  <td className="py-2 px-2 font-mono font-bold text-[11px] text-[#2b241d] whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      {item.wellName}
                      {item.sourceType && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full inline-block ${
                            item.sourceType === 'synthetic_demo' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          title={SOURCE_TYPE_LABELS[item.sourceType] || item.sourceType}
                        />
                      )}
                    </span>
                  </td>

                  {/* Column 3: Depth */}
                  <td className="py-2 px-2 font-mono text-[11px] text-[#4d4033] whitespace-nowrap">
                    {item.depthM}m
                  </td>

                  {/* Column 4: Summary/Action */}
                  <td className="py-2 px-2 text-[11px] text-[#332b24] truncate max-w-[170px]" title={item.summary}>
                    {item.summary}
                  </td>

                  {/* Column 5: Action Menu button ··· */}
                  <td className="py-2 px-2 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenReportModal(item);
                      }}
                      className="w-6 h-6 rounded bg-[#ebdcc8] hover:bg-[#d8c5ad] flex items-center justify-center text-[#2c241c] transition-colors"
                      title="Inspect Source Report"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="text-[10px] font-mono text-[#5c4f42] flex items-center justify-between px-1">
          <span>Click any row to open OCR Report citation & table extract</span>
          <span className="text-emerald-800 font-semibold">Verified Ground Truth</span>
        </div>
      </div>
    </div>
  );
};
