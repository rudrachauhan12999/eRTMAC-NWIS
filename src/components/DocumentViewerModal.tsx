import React from 'react';
import { X, FileText, CheckCircle2, ShieldAlert, Sparkles, Download, Copy, ExternalLink } from 'lucide-react';
import { HistoricalIncident } from '../data/wellsData.ts';

interface DocumentViewerModalProps {
  incident: HistoricalIncident | null;
  onClose: () => void;
  onAskCopilot?: (query: string) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  incident,
  onClose,
  onAskCopilot,
}) => {
  if (!incident) return null;

  const report = incident.sourceReport;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
      <div 
        className="bg-[#fcf8f2] border-2 border-[#5c4f42] rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Bar matching industrial styling */}
        <div className="bg-[#463d35] text-white px-5 py-3 flex items-center justify-between border-b border-[#352d26]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold font-['Chakra_Petch',sans-serif] tracking-wide flex items-center gap-2">
                <span>{report.title}</span>
                <span className="text-xs bg-amber-700/80 text-amber-100 px-2 py-0.2 rounded font-mono">
                  {report.reportType}
                </span>
              </div>
              <div className="text-xs text-stone-300 font-mono">
                Source Document ID: {report.reportId} • Page {report.page} ({report.section})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-900/60 border border-emerald-500 text-emerald-300 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>OCR Accuracy: {report.ocrConfidence}%</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded bg-stone-700 hover:bg-stone-600 text-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-[#241e19]">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#ebdcc8] p-3.5 rounded-md border border-[#c4b5a2] text-xs font-mono">
            <div>
              <span className="text-[#695c4d] block">Well Identifier:</span>
              <strong className="text-[#1a1511] text-sm">{incident.wellName}</strong>
            </div>
            <div>
              <span className="text-[#695c4d] block">Target Formation:</span>
              <strong className="text-[#1a1511] text-sm">{incident.formation}</strong>
            </div>
            <div>
              <span className="text-[#695c4d] block">Depth of Occurrence:</span>
              <strong className="text-red-700 text-sm font-bold">{incident.depthM} m</strong>
            </div>
            <div>
              <span className="text-[#695c4d] block">Severity & Risk:</span>
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
                {incident.severity} • {incident.incidentType}
              </span>
            </div>
          </div>

          {/* OCR Document Excerpt / Verified Ground Truth */}
          <div>
            <div className="text-xs font-bold text-[#3d3227] font-['Chakra_Petch',sans-serif] uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Verified OCR Report Transcription (Ground Truth Citation)</span>
              <span className="text-[11px] text-amber-800 font-mono">Digitized via PyMuPDF + Camelot</span>
            </div>
            <div className="p-4 rounded-md bg-[#fffdfa] border-l-4 border-amber-600 border border-[#d6c7b4] shadow-xs text-sm font-mono leading-relaxed text-[#1a1612]">
              <p className="italic">"{report.excerpt}"</p>
            </div>
          </div>

          {/* Extracted Tabular Parameters */}
          {report.tableData && (
            <div>
              <div className="text-xs font-bold text-[#3d3227] font-['Chakra_Petch',sans-serif] uppercase tracking-wider mb-1.5">
                Extracted Drilling Telemetry & Rheology Parameters
              </div>
              <div className="rounded border border-[#c4b5a2] overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#ede1d1] text-[#332b23] border-b border-[#c4b5a2]">
                    <tr>
                      <th className="py-1.5 px-3">Parameter Name</th>
                      <th className="py-1.5 px-3">Recorded Value</th>
                      <th className="py-1.5 px-3">Standard Safety Threshold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebdcc8]">
                    {Object.entries(report.tableData).map(([key, val]) => (
                      <tr key={key} className="hover:bg-[#fbf7f0]">
                        <td className="py-1.5 px-3 font-semibold text-[#40352b]">{key}</td>
                        <td className="py-1.5 px-3 font-bold text-red-700">{String(val)}</td>
                        <td className="py-1.5 px-3 text-[#695c4d]">Within OIL Assam Standard Spec</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Root Cause & Engineering Mitigation Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#fee2e2]/60 p-3.5 rounded border border-red-300">
              <div className="text-xs font-bold text-red-900 font-['Chakra_Petch',sans-serif] flex items-center gap-1.5 mb-1">
                <ShieldAlert className="w-4 h-4 text-red-700" />
                <span>Geomechanical Root Cause Analysis</span>
              </div>
              <p className="text-xs text-red-950 leading-relaxed">
                {incident.rootCause}
              </p>
            </div>

            <div className="bg-[#dcfce7]/70 p-3.5 rounded border border-emerald-300">
              <div className="text-xs font-bold text-emerald-950 font-['Chakra_Petch',sans-serif] flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Recommended Field Mitigation Procedure</span>
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed">
                {incident.recommendedMitigation}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-[#ebdcc8] px-5 py-3 border-t border-[#c4b5a2] flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onAskCopilot?.(`What mitigation worked best for ${incident.incidentType} in ${incident.wellName} at ${incident.depthM}m?`);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#2b2520] hover:bg-[#1a1612] text-amber-300 text-xs font-bold shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Consult AI Copilot About This Incident</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-[#ded0bd] hover:bg-[#cfbfab] text-[#2c241c] text-xs font-bold border border-[#a89985] transition-colors"
          >
            Close Document
          </button>
        </div>
      </div>
    </div>
  );
};
