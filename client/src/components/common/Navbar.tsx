import React from 'react';
import {
  Flame,
  Moon,
  Sun,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { ProviderSettings } from '@shared/types/index';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  streakDays: number;
  settings: ProviderSettings;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  streakDays,
  settings,
  darkMode,
  onToggleDarkMode,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'modes', label: 'Practice Modes' },
    { id: 'topics', label: 'Topic Bank' },
    { id: 'progress', label: 'Progress' },
    { id: 'history', label: 'History' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="bg-white border-b border-[#E5E5E5] sticky top-0 z-50 select-none">
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
        {/* Brand & Primary Navigation */}
        <div className="flex items-center gap-10">
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <span className="w-6 h-6 bg-[#252525] text-white flex items-center justify-center rounded-[3px] font-bold text-xs tracking-tight">
              S
            </span>
            <span className="font-semibold text-base tracking-tight text-[#252525]">
              SpeakUp
            </span>
          </div>

          {/* Desktop Navigation Items */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium h-16">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`h-full inline-flex items-center transition-colors pb-1 pt-1 ${
                    isActive
                      ? 'text-[#252525] font-semibold border-b-2 border-[#252525]'
                      : 'text-[#666666] hover:text-[#252525] font-normal'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Streak Indicator Badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E5E5E5] rounded text-xs font-medium text-[#252525]"
            title={`${streakDays} Day Practice Streak`}
          >
            <Flame className="w-3.5 h-3.5 text-[#252525]" />
            <span>{streakDays}d streak</span>
          </div>

          {/* Provider status badge */}
          <button
            onClick={() => onNavigate('settings')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium border transition-colors ${
              settings.isDemoMode || !settings.geminiApiKey
                ? 'bg-[#F5F5F4] text-[#666666] border-[#E5E5E5] hover:border-[#252525]'
                : 'bg-[#F5F5F4] text-[#252525] border-[#E5E5E5] font-semibold'
            }`}
            title="Manage AI and STT providers"
          >
            {settings.isDemoMode || !settings.geminiApiKey ? (
              <>
                <AlertTriangle className="w-3 h-3 text-[#666666]" />
                <span>Demo Mode</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3 h-3 text-[#252525]" />
                <span>AI Connected</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation row */}
      <div className="md:hidden flex items-center justify-around border-t border-[#E5E5E5] px-2 py-2 bg-white overflow-x-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${
                isActive
                  ? 'text-[#252525] font-bold border-b-2 border-[#252525]'
                  : 'text-[#666666]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
