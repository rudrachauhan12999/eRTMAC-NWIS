import React, { useState, useEffect } from 'react';
import { Radio, Play, Pause, AlertTriangle, Activity, Gauge, Droplets, Flame } from 'lucide-react';
import { fetchCurrentTelemetry, TelemetryApiError, TelemetryReading } from '../services/telemetryApi.ts';

interface LiveTelemetryViewProps {
  // Optional well context — telemetry follows whichever well is selected
  // elsewhere in the app; defaults to the backend's own default well
  // (NWIS-Active-01) when nothing is selected yet, matching prior behavior.
  wellId?: string;
  wellName?: string;
}

export const LiveTelemetryView: React.FC<LiveTelemetryViewProps> = ({ wellId, wellName }) => {
  const [telemetry, setTelemetry] = useState<TelemetryReading | null>(null);
  const [history, setHistory] = useState<TelemetryReading[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Selected well changed — the backend simulator keeps independent
    // state per well, so the displayed reading must not carry over.
    setTelemetry(null);
    setHistory([]);
    setLoadError(null);
  }, [wellId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isStreaming) {
      const poll = async () => {
        try {
          const data = await fetchCurrentTelemetry(wellId);
          setTelemetry(data);
          setLoadError(null);
          setHistory((prev) => [...prev.slice(-20), data]);
        } catch (e) {
          setLoadError(e instanceof TelemetryApiError ? e.message : 'Could not reach the backend telemetry service.');
        }
      };

      poll();
      interval = setInterval(poll, 1500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, wellId]);

  const flowDelta = telemetry ? telemetry.mudFlowOutLpm - telemetry.mudFlowInLpm : 0;

  return (
    <div className="flex-1 p-4 max-w-7xl mx-auto w-full select-none flex flex-col gap-4">
      {/* Top Banner */}
      <div className="bg-[#463d35] text-white p-4 rounded-lg border-2 border-[#352d26] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="text-lg font-bold font-['Chakra_Petch',sans-serif] tracking-wide">
              Rig Sensor Telemetry Stream (WITSML Live Simulation)
            </h2>
            <span className="bg-red-600 text-white text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold animate-pulse">
              LIVE RIG DATA
            </span>
            {telemetry?.isSimulation && (
              <span
                className="bg-amber-200 text-amber-900 border border-amber-500 text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold"
                title="Simulated for demonstration — not proprietary Oil India eRTMAC data"
              >
                SIMULATED DEMO TELEMETRY
              </span>
            )}
          </div>
          <p className="text-xs text-stone-300 mt-1">
            Real-time downhole sensor stream for {wellName || telemetry?.wellId || 'the selected well'} (Rig OIL-E2000, Duliajan).
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold transition-colors ${
              isStreaming
                ? 'bg-amber-700 hover:bg-amber-800 text-white'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
          >
            {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isStreaming ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>
        </div>
      </div>

      {/* Backend Load State */}
      {!telemetry && !loadError && (
        <div className="p-3 bg-[#ebdcc8] border border-[#c4b5a2] text-[#5c5247] rounded-lg text-xs font-mono text-center">
          Connecting to backend telemetry stream…
        </div>
      )}
      {loadError && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-lg text-xs font-mono text-center">
          {loadError}
        </div>
      )}

      {/* Primary KPI Sensor Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Depth */}
        <div className="bg-[#fcf8f2] p-3.5 rounded-lg border-2 border-[#5c4f42] shadow-xs">
          <div className="text-[11px] font-bold text-[#695c4d] font-['Chakra_Petch',sans-serif]">
            BIT DEPTH
          </div>
          <div className="text-2xl font-bold font-mono text-red-700 mt-0.5">
            {telemetry ? `${telemetry.depthM} m` : '—'}
          </div>
          <div className="text-[10px] font-mono text-[#8c7862] mt-1">
            Target: 4,850 m
          </div>
        </div>

        {/* ROP */}
        <div className="bg-[#fcf8f2] p-3.5 rounded-lg border-2 border-[#5c4f42] shadow-xs">
          <div className="text-[11px] font-bold text-[#695c4d] font-['Chakra_Petch',sans-serif]">
            ROP (RATE OF PEN.)
          </div>
          <div className="text-2xl font-bold font-mono text-[#1a1612] mt-0.5">
            {telemetry ? `${telemetry.ropMhr} m/h` : '—'}
          </div>
          <div className="text-[10px] font-mono text-[#8c7862] mt-1">
            Barail Coal Stringers
          </div>
        </div>

        {/* WOB */}
        <div className="bg-[#fcf8f2] p-3.5 rounded-lg border-2 border-[#5c4f42] shadow-xs">
          <div className="text-[11px] font-bold text-[#695c4d] font-['Chakra_Petch',sans-serif]">
            WEIGHT ON BIT
          </div>
          <div className="text-2xl font-bold font-mono text-[#1a1612] mt-0.5">
            {telemetry ? `${telemetry.wobTons} T` : '—'}
          </div>
          <div className="text-[10px] font-mono text-[#8c7862] mt-1">
            Max Allowable: 14 T
          </div>
        </div>

        {/* Torque */}
        <div className="bg-[#fcf8f2] p-3.5 rounded-lg border-2 border-[#5c4f42] shadow-xs">
          <div className="text-[11px] font-bold text-[#695c4d] font-['Chakra_Petch',sans-serif]">
            SURFACE TORQUE
          </div>
          <div className="text-2xl font-bold font-mono text-orange-700 mt-0.5">
            {telemetry ? `${telemetry.torqueKNm} kNm` : '—'}
          </div>
          <div className="text-[10px] font-mono text-orange-800 mt-1 font-bold">
            Stick-Slip Warning
          </div>
        </div>

        {/* SPP */}
        <div className="bg-[#fcf8f2] p-3.5 rounded-lg border-2 border-[#5c4f42] shadow-xs">
          <div className="text-[11px] font-bold text-[#695c4d] font-['Chakra_Petch',sans-serif]">
            STANDPIPE PRESS.
          </div>
          <div className="text-2xl font-bold font-mono text-[#1a1612] mt-0.5">
            {telemetry ? `${telemetry.sppPsi} psi` : '—'}
          </div>
          <div className="text-[10px] font-mono text-[#8c7862] mt-1">
            Triplex Pump #1 & #2
          </div>
        </div>

        {/* Gas */}
        <div className="bg-[#fcf8f2] p-3.5 rounded-lg border-2 border-[#5c4f42] shadow-xs">
          <div className="text-[11px] font-bold text-[#695c4d] font-['Chakra_Petch',sans-serif]">
            TOTAL GAS
          </div>
          <div className="text-2xl font-bold font-mono text-red-700 mt-0.5">
            {telemetry ? `${telemetry.gasUnits} u` : '—'}
          </div>
          <div className="text-[10px] font-mono text-red-800 mt-1 font-bold">
            Chromatograph C1-C4
          </div>
        </div>
      </div>

      {/* Mud Flow & Pit Volume Influx/Loss Detection Module */}
      <div className="bg-[#f5ede1] rounded-lg border-2 border-[#8f7d6a] p-4 shadow-sm">
        <div className="text-xs font-bold text-[#3d3227] font-['Chakra_Petch',sans-serif] uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>Early Kick / Loss Differential Flow Monitor (Delta Flow Sensor)</span>
          <span className="text-xs font-mono text-emerald-800 font-bold">WITSML Channel #14</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="bg-white p-3 rounded border border-[#c4b5a2]">
            <span className="text-[#695c4d] block">Flow In (Pump rate):</span>
            <strong className="text-lg text-[#1a1612]">{telemetry ? `${telemetry.mudFlowInLpm} LPM` : '—'}</strong>
          </div>

          <div className="bg-white p-3 rounded border border-[#c4b5a2]">
            <span className="text-[#695c4d] block">Flow Out (Paddle return):</span>
            <strong className="text-lg text-[#1a1612]">{telemetry ? `${telemetry.mudFlowOutLpm} LPM` : '—'}</strong>
          </div>

          <div className={`p-3 rounded border ${
            telemetry && Math.abs(flowDelta) > 10 ? 'bg-red-100 border-red-300' : 'bg-emerald-100 border-emerald-300'
          }`}>
            <span className="text-[#695c4d] block">Flow Delta (Out - In):</span>
            <strong className={`text-lg ${flowDelta < 0 ? 'text-amber-800' : 'text-red-800'}`}>
              {telemetry ? `${flowDelta > 0 ? `+${flowDelta}` : flowDelta} LPM (${flowDelta < 0 ? 'MUD LOSS DETECTED' : 'BALANCED'})` : '—'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
