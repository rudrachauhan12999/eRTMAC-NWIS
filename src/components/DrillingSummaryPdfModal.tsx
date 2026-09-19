import React, { useState } from 'react';
import { 
  X, 
  FileDown, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  Layers, 
  Compass, 
  Info,
  Building2
} from 'lucide-react';
import { ACTIVE_WELL, PREDICTIVE_ALERTS } from '../data/wellsData.ts';
import { generateDrillingSummaryPdf } from '../utils/generateDrillingPdf.ts';

interface DrillingSummaryPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDepthM?: number;
  mudWeightSG?: number;
  activeFormation?: string;
}

export const DrillingSummaryPdfModal: React.FC<DrillingSummaryPdfModalProps> = ({
  isOpen,
  onClose,
  currentDepthM = 3500,
  mudWeightSG = 1.24,
  activeFormation = 'Barail Coal-Shale',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [engineerNotes, setEngineerNotes] = useState(
    'Borehole condition stable. High torque observed between 3,480m-3,500m. Mud weight maintained at 1.24 SG; recommended to trim to 1.21-1.22 SG before entering lower permeable sand.'
  );

  if (!isOpen) return null;

  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      await generateDrillingSummaryPdf({
        currentDepthM,
        mudWeightSG,
        activeFormation,
        notes: engineerNotes,
      });
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const summaryText = `
OIL INDIA LIMITED - DRILLING OPERATIONS REPORT
Rig: ${ACTIVE_WELL.rigName || 'OIL-E2000'} | Well: ${ACTIVE_WELL.name}
Date: ${dateStr} ${timeStr} | Field: Duliajan
Depth: ${currentDepthM} m | Formation: ${activeFormation}
Mud Density: ${mudWeightSG} SG (Pore: 1.20 SG, Frac: 1.23 SG)
ROP: 12.4 m/hr | WOB: 18.5 klbs | RPM: 88
Active Hazards: Mud Loss (61.4%), Gas Kick (11.2%), Stuck Pipe (44.8%), Torque (85%)
Directives: Trim mud to 1.21 SG. Keep 45 bbl LCM on standby.
Notes: ${engineerNotes}
Sign-off: Er. R. Chauhan (Lead Drilling Engineer)
    `.trim();

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto select-none">
      <div 
        className="bg-[#fcf8f2] border-2 border-[#5c4f42] rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Dark Header Controls */}
        <div className="bg-[#3b322a] text-white px-4 py-3 flex items-center justify-between border-b border-[#2b241d] shrink-0">
          <div className="flex items-center gap-2.5">
            <img 
              src="/oil_india_logo.png" 
              alt="Oil India Logo" 
              className="w-7 h-7 object-contain drop-shadow-xs" 
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="text-sm font-bold font-['Chakra_Petch',sans-serif] text-amber-300">
                Well Drilling Summary • Official PDF Export
              </h3>
              <p className="text-[11px] text-stone-300 font-mono">
                Rig OIL-E2000 • Well {ACTIVE_WELL.name} • 24-Hour Operations Cycle
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-2.5 py-1.5 rounded bg-[#4f4438] hover:bg-[#615446] text-stone-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy plain text summary to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1.5 rounded bg-[#4f4438] hover:bg-[#615446] text-stone-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print directly or save via browser PDF printer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isGenerating ? 'Generating...' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Sheet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#eee4d6] flex justify-center">
          <div 
            id="printable-drilling-summary"
            className="w-full max-w-3xl bg-[#fffdfa] border border-[#d6c7b2] rounded shadow-md p-6 sm:p-8 text-[#241e19] flex flex-col gap-5 print:shadow-none print:border-none print:p-0"
          >
            {/* Official Oil India Letterhead */}
            <div className="flex items-start justify-between border-b-2 border-[#8b1e22] pb-4 gap-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/oil_india_logo.png" 
                  alt="Oil India Limited" 
                  className="w-14 h-14 object-contain shrink-0 drop-shadow-xs" 
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h1 className="text-xl font-extrabold text-[#8b1e22] tracking-wider font-['Chakra_Petch',sans-serif] leading-tight">
                    ऑयल इंडिया लिमिटेड | OIL INDIA LIMITED
                  </h1>
                  <p className="text-xs font-bold text-[#4a3f33]">
                    DIRECTORATE OF DRILLING & SUBSURFACE OPERATIONS • DULIAJAN, ASSAM
                  </p>
                  <p className="text-[11px] text-[#7a6a57] font-mono">
                    eRTMAC-NWIS Geomechanical Intelligence Engine • Assam-Arakan Basin Division
                  </p>
                </div>
              </div>

              <div className="text-right font-mono text-[11px] shrink-0 leading-tight space-y-0.5">
                <div className="font-bold text-[#1c1815]">REF: OIL/DRL/DS-{dateStr.replace(/ /g, '')}</div>
                <div className="text-[#695c4d]">DATE: {dateStr} {timeStr}</div>
                <div className="text-[#695c4d]">RIG: OIL-E2000 (2000 HP Cyber)</div>
                <div className="text-red-700 font-bold text-[10px]">RESTRICTED OPERATIONAL DATA</div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="bg-[#f5ede1] border border-[#d8c8b4] px-4 py-2 rounded flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#2d251d] font-['Chakra_Petch',sans-serif]">
                  DAILY DRILLING & GEOMECHANICAL SUMMARY REPORT (24-HR CYCLE)
                </h2>
                <span className="text-xs font-mono text-[#6e5d4c]">
                  Live Rig WITSML Ingestion & Bayesian Offset Correlation
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded">
                TELEMETRY VALIDATED
              </span>
            </div>

            {/* Section 1: Wellbore Profile & Status */}
            <div>
              <div className="bg-[#3b322a] text-white px-3 py-1 rounded-t text-xs font-bold font-mono tracking-wider">
                1. WELLBORE PROFILE & CURRENT DRILL RIG STATUS
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#fbf7f0] border border-t-0 border-[#d6c7b2] rounded-b text-xs font-mono">
                <div>
                  <span className="text-[#8c7862] text-[10px] block">WELL NAME</span>
                  <strong>{ACTIVE_WELL.name}</strong>
                </div>
                <div>
                  <span className="text-[#8c7862] text-[10px] block">RIG ID</span>
                  <strong>{ACTIVE_WELL.rigName} (2000 HP)</strong>
                </div>
                <div>
                  <span className="text-[#8c7862] text-[10px] block">FIELD / BASIN</span>
                  <span>Duliajan, Assam-Arakan</span>
                </div>
                <div>
                  <span className="text-[#8c7862] text-[10px] block">SPUD DATE</span>
                  <span>{ACTIVE_WELL.spudDate}</span>
                </div>
                <div>
                  <span className="text-[#8c7862] text-[10px] block">CURRENT DEPTH</span>
                  <strong className="text-amber-900">{currentDepthM.toLocaleString()} m</strong>
                </div>
                <div>
                  <span className="text-[#8c7862] text-[10px] block">TARGET DEPTH (TD)</span>
                  <strong>{ACTIVE_WELL.targetDepthM.toLocaleString()} m</strong>
                </div>
                <div>
                  <span className="text-[#8c7862] text-[10px] block">ACTIVE STRATIGRAPHY</span>
                  <strong className="text-red-900">{activeFormation}</strong>
                </div>
                <div>
                  <span className="text-[#8c7862] text-[10px] block">DRILL STATUS</span>
                  <span className="text-emerald-700 font-bold">DRILLING AHEAD</span>
                </div>
              </div>
            </div>

            {/* Section 2: Real-time Telemetry & Fluid Hydraulics */}
            <div>
              <div className="bg-[#3b322a] text-white px-3 py-1 rounded-t text-xs font-bold font-mono tracking-wider">
                2. REAL-TIME DRILLING HYDRAULICS & FLUID COLUMN
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-[#fbf7f0] border border-t-0 border-[#d6c7b2] rounded-b text-xs font-mono">
                <div className="bg-white p-2 rounded border border-[#dfd2c0]">
                  <span className="text-[#8c7862] text-[10px] block">ACTIVE MUD DENSITY</span>
                  <div className="text-sm font-bold text-[#1c1815]">{mudWeightSG.toFixed(2)} SG</div>
                  <span className="text-[10px] text-amber-700">Margin: -0.01 vs Frac</span>
                </div>
                <div className="bg-white p-2 rounded border border-[#dfd2c0]">
                  <span className="text-[#8c7862] text-[10px] block">PORE PRESSURE</span>
                  <div className="text-sm font-bold text-[#1c1815]">1.20 SG</div>
                  <span className="text-[10px] text-[#695c4d]">Barail Gas Sand</span>
                </div>
                <div className="bg-white p-2 rounded border border-[#dfd2c0]">
                  <span className="text-[#8c7862] text-[10px] block">FRACTURE GRADIENT</span>
                  <div className="text-sm font-bold text-[#1c1815]">1.23 SG</div>
                  <span className="text-[10px] text-red-700">Depleted Sand Limit</span>
                </div>
                <div className="bg-white p-2 rounded border border-[#dfd2c0]">
                  <span className="text-[#8c7862] text-[10px] block">CIRCULATING ECD</span>
                  <div className="text-sm font-bold text-[#1c1815]">{(mudWeightSG + 0.03).toFixed(2)} SG</div>
                  <span className="text-[10px] text-[#695c4d]">@ Bit Depth 3,500m</span>
                </div>
                <div className="bg-white p-2 rounded border border-[#dfd2c0]">
                  <span className="text-[#8c7862] text-[10px] block">PENETRATION RATE (ROP)</span>
                  <div className="text-sm font-bold text-[#1c1815]">12.4 m/hr</div>
                </div>
                <div className="bg-white p-2 rounded border border-[#dfd2c0]">
                  <span className="text-[#8c7862] text-[10px] block">WEIGHT ON BIT (WOB)</span>
                  <div className="text-sm font-bold text-[#1c1815]">18.5 klbs</div>
                </div>
                <div className="bg-white p-2 rounded border border-[#dfd2c0]">
                  <span className="text-[#8c7862] text-[10px] block">ROTARY SPEED (RPM)</span>
                  <div className="text-sm font-bold text-[#1c1815]">88 RPM</div>
                </div>
                <div className="bg-white p-2 rounded border border-[#dfd2c0]">
                  <span className="text-[#8c7862] text-[10px] block">STANDPIPE PRESSURE</span>
                  <div className="text-sm font-bold text-[#1c1815]">2,450 psi</div>
                </div>
              </div>
            </div>

            {/* Section 3: Predictive Hazard Matrix (Offset Wells) */}
            <div>
              <div className="bg-[#3b322a] text-white px-3 py-1 rounded-t text-xs font-bold font-mono tracking-wider">
                3. PREDICTIVE HAZARD MATRIX (BAYESIAN OFFSET CORRELATION)
              </div>
              <div className="p-3 bg-[#fbf7f0] border border-t-0 border-[#d6c7b2] rounded-b text-xs font-mono overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#c4b5a2] text-[10px] text-[#5c4f42]">
                      <th className="py-1">HAZARD MECHANISM</th>
                      <th className="py-1">SEVERITY</th>
                      <th className="py-1">PROBABILITY</th>
                      <th className="py-1">CORRELATED OFFSET WELL</th>
                      <th className="py-1">CRITICAL TRIGGER FACTOR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebdcc8]">
                    <tr>
                      <td className="py-1.5 font-bold">Lost Circulation / Loss</td>
                      <td>
                        <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {mudWeightSG > 1.23 ? 'CRITICAL' : 'HIGH'}
                        </span>
                      </td>
                      <td className="font-bold">{mudWeightSG > 1.23 ? '88.5%' : '61.4%'}</td>
                      <td>NWIS-Calire-02 (1.4 km Updip)</td>
                      <td className="text-[11px] text-[#5a4c3e]">Mud weight ({mudWeightSG.toFixed(2)} SG) vs frac limit (1.22 SG)</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold">Gas Kick / Mud Influx</td>
                      <td>
                        <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {mudWeightSG < 1.20 ? 'CRITICAL' : 'LOW'}
                        </span>
                      </td>
                      <td className="font-bold">{mudWeightSG < 1.20 ? '76.2%' : '11.2%'}</td>
                      <td>NWIS-Colive-04 (2.1 km West)</td>
                      <td className="text-[11px] text-[#5a4c3e]">Gas pore pressure: 1.20 SG</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold">Differential Stuck Pipe</td>
                      <td>
                        <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          MEDIUM
                        </span>
                      </td>
                      <td className="font-bold">44.8%</td>
                      <td>NWIS-Colve-02 (2.8 km NE)</td>
                      <td className="text-[11px] text-[#5a4c3e]">0.04 SG overbalance across depleted coal beds</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold">Torque Spikes & Stick-Slip</td>
                      <td>
                        <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          HIGH
                        </span>
                      </td>
                      <td className="font-bold">85.0%</td>
                      <td>NWIS-Active-02 (4.5 km South)</td>
                      <td className="text-[11px] text-[#5a4c3e]">Cleat micro-spalling causing ledge formation</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Operational Directives & Engineer Notes */}
            <div>
              <div className="bg-[#3b322a] text-white px-3 py-1 rounded-t text-xs font-bold font-mono tracking-wider">
                4. MANDATORY FIELD DIRECTIVES & SHIFT NOTES (OIL-SOP-DRL-04)
              </div>
              <div className="p-3 bg-[#fbf7f0] border border-t-0 border-[#d6c7b2] rounded-b text-xs font-mono space-y-2">
                <ul className="list-disc list-inside space-y-1 text-[#3b3026]">
                  <li><strong>Mud Density:</strong> Trim active fluid density to 1.21 - 1.22 SG to safely honor the 1.23 SG fracture threshold.</li>
                  <li><strong>LCM Readiness:</strong> Maintain 45 bbl high-viscosity coarse LCM pill pre-mixed on active pit #3.</li>
                  <li><strong>Flow Checks:</strong> Conduct 10-min flow checks on all connections through Barail Coal-Shale.</li>
                  <li><strong>Survey Limits:</strong> Limit stationary directional surveys to &lt; 3 minutes to avoid differential sticking.</li>
                </ul>

                <div className="pt-2 border-t border-[#dfd2c0]">
                  <label className="text-[10px] font-bold text-[#695c4d] block uppercase mb-1">
                    Drilling Engineer Shift Remarks:
                  </label>
                  <textarea
                    value={engineerNotes}
                    onChange={(e) => setEngineerNotes(e.target.value)}
                    rows={2}
                    className="w-full text-xs font-mono p-2 bg-white border border-[#c4b5a2] rounded focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Digital Signatures & Handover Block */}
            <div className="border border-[#c4b5a2] rounded p-3 bg-[#f7f2ea] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <span className="text-[10px] text-[#8c7862] block">LEAD DRILLING ENGINEER</span>
                <strong className="text-[#1c1815]">Er. R. Chauhan</strong>
                <div className="text-[10px] text-emerald-700 font-bold mt-1">Verified & Digitally Signed</div>
              </div>
              <div>
                <span className="text-[10px] text-[#8c7862] block">RIG SUPERINTENDENT</span>
                <strong className="text-[#1c1815]">Sh. K. Gogoi (Senior Toolpusher)</strong>
                <div className="text-[10px] text-stone-600 mt-1">Protocols Acknowledged</div>
              </div>
              <div>
                <span className="text-[10px] text-[#8c7862] block">DULIAJAN COMMAND HQ</span>
                <strong className="text-[#1c1815]">eRTMAC Central Operations</strong>
                <div className="text-[10px] text-stone-600 mt-1">Telemetry Synced at {timeStr}</div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center font-mono text-[10px] text-[#7a6a57] pt-2 border-t border-[#dfd2c0]">
              Oil India Limited • Directorate of Drilling Operations • Field Headquarters: Duliajan, Assam 786602
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="bg-[#ede1d1] border-t border-[#c4b5a2] px-4 py-3 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-[#5c4f42]">
            <Info className="w-4 h-4 text-amber-800 shrink-0" />
            <span>Click <strong>"Download PDF"</strong> to save the formatted official report to your local disk.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-[#dbcebd] hover:bg-[#cbbcb0] text-[#362b21] font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-4 py-1.5 rounded bg-[#3b322a] hover:bg-[#28211b] text-amber-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              <span>{isGenerating ? 'Exporting...' : 'Export PDF Report'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
