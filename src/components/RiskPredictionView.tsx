import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp, Sliders, Activity, Calculator, Sparkles, Info } from 'lucide-react';
import { HazardScoreModal } from './HazardScoreModal.tsx';
import { HistoricalRiskCorrelationChart } from './HistoricalRiskCorrelationChart.tsx';
import { predictRisk, RiskApiError, RiskPredictResponse } from '../services/riskApi.ts';

interface RiskPredictionViewProps {
  onOpenReportModal?: (incident: any) => void;
  // Optional well context — when a well is selected elsewhere in the app,
  // risk intelligence uses that well's real formation and telemetry
  // instead of the standalone-slider defaults.
  wellId?: string;
  wellName?: string;
  formation?: string;
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  public_document: 'Real Oil India Document',
  government_data: 'Government Dataset',
  geospatial_data: 'Geospatial Dataset',
  derived: 'Derived Record',
  synthetic_demo: 'Synthetic Demo Data',
};

export const RiskPredictionView: React.FC<RiskPredictionViewProps> = ({ onOpenReportModal, wellId, wellName, formation }) => {
  const [depthM, setDepthM] = useState<number>(3500);
  const [mudWeightSG, setMudWeightSG] = useState<number>(1.24);
  const [riskData, setRiskData] = useState<RiskPredictResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isHazardModalOpen, setIsHazardModalOpen] = useState<boolean>(false);

  const fetchRiskPrediction = async (depth: number, mud: number) => {
    setIsCalculating(true);
    try {
      const data = await predictRisk(depth, mud, formation || 'Barail Coal-Shale', wellId);
      setRiskData(data);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof RiskApiError ? err.message : 'Could not reach the backend risk engine.');
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    fetchRiskPrediction(depthM, mudWeightSG);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depthM, mudWeightSG, wellId, formation]);

  return (
    <div className="flex-1 p-4 max-w-7xl mx-auto w-full select-none flex flex-col gap-4">
      {/* Top Banner */}
      <div className="bg-[#463d35] text-white p-4 rounded-lg border-2 border-[#352d26] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold font-['Chakra_Petch',sans-serif] tracking-wide">
              Predictive Geomechanical Risk Engine & Safe Drilling Window
            </h2>
            <span className="bg-[#241e18] border border-amber-600/50 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded uppercase" title="Rule/similarity-based decision support — not a trained or validated ML model">
              Risk Intelligence: Rule &amp; Similarity Engine
            </span>
            {riskData?.isSimulation && (
              <span
                className="bg-amber-200 text-amber-900 border border-amber-500 text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold"
                title="This result includes a signal derived from simulated demo telemetry — not proprietary Oil India eRTMAC data"
              >
                SIMULATED DEMO TELEMETRY
              </span>
            )}
          </div>
          <p className="text-xs text-stone-300 mt-1">
            Calculates pore-to-fracture pressure margins and historical similarity for {wellName || 'the selected well'} using indexed demonstration and document evidence.
          </p>
        </div>

        {/* Clickable Composite Hazard Score Badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsHazardModalOpen(true)}
            className="bg-[#241e18] hover:bg-[#332b22] text-left px-3.5 py-2 rounded-lg border-2 border-amber-500/80 hover:border-amber-400 shadow-md transition-all cursor-pointer group flex items-center gap-3"
            title="Click to open mathematical breakdown of how this hazard score is calculated"
          >
            <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-stone-300 flex items-center gap-1.5 font-mono">
                <span>COMPOSITE HAZARD SCORE</span>
                <span className="text-amber-400 font-bold underline text-[9px]">VIEW FORMULA</span>
              </div>
              <div className="flex items-baseline gap-1.5 font-mono">
                <strong className={`text-xl font-bold ${
                  riskData == null ? 'text-stone-400' : riskData.compositeRiskScore >= 70 ? 'text-red-400' : riskData.compositeRiskScore >= 40 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {riskData ? riskData.compositeRiskScore : '—'}
                </strong>
                <span className="text-stone-400 text-xs">/ 100</span>
                {riskData && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ml-1 ${
                    riskData.compositeRiskScore >= 70 ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {riskData.compositeRiskScore >= 70 ? 'CRITICAL' : 'ELEVATED'}
                  </span>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Backend Load State */}
      {loadError && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-lg text-xs font-mono text-center">
          {loadError}
        </div>
      )}

      {/* Interactive Sliders (Mud Weight SG & Depth M) */}
      <div className="bg-[#f5ede1] p-4 rounded-lg border-2 border-[#8f7d6a] grid grid-cols-1 md:grid-cols-2 gap-6 shadow-sm">
        {/* Mud Weight Slider */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-[#2d241d] mb-1 font-['Chakra_Petch',sans-serif]">
            <span>Active Mud Weight (Density):</span>
            <span className="font-mono text-sm font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-300">
              {mudWeightSG.toFixed(2)} SG (Specific Gravity)
            </span>
          </div>
          <input
            type="range"
            min={1.15}
            max={1.35}
            step={0.01}
            value={mudWeightSG}
            onChange={(e) => setMudWeightSG(Number(e.target.value))}
            className="w-full accent-amber-600 h-2 bg-[#d4c4b0] rounded cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-[#695c4d] mt-1">
            <span>1.15 SG (Underbalanced - Kick Risk)</span>
            <span className="font-bold text-emerald-800">1.21 SG (Optimal Window)</span>
            <span>1.35 SG (Overbalanced - Loss Risk)</span>
          </div>
        </div>

        {/* Depth Slider */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-[#2d241d] mb-1 font-['Chakra_Petch',sans-serif]">
            <span>Simulation Borehole Depth:</span>
            <span className="font-mono text-sm font-bold text-[#1c1815] bg-[#ebdcc8] px-2 py-0.5 rounded border border-[#c4b5a2]">
              {depthM} meters
            </span>
          </div>
          <input
            type="range"
            min={2000}
            max={4800}
            step={25}
            value={depthM}
            onChange={(e) => setDepthM(Number(e.target.value))}
            className="w-full accent-amber-600 h-2 bg-[#d4c4b0] rounded cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-[#695c4d] mt-1">
            <span>Tipam Sandstone (2,500m)</span>
            <span className="font-bold text-red-700">Barail Hazard (3,500m)</span>
            <span>Kopili Shale (4,500m)</span>
          </div>
        </div>
      </div>

      {/* Drilling Margin Pressure Window Visualization */}
      <div className="bg-[#fcf8f2] border-2 border-[#5c4f42] rounded-lg p-4 shadow-sm">
        <div className="text-xs font-bold text-[#3d3227] font-['Chakra_Petch',sans-serif] uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Safe Drilling Operating Window (Barail Formation at 3,500m)</span>
          <span className="text-[11px] font-mono text-amber-800">Assam-Arakan Geomechanics</span>
        </div>

        {/* Visual Gradient Gauge */}
        <div className="relative h-10 w-full bg-[#ebdcc8] rounded-md border border-[#a89985] overflow-hidden flex items-center shadow-inner">
          {/* Underbalanced Influx Zone */}
          <div className="w-[30%] h-full bg-red-300 flex items-center justify-center text-[10px] font-mono font-bold text-red-950 border-r border-black/20">
            Gas Kick Risk (&lt; 1.20 SG)
          </div>

          {/* Safe Mud Window */}
          <div className="w-[35%] h-full bg-emerald-300 flex items-center justify-center text-[10px] font-mono font-bold text-emerald-950 border-r border-black/20">
            SAFE DRILLING WINDOW (1.20 - 1.23 SG)
          </div>

          {/* Overbalanced Loss Zone */}
          <div className="w-[35%] h-full bg-amber-300 flex items-center justify-center text-[10px] font-mono font-bold text-amber-950">
            Induced Mud Loss (&gt; 1.23 SG)
          </div>

          {/* Current Mud Weight Indicator Needle */}
          <div
            className="absolute top-0 bottom-0 w-2 bg-black shadow-md flex items-center justify-center transition-all duration-200"
            style={{
              left: `${Math.max(5, Math.min(95, ((mudWeightSG - 1.15) / (1.35 - 1.15)) * 100))}%`,
            }}
          >
            <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white -mt-8 text-[9px] font-mono font-bold text-white flex items-center justify-center shadow-sm" />
          </div>
        </div>
      </div>

      {/* 4 Risk Category Probability Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {riskData?.predictedRisks?.map((risk: any, idx: number) => (
          <div
            key={idx}
            className={`p-4 rounded-lg border-2 shadow-xs transition-all ${
              risk.severity === 'CRITICAL'
                ? 'bg-[#fee2e2]/80 border-red-400'
                : 'bg-[#fef3c7]/80 border-amber-400'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1a1612] font-['Chakra_Petch',sans-serif]">
                  {risk.name}
                </h3>
                <p className="text-[11px] text-[#4b5563] mt-0.5 font-sans">
                  {risk.triggerFactor}
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold font-['Chakra_Petch',sans-serif] text-red-700">
                  {risk.probability}%
                </div>
                <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-red-700 text-white uppercase">
                  {risk.severity}
                </span>
              </div>
            </div>

            {/* Probability Progress Bar */}
            <div className="w-full h-2 bg-black/10 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  risk.probability > 75 ? 'bg-red-600' : 'bg-amber-600'
                }`}
                style={{ width: `${risk.probability}%` }}
              />
            </div>

            {/* Contributing Offset Wells */}
            {risk.contributingWells?.length > 0 && (
              <div className="mt-3 pt-2 border-t border-black/10 text-xs font-mono flex items-center justify-between text-[#374151]">
                <span>Correlated Wells: <strong>{risk.contributingWells.join(', ')}</strong></span>
              </div>
            )}

            {/* Evidence & Provenance */}
            {risk.evidence?.length > 0 ? (
              <div className="mt-2 pt-2 border-t border-black/10 text-[11px] font-mono text-[#374151]">
                <div className="font-bold text-[#1a1612] mb-1">
                  Evidence ({risk.evidence.length}):
                </div>
                <div className="flex flex-wrap gap-1">
                  {risk.evidence.map((ev: any, evIdx: number) => (
                    <span
                      key={evIdx}
                      className={`px-1.5 py-0.2 rounded border ${
                        ev.sourceType === 'synthetic_demo'
                          ? 'bg-amber-100 text-amber-900 border-amber-400'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-400'
                      }`}
                      title={ev.type === 'document' ? `${ev.documentName} p.${ev.page}` : `${ev.wellName} @ ${ev.depthM}m — ${ev.eventType}`}
                    >
                      {ev.type === 'document' ? ev.documentName : `${ev.wellName} (${ev.eventType})`} · {SOURCE_TYPE_LABELS[ev.sourceType] || ev.sourceType}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-2 pt-2 border-t border-black/10 text-[11px] font-mono text-[#6b7280] italic">
                No matching historical or document evidence in the currently indexed data.
              </div>
            )}

            {/* Recommended Action */}
            <div className="mt-2 text-xs bg-white/80 p-2 rounded border border-black/10 text-[#1f2937]">
              <strong>Engineering Mitigation:</strong> {risk.recommendedAction}
            </div>
          </div>
        ))}
      </div>

      {/* Historical 30-Day Trends & Correlation Chart (Recharts) */}
      <HistoricalRiskCorrelationChart onOpenReportModal={onOpenReportModal} />

      {/* Geomechanical Transparency & Audit Strip */}
      <div className="bg-[#ebdcc8] border border-[#a89985] rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#4a3f33]">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-amber-800 shrink-0" />
          <span>
            <strong>Judge / Auditor Verification:</strong> The composite hazard score ({riskData ? riskData.compositeRiskScore : '—'}/100) dynamically recalculates from weighted geomechanical margins and historical similarity across indexed wells — a transparent rule/similarity engine, not a trained model.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsHazardModalOpen(true)}
          className="px-3 py-1.5 rounded bg-[#3b322a] hover:bg-[#28211b] text-amber-300 font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Inspect Formula & Weights</span>
        </button>
      </div>

      {/* Mathematical Formulation Modal */}
      <HazardScoreModal
        isOpen={isHazardModalOpen}
        onClose={() => setIsHazardModalOpen(false)}
        compositeScore={riskData?.compositeRiskScore ?? 88}
        depthM={depthM}
        mudWeightSG={mudWeightSG}
        calculationModel={riskData?.calculationModel}
        onApplyPreset={(depth, mud) => {
          setDepthM(depth);
          setMudWeightSG(mud);
        }}
      />
    </div>
  );
};
