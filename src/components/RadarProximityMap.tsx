import React, { useState } from 'react';
import { Plus, Minus, Crosshair, ExternalLink, Info, AlertTriangle } from 'lucide-react';
import { Well, NEARBY_WELLS, ACTIVE_WELL } from '../data/wellsData.ts';

interface RadarProximityMapProps {
  activeWell?: Well;
  nearbyWells?: Well[];
  onSelectWell: (well: Well) => void;
  onOpenGisMap: () => void;
}

export const RadarProximityMap: React.FC<RadarProximityMapProps> = ({
  activeWell = ACTIVE_WELL,
  nearbyWells = NEARBY_WELLS,
  onSelectWell,
  onOpenGisMap,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredWell, setHoveredWell] = useState<Well | null>(null);
  const [selectedWell, setSelectedWell] = useState<Well | null>(activeWell);

  // Offset wells positioned radially around center (NWIS-Active-01)
  const displayWells = [
    {
      well: nearbyWells.find(w => w.id === 'well-calire-02') || nearbyWells[1],
      label: 'NWIS-Calire-02',
      bgClass: 'bg-[#eab308] text-black border-black',
      x: 18,
      y: 28,
      distance: '1.4 km',
      risk: 'Mud Loss',
    },
    {
      well: nearbyWells.find(w => w.id === 'well-active-02-north') || nearbyWells[2],
      label: 'NWIS-Active-02',
      bgClass: 'bg-[#86efac] text-emerald-950 border-emerald-900',
      x: 50,
      y: 12,
      distance: '2.1 km',
      risk: 'Gas Kick',
    },
    {
      well: nearbyWells.find(w => w.id === 'well-active-02-ne') || nearbyWells[3],
      label: 'NWIS-Active-02',
      bgClass: 'bg-[#fdba74] text-orange-950 border-orange-900',
      x: 78,
      y: 26,
      distance: '2.3 km',
      risk: 'Stuck Pipe',
    },
    {
      well: nearbyWells.find(w => w.id === 'well-active-02-east') || nearbyWells[4],
      label: 'NWIS-Active-02',
      bgClass: 'bg-[#fca5a5] text-red-950 border-red-900',
      x: 88,
      y: 44,
      distance: '2.9 km',
      risk: 'High Loss',
    },
    {
      well: nearbyWells.find(w => w.id === 'well-colive-04') || nearbyWells[5],
      label: 'NWIS-Colive-04',
      bgClass: 'bg-[#fef08a] text-yellow-950 border-yellow-800',
      x: 72,
      y: 75,
      distance: '1.9 km',
      risk: 'Gas Kick',
    },
    {
      well: nearbyWells.find(w => w.id === 'well-colov-01') || nearbyWells[6],
      label: 'NWIS-Colov-01',
      bgClass: 'bg-[#a5f3fc] text-cyan-950 border-cyan-800',
      x: 18,
      y: 75,
      distance: '2.5 km',
      risk: 'Stable',
    },
    {
      well: nearbyWells.find(w => w.id === 'well-colve-02') || nearbyWells[7],
      label: 'NWIS-Colve-02',
      bgClass: 'bg-[#d8b4fe] text-purple-950 border-purple-800',
      x: 10,
      y: 49,
      distance: '2.8 km',
      risk: 'Stuck Pipe',
    },
  ];

  return (
    <div className="rounded-lg border-2 border-[#5c4f42] bg-[#f5ede1] shadow-md overflow-hidden flex flex-col h-full">
      {/* Dark Header Strip matching screenshot */}
      <div className="bg-[#463d35] text-white px-3.5 py-2 flex items-center justify-between border-b border-[#352d26]">
        <h2 className="text-sm font-bold tracking-wide font-['Chakra_Petch',sans-serif]">
          Modern, geospatial Map - Real-Time Visualization
        </h2>
        <button
          onClick={onOpenGisMap}
          className="text-xs bg-[#5a4e44] hover:bg-[#6e6054] text-amber-300 px-2 py-0.5 rounded flex items-center gap-1 border border-white/10 transition-colors"
          title="Open Full Leaflet Map View"
        >
          <span>Full GIS</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Map Canvas with SVG Radar Overlay */}
      <div className="relative flex-1 min-h-[310px] w-full bg-[#ebdcc8] overflow-hidden select-none">
        {/* Topographic and Geologic Contour Curves */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
          <path
            d="M -50,40 Q 80,90 220,50 T 450,110 T 700,70"
            fill="none"
            stroke="#a68a68"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <path
            d="M -30,160 Q 120,130 280,180 T 520,150 T 720,200"
            fill="none"
            stroke="#b09674"
            strokeWidth="1.2"
          />
          <path
            d="M 10,260 Q 150,290 320,240 T 560,280 T 750,260"
            fill="none"
            stroke="#9c805f"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          {/* Burhi Dihing River representation */}
          <path
            d="M 30,-20 C 140,80 180,120 220,210 C 240,260 290,320 330,380"
            fill="none"
            stroke="#b8d5e5"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>

        {/* Zoom and Navigation Controls in top-left matching screenshot */}
        <div className="absolute top-2.5 left-2.5 z-20 flex flex-col bg-[#fdfaf5] border border-[#a89985] rounded shadow-sm divide-y divide-[#a89985]">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2))}
            className="p-1.5 hover:bg-[#e8dccb] text-[#2c241c] transition-colors"
            title="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
            className="p-1.5 hover:bg-[#e8dccb] text-[#2c241c] transition-colors"
            title="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoomLevel(1);
              setSelectedWell(activeWell);
            }}
            className="p-1.5 hover:bg-[#e8dccb] text-[#2c241c] transition-colors"
            title="Recenter on Active Well"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* Proximity Radius Canvas Container */}
        <div 
          className="w-full h-full relative transition-transform duration-300 origin-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Concentric Proximity Range Rings (1km, 2km, 3km) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Outer ring */}
            <div className="w-[84%] h-[84%] rounded-full border-2 border-[#d4b996] bg-[#d9c4a7]/20 flex items-center justify-center">
              {/* Mid ring */}
              <div className="w-[70%] h-[70%] rounded-full border border-[#c4a984] bg-[#f1dfc6]/30 flex items-center justify-center">
                {/* Inner ring */}
                <div className="w-[45%] h-[45%] rounded-full border border-[#b49974] bg-[#ebd8be]/40" />
              </div>
            </div>
          </div>

          {/* Radiating Directional Vectors from Center to Each Offset Well */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 6 3, 0 6" fill="#8c7862" />
              </marker>
            </defs>
            {displayWells.map((item, idx) => (
              <line
                key={idx}
                x1="50%"
                y1="50%"
                x2={`${item.x}%`}
                y2={`${item.y}%`}
                stroke="#8c7862"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                markerEnd="url(#arrowhead)"
              />
            ))}
          </svg>

          {/* Center: NWIS-Active-01 with Authentic Oil Rig / Pumpjack Motif */}
          <div 
            onClick={() => {
              setSelectedWell(activeWell);
              onSelectWell(activeWell);
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center cursor-pointer group"
          >
            {/* Rig / Pumpjack Silhouette Icon Illustration */}
            <div className="relative flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-[#ffeed0]/80 border border-amber-600/30 flex items-center justify-center shadow-md animate-pulse">
                {/* SVG Pumpjack silhouette */}
                <svg
                  viewBox="0 0 100 100"
                  className="w-12 h-12 text-[#1c1815] drop-shadow-sm"
                  fill="currentColor"
                >
                  {/* Base frame */}
                  <polygon points="20,88 80,88 74,78 26,78" fill="#2b241d" />
                  {/* Samson post */}
                  <polygon points="46,78 54,78 52,38 48,38" fill="#1c1815" />
                  <polygon points="34,78 40,78 49,42 45,42" fill="#3a3026" />
                  <polygon points="66,78 60,78 51,42 55,42" fill="#3a3026" />
                  {/* Walking beam */}
                  <polygon points="20,44 68,30 65,24 18,38" fill="#b91c1c" />
                  {/* Horse head */}
                  <path
                    d="M 18,38 C 14,35 12,28 14,22 C 16,18 20,24 22,30 Z"
                    fill="#1c1815"
                  />
                  {/* Pitman arm & Counterweight */}
                  <line x1="66" y1="28" x2="74" y2="58" stroke="#1c1815" strokeWidth="4" />
                  <circle cx="74" cy="58" r="8" fill="#ea580c" />
                  {/* Wellhead borehole */}
                  <line x1="16" y1="36" x2="16" y2="88" stroke="#000" strokeWidth="2.5" />
                </svg>
              </div>
            </div>

            {/* Active Well Badge */}
            <div className="mt-1 px-2.5 py-0.5 rounded border-2 border-black bg-[#2c241d] text-amber-300 font-bold text-[11px] shadow-sm flex items-center gap-1 font-mono tracking-tight group-hover:scale-105 transition-transform">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <span>NWIS-Active-01</span>
            </div>
          </div>

          {/* Surrounding Offset Wells with Colorful Badges */}
          {displayWells.map((item, idx) => {
            const isHovered = hoveredWell?.id === item.well?.id;
            const isSelected = selectedWell?.id === item.well?.id;

            return (
              <div
                key={idx}
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center cursor-pointer group"
                onMouseEnter={() => setHoveredWell(item.well || null)}
                onMouseLeave={() => setHoveredWell(null)}
                onClick={() => {
                  if (item.well) {
                    setSelectedWell(item.well);
                    onSelectWell(item.well);
                  }
                }}
              >
                {/* Rig Tower Mini Icon */}
                <div className="w-6 h-6 rounded-full bg-white/90 border border-[#524436] flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <div className="w-2 h-2 rounded-full bg-[#2c241d]" />
                </div>

                {/* Name Badge matching screenshot appearance */}
                <div
                  className={`mt-0.5 px-1.5 py-0.2 rounded border text-[10px] font-bold font-mono shadow-xs tracking-tight transition-all duration-150 ${item.bgClass} ${
                    isSelected ? 'ring-2 ring-blue-600 scale-105' : ''
                  }`}
                >
                  {item.label}
                </div>

                {/* Distance & Risk Tag on hover */}
                {(isHovered || isSelected) && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 bg-[#1c1815] text-white px-2 py-1 rounded shadow-lg text-[10px] whitespace-nowrap pointer-events-none border border-amber-400">
                    <div className="font-bold text-amber-300">{item.well?.name}</div>
                    <div className="text-gray-300">
                      {item.distance} • {item.well?.formation}
                    </div>
                    <div className="text-red-400 font-semibold">
                      Primary Risk: {item.well?.primaryRisk}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info Bar */}
      <div className="bg-[#ebdcc8] border-t border-[#c4b5a2] px-3 py-1.5 text-[11px] text-[#4d4033] flex items-center justify-between font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <span>Active Proximity Buffer: <strong>3 km</strong></span>
        </div>
        <div className="text-right text-[#6e5e4e]">
          Upper Assam Basin • Duliajan
        </div>
      </div>
    </div>
  );
};
