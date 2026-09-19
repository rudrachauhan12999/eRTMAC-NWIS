import React from 'react';
import { Compass, FileText, CheckCircle2, AlertTriangle, Crosshair } from 'lucide-react';

interface TopKpiStripProps {
  scannedWellsCount: number;
  extractedReportsCount: number;
  activeAlertsCount: number;
  accuracyPercent: number;
  currentDepthM: number;
  activeFormation: string;
  onOpenAlerts?: () => void;
  onOpenReports?: () => void;
  onOpenWells?: () => void;
  onExportPdf?: () => void;
}

export const TopKpiStrip: React.FC<TopKpiStripProps> = ({
  scannedWellsCount = 42,
  extractedReportsCount = 1250,
  activeAlertsCount = 3,
  accuracyPercent = 92,
  currentDepthM = 3500,
  activeFormation = 'Barail Coal-Shale',
  onOpenAlerts,
  onOpenReports,
  onOpenWells,
  onExportPdf,
}) => {
  return (
    <div className="flex flex-col gap-2 my-2 px-4">
      {/* Top Banner with Operational Status & Export PDF Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#ebdcc8] border border-[#a89985] rounded-lg px-3.5 py-1.5 text-xs font-mono text-[#382f25]">
        <div className="flex items-center gap-2">
          <img
            src="/oil_india_logo.png"
            alt="OIL Logo"
            className="w-4 h-4 object-contain shrink-0"
            referrerPolicy="no-referrer"
          />
          <span>
            <strong>OIL RIG-SITE DISPATCH:</strong> Well NWIS-Active-02C • Depth {currentDepthM.toLocaleString()} m • Formation: {activeFormation}
          </span>
        </div>

        {onExportPdf && (
          <button
            type="button"
            onClick={onExportPdf}
            className="px-3 py-1 rounded bg-[#3b322a] hover:bg-[#241e19] text-amber-300 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-amber-600/50 shadow-xs shrink-0 self-start sm:self-auto"
            title="Export official 24-hr drilling and geomechanical summary PDF report"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Drilling Summary PDF</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* 1. Nearby Wells Scanned: 42 */}
      <div 
        onClick={onOpenWells}
        className="cursor-pointer group flex items-center justify-between px-5 py-3 rounded-lg border border-[#c4b5a2] bg-[#f8f3eb] shadow-xs hover:border-[#8f7d6a] hover:bg-[#fffdf9] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#e2d5c3] flex items-center justify-center text-[#524436] group-hover:bg-[#d6c4ae] transition-colors">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#574b3f]">Nearby Wells Scanned:</div>
            <div className="text-2xl font-bold text-[#1a1613] font-['Chakra_Petch',sans-serif] leading-tight">
              {scannedWellsCount}
            </div>
          </div>
        </div>
        <div className="text-right text-[11px] font-mono text-[#786b5e]">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 mr-1.5 animate-pulse" />
          Radius: 25 km
        </div>
      </div>

      {/* 2. AI-Extracted Reports: 1250+ */}
      <div 
        onClick={onOpenReports}
        className="cursor-pointer group flex items-center justify-between px-5 py-3 rounded-lg border border-[#c4b5a2] bg-[#f8f3eb] shadow-xs hover:border-[#8f7d6a] hover:bg-[#fffdf9] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#dce6f2] flex items-center justify-center text-[#1e40af] group-hover:bg-[#c9ddf2] transition-colors">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#574b3f]">AI-Extracted Reports:</div>
            <div className="text-2xl font-bold text-[#1a1613] font-['Chakra_Petch',sans-serif] leading-tight">
              {extractedReportsCount}+
            </div>
          </div>
        </div>
        <div className="text-right text-[11px] font-mono text-[#786b5e]">
          WCR / DDR / Mud Logs
        </div>
      </div>

      {/* 3. System Status: Optimal (3 Alerts, 92% Acc.) */}
      <div 
        onClick={onOpenAlerts}
        className="cursor-pointer group flex items-center justify-between px-5 py-3 rounded-lg border border-[#c4b5a2] bg-[#f8f3eb] shadow-xs hover:border-[#8f7d6a] hover:bg-[#fffdf9] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#dcfce7] flex items-center justify-center text-emerald-800 group-hover:bg-[#bbf7d0] transition-colors">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#574b3f]">System Status:</div>
            <div className="text-lg md:text-xl font-bold text-emerald-800 font-['Chakra_Petch',sans-serif] leading-tight flex items-center gap-1.5">
              <span>Optimal</span>
              <span className="text-sm font-semibold text-[#1c1815]">
                (<span className="text-red-700 font-bold">{activeAlertsCount} Alerts</span>, {accuracyPercent}% Acc.)
              </span>
            </div>
          </div>
        </div>
        <div className="text-right text-[11px] font-mono text-[#786b5e]">
          {activeFormation}
        </div>
      </div>
    </div>
    </div>
  );
};
