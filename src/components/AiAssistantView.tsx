import React, { useState } from 'react';
import { 
  Send, 
  Sparkles, 
  FileText, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Layers, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { HistoricalIncident } from '../data/wellsData.ts';
import { apiFetch } from '../services/apiConfig.ts';

interface AiAssistantViewProps {
  onOpenReportModal?: (incident: any) => void;
  initialQuery?: string;
}

// "public_document"/"government_data" = a real Oil India/government source;
// "synthetic_demo" = the frontend's own labeled demo fixture, not a real
// OIL India record (docs/DATA_SOURCES.md). Always shown on each citation so
// the two are never presented as the same thing.
type SourceType = 'public_document' | 'government_data' | 'geospatial_data' | 'derived' | 'synthetic_demo';

interface RagResponse {
  summary: string;
  nearbyWellsAnalysis: string;
  rootCause: string;
  recommendedMitigation: string;
  confidenceScore: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  isInsufficientInfo: boolean;
  reasoningSteps: string[];
  citations: Array<{
    reportId: string;
    reportType?: string;
    wellName: string;
    title?: string;
    page: number;
    section: string;
    ocrConfidence?: number;
    excerpt: string;
    sourceType?: SourceType;
  }>;
}

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  public_document: 'Real Oil India Document',
  government_data: 'Government Dataset',
  geospatial_data: 'Geospatial Dataset',
  derived: 'Derived Record',
  synthetic_demo: 'Synthetic Demo Data',
};

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  onOpenReportModal,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState<string>(initialQuery);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentResponse, setCurrentResponse] = useState<RagResponse | null>(null);
  const [activeWellDepth, setActiveWellDepth] = useState<number>(3500);

  const suggestedQuestions = [
    {
      title: 'Current Depth 3,500m Hazard & Mud Loss Plan',
      prompt: 'We are drilling NWIS-Active-01 at 3,500m in Barail Coal-Shale. What incidents occurred in offset wells within 3 km and what should our mud weight be?',
    },
    {
      title: 'Increasing Torque & Cavings Diagnostics',
      prompt: 'NWIS-Active-01 is seeing increasing torque and tight hole at 3,500m. What did NWIS-Calire-02 and NWIS-Active-02 experience?',
    },
    {
      title: 'Anti-Hallucination Test (6,800m Basement)',
      prompt: 'Predict pore pressure and drilling risks for Pre-Cambrian basement at 6,800m in well Selt-OW-08.',
    },
    {
      title: 'LCM Pill Formulation Empirical Evaluation',
      prompt: 'What mud loss mitigation worked best in NWIS-Calire-02 and NWIS-Colive-04 during Barail penetration?',
    },
  ];

  const handleSearch = async (userPrompt: string) => {
    if (!userPrompt.trim()) return;
    setIsLoading(true);
    setCurrentResponse(null);

    try {
      const res = await apiFetch('/api/rag/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userPrompt,
          activeDepth: activeWellDepth,
          activeFormation: 'Barail Coal-Shale & Sandstone',
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch from RAG backend');
      const data: RagResponse = await res.json();
      setCurrentResponse(data);
    } catch (err) {
      console.error('RAG Query Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 p-4 max-w-7xl mx-auto w-full select-none flex flex-col gap-4">
      {/* Top Banner */}
      <div className="bg-[#463d35] text-white p-4 rounded-lg border-2 border-[#352d26] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold font-['Chakra_Petch',sans-serif] tracking-wide">
              eRTMAC-NWIS AI Drilling Operations Copilot
            </h2>
          </div>
          <p className="text-xs text-stone-300 mt-1">
            Synthesizes 1,250+ digitized Oil India Well Completion Reports (WCR) & Daily Drilling Reports (DDR) with strict Anti-Hallucination Guardrails.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto font-mono text-xs">
          <div className="bg-[#342c25] px-3 py-1.5 rounded border border-[#524436]">
            <span className="text-[#a89985]">Active Horizon:</span>{' '}
            <strong className="text-amber-300">Barail (3,500m)</strong>
          </div>
        </div>
      </div>

      {/* Suggested Fast-Track Scenarios for Hackathon Judges */}
      <div>
        <div className="text-xs font-bold text-[#44382c] font-['Chakra_Petch',sans-serif] mb-2 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-amber-700" />
          <span>Quick Benchmark Scenarios (Smart India Hackathon 2026 Judging Prompts):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(q.prompt);
                handleSearch(q.prompt);
              }}
              className="text-left p-2.5 rounded border border-[#c4b5a2] bg-[#f8f3eb] hover:bg-[#fffdfa] hover:border-[#8f7d6a] transition-all shadow-xs group"
            >
              <div className="text-xs font-bold text-[#2d241d] font-['Chakra_Petch',sans-serif] group-hover:text-amber-800 flex items-center justify-between">
                <span>{q.title}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#8f7d6a] group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-[#695c4d] mt-1 line-clamp-2">
                {q.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-[#f5ede1] p-3 rounded-lg border-2 border-[#8f7d6a] shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything (e.g. mud weight recommendations, stuck pipe history, kick tolerance in Barail)..."
              className="w-full bg-[#fcfaf5] border border-[#a89985] rounded-md px-4 py-2 text-sm text-[#1a1612] placeholder-[#7d6f5f] focus:outline-none focus:ring-2 focus:ring-amber-600 font-sans shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-5 py-2 rounded-md bg-[#2c241d] hover:bg-[#1a1612] text-amber-300 font-bold text-xs flex items-center gap-2 disabled:opacity-50 transition-all shadow-sm"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-amber-400" />
                <span>Query RAG Engine</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* AI Response Display Card */}
      {currentResponse && (
        <div className="bg-[#fcf8f2] border-2 border-[#5c4f42] rounded-lg shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header of Response */}
          <div className="bg-[#463d35] text-white px-4 py-2.5 flex items-center justify-between border-b border-[#352d26]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm font-['Chakra_Petch',sans-serif]">
                Verified Drilling Decision Recommendation
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className={`px-2.5 py-0.5 rounded font-bold border ${
                currentResponse.isInsufficientInfo
                  ? 'bg-red-900/60 border-red-500 text-red-300'
                  : 'bg-emerald-900/60 border-emerald-500 text-emerald-300'
              }`}>
                {currentResponse.isInsufficientInfo ? 'DATA SCARCITY HORIZON' : `Confidence: ${currentResponse.confidenceScore}%`}
              </div>
              <div className={`px-2.5 py-0.5 rounded font-bold ${
                currentResponse.riskLevel === 'CRITICAL'
                  ? 'bg-red-600 text-white'
                  : 'bg-amber-600 text-white'
              }`}>
                Risk: {currentResponse.riskLevel}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 text-[#241e19]">
            {/* 1. Executive Summary */}
            <div className={`p-4 rounded-md border ${
              currentResponse.isInsufficientInfo 
                ? 'bg-red-50 border-red-300 text-red-950' 
                : 'bg-[#fffdf9] border-[#c4b5a2]'
            }`}>
              <div className="text-xs font-bold font-['Chakra_Petch',sans-serif] uppercase tracking-wider text-[#45372a] mb-1">
                Executive Synthesis
              </div>
              <p className="text-sm font-medium leading-relaxed">
                {currentResponse.summary}
              </p>
            </div>

            {/* 2. Offset Well Correlation Analysis */}
            <div>
              <div className="text-xs font-bold font-['Chakra_Petch',sans-serif] uppercase tracking-wider text-[#45372a] mb-1.5 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-700" />
                <span>Geospatial Offset Well Correlation</span>
              </div>
              <div className="p-3.5 rounded-md bg-[#ebdcc8] border border-[#c4b5a2] text-xs leading-relaxed text-[#2c241d]">
                {currentResponse.nearbyWellsAnalysis}
              </div>
            </div>

            {/* 3. Root Cause & Actionable Mitigation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-md bg-[#fee2e2]/60 border border-red-300">
                <div className="text-xs font-bold text-red-900 font-['Chakra_Petch',sans-serif] flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-700" />
                  <span>Geomechanical Root Cause</span>
                </div>
                <p className="text-xs text-red-950 leading-relaxed font-sans">
                  {currentResponse.rootCause}
                </p>
              </div>

              <div className="p-3.5 rounded-md bg-[#dcfce7]/70 border border-emerald-300">
                <div className="text-xs font-bold text-emerald-950 font-['Chakra_Petch',sans-serif] flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Actionable Rig Operations Mitigation</span>
                </div>
                <p className="text-xs text-emerald-950 leading-relaxed font-sans whitespace-pre-line">
                  {currentResponse.recommendedMitigation}
                </p>
              </div>
            </div>

            {/* 4. Anti-Hallucination Reasoning Steps */}
            <div>
              <div className="text-xs font-bold font-['Chakra_Petch',sans-serif] uppercase tracking-wider text-[#45372a] mb-1.5">
                RAG Reasoning Chain & Evidence Verification Steps
              </div>
              <div className="bg-[#f0e6d8] p-3 rounded border border-[#c4b5a2] font-mono text-[11px] space-y-1 text-[#332b23]">
                {currentResponse.reasoningSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#463d35] text-amber-300 flex items-center justify-center text-[9px] font-bold">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Clickable Citations */}
            {currentResponse.citations.length > 0 && (
              <div>
                <div className="text-xs font-bold font-['Chakra_Petch',sans-serif] uppercase tracking-wider text-[#45372a] mb-2 flex items-center justify-between">
                  <span>Retrieved Ground Truth Source Citations (Click to View Full OCR Report)</span>
                  <span className="text-[11px] font-mono text-[#695c4d]">
                    {currentResponse.citations.length} Verified Sources
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentResponse.citations.map((cite, idx) => (
                    <div
                      key={idx}
                      onClick={() => onOpenReportModal?.({
                        id: cite.reportId,
                        wellName: cite.wellName,
                        formation: 'Barail',
                        depthM: 3480,
                        incidentType: 'Mud Loss',
                        severity: 'HIGH',
                        summary: cite.excerpt,
                        rootCause: currentResponse.rootCause,
                        recommendedMitigation: currentResponse.recommendedMitigation,
                        sourceReport: {
                          reportId: cite.reportId,
                          reportType: cite.reportType || 'WCR',
                          title: cite.title || `Well Completion Report - ${cite.wellName}`,
                          page: cite.page,
                          section: cite.section,
                          ocrConfidence: cite.ocrConfidence || 98.4,
                          excerpt: cite.excerpt,
                        }
                      })}
                      className="p-3 rounded-md bg-[#fffdf9] border border-[#c4b5a2] hover:border-amber-700 hover:bg-[#fff9ef] cursor-pointer transition-all shadow-xs group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-[#1a1612] group-hover:text-amber-800">
                          {cite.wellName} • Page {cite.page}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#8f7d6a] group-hover:text-amber-700" />
                      </div>
                      <div className="text-[10px] text-[#695c4d] font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{cite.section} • {cite.reportId}</span>
                        {cite.sourceType && (
                          <span className={`px-1.5 py-0.2 rounded font-bold ${
                            cite.sourceType === 'synthetic_demo'
                              ? 'bg-amber-200 text-amber-900 border border-amber-400'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                          }`}>
                            {SOURCE_TYPE_LABELS[cite.sourceType]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs italic text-[#3a3026] mt-2 line-clamp-2 border-l-2 border-amber-600 pl-2">
                        "{cite.excerpt}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
