import React, { useState } from 'react';
import { useAuth, DEMO_PRESETS, DemoRoleKey } from '../context/AuthContext';
import {
  ShieldAlert,
  Lock,
  User as UserIcon,
  ArrowRight,
  AlertTriangle,
  Building2,
  Users,
  Activity,
  Network,
  Cpu,
  Layers,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginDemo, isLoading, error } = useAuth();
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('Admin@123');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };

  const handleDemoClick = (key: DemoRoleKey) => {
    loginDemo(key);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Banner */}
      <div className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur px-6 py-2.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono uppercase tracking-wider text-slate-300">SYSTEM: ACTIVE</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 font-mono">MULTI-TENANT CYBERSECURITY MONITORING</span>
        </div>
        <div className="font-mono text-slate-500 hidden md:block">
          ROLES: SUPER_ADMIN · ORGANIZATION_MANAGER · EMPLOYEE
        </div>
      </div>

      {/* Main Login Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-stretch">
          
          {/* Left Column: Login Card & Demo Quick Logins */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

            <div>
              {/* Brand Header */}
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/30 rounded-xl text-cyan-400 shadow-inner">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    ThreatGraph
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                      v2.0 Enterprise
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 font-medium">Explainable Cyber Threat Detection Platform</p>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-5 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                    Username or Email
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. superadmin, manager_abc, emp_rahul"
                      required
                      className="w-full bg-slate-950/70 border border-slate-700/80 focus:border-cyan-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full bg-slate-950/70 border border-slate-700/80 focus:border-cyan-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm rounded-xl transition duration-150 flex items-center justify-center space-x-2 shadow-lg shadow-cyan-900/20 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In & Record Telemetry</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* 1-Click Role Logins */}
            <div className="mt-8 pt-5 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  ⚡ 1-Click Evaluation Logins:
                </span>
                <span className="text-[11px] text-cyan-400 font-mono">3 Roles Isolated</span>
              </div>

              <div className="space-y-2">
                {/* Super Admin */}
                <button
                  type="button"
                  onClick={() => handleDemoClick('SUPER_ADMIN')}
                  className="w-full p-2.5 rounded-xl border border-purple-500/40 bg-purple-950/20 hover:bg-purple-950/40 text-left transition flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-purple-300">Super Admin (Centralized)</div>
                    <div className="text-[10px] text-slate-400 font-mono">superadmin · All orgs, ThreatGraph, alerts, simulator</div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 border border-purple-700 text-purple-300">
                    Full Control
                  </span>
                </button>

                {/* Org Managers */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoClick('MANAGER_ABC')}
                    className="p-2.5 rounded-xl border border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-950/40 text-left transition cursor-pointer"
                  >
                    <div className="text-xs font-bold text-cyan-300 truncate">Org Manager (ABC)</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">manager_abc · ABC Tech only</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoClick('MANAGER_XYZ')}
                    className="p-2.5 rounded-xl border border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-950/40 text-left transition cursor-pointer"
                  >
                    <div className="text-xs font-bold text-cyan-300 truncate">Org Manager (XYZ)</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">manager_xyz · XYZ Solutions</div>
                  </button>
                </div>

                {/* Employees */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoClick('EMPLOYEE_RAHUL')}
                    className="p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/40 text-left transition cursor-pointer"
                  >
                    <div className="text-xs font-bold text-emerald-300 truncate">Employee (Rahul)</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">emp_rahul · Personal portal</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoClick('EMPLOYEE_PRIYA')}
                    className="p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/40 text-left transition cursor-pointer"
                  >
                    <div className="text-xs font-bold text-emerald-300 truncate">Employee (Priya)</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">emp_priya · Personal portal</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Architectural Highlights */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-700/50 text-blue-300 text-xs font-mono mb-4">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                AUTOMATIC LOGIN EVENT TELEMETRY & BEHAVIOR MONITORING
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white mb-3">
                Centralized Multi-Tenant Security with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Strict Data Isolation</span>
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Whenever an employee authenticates, the backend automatically records login telemetry, compares the attempt against their historical profile baseline, evaluates 5 deterministic rules, and streams results to the Super Admin.
              </p>

              {/* 3 Value Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="p-2 w-fit rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 mb-3">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1 font-mono">Multi-Tenant Isolation</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Organization Managers can only access their own organization. Cross-organization access is strictly forbidden at API level.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="p-2 w-fit rounded-lg bg-purple-950 border border-purple-800 text-purple-400 mb-3">
                    <Network className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1 font-mono">ThreatGraph Canvas</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Interactive graph connecting Organizations → Employees → Events → Origin IPs → Threat Alerts.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="p-2 w-fit rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 mb-3">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1 font-mono">What-If Simulator</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Super Admin can test hypothetical attack parameters and verify explainable point contributions safely.
                  </p>
                </div>
              </div>
            </div>

            {/* Workflow Diagram Card */}
            <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6 font-mono text-xs text-slate-300">
              <div className="text-cyan-400 font-bold uppercase tracking-wider mb-3">
                Core Event Ingestion & Threat Detection Flow:
              </div>
              <div className="flex flex-wrap items-center gap-2 text-slate-400">
                <span className="p-2 rounded bg-slate-950 border border-slate-800 text-white">Manager Creates Emp</span>
                <span>→</span>
                <span className="p-2 rounded bg-slate-950 border border-slate-800 text-white">Emp Logs In</span>
                <span>→</span>
                <span className="p-2 rounded bg-slate-950 border border-slate-800 text-cyan-400">Auto Event Logged</span>
                <span>→</span>
                <span className="p-2 rounded bg-slate-950 border border-slate-800 text-amber-400">Threat Engine Evaluates</span>
                <span>→</span>
                <span className="p-2 rounded bg-slate-950 border border-slate-800 text-red-400">Alert to Super Admin</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Compliance Disclaimer Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500">
        <p className="max-w-4xl mx-auto">
          ⚠️ <strong className="text-slate-400">Security Disclaimer:</strong> Prototype using synthetic data. An early-warning aid, not a guarantee of attack prevention. Rule engine is deterministic and mathematically explainable; no machine-learning or black-box algorithms are utilized.
        </p>
      </footer>
    </div>
  );
};
