import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Building2, User as UserIcon, LogOut, Radio } from 'lucide-react';

interface NavbarProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
  tabs?: Array<{ id: string; label: string; icon: React.ReactNode }>;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange, tabs = [] }) => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          bg: 'bg-purple-950/80 border-purple-500/50 text-purple-300',
          dot: 'bg-purple-400',
          label: 'SUPER ADMIN',
        };
      case 'ORGANIZATION_MANAGER':
        return {
          bg: 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300',
          dot: 'bg-cyan-400',
          label: 'ORG MANAGER',
        };
      case 'EMPLOYEE':
        return {
          bg: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300',
          dot: 'bg-emerald-400',
          label: 'EMPLOYEE',
        };
      default:
        return {
          bg: 'bg-slate-800 border-slate-700 text-slate-300',
          dot: 'bg-slate-400',
          label: 'USER',
        };
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <header className="border-b border-slate-800/90 bg-slate-950/85 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-950 border border-cyan-500/40 rounded-xl text-cyan-400 shadow-inner">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">ThreatGraph</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400">
                ENTERPRISE SOC
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Explainable Cyber Threat Detection & Multi-Tenant Behavior Platform
            </p>
          </div>
        </div>

        {/* Right Info & Role Tag */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          {user?.organizationName && user.role !== 'SUPER_ADMIN' && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{user.organizationName}</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
            <span className="font-bold">{user?.name || user?.username}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badge.bg}`}>
              {badge.label}
            </span>
          </div>

          <button
            onClick={logout}
            title="Log out securely"
            className="p-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Optional Sub-Tab Bar */}
      {tabs.length > 0 && (
        <div className="border-t border-slate-800/80 bg-slate-950/60 px-6">
          <div className="max-w-7xl mx-auto flex space-x-2 overflow-x-auto py-2 text-xs font-mono">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange && onTabChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                  currentTab === tab.id
                    ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-bold shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
