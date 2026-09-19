import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Activity,
  Layers,
  MapPin,
  ChevronRight,
  Sparkles,
  Info,
  Clock,
  Gauge,
  UserCheck,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  Database,
  Search,
  Sliders,
  Cpu,
  Radio,
  BarChart2,
  ExternalLink,
  Flame,
  Droplets,
  BookOpen,
} from 'lucide-react';
import { UserProfile } from '../types/auth.ts';
import { ActiveTab } from './HeaderBar.tsx';
import {
  ACTIVE_WELL,
  NEARBY_WELLS,
  STRATIGRAPHIC_FORMATIONS,
  HISTORICAL_INCIDENTS,
  PREDICTIVE_ALERTS,
} from '../data/wellsData.ts';

interface IntelligenceDashboardViewProps {
  currentUser: UserProfile;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onExportPdf?: () => void;
}

// Flowchart architecture step definitions
interface PipelineStep {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badge: string;
  badgeColor: string;
  description: string;
  metrics: string;
  details: string[];
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 1,
    title: '1. Multi-Well Ingestion',
    subtitle: 'WCR, DDR & Mud Logs',
    icon: Database,
    badge: '18 Wells Indexed',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    description: 'Continuous harvesting of historical well completion reports, daily drilling logs, and lithological composite logs from the Assam-Arakan Basin archive.',
    metrics: '1,250 Reports • 42 Historical Incidents',
    details: [
      'Digital ingestion of legacy Oil India Limited WCRs dating back to 1985',
      'Continuous parsing of 24-hour Daily Drilling Reports (DDR)',
      'Master stratigraphy cross-referencing against Upper Assam Basin standards',
    ],
  },
  {
    id: 2,
    title: '2. Vector OCR & Geospatial Mesh',
    subtitle: 'Spatial Coordinates & Strata Dip',
    icon: Search,
    badge: '4.2° SSE Dip Adjusted',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'Transforms unstructured drilling documentation into geo-referenced vector embeddings aligned with regional tectonic fault blocks and strike angles.',
    metrics: 'Cosine Distance Weighting • 0.88 Avg Similarity',
    details: [
      'Document chunking with stratigraphic depth tags (every 10m interval)',
      'Subsurface geological dip correction (4.2° toward Naga Thrust belt)',
      'Automated extraction of casing points, mud weight schedules, and LOT values',
    ],
  },
  {
    id: 3,
    title: '3. Real-Time Telemetry Stream',
    subtitle: 'Rig WITSML Sensor Feed',
    icon: Radio,
    badge: 'Live WITSML 1 Hz',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'High-frequency telemetry ingestion from active drilling rig sensors tracking ROP, WOB, Rotary Torque, Standpipe Pressure, Gas, and Flow Differential.',
    metrics: 'Active Sensor Feed: NWIS-Active-01 @ 3,500m',
    details: [
      'Millisecond sampling of surface hookload, torque, and RPM',
      'Real-time mud logging delta flow (paddle return vs stroke counter)',
      'Automated threshold boundary checks against safe operating envelope',
    ],
  },
  {
    id: 4,
    title: '4. Spatial RAG Correlation Engine',
    subtitle: 'Cross-Well Hazard Reasoning',
    icon: Cpu,
    badge: 'Hybrid AI Reasoning',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Correlates live borehole parameters against verified historical failure modes from direct offset wells within a 3 km radius.',
    metrics: 'Gemini + Oil India Subsurface Grounding',
    details: [
      'Instant retrieval of closest offset incident reports (e.g., NWIS-Calire-02 at 1.4 km)',
      'Dynamic geomechanical pore pressure vs fracture gradient correlation',
      'Hallucination-free synthesis strictly grounded in verified completion logs',
    ],
  },
  {
    id: 5,
    title: '5. Automated Rig Advisory Dispatch',
    subtitle: 'Executive Field Action',
    icon: ShieldAlert,
    badge: 'Actionable SOPs',
    badgeColor: 'bg-red-100 text-red-900 border-red-300',
    description: 'Generates prescriptive, step-by-step engineering recommendations for the driller, toolpusher, and mud engineer before hazards escalate into NPT.',
    metrics: 'Proven LCM Recipes • Kill Mud Calc • Drill Specs',
    details: [
      'Immediate alert broadcast to rig floor and Duliajan central control',
      'Dual-barrier mud weight trimming guidance (1.21 - 1.22 SG window)',
      'Shift tour handover export with verifiable document citations',
    ],
  },
];

// Interactive simulation scenarios
interface ScenarioOption {
  id: string;
  name: string;
  formation: string;
  depthM: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'STABLE';
  summary: string;
  offsetWell: string;
  offsetIncident: string;
  offsetDistKm: number;
  params: {
    rop: number;
    wob: number;
    torque: number;
    spp: number;
    gas: number;
    mudWeight: number;
    flowDelta: number;
  };
  remedy: string;
}

const SCENARIOS: ScenarioOption[] = [
  {
    id: 'sc-1',
    name: 'Mud Loss in Depleted Sandstone',
    formation: 'Barail Sand-4 (Depleted Zone)',
    depthM: 3480,
    severity: 'CRITICAL',
    summary: 'Fracture breakdown gradient breached due to dynamic surge pressure. Active mud losses detected at 38 m³/hr.',
    offsetWell: 'NWIS-Calire-02',
    offsetIncident: '48 m³ mud loss at 3,480m requiring 50 bbl dual-density LCM pill & 4h hesitation squeeze.',
    offsetDistKm: 1.4,
    params: {
      rop: 4.2,
      wob: 10.0,
      torque: 12.8,
      spp: 2420,
      gas: 6,
      mudWeight: 1.25,
      flowDelta: -42,
    },
    remedy: 'Immediately reduce active mud density to 1.21 SG. Spot 45 bbl LCM pill (25 ppb nut plug + 15 ppb CaCO3) across the loss interval.',
  },
  {
    id: 'sc-2',
    name: 'Coal Cleat Sloughing & Torque Surge',
    formation: 'Barail Coal-Shale Main Pay',
    depthM: 3500,
    severity: 'HIGH',
    summary: 'Sub-bituminous coal cleat spalling causing annular ledge formation, severe stick-slip, and torque oscillations exceeding 24 kNm.',
    offsetWell: 'NWIS-Active-02',
    offsetIncident: 'Torque spiked to 29.5 kNm with blocky coal cavings on shakers at 3,520m.',
    offsetDistKm: 2.1,
    params: {
      rop: 6.8,
      wob: 11.5,
      torque: 22.4,
      spp: 2780,
      gas: 18,
      mudWeight: 1.24,
      flowDelta: -4,
    },
    remedy: 'Cap rotary RPM at 70 and WOB at 10 tons. Pump 20 m³ high-viscosity XC-polymer pill to clear annular cavings.',
  },
  {
    id: 'sc-3',
    name: 'Trapped Gas Influx / Kick Warning',
    formation: 'Barail Lower Sand Lens',
    depthM: 3495,
    severity: 'CRITICAL',
    summary: 'Pore pressure kick (1.23 SG equivalent) penetrated. Background gas surging rapidly to 480 units with active pit gain.',
    offsetWell: 'NWIS-Colive-04',
    offsetIncident: '18 bbl gas kick at 3,495m. Driller shut-in on annular preventer (SIDPP 320 psi).',
    offsetDistKm: 1.9,
    params: {
      rop: 11.2,
      wob: 9.0,
      torque: 11.2,
      spp: 2890,
      gas: 340,
      mudWeight: 1.18,
      flowDelta: +36,
    },
    remedy: 'Perform immediate space-out and hard shut-in. Verify SIDPP & SICP. Prepare kill mud weighted to 1.23 SG using Wait & Weight procedure.',
  },
  {
    id: 'sc-4',
    name: 'Normal Drilling Baseline',
    formation: 'Barail Upper Siltstone',
    depthM: 3440,
    severity: 'STABLE',
    summary: 'Borehole stable. Flow in/out balanced, torque smooth, cuttings homogeneous, ECD within 1.21 SG target window.',
    offsetWell: 'OIL-MOR-188',
    offsetIncident: 'Smooth drilling through upper Barail capstone. Average ROP 8.4 m/hr.',
    offsetDistKm: 4.2,
    params: {
      rop: 8.4,
      wob: 12.0,
      torque: 11.0,
      spp: 2550,
      gas: 12,
      mudWeight: 1.21,
      flowDelta: 0,
    },
    remedy: 'Maintain current drilling parameters. Monitor for formation top contact in the next 40 meters.',
  },
];

export const IntelligenceDashboardView: React.FC<IntelligenceDashboardViewProps> = ({
  currentUser,
  onOpenAuth,
  onNavigateTab,
  onExportPdf,
}) => {
  // Selected pipeline step for flowchart inspector
  const [selectedStepId, setSelectedStepId] = useState<number>(3);

  // Active interactive scenario
  const [activeScenarioId, setActiveScenarioId] = useState<string>('sc-2');
  const activeScenario = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[1];

  // Simulation execution stepper state
  const [simulationProgress, setSimulationProgress] = useState<number>(3);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Animated stepper progression
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setSimulationProgress((prev) => (prev >= 5 ? 1 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [isSimulating]);

  const selectedStep = PIPELINE_STEPS.find((s) => s.id === selectedStepId) || PIPELINE_STEPS[2];

  // Drilling margin calculation
  const mudWeight = activeScenario.params.mudWeight;
  const porePressure = 1.20;
  const fracLimit = 1.23;
  const isLossRisk = mudWeight > fracLimit;
  const isKickRisk = mudWeight < porePressure;

  return (
    <div className="flex-1 p-4 md:p-6 max-w-[1550px] w-full mx-auto select-none space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-[#463d35] text-white p-4 md:p-5 rounded-xl border-2 border-[#352d26] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-3.5">
          <img
            src="/oil_india_logo.png"
            alt="Oil India Limited"
            className="w-11 h-11 object-contain shrink-0 bg-white/10 p-1 rounded border border-white/20"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg md:text-xl font-bold font-['Chakra_Petch',sans-serif] tracking-wide text-amber-300">
                REAL-TIME WELLBORE INTELLIGENCE DASHBOARD
              </h2>
              <span className="bg-emerald-600 text-white text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                eRTMAC-NWIS
              </span>
              <span className="bg-amber-600 text-black text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Active Tour Shift
              </span>
            </div>
            <p className="text-xs text-stone-300 font-mono mt-0.5">
              Active Well: <strong className="text-white">{ACTIVE_WELL.name}</strong> • Rig: {ACTIVE_WELL.rigName} • Subsurface Interval: 3,480m - 3,520m
            </p>
          </div>
        </div>

        {/* Quick Engineer Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              className="bg-[#2a241e] hover:bg-[#382f27] text-amber-300 border border-amber-500/50 hover:border-amber-400 px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Shift Tour PDF</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigateTab('operations')}
            className="bg-[#2a241e] hover:bg-[#382f27] text-stone-200 border border-stone-600 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Operations Console</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. Interactive System Architecture Flowchart (5-Stage Visual Process Diagram) */}
      <div className="bg-[#fcf8f2] border-2 border-[#5c4f42] rounded-xl p-4 md:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ded0bd] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-700" />
            <h3 className="text-sm md:text-base font-bold font-['Chakra_Petch',sans-serif] text-[#1c1815]">
              AUTONOMOUS INTELLIGENCE PIPELINE: HOW eRTMAC-NWIS REASONS
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#695c4d]">
            Click any step to inspect technical implementation details
          </span>
        </div>

        {/* 5-Step Process Flow Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {PIPELINE_STEPS.map((step) => {
            const Icon = step.icon;
            const isSelected = selectedStepId === step.id;
            const isProgressActive = simulationProgress === step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setSelectedStepId(step.id)}
                className={`text-left p-3 rounded-lg border-2 transition-all flex flex-col justify-between cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#f0e4d2] border-amber-700 shadow-sm'
                    : 'bg-[#f7efe3] border-[#d8c8b4] hover:bg-[#f2e7d7]'
                }`}
              >
                {/* Simulation animated indicator */}
                {isProgressActive && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-amber-600 animate-pulse" />
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center ${
                        isSelected ? 'bg-[#3d3227] text-amber-300' : 'bg-[#e5d6c2] text-[#42362a]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${step.badgeColor}`}>
                      Step {step.id}
                    </span>
                  </div>

                  <div className="font-bold text-xs font-['Chakra_Petch',sans-serif] text-[#1c1815]">
                    {step.title}
                  </div>
                  <div className="text-[10px] font-mono text-[#695c4d] mt-0.5">
                    {step.subtitle}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#dfd0bd] flex items-center justify-between text-[10px] font-mono">
                  <span className={isSelected ? 'text-amber-800 font-bold' : 'text-[#85735e]'}>
                    {isSelected ? 'Active View' : 'Inspect'}
                  </span>
                  <ChevronRight className={`w-3 h-3 ${isSelected ? 'text-amber-800' : 'text-[#85735e]'}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Inspector for Selected Step */}
        <div className="bg-[#f5ede1] border border-[#d6c7b2] rounded-lg p-3.5 md:p-4 text-xs font-mono space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ddcdb8] pb-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#3b3026] text-amber-300 flex items-center justify-center text-[11px] font-bold">
                {selectedStep.id}
              </span>
              <strong className="text-sm font-['Chakra_Petch',sans-serif] text-[#1c1815]">
                {selectedStep.title} — {selectedStep.subtitle}
              </strong>
            </div>
            <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
              {selectedStep.metrics}
            </span>
          </div>

          <p className="text-[#3d3227] leading-relaxed">
            {selectedStep.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
            {selectedStep.details.map((detail, idx) => (
              <div key={idx} className="bg-white/80 p-2.5 rounded border border-[#dfd0bd] flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <span className="text-[11px] text-[#423528] leading-snug">{detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Interactive Scenario Simulation Runner & Stepper */}
      <div className="bg-[#fcf8f2] border-2 border-[#5c4f42] rounded-xl p-4 md:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ded0bd] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <h3 className="text-sm md:text-base font-bold font-['Chakra_Petch',sans-serif] text-[#1c1815]">
                INTERACTIVE OPERATIONAL SCENARIOS (REAL FIELD DRILLS)
              </h3>
            </div>
            <p className="text-xs font-mono text-[#695c4d] mt-0.5">
              Select an operational drill to evaluate how the intelligence system detects, correlates, and mitigates risks.
            </p>
          </div>

          {/* Simulation Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSimulating(!isSimulating)}
              className="bg-[#2c241d] hover:bg-[#1a1612] text-amber-300 px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSimulating ? 'Pause Loop' : 'Play Loop'}</span>
            </button>
            <button
              type="button"
              onClick={() => setSimulationProgress(1)}
              className="bg-[#ebe0ce] hover:bg-[#decdb7] text-[#3d3227] border border-[#c4b5a2] px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset simulation loop"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Scenario Selection Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SCENARIOS.map((sc) => {
            const isSelected = activeScenarioId === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => {
                  setActiveScenarioId(sc.id);
                  setSimulationProgress(1);
                }}
                className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#f2e7d7] border-amber-700 shadow-sm'
                    : 'bg-[#fbf7f0] border-[#d8c8b4] hover:bg-[#f5ede1]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#463d35] text-amber-300">
                      {sc.depthM} m
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        sc.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-900 border border-red-300'
                          : sc.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}
                    >
                      {sc.severity}
                    </span>
                  </div>
                  <strong className="text-xs font-['Chakra_Petch',sans-serif] text-[#1c1815] block">
                    {sc.name}
                  </strong>
                  <div className="text-[10px] font-mono text-[#786653] mt-0.5">
                    {sc.formation}
                  </div>
                </div>

                <div className="mt-2 text-[10px] font-mono text-[#5c4f42] flex items-center gap-1">
                  <span>Offset:</span>
                  <strong className="text-[#1c1815]">{sc.offsetWell}</strong>
                  <span>({sc.offsetDistKm} km)</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Active Scenario Breakdown & Simulation Stage Bar */}
        <div className="bg-[#f5ede1] border border-[#d6c7b2] rounded-lg p-4 space-y-4">
          {/* Progress Stage Tracker */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#3d3227] mb-2">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-800" />
                <span>Simulation Stepper: Automated Detection & Response Cycle</span>
              </span>
              <span className="text-[11px] bg-[#3a3026] text-amber-300 px-2 py-0.5 rounded">
                Stage {simulationProgress} of 5: {
                  simulationProgress === 1 ? 'Sensor Telemetry Influx' :
                  simulationProgress === 2 ? 'Subsurface Envelope Check' :
                  simulationProgress === 3 ? 'Offset Well Match & RAG Synthesis' :
                  simulationProgress === 4 ? 'Geomechanical Verification' :
                  'Prescriptive Advisory Dispatch'
                }
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 h-2 w-full">
              {[1, 2, 3, 4, 5].map((st) => (
                <div
                  key={st}
                  className={`h-full rounded-sm transition-colors ${
                    st <= simulationProgress ? 'bg-amber-600' : 'bg-[#dacab6]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Scenario Metrics & Immediate Guidance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs font-mono">
            {/* Column 1: Live Scenario Sensor State */}
            <div className="bg-white p-3 rounded-lg border border-[#ded0bd] space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase text-[#85735e] block">
                Simulated Borehole Parameters
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[#6b5a48] block">ROP:</span>
                  <strong className="text-sm text-[#1c1815]">{activeScenario.params.rop} m/h</strong>
                </div>
                <div>
                  <span className="text-[#6b5a48] block">Torque:</span>
                  <strong className={`text-sm ${activeScenario.params.torque > 18 ? 'text-amber-800' : 'text-[#1c1815]'}`}>
                    {activeScenario.params.torque} kNm
                  </strong>
                </div>
                <div>
                  <span className="text-[#6b5a48] block">Active Mud:</span>
                  <strong className={`text-sm ${isLossRisk ? 'text-red-700' : 'text-[#1c1815]'}`}>
                    {activeScenario.params.mudWeight} SG
                  </strong>
                </div>
                <div>
                  <span className="text-[#6b5a48] block">Delta Flow:</span>
                  <strong className={`text-sm ${
                    activeScenario.params.flowDelta < 0 ? 'text-amber-800' :
                    activeScenario.params.flowDelta > 0 ? 'text-red-700' : 'text-emerald-700'
                  }`}>
                    {activeScenario.params.flowDelta > 0 ? `+${activeScenario.params.flowDelta}` : activeScenario.params.flowDelta} LPM
                  </strong>
                </div>
              </div>
            </div>

            {/* Column 2: Historical Offset Precedent */}
            <div className="bg-white p-3 rounded-lg border border-[#ded0bd] space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-[#85735e] block">
                Direct Offset Incident Match
              </span>
              <div className="flex items-center justify-between">
                <strong className="text-sm text-[#1c1815]">{activeScenario.offsetWell}</strong>
                <span className="text-[10px] text-[#705e4c] font-bold">{activeScenario.offsetDistKm} km Radius</span>
              </div>
              <p className="text-[11px] text-[#4d4033] leading-snug">
                {activeScenario.offsetIncident}
              </p>
            </div>

            {/* Column 3: Synthesized Rig Advisory */}
            <div className="bg-[#faf5ec] p-3 rounded-lg border-2 border-amber-600/50 space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-amber-900 block">
                Prescribed Field Mitigation
              </span>
              <p className="text-[11px] text-[#2c241c] leading-snug font-semibold">
                {activeScenario.remedy}
              </p>
              <div className="pt-1 flex items-center justify-between text-[10px] text-amber-800 font-bold">
                <span>Verified Oil India SOP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Safe Operating Envelope (Pore vs. Frac Window) */}
      <div className="bg-[#fcf8f2] border-2 border-[#5c4f42] rounded-xl p-4 md:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ded0bd] pb-2.5">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-700" />
            <h3 className="text-sm md:text-base font-bold font-['Chakra_Petch',sans-serif] text-[#1c1815]">
              GEOMECHANICAL DRILLING ENVELOPE (PORE PRESSURE VS FRACTURE GRADIENT)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#695c4d]">
            Target Formation: {activeScenario.formation} @ {activeScenario.depthM}m
          </span>
        </div>

        {/* Visual Safe Envelope Bar */}
        <div className="relative h-10 w-full bg-[#ebdcc8] rounded-lg border-2 border-[#a89985] overflow-hidden flex items-center shadow-inner">
          {/* Underbalanced Kick Zone (< 1.20 SG) */}
          <div className="w-[30%] h-full bg-red-200 flex flex-col justify-center items-center text-[10px] font-mono font-bold text-red-950 border-r border-red-400/50">
            <span>INFLUX / KICK RISK</span>
            <span className="text-[9px] font-normal text-red-800">&lt; 1.20 SG (Pore Pressure)</span>
          </div>

          {/* Safe Operational Window (1.20 - 1.23 SG) */}
          <div className="w-[40%] h-full bg-emerald-200/90 flex flex-col justify-center items-center text-[11px] font-mono font-bold text-emerald-950 border-r border-emerald-400">
            <span>SAFE OPERATING ENVELOPE</span>
            <span className="text-[9px] font-normal text-emerald-800">1.20 to 1.23 SG (Safe Margin: 0.03 SG)</span>
          </div>

          {/* Overbalanced Loss Zone (> 1.23 SG) */}
          <div className="w-[30%] h-full bg-amber-200 flex flex-col justify-center items-center text-[10px] font-mono font-bold text-amber-950">
            <span>MUD LOSS / FRACTURE RISK</span>
            <span className="text-[9px] font-normal text-amber-800">&gt; 1.23 SG (Fracture Limit)</span>
          </div>

          {/* Needle indicator */}
          <div
            className="absolute top-0 bottom-0 w-2.5 bg-black shadow-lg flex items-center justify-center transition-all duration-300"
            style={{
              left: `${Math.max(5, Math.min(95, ((mudWeight - 1.15) / (1.30 - 1.15)) * 100))}%`,
            }}
            title={`Active Mud: ${mudWeight} SG`}
          >
            <div className="w-5 h-5 rounded-full bg-red-600 border-2 border-white -mt-9 text-[9px] font-mono font-bold text-white flex items-center justify-center shadow-md">
              ▼
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-[#3d3227] bg-[#f2e6d5] p-2.5 rounded-lg border border-[#d6c7b2]">
          <div>
            Active Mud Weight: <strong>{mudWeight.toFixed(2)} SG</strong> • Formation Pore Pressure: <strong>1.20 SG</strong> • Formation Fracture Breakdown: <strong>1.23 SG</strong>
          </div>
          <div className={`font-bold px-2 py-0.5 rounded text-[11px] ${
            isLossRisk ? 'bg-amber-200 text-amber-950' :
            isKickRisk ? 'bg-red-200 text-red-950' :
            'bg-emerald-200 text-emerald-950'
          }`}>
            Status: {isLossRisk ? 'Loss Risk (Overbalanced)' : isKickRisk ? 'Kick Risk (Underbalanced)' : 'Optimal Safe Window'}
          </div>
        </div>
      </div>

      {/* 5. 3 Real Rig Site Pillars: Sensor Feed, Historical Radar, Stratigraphy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pillar 1: 6 Core Live Rig Sensors */}
        <div className="bg-[#fcf8f2] border-2 border-[#5c4f42] rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-[#ded0bd] pb-2 mb-3">
              <div className="flex items-center gap-1.5 font-bold font-['Chakra_Petch',sans-serif] text-sm text-[#1c1815]">
                <Activity className="w-4 h-4 text-amber-700" />
                <span>Live Sensor Telemetry</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                1 Hz WITSML
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-[#f5ede1] p-2 rounded border border-[#dacbb8]">
                <span className="text-[#8c7862] text-[10px] block uppercase">Bit Depth</span>
                <strong className="text-base text-[#1c1815]">{activeScenario.depthM} m</strong>
                <span className="text-[9px] text-[#5c4f42] block">TVD Target: 4,850m</span>
              </div>

              <div className="bg-[#f5ede1] p-2 rounded border border-[#dacbb8]">
                <span className="text-[#8c7862] text-[10px] block uppercase">ROP</span>
                <strong className="text-base text-[#1c1815]">{activeScenario.params.rop} m/h</strong>
                <span className="text-[9px] text-emerald-700 block">Penetration Rate</span>
              </div>

              <div className="bg-[#f5ede1] p-2 rounded border border-[#dacbb8]">
                <span className="text-[#8c7862] text-[10px] block uppercase">Weight on Bit</span>
                <strong className="text-base text-[#1c1815]">{activeScenario.params.wob} T</strong>
                <span className="text-[9px] text-[#5c4f42] block">Cap: 14 Tons</span>
              </div>

              <div className="bg-[#f5ede1] p-2 rounded border border-[#dacbb8]">
                <span className="text-[#8c7862] text-[10px] block uppercase">Torque</span>
                <strong className={`text-base ${activeScenario.params.torque > 18 ? 'text-amber-800' : 'text-[#1c1815]'}`}>
                  {activeScenario.params.torque} kNm
                </strong>
                <span className="text-[9px] text-amber-700 block">Stick-Slip Monitor</span>
              </div>

              <div className="bg-[#f5ede1] p-2 rounded border border-[#dacbb8]">
                <span className="text-[#8c7862] text-[10px] block uppercase">Standpipe Press.</span>
                <strong className="text-base text-[#1c1815]">{activeScenario.params.spp} psi</strong>
                <span className="text-[9px] text-emerald-700 block">Triplex Pump</span>
              </div>

              <div className="bg-[#f5ede1] p-2 rounded border border-[#dacbb8]">
                <span className="text-[#8c7862] text-[10px] block uppercase">Total Gas</span>
                <strong className={`text-base ${activeScenario.params.gas > 100 ? 'text-red-700' : 'text-amber-900'}`}>
                  {activeScenario.params.gas} u
                </strong>
                <span className="text-[9px] text-[#5c4f42] block">C1-C4 Chromatograph</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('telemetry')}
            className="w-full py-1.5 rounded-lg bg-[#ebdcc8] hover:bg-[#decdb7] text-[#2d241d] font-mono font-bold text-xs flex items-center justify-center gap-1 transition-colors border border-[#c4b5a2] cursor-pointer"
          >
            <span>Open Real-Time Telemetry Simulator</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pillar 2: 3 Direct Offset Incident Pins */}
        <div className="bg-[#fcf8f2] border-2 border-[#5c4f42] rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-[#ded0bd] pb-2 mb-3">
              <div className="flex items-center gap-1.5 font-bold font-['Chakra_Petch',sans-serif] text-sm text-[#1c1815]">
                <MapPin className="w-4 h-4 text-amber-700" />
                <span>Nearby Offset Incident Radar</span>
              </div>
              <span className="text-[10px] font-mono text-[#5c4f42] bg-[#ebdcc8] px-1.5 py-0.5 rounded">
                &lt; 3 km
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="bg-[#fbf7f0] p-2 rounded-lg border border-[#ded0bd] space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-[#1c1815]">NWIS-Calire-02</strong>
                  <span className="text-red-700 font-bold text-[10px] bg-red-100 px-1.5 py-0.2 rounded">
                    48 m³ LOSS @ 3,480m
                  </span>
                </div>
                <p className="text-[11px] text-[#5c4f42] leading-snug">
                  1.4 km NW • Surge at 1.25 SG fractured Barail Sand-4. Cured by 50 bbl dual-density LCM pill.
                </p>
              </div>

              <div className="bg-[#fbf7f0] p-2 rounded-lg border border-[#ded0bd] space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-[#1c1815]">NWIS-Colive-04</strong>
                  <span className="text-amber-700 font-bold text-[10px] bg-amber-100 px-1.5 py-0.2 rounded">
                    18 bbl KICK @ 3,495m
                  </span>
                </div>
                <p className="text-[11px] text-[#5c4f42] leading-snug">
                  1.9 km NE • 1.18 SG underbalanced gas influx. Controlled via Wait & Weight with 1.22 SG kill mud.
                </p>
              </div>

              <div className="bg-[#fbf7f0] p-2 rounded-lg border border-[#ded0bd] space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-[#1c1815]">NWIS-Active-02</strong>
                  <span className="text-purple-700 font-bold text-[10px] bg-purple-100 px-1.5 py-0.2 rounded">
                    TORQUE SPIKE @ 3,520m
                  </span>
                </div>
                <p className="text-[11px] text-[#5c4f42] leading-snug">
                  2.1 km SSE • Barail coal sloughing choked annulus. Resolved with high-viscosity XC-polymer sweep.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('historical-events')}
            className="w-full py-1.5 rounded-lg bg-[#ebdcc8] hover:bg-[#decdb7] text-[#2d241d] font-mono font-bold text-xs flex items-center justify-center gap-1 transition-colors border border-[#c4b5a2] cursor-pointer"
          >
            <span>Explore All 42 Offset Historical Incidents</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pillar 3: Stratigraphic Look-Ahead */}
        <div className="bg-[#fcf8f2] border-2 border-[#5c4f42] rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-[#ded0bd] pb-2 mb-3">
              <div className="flex items-center gap-1.5 font-bold font-['Chakra_Petch',sans-serif] text-sm text-[#1c1815]">
                <Layers className="w-4 h-4 text-amber-700" />
                <span>Stratigraphic Projection Ahead</span>
              </div>
              <span className="text-[10px] font-mono text-[#5c4f42] bg-[#ebdcc8] px-1.5 py-0.5 rounded">
                4.2° SSE Dip
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="bg-[#f5ede1] p-2 rounded border-2 border-amber-600/60">
                <div className="flex items-center justify-between text-[11px]">
                  <strong className="text-[#1c1815]">3,500m – 3,650m</strong>
                  <span className="text-amber-800 font-bold uppercase text-[9px]">Active Bit</span>
                </div>
                <div className="text-xs font-bold text-amber-900 mt-0.5">Barail Coal-Shale Main Pay</div>
                <div className="text-[10px] text-[#5c4f42] mt-1">
                  Pore: 1.20 SG • Frac: 1.23 SG • High Cleat Spalling Risk
                </div>
              </div>

              <div className="bg-[#fbf7f0] p-2 rounded border border-[#dacbb8]">
                <div className="flex items-center justify-between text-[11px]">
                  <strong className="text-[#1c1815]">3,650m Casing Point</strong>
                  <span className="text-[#6e5d4c] text-[9px]">Planned Seat</span>
                </div>
                <div className="text-xs font-bold text-stone-800 mt-0.5">Barail / Kopili Contact</div>
                <div className="text-[10px] text-[#5c4f42] mt-1">
                  Planned 9-5/8" Casing • Target LOT: 1.34 SG
                </div>
              </div>

              <div className="bg-[#fbf7f0] p-2 rounded border border-[#dacbb8]">
                <div className="flex items-center justify-between text-[11px]">
                  <strong className="text-[#1c1815]">3,650m – 4,200m</strong>
                  <span className="text-[#6e5d4c] text-[9px]">Lower Horizon</span>
                </div>
                <div className="text-xs font-bold text-stone-800 mt-0.5">Kopili Calcareous Shale</div>
                <div className="text-[10px] text-[#5c4f42] mt-1">
                  Pore: 1.12 SG • Requires KCl / Glycol Polymer Mud
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('analytics')}
            className="w-full py-1.5 rounded-lg bg-[#3b322a] hover:bg-[#28211b] text-amber-300 font-mono font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <span>Inspect 5-Well Stratigraphic Cross-Section</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 6. Active Tour Shift Handover & System Status */}
      <div className="bg-[#ebdcc8] border border-[#c4b5a2] rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#4a3f33]">
        <div className="flex items-center gap-2.5">
          <UserCheck className="w-4 h-4 text-emerald-800 shrink-0" />
          <span>
            Duty Officer: <strong>{currentUser.name}</strong> ({currentUser.role}, {currentUser.department}) • Clearance: <strong>{currentUser.clearanceLevel}</strong> • Tour: <strong>06:00 - 18:00 Day Shift</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenAuth('signin')}
            className="px-2.5 py-1 rounded bg-[#3b322a] hover:bg-[#28211b] text-amber-300 font-bold transition-colors cursor-pointer text-[11px]"
          >
            Switch Operator
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('system-docs')}
            className="px-2.5 py-1 rounded bg-[#f4ebe0] hover:bg-[#ebdcc8] border border-[#c4b5a2] text-[#332a21] transition-colors cursor-pointer text-[11px]"
          >
            System Architecture Specs
          </button>
        </div>
      </div>
    </div>
  );
};
