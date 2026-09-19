/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HeaderBar, ActiveTab } from './components/HeaderBar.tsx';
import { LeftSidebarIndex } from './components/LeftSidebarIndex.tsx';
import { IntelligenceDashboardView } from './components/IntelligenceDashboardView.tsx';
import { TopKpiStrip } from './components/TopKpiStrip.tsx';
import { RadarProximityMap } from './components/RadarProximityMap.tsx';
import { CrossSection3D } from './components/CrossSection3D.tsx';
import { CorrelationCenterPanel } from './components/CorrelationCenterPanel.tsx';
import { ReportBrowserTable } from './components/ReportBrowserTable.tsx';
import { DocumentViewerModal } from './components/DocumentViewerModal.tsx';
import { AiAssistantView } from './components/AiAssistantView.tsx';
import { InteractiveLeafletMap } from './components/InteractiveLeafletMap.tsx';
import { RiskPredictionView } from './components/RiskPredictionView.tsx';
import { HistoricalEventsView } from './components/HistoricalEventsView.tsx';
import { DocLibraryView } from './components/DocLibraryView.tsx';
import { LiveTelemetryView } from './components/LiveTelemetryView.tsx';
import { StratigraphicAnalyticsView } from './components/StratigraphicAnalyticsView.tsx';
import { FieldDemosView } from './components/FieldDemosView.tsx';
import { SystemDocsView } from './components/SystemDocsView.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { DrillingSummaryPdfModal } from './components/DrillingSummaryPdfModal.tsx';

import {
  Well,
  HistoricalIncident,
  AlertItem,
  OperationalScenario,
} from './data/wellsData.ts';

import { UserProfile, PRESET_USERS } from './types/auth.ts';
import { fetchWells, WellsApiError } from './services/wellsApi.ts';
import { fetchEvents } from './services/eventsApi.ts';
import { fetchAlerts } from './services/alertsApi.ts';

// The well the rest of the app treats as "the active well" (map center,
// radar center, etc.) — matches the id the frontend's original wellsData.ts
// fixture used for ACTIVE_WELL, now looked up from the real backend list
// instead of a hardcoded import.
const ACTIVE_WELL_ID = 'well-active-01';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [selectedWell, setSelectedWell] = useState<Well | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<HistoricalIncident | null>(null);

  // Wells & Map Data (from GET /api/wells — replaces the wellsData.ts fixture)
  const [wells, setWells] = useState<Well[]>([]);
  const [wellsLoading, setWellsLoading] = useState<boolean>(true);
  const [wellsError, setWellsError] = useState<string | null>(null);
  const activeWell = wells.find((w) => w.id === ACTIVE_WELL_ID) ?? null;

  useEffect(() => {
    let cancelled = false;
    setWellsLoading(true);
    setWellsError(null);
    fetchWells()
      .then((data) => {
        if (cancelled) return;
        setWells(data);
        setSelectedWell(data.find((w) => w.id === ACTIVE_WELL_ID) ?? data[0] ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setWellsError(err instanceof WellsApiError ? err.message : 'Could not reach the backend to load wells.');
      })
      .finally(() => {
        if (!cancelled) setWellsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Historical Events data (from GET /api/events — replaces the
  // wellsData.ts HISTORICAL_INCIDENTS fixture as the active lookup source
  // for report/alert click-throughs below). See docs/EVENT_INTEGRATION_ANALYSIS.md.
  const [events, setEvents] = useState<HistoricalIncident[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchEvents()
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch(() => {
        // Non-fatal here: HistoricalEventsView/ReportBrowserTable fetch
        // and surface their own load errors independently. This copy is
        // only used for the report/alert click-through lookups below.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Header/sidebar "N HAZARD ALERTS" badge count (Alerts Intelligence round)
  // — real backend-generated alert count, replacing the previous hardcoded
  // PREDICTIVE_ALERTS.length. A single fetch on load, matching the `events`
  // fetch above; not polled, per the round's "no aggressive polling" guidance.
  const [alertsCount, setAlertsCount] = useState<number>(0);
  useEffect(() => {
    let cancelled = false;
    fetchAlerts()
      .then((data) => {
        if (!cancelled) setAlertsCount(data.length);
      })
      .catch(() => {
        // Non-fatal: the header badge simply stays at its default count;
        // CorrelationCenterPanel surfaces its own load error independently.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Well Intelligence integration: true only once the user explicitly
  // selects a well on a map (not on the automatic initial default-select),
  // so ReportBrowserTable's default "show all events" behavior is unchanged
  // unless the user actually clicks a well.
  const [wellFilterActive, setWellFilterActive] = useState<boolean>(false);

  const [copilotQuery, setCopilotQuery] = useState<string>('');
  const [currentDepthM, setCurrentDepthM] = useState<number>(3500);
  const [activeFormation, setActiveFormation] = useState<string>('Barail Coal-Shale');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('ertmac_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read user from local storage:', e);
    }
    return PRESET_USERS[0];
  });

  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('ertmac_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Could not save user to local storage:', e);
    }
  };

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  // Handle Operational Drill Scenario Launch
  const handleRunDemoScenario = (scenario: OperationalScenario) => {
    setCurrentDepthM(scenario.depthTarget);
    setActiveFormation(scenario.formationTarget);
    setCopilotQuery(scenario.query);
    if (scenario.id === 'scenario-5') {
      setActiveTab('ai-assistant');
    } else {
      setActiveTab('operations');
    }
  };

  // Open Copilot with specific query from anywhere
  const handleAskCopilot = (query: string) => {
    setCopilotQuery(query);
    setActiveTab('ai-assistant');
  };

  return (
    <div className="h-screen bg-[#e8dfcf] text-[#241f1a] flex flex-col font-sans overflow-hidden">
      {/* Top Application Bar with Oil India insignia, title, operator info, and live UTC clock */}
      <HeaderBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        alertsCount={alertsCount}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Main Layout Container with Left Sidebar Index */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Navigation / Module Index */}
        <LeftSidebarIndex
          activeTab={activeTab}
          onTabChange={setActiveTab}
          alertsCount={alertsCount}
          currentUser={currentUser}
          onOpenAuth={handleOpenAuth}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main Content Body */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {/* TAB 0: INTELLIGENCE DASHBOARD (Interactive visual explanation with flowcharts & simulation drills) */}
          {activeTab === 'dashboard' && (
            <IntelligenceDashboardView
              currentUser={currentUser}
              onOpenAuth={handleOpenAuth}
              onNavigateTab={setActiveTab}
              onExportPdf={() => setIsPdfModalOpen(true)}
            />
          )}

          {/* TAB 1: OPERATIONS CONSOLE (3-Column command center) */}
          {activeTab === 'operations' && (
            <div className="flex-1 flex flex-col max-w-[1700px] w-full mx-auto pb-4">
              {/* Top KPI Metric Strip */}
              <TopKpiStrip
                scannedWellsCount={42}
                extractedReportsCount={1250}
                activeAlertsCount={3}
                accuracyPercent={92}
                currentDepthM={currentDepthM}
                activeFormation={activeFormation}
                onOpenAlerts={() => setActiveTab('risk-prediction')}
                onOpenReports={() => setActiveTab('doc-library')}
                onOpenWells={() => setActiveTab('map')}
                onExportPdf={() => setIsPdfModalOpen(true)}
              />

              {/* The 3 Main Columns matching the screenshot layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 px-4 flex-1 items-stretch">
                {/* Left Column (col-span-4): Radar Map + 3D Cross Section */}
                <div className="lg:col-span-4 flex flex-col gap-3">
                  {/* 1. Modern geospatial Map - Real-Time Visualization */}
                  <div className="flex-1 min-h-[360px]">
                    {wellsLoading && (
                      <div className="h-full min-h-[310px] flex items-center justify-center rounded-lg border-2 border-[#5c4f42] bg-[#f5ede1] text-sm font-mono text-[#5c5247]">
                        Loading well data from backend…
                      </div>
                    )}
                    {!wellsLoading && wellsError && (
                      <div className="h-full min-h-[310px] flex items-center justify-center rounded-lg border-2 border-red-300 bg-red-50 text-sm font-mono text-red-800 text-center px-4">
                        {wellsError}
                      </div>
                    )}
                    {!wellsLoading && !wellsError && activeWell && (
                      <RadarProximityMap
                        activeWell={activeWell}
                        nearbyWells={wells}
                        onSelectWell={(w) => {
                          setSelectedWell(w);
                          setWellFilterActive(true);
                        }}
                        onOpenGisMap={() => setActiveTab('map')}
                      />
                    )}
                  </div>

                  {/* 2. 3D Subsurface Formation Cross-Section */}
                  <div className="flex-1 min-h-[320px]">
                    <CrossSection3D
                      currentDepthM={currentDepthM}
                      onSelectFormation={(fmt) => setActiveFormation(fmt)}
                    />
                  </div>
                </div>

                {/* Center Column (col-span-4): Cross-Well Correlation & Operations */}
                <div className="lg:col-span-4 flex flex-col">
                  <CorrelationCenterPanel
                    currentDepthM={currentDepthM}
                    onExportPdf={() => setIsPdfModalOpen(true)}
                    activeWellId={wellFilterActive ? selectedWell?.id : undefined}
                    activeWellName={wellFilterActive ? selectedWell?.name : undefined}
                    onClearWellFilter={() => setWellFilterActive(false)}
                    onSelectAlert={(alt) => {
                      const matched = events.find(
                        (i) => i.wellName === alt.wellRef
                      );
                      if (matched) setSelectedIncident(matched);
                    }}
                    onOpenReport={(repId) => {
                      // repId may be a source-report reportId (existing
                      // behavior) or a real event's own id (Alerts round —
                      // an alert's evidence cites the specific underlying
                      // event, not a hardcoded report).
                      const matched = events.find(
                        (i) => i.sourceReport.reportId === repId || i.id === repId
                      );
                      if (matched) setSelectedIncident(matched);
                    }}
                  />
                </div>

                {/* Right Column (col-span-4): Interactive Report Browser */}
                <div className="lg:col-span-4 flex flex-col">
                  <ReportBrowserTable
                    onSelectIncident={(inc) => setSelectedIncident(inc)}
                    onOpenReportModal={(inc) => setSelectedIncident(inc)}
                    activeWellId={wellFilterActive ? selectedWell?.id : undefined}
                    activeWellName={wellFilterActive ? selectedWell?.name : undefined}
                    onClearWellFilter={() => setWellFilterActive(false)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI DRILLING COPILOT (RAG & Gemini 3.8 Flash) */}
          {activeTab === 'ai-assistant' && (
            <AiAssistantView
              initialQuery={copilotQuery}
              onOpenReportModal={(inc) => setSelectedIncident(inc)}
            />
          )}

          {/* TAB 3: GEOSPATIAL GIS MAP (Leaflet) */}
          {activeTab === 'map' && (
            <InteractiveLeafletMap
              onSelectWell={(w) => {
                setSelectedWell(w);
                setWellFilterActive(true);
              }}
              onOpenReportModal={(inc) => setSelectedIncident(inc)}
            />
          )}

          {/* TAB 4: RISK PREDICTION & ML RADAR */}
          {activeTab === 'risk-prediction' && (
            <RiskPredictionView
              wellId={selectedWell?.id}
              wellName={selectedWell?.name}
              formation={selectedWell?.formation}
              onOpenReportModal={(inc) => {
                if (typeof inc === 'string') {
                  const matched = events.find(
                    (i) => i.wellName === inc || i.sourceReport.reportId === inc
                  );
                  if (matched) setSelectedIncident(matched);
                } else if (inc) {
                  setSelectedIncident(inc);
                }
              }}
            />
          )}

          {/* TAB 5: HISTORICAL EVENTS EXPLORER */}
          {activeTab === 'historical-events' && (
            <HistoricalEventsView
              onOpenReportModal={(inc) => setSelectedIncident(inc)}
              onAskCopilot={handleAskCopilot}
            />
          )}

          {/* TAB 6: DOCUMENT LIBRARY & OCR REPOSITORY */}
          {activeTab === 'doc-library' && (
            <DocLibraryView
              onOpenReportModal={(inc) => setSelectedIncident(inc)}
            />
          )}

          {/* TAB 7: LIVE TELEMETRY SIMULATOR */}
          {activeTab === 'telemetry' && (
            <LiveTelemetryView wellId={selectedWell?.id} wellName={selectedWell?.name} />
          )}

          {/* TAB 8: CROSS-WELL STRATIGRAPHIC ANALYTICS */}
          {activeTab === 'analytics' && (
            <StratigraphicAnalyticsView
              wellId={wellFilterActive ? selectedWell?.id : undefined}
              wellName={wellFilterActive ? selectedWell?.name : undefined}
            />
          )}

          {/* TAB 9: OPERATIONAL FIELD DRILLS */}
          {activeTab === 'field-drills' && (
            <FieldDemosView onRunScenario={handleRunDemoScenario} />
          )}

          {/* TAB 10: ARCHITECTURE & SYSTEM SPECS */}
          {activeTab === 'docs' && <SystemDocsView />}
        </main>
      </div>

      {/* Global Document Citation / WCR OCR Viewer Modal */}
      <DocumentViewerModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onAskCopilot={handleAskCopilot}
      />

      {/* Operator Authentication Modal (Sign In / Sign Up) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        initialMode={authMode}
      />

      {/* Operations Console Drilling Summary Export PDF Modal */}
      <DrillingSummaryPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        currentDepthM={currentDepthM}
        mudWeightSG={1.24}
        activeFormation={activeFormation}
      />
    </div>
  );
}
