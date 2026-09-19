import React from 'react';
import {
  LayoutDashboard,
  Activity,
  MessageSquare,
  Map as MapIcon,
  ShieldAlert,
  Layers,
  FileText,
  Radio,
  BarChart3,
  Sparkles,
  BookOpen,
  UserCheck,
  LogIn,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { ActiveTab } from './HeaderBar.tsx';
import { UserProfile } from '../types/auth.ts';

interface LeftSidebarIndexProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  alertsCount: number;
  currentUser?: UserProfile;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const LeftSidebarIndex: React.FC<LeftSidebarIndexProps> = ({
  activeTab,
  onTabChange,
  alertsCount,
  currentUser,
  onOpenAuth,
  isCollapsed,
  onToggleCollapse,
}) => {
  const sections = [
    {
      group: 'PRIMARY CONSOLE',
      items: [
        { id: 'dashboard' as ActiveTab, label: 'Intelligence Dashboard', icon: LayoutDashboard, tag: 'Visual' },
        { id: 'operations' as ActiveTab, label: 'Operations Console', icon: Activity, tag: '3-Col' },
        { id: 'ai-assistant' as ActiveTab, label: 'AI Drilling Copilot', icon: MessageSquare, tag: 'RAG' },
      ],
    },
    {
      group: 'SUBSURFACE & RISK',
      items: [
        { id: 'map' as ActiveTab, label: 'Geospatial GIS Map', icon: MapIcon, tag: null },
        { id: 'risk-prediction' as ActiveTab, label: 'Risk Prediction', icon: ShieldAlert, tag: alertsCount > 0 ? `${alertsCount}` : null },
        { id: 'analytics' as ActiveTab, label: 'Stratigraphic Correlation', icon: BarChart3, tag: '4.2° Dip' },
      ],
    },
    {
      group: 'DATA & TELEMETRY',
      items: [
        { id: 'historical-events' as ActiveTab, label: 'Historical Incidents', icon: Layers, tag: '300+' },
        { id: 'doc-library' as ActiveTab, label: 'Document Library', icon: FileText, tag: 'OCR' },
        { id: 'telemetry' as ActiveTab, label: 'Live Rig Telemetry', icon: Radio, tag: 'LIVE' },
      ],
    },
    {
      group: 'DRILLS & ARCHITECTURE',
      items: [
        { id: 'field-drills' as ActiveTab, label: 'Operational Drills', icon: Sparkles, tag: 'Sim' },
        { id: 'docs' as ActiveTab, label: 'Technical Specs', icon: BookOpen, tag: 'Specs' },
      ],
    },
  ];

  return (
    <aside
      className={`bg-[#e5dbc9] border-r-2 border-[#b5a794] flex flex-col justify-between select-none transition-all duration-200 z-30 shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Sidebar Header / Index Title */}
      <div className="p-3 border-b border-[#b5a794] bg-[#dbcfbd] flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5">
            <img
              src="/oil_india_logo.png"
              alt="Oil India"
              className="w-7 h-7 object-contain shrink-0 drop-shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="text-xs font-bold font-['Chakra_Petch',sans-serif] text-[#2c241d] tracking-wider uppercase">
                SYSTEM INDEX
              </div>
              <div className="text-[10px] font-mono text-[#665747]">
                Rig OIL-E2000 • Duliajan
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto">
            <img
              src="/oil_india_logo.png"
              alt="Oil India"
              className="w-6 h-6 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand Sidebar Index' : 'Collapse Sidebar Index'}
          className="p-1 rounded hover:bg-[#c9bcab] text-[#4d4034] transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-4 scrollbar-thin">
        {sections.map((sec, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-2 text-[10px] font-bold font-['Chakra_Petch',sans-serif] text-[#6d5e4f] tracking-wider uppercase">
                {sec.group}
              </div>
            )}
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#3b322a] text-white font-bold shadow-xs border-l-3 border-amber-500'
                        : 'text-[#3d3329] hover:bg-[#d6c9b6] hover:text-[#171411]'
                    } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-amber-400' : 'text-[#635546]'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1 text-left font-sans text-[12px]">
                        {item.label}
                      </span>
                    )}
                    {!isCollapsed && item.tag && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          item.tag === 'LIVE'
                            ? 'bg-red-600 text-white animate-pulse'
                            : item.tag === 'RAG'
                            ? 'bg-blue-600 text-white'
                            : isActive
                            ? 'bg-amber-400 text-[#171411]'
                            : 'bg-[#c5b7a4] text-[#2d251d]'
                        }`}
                      >
                        {item.tag}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom: Current Operator Profile & Quick Auth Actions */}
      <div className="p-2.5 border-t border-[#b5a794] bg-[#dbcfbd]">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="bg-[#ebdcc8] p-2 rounded border border-[#c4b5a2] flex items-center gap-2">
              <div className="w-8 h-8 rounded-sm bg-[#3b322a] border border-[#b8860b] text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser ? currentUser.name.slice(0, 2).toUpperCase() : 'OP'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-[#1c1815] truncate font-mono">
                  {currentUser?.name || 'Er. R. Chauhan'}
                </div>
                <div className="text-[10px] text-[#695c4d] truncate">
                  {currentUser?.role || 'Lead Drilling Eng.'}
                </div>
              </div>
            </div>

            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onOpenAuth('signin')}
                className="flex-1 py-1.5 px-2 rounded bg-[#3b322a] hover:bg-[#26201a] text-amber-300 text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-colors"
                title="Switch Account / Sign In"
              >
                <LogIn className="w-3 h-3 text-amber-400" />
                <span>Switch</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="py-1.5 px-2 rounded bg-[#ebdcc8] hover:bg-[#decdb7] border border-[#a89985] text-[#332b23] text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-colors"
                title="Create Operator Account"
              >
                <UserPlus className="w-3 h-3 text-amber-800" />
                <span>New</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#635546] px-1 pt-1">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                ONLINE
              </span>
              <span>OIL INDIA ERTMAC</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <button
              onClick={() => onOpenAuth('signin')}
              title={currentUser ? currentUser.name : 'Sign In'}
              className="w-9 h-9 rounded bg-[#3b322a] border border-[#b8860b] text-amber-300 flex items-center justify-center hover:bg-[#26201a] transition-colors"
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
