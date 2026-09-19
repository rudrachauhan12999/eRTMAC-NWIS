import React, { useState } from 'react';
import { Layers, ChevronRight, Eye } from 'lucide-react';
import { STRATIGRAPHIC_FORMATIONS, FormationLayer } from '../data/wellsData.ts';

interface CrossSection3DProps {
  onSelectFormation?: (formationName: string) => void;
  currentDepthM?: number;
}

export const CrossSection3D: React.FC<CrossSection3DProps> = ({
  onSelectFormation,
  currentDepthM = 3500,
}) => {
  const [selectedLayer, setSelectedLayer] = useState<FormationLayer | null>(null);

  return (
    <div className="rounded-lg border-2 border-[#5c4f42] bg-[#f5ede1] shadow-md overflow-hidden flex flex-col h-full">
      {/* Dark Header Strip matching screenshot */}
      <div className="bg-[#463d35] text-white px-3.5 py-2 flex items-center justify-between border-b border-[#352d26]">
        <h2 className="text-sm font-bold tracking-wide font-['Chakra_Petch',sans-serif]">
          3D Subsurface Formation Cross-Section
        </h2>
        <span className="text-[11px] font-mono text-amber-300">
          Isometric View
        </span>
      </div>

      {/* Main 3D Canvas Area */}
      <div className="relative flex-1 min-h-[290px] p-3 bg-[#ebdcc8] flex flex-col justify-between select-none">
        <div className="relative w-full h-[230px] flex items-center justify-center">
          {/* SVG 3D Isometric Geological Block Diagram */}
          <svg
            viewBox="0 0 520 240"
            className="w-full h-full max-h-[230px] drop-shadow-md overflow-visible"
          >
            <defs>
              {/* Patterns for lithology representations */}
              <pattern id="sandPattern" width="8" height="8" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.8" fill="#785934" opacity="0.4" />
                <circle cx="6" cy="6" r="0.8" fill="#785934" opacity="0.4" />
              </pattern>
              <pattern id="shalePattern" width="12" height="4" patternUnits="userSpaceOnUse">
                <line x1="1" y1="2" x2="6" y2="2" stroke="#334155" strokeWidth="0.8" opacity="0.5" />
              </pattern>
            </defs>

            {/* Top Surface: Isometric Plane with Green Land & Blue River */}
            <polygon
              points="100,60 300,15 440,65 240,110"
              fill="#94a378"
              stroke="#435031"
              strokeWidth="2"
            />
            {/* Meandering River on top surface */}
            <path
              d="M 120,55 Q 220,50 260,35 T 410,55"
              fill="none"
              stroke="#6ba3be"
              strokeWidth="11"
              strokeLinecap="round"
              opacity="0.85"
            />
            <path
              d="M 120,55 Q 220,50 260,35 T 410,55"
              fill="none"
              stroke="#8bc5dd"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Front Geological Face (Layered Strata) */}
            {/* Layer 1: Alluvium / Dhekiajuli (tan) */}
            <polygon
              points="100,60 240,110 240,130 100,80"
              fill="#d4a373"
              stroke="#5c4328"
              strokeWidth="1.2"
              className="cursor-pointer hover:brightness-110"
              onClick={() => onSelectFormation?.('Alluvium')}
            />
            {/* Layer 2: Girujan Clay (slate-blue/purple) */}
            <polygon
              points="100,80 240,130 240,155 100,105"
              fill="#7a8d9a"
              stroke="#3a4852"
              strokeWidth="1.2"
              className="cursor-pointer hover:brightness-110"
              onClick={() => onSelectFormation?.('Girujan Clay')}
            />
            {/* Layer 3: Tipam Sandstone (warm ochre) */}
            <polygon
              points="100,105 240,155 240,175 100,125"
              fill="#e09f3e"
              stroke="#6e4713"
              strokeWidth="1.2"
              className="cursor-pointer hover:brightness-110"
              onClick={() => onSelectFormation?.('Tipam Sandstone')}
            />
            {/* Layer 4: Surma Group Transition (rust-orange) */}
            <polygon
              points="100,125 240,175 240,195 100,145"
              fill="#d95d39"
              stroke="#612311"
              strokeWidth="1.2"
              className="cursor-pointer hover:brightness-110"
              onClick={() => onSelectFormation?.('Surma Group')}
            />
            {/* Layer 5: Barail Coal-Shale Hazard Zone (Crimson-Red & Black stripes) */}
            <polygon
              points="100,145 240,195 240,225 100,175"
              fill="#b91c1c"
              stroke="#450a0a"
              strokeWidth="1.5"
              className="cursor-pointer hover:brightness-110"
              onClick={() => onSelectFormation?.('Barail')}
            />
            {/* Highlighting coal seam stripe in Barail */}
            <polygon
              points="100,158 240,208 240,214 100,164"
              fill="#18181b"
              opacity="0.75"
            />
            {/* Layer 6: Kopili / Deep basement (dark gray-brown) */}
            <polygon
              points="100,175 240,225 240,240 100,190"
              fill="#3f3730"
              stroke="#1f1b17"
              strokeWidth="1.2"
            />

            {/* Right Side Isometric Geological Face (Strata depth) */}
            {/* Layer 1 side */}
            <polygon
              points="240,110 440,65 440,85 240,130"
              fill="#b88b5e"
              stroke="#5c4328"
              strokeWidth="1.2"
            />
            {/* Layer 2 side */}
            <polygon
              points="240,130 440,85 440,110 240,155"
              fill="#62727d"
              stroke="#3a4852"
              strokeWidth="1.2"
            />
            {/* Layer 3 side */}
            <polygon
              points="240,155 440,110 440,130 240,175"
              fill="#be8129"
              stroke="#6e4713"
              strokeWidth="1.2"
            />
            {/* Layer 4 side */}
            <polygon
              points="240,175 440,130 440,150 240,195"
              fill="#b54727"
              stroke="#612311"
              strokeWidth="1.2"
            />
            {/* Layer 5 side (Barail high risk) */}
            <polygon
              points="240,195 440,150 440,180 240,225"
              fill="#991b1b"
              stroke="#450a0a"
              strokeWidth="1.5"
            />
            {/* Layer 6 side */}
            <polygon
              points="240,225 440,180 440,195 240,240"
              fill="#2b2520"
              stroke="#1f1b17"
              strokeWidth="1.2"
            />

            {/* Left Depth Ticks & Labels matching screenshot */}
            <g className="text-[10px] font-mono font-bold fill-[#2c241c]">
              <text x="60" y="55">Depth</text>
              <line x1="85" y1="65" x2="100" y2="65" stroke="#2c241c" strokeWidth="1.5" />
              <text x="50" y="70">100m -</text>
              <line x1="85" y1="105" x2="100" y2="105" stroke="#2c241c" strokeWidth="1.5" />
              <text x="50" y="110">200m -</text>
              <line x1="85" y1="145" x2="100" y2="145" stroke="#2c241c" strokeWidth="1.5" />
              <text x="50" y="150">300m -</text>
              <line x1="85" y1="185" x2="100" y2="185" stroke="#2c241c" strokeWidth="1.5" />
              <text x="50" y="190">400m -</text>
            </g>

            {/* Right Side: Formation Map Rig & Borehole Depth Legend */}
            <g transform="translate(425, 45)">
              {/* Mini Derrick on surface */}
              <polygon points="12,12 18,12 16,-6 14,-6" fill="#1c1815" />
              <line x1="15" y1="-6" x2="15" y2="140" stroke="#1c1815" strokeWidth="2" strokeDasharray="3 2" />
              
              {/* Formation column legend box matching screenshot */}
              <text x="0" y="-12" className="text-[9px] font-bold font-mono fill-[#1c1815]">
                Formation Map
              </text>
              <rect x="25" y="0" width="10" height="30" fill="#d4a373" stroke="#2c241c" strokeWidth="1" />
              <text x="40" y="20" className="text-[8px] font-mono fill-[#3d3227]">1500m</text>
              
              <rect x="25" y="30" width="10" height="35" fill="#e09f3e" stroke="#2c241c" strokeWidth="1" />
              <text x="40" y="55" className="text-[8px] font-mono fill-[#3d3227]">2500m</text>

              <rect x="25" y="65" width="10" height="40" fill="#b91c1c" stroke="#2c241c" strokeWidth="1" />
              <text x="40" y="90" className="text-[8px] font-mono font-bold fill-[#b91c1c]">3500m</text>

              <rect x="25" y="105" width="10" height="30" fill="#457b9d" stroke="#2c241c" strokeWidth="1" />
              <text x="40" y="125" className="text-[8px] font-mono fill-[#3d3227]">4500m</text>
            </g>
          </svg>
        </div>

        {/* Bottom Horizontal Scale Indicator matching screenshot: Depth/m 0 ------ 1000 */}
        <div className="flex items-center justify-end gap-2 pr-6 pt-1 border-t border-[#c4b5a2] text-[11px] font-mono text-[#3a3026]">
          <span>Depth/m</span>
          <div className="flex items-center gap-1">
            <span>0</span>
            <div className="w-24 h-1 bg-[#2c241c] relative">
              <div className="absolute top-0 left-0 w-0.5 h-2 -translate-y-0.5 bg-[#2c241c]" />
              <div className="absolute top-0 right-0 w-0.5 h-2 -translate-y-0.5 bg-[#2c241c]" />
            </div>
            <span>1000</span>
          </div>
        </div>
      </div>
    </div>
  );
};
