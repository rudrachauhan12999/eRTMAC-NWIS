import React from 'react';
import { Sparkles, Play, ShieldAlert, CheckCircle2, ArrowRight, HelpCircle } from 'lucide-react';
import { OPERATIONAL_SCENARIOS, OperationalScenario } from '../data/wellsData.ts';

interface FieldDemosViewProps {
  onRunScenario: (scenario: OperationalScenario) => void;
}

export const FieldDemosView: React.FC<FieldDemosViewProps> = ({ onRunScenario }) => {
  return (
    <div className="flex-1 p-4 max-w-7xl mx-auto w-full select-none flex flex-col gap-4">
      {/* Top Banner */}
      <div className="bg-[#463d35] text-white p-4 rounded-lg border-2 border-[#352d26] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold font-['Chakra_Petch',sans-serif] tracking-wide">
              Wellsite Operational Drill & Field Scenarios
            </h2>
            <span className="bg-amber-600 text-black text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold">
              1-Click Interactive Simulations
            </span>
          </div>
          <p className="text-xs text-stone-300 mt-1">
            Pre-configured benchmark operational drills aligned with Oil India Limited standard operating procedures.
          </p>
        </div>

        <div className="text-xs font-mono text-amber-300 bg-[#2b241d] px-3 py-1.5 rounded border border-[#524436]">
          Field Division: Oil India Limited (Assam-Arakan)
        </div>
      </div>

      {/* Demo Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {OPERATIONAL_SCENARIOS.map((sc, idx) => (
          <div
            key={sc.id}
            className="bg-[#fcf8f2] rounded-lg border-2 border-[#5c4f42] p-4 flex flex-col justify-between shadow-sm hover:border-amber-700 hover:shadow-md transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-[#463d35] text-amber-300 flex items-center justify-center font-bold text-xs font-mono">
                  0{idx + 1}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  {sc.formationTarget} • {sc.depthTarget}m
                </span>
              </div>

              <h3 className="text-sm font-bold text-[#1c1815] font-['Chakra_Petch',sans-serif] group-hover:text-amber-800 transition-colors">
                {sc.title}
              </h3>

              <p className="text-xs text-[#554a3e] mt-2 line-clamp-2 leading-relaxed">
                {sc.desc}
              </p>

              {/* Prompt Preview */}
              <div className="mt-3 p-2 bg-[#ebdcc8] rounded border border-[#c4b5a2] text-[11px] font-mono text-[#2c241c]">
                <span className="text-[#695c4d] block">Automated RAG Prompt:</span>
                <strong className="line-clamp-2">"{sc.query}"</strong>
              </div>

              {/* Category Badge */}
              <div className="mt-2 text-[11px] text-[#1e3a8a] bg-blue-50 p-2 rounded border border-blue-200 flex items-center justify-between">
                <span>Evaluation Focus:</span>
                <strong className="font-mono">{sc.badge}</strong>
              </div>
            </div>

            {/* Launch Button */}
            <button
              onClick={() => onRunScenario(sc)}
              className="mt-4 w-full py-2 rounded bg-[#2c241d] hover:bg-[#1a1612] text-amber-300 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors font-mono"
            >
              <Play className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Execute Scenario #{idx + 1}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
