import React, { useState, useEffect } from 'react';
import { 
  UserCheck,
  Menu,
  ShieldAlert
} from 'lucide-react';
import { UserProfile } from '../types/auth.ts';

export type ActiveTab = 
  | 'dashboard'
  | 'operations' 
  | 'ai-assistant' 
  | 'map' 
  | 'risk-prediction' 
  | 'historical-events' 
  | 'doc-library' 
  | 'telemetry' 
  | 'analytics' 
  | 'field-drills' 
  | 'docs';

interface HeaderBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  alertsCount: number;
  currentUser?: UserProfile;
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeTab,
  onTabChange,
  alertsCount,
  currentUser,
  onOpenAuth,
  onToggleSidebar,
  isSidebarCollapsed,
}) => {
  const [timestamp, setTimestamp] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.toLocaleString('en-US', { month: 'short' });
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTimestamp(`${day}-${month}-${year} ${hours}:${minutes}:${seconds} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b-2 border-[#b5a794] bg-[#ece4d6] text-[#241f1a] shadow-sm select-none z-20">
      {/* Identity & Status Strip */}
      <div className="mx-auto flex flex-col md:flex-row md:items-center justify-between px-4 py-2.5 gap-3">
        {/* Left Title, Branding & Sidebar Toggle */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 rounded bg-[#dfd4c3] hover:bg-[#d0c4b2] text-[#4d4034] border border-[#a89985] transition-colors cursor-pointer flex items-center justify-center"
              title={isSidebarCollapsed ? 'Open Left Navigation Index' : 'Collapse Left Navigation Index'}
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div 
            className="flex items-center cursor-pointer group shrink-0" 
            onClick={() => onTabChange('dashboard')}
            title="eRTMAC-NWIS | Oil India Limited Subsurface Operations"
          >
            <img
              src="/oil_barrel_logo.svg"
              alt="eRTMAC-NWIS Logo"
              className="h-12 md:h-14 w-auto object-contain filter drop-shadow-xs group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1c1815] font-['Chakra_Petch',sans-serif]">
                eRTMAC-NWIS <span className="text-[#8c7862] font-normal">|</span> Nearby Wells Intelligence System
              </h1>
            </div>
            <p className="text-xs md:text-sm font-medium text-[#5c5247]">
              AI-powered institutional memory & real-time decision support for drilling operations
            </p>
          </div>
        </div>

        {/* Right Oil India Limited Badge, Active Alert Indicator, User & Live Timestamp */}
        <div className="flex items-center gap-4 self-end md:self-auto">
          {/* Real-Time Alerts Chip */}
          {alertsCount > 0 && (
            <button
              type="button"
              onClick={() => onTabChange('risk-prediction')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-800 hover:bg-red-900 text-white text-xs font-mono font-bold animate-pulse transition-colors"
              title="Active Critical Drilling Risk Detected"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{alertsCount} HAZARD ALERTS</span>
            </button>
          )}

          {/* Oil India Official Logo */}
          <div className="flex items-center gap-2.5 border-r border-[#c2b4a1] pr-4">
            <img
              src="/oil_india_logo.png"
              alt="Oil India Limited Official Logo"
              className="h-9 w-auto object-contain shrink-0 drop-shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div className="leading-tight">
              <div className="text-xs font-semibold text-[#8b1e22] font-['Chakra_Petch',sans-serif]">
                ऑयल इंडिया लिमिटेड
              </div>
              <div className="text-xs font-bold text-[#1c1815] tracking-wide">
                Oil India Limited
              </div>
              <div className="text-[10px] text-[#7a6f62]">Duliajan Rig Operational Command</div>
            </div>
          </div>

          {/* User and Timestamp matching the screenshot exact header tags with Clickable Auth */}
          <div className="text-right font-mono text-xs leading-snug flex flex-col items-end">
            <div className="flex items-center justify-end gap-1.5 text-[#2d2620]">
              <span className="font-semibold text-[#665a4c]">User:</span>
              <button
                type="button"
                onClick={() => onOpenAuth?.('signin')}
                title="Click to Switch Account or Sign In"
                className="bg-[#dfd3c1] hover:bg-[#d0c4b2] border border-[#a89985] px-2 py-0.5 rounded text-[11px] font-bold text-[#1a1613] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <UserCheck className="w-3 h-3 text-emerald-800" />
                <span>{currentUser ? `${currentUser.name} [${currentUser.role.split(' ')[0]}]` : 'Er. R. Chauhan [Lead Drilling Eng.]'}</span>
              </button>
            </div>
            <div className="flex items-center justify-end gap-1 mt-1 text-[#2d2620]">
              <span className="font-semibold text-[#665a4c]">Timestamp:</span>
              <span className="font-bold text-[#b91c1c] text-[11px]">
                [{timestamp || '14-Sep-2026 12:45:10 UTC'}]
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
