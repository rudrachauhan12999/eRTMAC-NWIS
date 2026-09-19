import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  ExternalLink, 
  Clock, 
  Layers, 
  BookOpen, 
  Calendar, 
  Sparkles,
  Filter,
  ArrowUpDown,
  Tag,
  Eye,
  FileCheck,
  Plus,
  Trash2,
  RotateCcw,
  AlertCircle,
  Building2
} from 'lucide-react';
import { HistoricalIncident } from '../data/wellsData.ts';
import { fetchEvents, createEvent, deleteEvent, EventsApiError } from '../services/eventsApi.ts';
import { AddNewDocModal } from './AddNewDocModal.tsx';

interface DocLibraryViewProps {
  onOpenReportModal: (incident: HistoricalIncident) => void;
}

type ViewMode = 'all-sections' | 'all-only' | 'wcr-only' | 'ddr-only';

// Prefix AddNewDocModal.tsx gives every user-added record's id — used to
// tell "original repository" documents apart from ones added this session,
// for the Restore Defaults action below.
const CUSTOM_ID_PREFIX = 'custom-inc-';

export const DocLibraryView: React.FC<DocLibraryViewProps> = ({ onOpenReportModal }) => {
  // Documents now come from the backend (GET /api/events) instead of
  // localStorage — see docs/DATA_SOURCES.md: these are the frontend's
  // synthetic_demo incident records, persisted server-side.
  const [incidents, setIncidents] = useState<HistoricalIncident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>('');
  const [activeViewMode, setActiveViewMode] = useState<ViewMode>('all-sections');
  const [selectedFormation, setSelectedFormation] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const loadFromBackend = () => {
    setIsLoading(true);
    setLoadError(null);
    fetchEvents()
      .then((data) => setIncidents(data))
      .catch((err) => setLoadError(err instanceof EventsApiError ? err.message : 'Could not reach the backend to load documents.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadFromBackend();
  }, []);

  // Handle Add New Document — indexes it into the real backend (RAG-searchable
  // document_chunks, tagged synthetic_demo) instead of only browser storage.
  const handleAddDocument = async (newDoc: HistoricalIncident) => {
    try {
      const saved = await createEvent(newDoc);
      setIncidents((prev) => [saved, ...prev]);
      setNotificationMsg(`Successfully indexed "${saved.sourceReport.title}" to repository.`);
    } catch (err) {
      setNotificationMsg(err instanceof EventsApiError ? err.message : 'Could not reach the backend to add this document.');
    }
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Handle Delete Document
  const handleDeleteDocument = async (reportId: string, docTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = incidents.find((item) => item.sourceReport.reportId === reportId);
    setDeleteConfirmId(null);
    if (!target) return;
    try {
      await deleteEvent(target.id);
      setIncidents((prev) => prev.filter((item) => item.sourceReport.reportId !== reportId));
      setNotificationMsg(`Deleted "${docTitle}" from repository.`);
    } catch (err) {
      setNotificationMsg(err instanceof EventsApiError ? err.message : 'Could not reach the backend to delete this document.');
    }
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Handle Restore Default Documents — removes only the documents added
  // this session (id prefix "custom-inc-"), then re-fetches the original
  // backend repository. There's no client-only override to discard anymore:
  // additions are real backend records, so "restoring" means deleting them.
  const handleRestoreDefaults = async () => {
    const customDocs = incidents.filter((i) => i.id.startsWith(CUSTOM_ID_PREFIX));
    await Promise.allSettled(customDocs.map((doc) => deleteEvent(doc.id)));
    loadFromBackend();
    setNotificationMsg('Restored official Oil India archival repository to default.');
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const hasCustomDocs = incidents.some((i) => i.id.startsWith(CUSTOM_ID_PREFIX));

  const allReports = useMemo(() => {
    return incidents.map((inc) => ({
      incident: inc,
      report: inc.sourceReport,
      isWCR: inc.sourceReport.reportType.includes('WCR'),
      isDDR: inc.sourceReport.reportType.includes('DDR') || inc.sourceReport.reportType.includes('Mud Logging'),
    }));
  }, [incidents]);

  const formations = useMemo(() => {
    const set = new Set<string>();
    allReports.forEach((r) => {
      if (r.incident.formation) set.add(r.incident.formation);
    });
    return ['ALL', ...Array.from(set)];
  }, [allReports]);

  // Filter based on search and formation
  const filterList = (list: typeof allReports) => {
    return list.filter(({ incident, report }) => {
      const matchesSearch = !search ||
        report.title.toLowerCase().includes(search.toLowerCase()) ||
        report.reportId.toLowerCase().includes(search.toLowerCase()) ||
        incident.wellName.toLowerCase().includes(search.toLowerCase()) ||
        report.section.toLowerCase().includes(search.toLowerCase()) ||
        incident.formation.toLowerCase().includes(search.toLowerCase()) ||
        report.excerpt.toLowerCase().includes(search.toLowerCase());

      const matchesFormation = selectedFormation === 'ALL' || incident.formation === selectedFormation;

      return matchesSearch && matchesFormation;
    });
  };

  const filteredAll = useMemo(() => filterList(allReports), [allReports, search, selectedFormation]);
  const filteredWCR = useMemo(() => filterList(allReports.filter((r) => r.isWCR)), [allReports, search, selectedFormation]);
  const filteredDDR = useMemo(() => filterList(allReports.filter((r) => r.isDDR)), [allReports, search, selectedFormation]);

  // Render a report card with Add / Delete features
  const renderReportCard = (item: typeof allReports[0], categoryBadge: 'ALL' | 'WCR' | 'DDR') => {
    const { incident, report, isWCR } = item;
    const isConfirmingDelete = deleteConfirmId === report.reportId;

    return (
      <div
        key={report.reportId}
        id={`report-${report.reportId}`}
        onClick={() => onOpenReportModal(incident)}
        className="bg-[#fcf8f2] rounded-lg border-2 border-[#695c4d] hover:border-amber-700 p-4 flex flex-col justify-between shadow-sm hover:shadow-md cursor-pointer transition-all group relative"
      >
        <div>
          {/* Top Tag, OCR Accuracy, and Delete Button */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                isWCR 
                  ? 'bg-[#3b322a] text-amber-300 border border-amber-600/50' 
                  : 'bg-[#1e3a5f] text-cyan-200 border border-cyan-500/50'
              }`}>
                {isWCR ? 'WCR • Completion' : 'DDR • Daily Tour'}
              </span>
              <span className="text-[10px] font-mono bg-[#ded0bd] text-[#4a3f33] px-1.5 py-0.5 rounded font-semibold">
                {report.reportId}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-800 font-bold shrink-0 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>OCR: {Math.round(report.ocrConfidence * 100)}%</span>
              </div>

              {/* Delete Document Button */}
              {isConfirmingDelete ? (
                <div 
                  className="flex items-center gap-1 bg-red-100 border border-red-300 p-0.5 rounded"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => handleDeleteDocument(report.reportId, report.title, e)}
                    className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded cursor-pointer"
                    title="Confirm Permanent Deletion"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(null);
                    }}
                    className="px-1.5 py-0.5 bg-stone-300 hover:bg-stone-400 text-stone-800 text-[10px] rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(report.reportId);
                  }}
                  className="p-1 rounded text-[#8a7662] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remove this document from repository"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <h4 className="text-sm font-bold text-[#1c1815] font-['Chakra_Petch',sans-serif] group-hover:text-amber-800 transition-colors leading-snug">
            {report.title}
          </h4>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-mono text-[#5c4f42] mt-2 bg-[#f4ebe0] p-2 rounded border border-[#dacbb8]">
            <div>
              <span className="text-[#8c7862] block text-[9px] uppercase">Offset Well</span>
              <strong className="text-[#1c1815]">{incident.wellName}</strong>
            </div>
            <div>
              <span className="text-[#8c7862] block text-[9px] uppercase">Recorded Depth</span>
              <strong className="text-[#1c1815]">{incident.depthM.toLocaleString()} m</strong>
            </div>
            <div>
              <span className="text-[#8c7862] block text-[9px] uppercase">Stratigraphy</span>
              <span className="text-[#1c1815] truncate block" title={incident.formation}>
                {incident.formation}
              </span>
            </div>
            <div>
              <span className="text-[#8c7862] block text-[9px] uppercase">Incident Type</span>
              <span className="text-amber-800 font-bold truncate block" title={incident.incidentType}>
                {incident.incidentType}
              </span>
            </div>
          </div>

          {/* Section info */}
          <div className="mt-2 text-xs font-mono text-[#5c4f42] flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 text-amber-700 shrink-0" />
            <span className="truncate">{report.section}</span>
          </div>

          {/* Excerpt quote */}
          <p className="text-xs italic text-[#382f26] mt-2.5 line-clamp-3 bg-[#ebdcc8] p-2.5 rounded border border-[#c4b5a2] leading-relaxed">
            "{report.excerpt}"
          </p>

          {/* Key Parameters preview */}
          {report.tableData && report.tableData.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-[#dfd2c0] flex flex-wrap gap-1.5">
              {report.tableData.slice(0, 3).map((item, idx) => (
                <span key={idx} className="text-[10px] font-mono bg-[#fffdfa] border border-[#d6c7b2] px-1.5 py-0.5 rounded text-[#42362b]">
                  {item.Parameter}: <strong className="text-[#1c1815]">{item.Value} {item.Unit}</strong>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mt-3.5 pt-2.5 border-t border-[#c4b5a2] flex items-center justify-between text-xs font-mono font-bold text-amber-900 group-hover:text-amber-950">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-amber-800" />
            <span>Open Archival OCR Viewer</span>
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-amber-800 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 p-4 max-w-7xl mx-auto w-full select-none flex flex-col gap-5">
      {/* Top Banner with Authentic Oil India Limited Logo */}
      <div className="bg-[#3b322a] text-white p-4 md:p-5 rounded-lg border-2 border-[#2b241d] shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <img
              src="/oil_india_logo.png"
              alt="Oil India Limited Official Logo"
              className="w-12 h-12 md:w-14 md:h-14 object-contain shrink-0 drop-shadow-md"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg md:text-xl font-bold font-['Chakra_Petch',sans-serif] tracking-wide text-amber-300">
                  ऑयल इंडिया लिमिटेड • Digitized Document & OCR Intelligence Repository
                </h2>
                <span className="bg-emerald-700 text-white text-[10px] font-mono px-2.5 py-0.5 rounded uppercase font-bold shadow-xs">
                  OIL DULIAJAN ARCHIVES
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-1">
                Institutional repository of historical Well Completion Reports (WCR) and Daily Drilling Reports (DDR), digitized with verified OCR confidence ratings.
              </p>
            </div>
          </div>

          {/* Quick Actions: Add New Document & Stats */}
          <div className="flex items-center gap-2 font-mono text-xs shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Upload or create a new well document"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Document</span>
            </button>

            <div className="bg-[#241e19] border border-[#524436] px-3 py-1.5 rounded text-stone-300">
              Total Docs: <strong className="text-amber-400">{allReports.length}</strong>
            </div>

            {hasCustomDocs && (
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="px-2.5 py-1.5 rounded bg-[#4f4235] hover:bg-[#635343] text-stone-200 flex items-center gap-1 transition-colors cursor-pointer"
                title="Remove documents added this session and restore the original repository"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Restore Defaults</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-stone-700">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports, well IDs, mud losses, formations..."
              className="w-full bg-[#241e19] border border-[#524436] rounded px-3.5 py-2 text-xs text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
            />
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
          </div>

          {/* Formation Filter */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-stone-400 shrink-0">Formation:</span>
            <select
              value={selectedFormation}
              onChange={(e) => setSelectedFormation(e.target.value)}
              className="bg-[#241e19] border border-[#524436] rounded px-2.5 py-1.5 text-xs text-amber-200 focus:outline-none font-mono cursor-pointer"
            >
              {formations.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Backend Load State */}
      {isLoading && (
        <div className="p-3 bg-[#ebdcc8] border border-[#c4b5a2] text-[#5c5247] rounded-lg text-xs font-mono text-center">
          Loading document repository from backend…
        </div>
      )}
      {!isLoading && loadError && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-lg text-xs font-mono flex items-center justify-between">
          <span>{loadError}</span>
          <button type="button" onClick={loadFromBackend} className="text-red-900 hover:text-red-950 font-bold cursor-pointer underline">
            Retry
          </button>
        </div>
      )}

      {/* Notification Toast if document added or deleted */}
      {notificationMsg && (
        <div className="p-3 bg-amber-100 border border-amber-400 text-amber-900 rounded-lg text-xs font-mono flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setNotificationMsg(null)}
            className="text-amber-800 hover:text-amber-950 font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3-Part View Switcher Navigation Bar (ALL is first, then WCR, then DDR) */}
      <div className="bg-[#ebdcc8] border-2 border-[#b5a794] rounded-lg p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold font-mono text-[#524436] mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-amber-800" />
            <span>Repository Sections:</span>
          </span>

          {/* 1. ALL REPORTS BUTTON (FIRST) */}
          <button
            type="button"
            onClick={() => setActiveViewMode('all-only')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeViewMode === 'all-only'
                ? 'bg-[#3b322a] text-amber-300 shadow-sm border border-amber-600'
                : 'bg-[#fcf8f2] hover:bg-[#dfd0be] text-[#3d332a] border border-[#c4b5a2]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. ALL REPORTS</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded ${
              activeViewMode === 'all-only' ? 'bg-amber-400 text-black' : 'bg-[#ded0bd] text-[#3d332a]'
            }`}>
              {filteredAll.length}
            </span>
          </button>

          {/* 2. WCR (WELL COMPLETION REPORTS) BUTTON */}
          <button
            type="button"
            onClick={() => setActiveViewMode('wcr-only')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeViewMode === 'wcr-only'
                ? 'bg-[#3b322a] text-amber-300 shadow-sm border border-amber-600'
                : 'bg-[#fcf8f2] hover:bg-[#dfd0be] text-[#3d332a] border border-[#c4b5a2]'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>2. WCR (Well Completion Reports)</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded ${
              activeViewMode === 'wcr-only' ? 'bg-amber-400 text-black' : 'bg-[#ded0bd] text-[#3d332a]'
            }`}>
              {filteredWCR.length}
            </span>
          </button>

          {/* 3. DDR (DAILY DRILLING REPORTS) BUTTON */}
          <button
            type="button"
            onClick={() => setActiveViewMode('ddr-only')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeViewMode === 'ddr-only'
                ? 'bg-[#1e3a5f] text-cyan-200 shadow-sm border border-cyan-500'
                : 'bg-[#fcf8f2] hover:bg-[#dfd0be] text-[#3d332a] border border-[#c4b5a2]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>3. DDR (Daily Drilling Reports)</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded ${
              activeViewMode === 'ddr-only' ? 'bg-cyan-300 text-black' : 'bg-[#ded0bd] text-[#3d332a]'
            }`}>
              {filteredDDR.length}
            </span>
          </button>
        </div>

        {/* Action Controls: Add Document + Layout toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 rounded text-xs font-mono font-bold bg-[#3b322a] hover:bg-[#28211b] text-amber-300 border border-amber-600/60 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewMode('all-sections')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeViewMode === 'all-sections'
                ? 'bg-[#4a3f33] text-white border border-[#2b241d]'
                : 'bg-[#fcf8f2] hover:bg-[#dfd0be] text-[#4a3f33] border border-[#c4b5a2]'
            }`}
            title="Display all 3 sections stacked on this page with ALL kept first"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Show All 3 Sections Divided</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PART 1: ALL REPORTS (FIRST SECTION - BOTH WCR & DDR COMBINED)             */}
      {/* ========================================================================= */}
      {(activeViewMode === 'all-sections' || activeViewMode === 'all-only') && (
        <section id="section-all-reports" className="space-y-3 pt-1">
          <div className="bg-[#ded0bd] border-2 border-[#a89985] rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-[#3b322a] text-amber-300 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div>
                <h3 className="text-sm md:text-base font-bold font-['Chakra_Petch',sans-serif] text-[#1c1815] flex items-center gap-2">
                  <span>ALL REPORTS (Combined WCR & DDR Repository)</span>
                  <span className="text-xs font-mono font-normal bg-[#3b322a] text-amber-300 px-2 py-0.5 rounded">
                    {filteredAll.length} Documents
                  </span>
                </h3>
                <p className="text-xs text-[#5c4f42]">
                  Unified master stream featuring both full Well Completion Reports (WCR) and 24-hour Daily Drilling Reports (DDR) indexed with OCR.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-2.5 py-1 rounded bg-[#3b322a] hover:bg-[#251e18] text-amber-300 text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Add a new document to the repository"
              >
                <Plus className="w-3 h-3" />
                <span>Add Document</span>
              </button>
              <span className="text-[11px] font-mono text-[#5c4f42] font-semibold hidden sm:inline">
                Part 1 of 3
              </span>
            </div>
          </div>

          {filteredAll.length === 0 ? (
            <div className="bg-[#fcf8f2] border-2 border-dashed border-[#b5a794] rounded-lg p-8 text-center text-stone-500 font-mono text-xs space-y-2">
              <p>No documents found matching "{search}".</p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-3 py-1 rounded bg-[#3b322a] text-amber-300 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add First Document</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAll.map((item) => renderReportCard(item, 'ALL'))}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* PART 2: WCR (WELL COMPLETION REPORTS ONLY)                                */}
      {/* ========================================================================= */}
      {(activeViewMode === 'all-sections' || activeViewMode === 'wcr-only') && (
        <section id="section-wcr-reports" className="space-y-3 pt-3">
          <div className="bg-[#e4d7c6] border-2 border-[#a89985] rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-[#3b322a] text-amber-300 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <h3 className="text-sm md:text-base font-bold font-['Chakra_Petch',sans-serif] text-[#1c1815] flex items-center gap-2">
                  <span>WELL COMPLETION REPORTS (WCR) ARCHIVE</span>
                  <span className="text-xs font-mono font-normal bg-[#3b322a] text-amber-300 px-2 py-0.5 rounded">
                    {filteredWCR.length} WCRs
                  </span>
                </h3>
                <p className="text-xs text-[#5c4f42]">
                  Official end-of-well completion dossiers covering final total depth, lithological column, casing tallies, and major geomechanical incidents.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono text-amber-900 font-bold bg-[#ded0bd] px-2 py-1 rounded border border-[#b5a794]">
                Part 2 of 3 (WCR Dossiers)
              </span>
            </div>
          </div>

          {filteredWCR.length === 0 ? (
            <div className="bg-[#fcf8f2] border-2 border-dashed border-[#b5a794] rounded-lg p-8 text-center text-stone-500 font-mono text-xs">
              No Well Completion Reports (WCR) match "{search}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWCR.map((item) => renderReportCard(item, 'WCR'))}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* PART 3: DDR (DAILY DRILLING REPORTS ONLY)                                 */}
      {/* ========================================================================= */}
      {(activeViewMode === 'all-sections' || activeViewMode === 'ddr-only') && (
        <section id="section-ddr-reports" className="space-y-3 pt-3">
          <div className="bg-[#d7e3ee] border-2 border-[#92a8be] rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-[#1e3a5f] text-cyan-200 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div>
                <h3 className="text-sm md:text-base font-bold font-['Chakra_Petch',sans-serif] text-[#1c1815] flex items-center gap-2">
                  <span>DAILY DRILLING REPORTS (DDR) ARCHIVE</span>
                  <span className="text-xs font-mono font-normal bg-[#1e3a5f] text-cyan-200 px-2 py-0.5 rounded">
                    {filteredDDR.length} DDRs
                  </span>
                </h3>
                <p className="text-xs text-[#35485c]">
                  Active 24-hour shift tour sheets, operational logs, mud engineer logs, and daily rate of penetration (ROP) chronologies.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono text-[#1e3a5f] font-bold bg-[#c5d7e8] px-2 py-1 rounded border border-[#92a8be]">
                Part 3 of 3 (DDR Tour Sheets)
              </span>
            </div>
          </div>

          {filteredDDR.length === 0 ? (
            <div className="bg-[#fcf8f2] border-2 border-dashed border-[#b5a794] rounded-lg p-8 text-center text-stone-500 font-mono text-xs">
              No Daily Drilling Reports (DDR) match "{search}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDDR.map((item) => renderReportCard(item, 'DDR'))}
            </div>
          )}
        </section>
      )}

      {/* Add New Document Modal */}
      <AddNewDocModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddDocument={handleAddDocument}
        availableFormations={formations}
      />
    </div>
  );
};
