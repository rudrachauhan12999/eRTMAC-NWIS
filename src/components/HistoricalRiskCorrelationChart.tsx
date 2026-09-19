import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Flame,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Calendar,
  Filter,
  BarChart3,
  Sparkles,
  Info,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  HISTORICAL_RISK_30_DAYS,
  CORRELATION_METRICS,
  HistoricalTrendDay,
} from '../data/historicalRiskTrends.ts';

interface HistoricalRiskCorrelationChartProps {
  onOpenReportModal?: (incidentRef: string) => void;
}

export const HistoricalRiskCorrelationChart: React.FC<HistoricalRiskCorrelationChartProps> = ({
  onOpenReportModal,
}) => {
  const [timeRange, setTimeRange] = useState<'30' | '14' | '7'>('30');
  const [incidentTypeFilter, setIncidentTypeFilter] = useState<string>('ALL');
  const [show7DayAvg, setShow7DayAvg] = useState<boolean>(true);
  const [showMudWeight, setShowMudWeight] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<HistoricalTrendDay>(
    // Default to the most severe incident day (Day 26: Major Gas Kick)
    HISTORICAL_RISK_30_DAYS.find((d) => d.day === 26) || HISTORICAL_RISK_30_DAYS[HISTORICAL_RISK_30_DAYS.length - 1]
  );

  // Filter data based on timeRange
  const chartData = useMemo(() => {
    let sliceCount = 30;
    if (timeRange === '14') sliceCount = 14;
    if (timeRange === '7') sliceCount = 7;
    const sliced = HISTORICAL_RISK_30_DAYS.slice(HISTORICAL_RISK_30_DAYS.length - sliceCount);

    return sliced.map((item) => {
      // If incident type filter is applied, only show incident bar for matching types
      let visibleIncidentCount = item.incidentCount;
      if (incidentTypeFilter !== 'ALL' && item.incidentType !== incidentTypeFilter) {
        visibleIncidentCount = 0;
      }
      return {
        ...item,
        visibleIncidentCount,
      };
    });
  }, [timeRange, incidentTypeFilter]);

  // Statistics for the filtered window
  const stats = useMemo(() => {
    const totalDays = chartData.length;
    const incidents = chartData.filter((d) => d.incidentCount > 0);
    const incidentCount = incidents.length;
    const avgScore = Math.round(
      chartData.reduce((acc, d) => acc + d.compositeHazardScore, 0) / (totalDays || 1)
    );
    const totalNpt = incidents.reduce((acc, d) => acc + (d.nptHours || 0), 0);

    return {
      totalDays,
      incidentCount,
      avgScore,
      totalNpt,
    };
  }, [chartData]);

  const getIncidentColor = (type?: string) => {
    switch (type) {
      case 'Gas Kick':
        return '#dc2626'; // Red-600
      case 'Mud Loss':
        return '#d97706'; // Amber-600
      case 'Stuck Pipe / Torque':
        return '#7c3aed'; // Violet-600
      default:
        return '#ef4444';
    }
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: HistoricalTrendDay = payload[0].payload;
      const hasIncident = data.incidentCount > 0;

      return (
        <div className="bg-[#1c1815] text-stone-100 p-3 rounded-lg border-2 border-amber-600/80 shadow-2xl text-xs font-mono max-w-xs pointer-events-none z-50">
          <div className="flex items-center justify-between border-b border-stone-700 pb-1.5 mb-2 gap-2">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Day {data.day} • {data.displayDate}</span>
            </span>
            <span className="text-[10px] text-stone-400 bg-stone-800 px-1.5 py-0.5 rounded">
              {data.depthM} m TVD
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Stratigraphy:</span>
              <span className="font-semibold text-white truncate max-w-[170px]">{data.formation}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Composite Hazard Score:</span>
              <span className={`font-bold px-1.5 py-0.2 rounded ${
                data.compositeHazardScore >= 70
                  ? 'bg-red-950 text-red-300 border border-red-800'
                  : data.compositeHazardScore >= 40
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {data.compositeHazardScore} / 100 ({data.compositeHazardScore >= 70 ? 'CRITICAL' : data.compositeHazardScore >= 40 ? 'ELEVATED' : 'SAFE'})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Mud Density:</span>
              <span className="font-mono text-cyan-300">{data.mudWeightSG.toFixed(2)} SG</span>
            </div>
          </div>

          {hasIncident ? (
            <div className="mt-2.5 pt-2 border-t border-red-800/60 bg-red-950/60 -mx-3 -mb-3 p-2.5 rounded-b-lg">
              <div className="flex items-center gap-1 text-red-400 font-bold mb-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>ACTUAL DRILLING INCIDENT</span>
              </div>
              <p className="text-[11px] text-white font-bold">{data.incidentName}</p>
              <div className="flex items-center justify-between text-[10px] text-stone-300 mt-1">
                <span>Type: <strong className="text-amber-300">{data.incidentType}</strong></span>
                <span className="text-red-300 font-bold">NPT: {data.nptHours} hrs</span>
              </div>
            </div>
          ) : (
            <div className="mt-2 pt-1.5 border-t border-stone-800 text-[10px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Zero Drilling Incidents Logged</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#fcf8f2] border-2 border-[#5c4f42] rounded-xl p-4 sm:p-5 shadow-sm space-y-4 select-none">
      {/* Chart Header with Industrial Oil India Badging */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b-2 border-[#ded0bd]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded bg-[#3b322a] text-amber-300">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold font-['Chakra_Petch',sans-serif] text-[#1c1815] tracking-wide">
              Historical Hazard Correlation & Model Validation (Last 30 Days)
            </h3>
            <span className="bg-amber-100 text-amber-900 border border-amber-400 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
              PEARSON r = +{CORRELATION_METRICS.pearsonR} (STRONG POSITIVE)
            </span>
          </div>
          <p className="text-xs text-[#5c4f42] font-mono mt-1">
            Empirical cross-validation comparing algorithmic composite hazard scores against verified field drilling incidents (wellbore mud loss, gas kicks, and tight hole pack-offs).
          </p>
        </div>

        {/* Time Window Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-[#ebdcc8] p-0.5 rounded-lg border border-[#c4b5a2] text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => setTimeRange('30')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                timeRange === '30'
                  ? 'bg-[#3b322a] text-amber-300 shadow-xs'
                  : 'text-[#5c4f42] hover:text-[#1c1815]'
              }`}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('14')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                timeRange === '14'
                  ? 'bg-[#3b322a] text-amber-300 shadow-xs'
                  : 'text-[#5c4f42] hover:text-[#1c1815]'
              }`}
            >
              14 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('7')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                timeRange === '7'
                  ? 'bg-[#3b322a] text-amber-300 shadow-xs'
                  : 'text-[#5c4f42] hover:text-[#1c1815]'
              }`}
            >
              7 Days
            </button>
          </div>
        </div>
      </div>

      {/* 4 Quantitative Validation Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
        <div className="bg-[#f5ede1] p-2.5 rounded-lg border border-[#dacbb8]">
          <span className="text-[#8c7862] text-[10px] block uppercase font-semibold">Correlation (r)</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <strong className="text-base text-emerald-800 font-bold">+{CORRELATION_METRICS.pearsonR}</strong>
            <span className="text-[10px] text-[#6e5d4d]">(R²: {CORRELATION_METRICS.rSquared})</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium">Statistically verified correlation</span>
        </div>

        <div className="bg-[#f5ede1] p-2.5 rounded-lg border border-[#dacbb8]">
          <span className="text-[#8c7862] text-[10px] block uppercase font-semibold">Incident Detection Accuracy</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <strong className="text-base text-red-700 font-bold">{CORRELATION_METRICS.predictionAccuracyRate}%</strong>
            <span className="text-[10px] text-[#6e5d4d]">({stats.incidentCount} incidents in window)</span>
          </div>
          <span className="text-[10px] text-[#5c4f42]">Preceded by Score &gt; 70</span>
        </div>

        <div className="bg-[#f5ede1] p-2.5 rounded-lg border border-[#dacbb8]">
          <span className="text-[#8c7862] text-[10px] block uppercase font-semibold">Early Warning Lead Time</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <strong className="text-base text-[#1c1815] font-bold">{CORRELATION_METRICS.leadTimeHoursAvg} hrs</strong>
            <span className="text-[10px] text-amber-800 font-semibold">avg notice</span>
          </div>
          <span className="text-[10px] text-[#5c4f42]">Prior to physical influx/loss</span>
        </div>

        <div className="bg-[#f5ede1] p-2.5 rounded-lg border border-[#dacbb8]">
          <span className="text-[#8c7862] text-[10px] block uppercase font-semibold">Total Recorded NPT</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <strong className="text-base text-amber-900 font-bold">{stats.totalNpt} Hours</strong>
          </div>
          <span className="text-[10px] text-[#5c4f42]">Non-productive downtime</span>
        </div>
      </div>

      {/* Filter and Overlay Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[#695c4d] font-bold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-amber-700" />
            <span>Filter Incidents:</span>
          </span>
          {[
            { id: 'ALL', label: 'All Types (5 Events)' },
            { id: 'Mud Loss', label: 'Mud Loss (3)' },
            { id: 'Gas Kick', label: 'Gas Kicks (2)' },
            { id: 'Stuck Pipe / Torque', label: 'Torque / Tight Hole (1)' },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setIncidentTypeFilter(btn.id)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                incidentTypeFilter === btn.id
                  ? 'bg-[#3b322a] text-amber-300 border-[#3b322a] shadow-xs'
                  : 'bg-[#f4ebe0] text-[#4a3e33] border-[#c4b5a2] hover:bg-[#ebdcc8]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Overlay Switches */}
        <div className="flex items-center gap-3 text-[11px]">
          <label className="flex items-center gap-1.5 text-[#3d3227] cursor-pointer">
            <input
              type="checkbox"
              checked={show7DayAvg}
              onChange={(e) => setShow7DayAvg(e.target.checked)}
              className="accent-amber-700 rounded cursor-pointer"
            />
            <span>7-Day Moving Avg</span>
          </label>

          <label className="flex items-center gap-1.5 text-[#3d3227] cursor-pointer">
            <input
              type="checkbox"
              checked={showMudWeight}
              onChange={(e) => setShowMudWeight(e.target.checked)}
              className="accent-cyan-700 rounded cursor-pointer"
            />
            <span>Mud Density (SG)</span>
          </label>
        </div>
      </div>

      {/* Main Recharts ComposedChart Area */}
      <div className="bg-[#fffdfa] p-3 sm:p-4 rounded-lg border border-[#c4b5a2] shadow-inner relative">
        {/* Chart Legend Summary Bar */}
        <div className="flex items-center justify-between mb-2 text-[11px] font-mono text-[#5c4f42] flex-wrap gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block border border-amber-700" />
              <span className="font-bold text-[#1c1815]">Composite Hazard Score (0-100)</span>
            </div>
            {show7DayAvg && (
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 bg-amber-900 inline-block border-t border-dashed border-amber-900" />
                <span>7-Day Moving Trend</span>
              </div>
            )}
            {showMudWeight && (
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 bg-cyan-600 inline-block" />
                <span className="text-cyan-800 font-semibold">Mud Weight (SG)</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-3 bg-red-600 inline-block rounded-xs" />
              <span className="font-bold text-red-700">Actual Drilling Incidents</span>
            </div>
          </div>
          <span className="text-[10px] text-[#786957]">Click any point or bar to inspect day</span>
        </div>

        {/* The Recharts Container */}
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 15, right: 20, bottom: 5, left: 0 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length) {
                  setSelectedDay(e.activePayload[0].payload);
                }
              }}
            >
              <defs>
                {/* Gradient for Hazard Score Area */}
                <linearGradient id="hazardAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.4} />
                  <stop offset="65%" stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e6ded3" vertical={false} />

              {/* X Axis */}
              <XAxis
                dataKey="displayDate"
                tick={{ fill: '#695c4d', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#c4b5a2' }}
                axisLine={{ stroke: '#a89985' }}
              />

              {/* Left Y Axis: Hazard Score (0 - 100) */}
              <YAxis
                yAxisId="left"
                domain={[0, 100]}
                tick={{ fill: '#695c4d', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#c4b5a2' }}
                axisLine={{ stroke: '#a89985' }}
                label={{
                  value: 'Hazard Score (0 - 100)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#695c4d',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />

              {/* Right Y Axis: Incidents Logged (0 - 2) or Mud Weight */}
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 2]}
                ticks={[0, 1, 2]}
                tick={{ fill: '#dc2626', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#fca5a5' }}
                axisLine={{ stroke: '#f87171' }}
                label={{
                  value: 'Incidents Logged (Count)',
                  angle: 90,
                  position: 'insideRight',
                  fill: '#dc2626',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />

              {/* Threshold Lines */}
              <ReferenceLine
                yAxisId="left"
                y={70}
                stroke="#dc2626"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'Critical Hazard Threshold (70)',
                  fill: '#dc2626',
                  fontSize: 10,
                  position: 'insideTopRight',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                }}
              />

              <ReferenceLine
                yAxisId="left"
                y={40}
                stroke="#d97706"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{
                  value: 'Elevated Threshold (40)',
                  fill: '#d97706',
                  fontSize: 9,
                  position: 'insideTopRight',
                  fontFamily: 'monospace',
                }}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Hazard Score Area Fill */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="compositeHazardScore"
                name="Hazard Score"
                stroke="#b45309"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#hazardAreaGrad)"
                activeDot={{ r: 6, fill: '#b45309', stroke: '#fff', strokeWidth: 2 }}
              />

              {/* 7-Day Moving Average Line */}
              {show7DayAvg && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="rollingAvgScore"
                  name="7-Day Avg"
                  stroke="#78350f"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              )}

              {/* Mud Weight SG Line */}
              {showMudWeight && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey={(d) => (d.mudWeightSG - 1.15) * (100 / (1.30 - 1.15))}
                  name="Mud Density"
                  stroke="#0891b2"
                  strokeWidth={1.5}
                  dot={false}
                />
              )}

              {/* Actual Incident Event Bars */}
              <Bar
                yAxisId="right"
                dataKey="visibleIncidentCount"
                name="Incident Logged"
                barSize={14}
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getIncidentColor(entry.incidentType)}
                    cursor="pointer"
                    stroke={entry.day === selectedDay.day ? '#000000' : 'none'}
                    strokeWidth={entry.day === selectedDay.day ? 2 : 0}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Selected Day Inspector Drill-Down Card */}
      <div className="bg-[#ede1d1] border-2 border-[#b8a794] rounded-lg p-3.5 sm:p-4 shadow-sm text-xs font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#c9baaa] pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#3b322a] text-amber-300 font-bold text-xs">
              Day {selectedDay.day} of 30
            </span>
            <span className="font-bold text-[#1c1815] text-sm font-['Chakra_Petch',sans-serif]">
              Historical Telemetry & Incident Audit: {selectedDay.date}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
              selectedDay.compositeHazardScore >= 70
                ? 'bg-red-700 text-white'
                : selectedDay.compositeHazardScore >= 40
                ? 'bg-amber-600 text-white'
                : 'bg-emerald-700 text-white'
            }`}>
              Score: {selectedDay.compositeHazardScore}/100 ({selectedDay.compositeHazardScore >= 70 ? 'CRITICAL RISK' : selectedDay.compositeHazardScore >= 40 ? 'ELEVATED RISK' : 'SAFE'})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <div className="bg-[#fbf7f0] p-2 rounded border border-[#dacbb8]">
            <span className="text-[#8c7862] text-[10px] block uppercase">Borehole Depth</span>
            <strong className="text-[#1c1815] text-xs">{selectedDay.depthM} m TVD</strong>
          </div>
          <div className="bg-[#fbf7f0] p-2 rounded border border-[#dacbb8]">
            <span className="text-[#8c7862] text-[10px] block uppercase">Active Formation</span>
            <strong className="text-[#1c1815] text-xs truncate block" title={selectedDay.formation}>
              {selectedDay.formation}
            </strong>
          </div>
          <div className="bg-[#fbf7f0] p-2 rounded border border-[#dacbb8]">
            <span className="text-[#8c7862] text-[10px] block uppercase">Mud Weight</span>
            <strong className="text-cyan-800 text-xs">{selectedDay.mudWeightSG.toFixed(2)} SG</strong>
          </div>
          <div className="bg-[#fbf7f0] p-2 rounded border border-[#dacbb8]">
            <span className="text-[#8c7862] text-[10px] block uppercase">Incident Status</span>
            {selectedDay.incidentCount > 0 ? (
              <span className="text-red-700 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{selectedDay.incidentType}</span>
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Normal Drilling</span>
              </span>
            )}
          </div>
        </div>

        {/* Detailed Incident Breakdown if this day had an incident */}
        {selectedDay.incidentCount > 0 ? (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-red-950 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 font-bold text-red-800">
                <Flame className="w-4 h-4 text-red-600" />
                <span className="text-sm">{selectedDay.incidentName}</span>
                <span className="text-[9px] bg-red-700 text-white px-1.5 py-0.2 rounded font-mono">
                  {selectedDay.incidentSeverity}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-red-100 border border-red-300 px-2 py-0.5 rounded text-red-900 font-bold">
                  NPT Lost: {selectedDay.nptHours} Hours
                </span>
                {selectedDay.lossVolumeBbl && (
                  <span className="bg-amber-100 border border-amber-300 px-2 py-0.5 rounded text-amber-900 font-bold">
                    Loss: {selectedDay.lossVolumeBbl} bbl
                  </span>
                )}
                {selectedDay.gasUnits && (
                  <span className="bg-red-100 border border-red-300 px-2 py-0.5 rounded text-red-900 font-bold">
                    Gas Peak: {selectedDay.gasUnits} units
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-stone-800 leading-relaxed bg-white/70 p-2 rounded border border-red-200">
              "{selectedDay.description}"
            </p>

            {selectedDay.mitigationApplied && (
              <div className="text-xs bg-emerald-50 border border-emerald-300 p-2 rounded text-emerald-900">
                <strong>Field Engineering Mitigation:</strong> {selectedDay.mitigationApplied}
              </div>
            )}

            {selectedDay.offsetWellRef && (
              <div className="flex items-center justify-between text-[11px] text-stone-600 pt-1">
                <span>Correlated Offset Well Reference: <strong>{selectedDay.offsetWellRef}</strong></span>
                <span className="text-amber-800 font-bold flex items-center gap-1">
                  <span>Archived in Oil India WCR/DDR Master Repository</span>
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>Controlled Operations:</strong> Wellbore drilled within safe margin. Mud weight ({selectedDay.mudWeightSG.toFixed(2)} SG) matched the safe operating envelope.
              </span>
            </div>
            <span className="text-[10px] text-emerald-800 font-bold shrink-0">Zero Downtime</span>
          </div>
        )}
      </div>
    </div>
  );
};
