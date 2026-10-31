import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Organization,
  User,
  LoginEvent,
  ThreatAlert,
  ThreatGraphNode,
  ThreatGraphEdge,
  DetectionRule,
  AuditLog,
  SimulatorResult,
} from '../types';
import {
  ShieldAlert,
  Building2,
  Users,
  Activity,
  AlertTriangle,
  Network,
  Cpu,
  FileText,
  Sliders,
  Download,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Check,
  X,
  Clock,
  MapPin,
  Laptop,
  Terminal,
  ShieldCheck,
  AlertOctagon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export const SuperAdminDashboard: React.FC = () => {
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'organizations' | 'alerts' | 'graph' | 'simulator' | 'rules' | 'audit'
  >('overview');

  // Overview Stats & Charts Data
  const [stats, setStats] = useState<any>(null);
  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [alerts, setAlerts] = useState<ThreatAlert[]>([]);
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters for Events Table
  const [search, setSearch] = useState('');
  const [filterOrg, setFilterOrg] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');

  // Selected Detail Modal
  const [selectedEvent, setSelectedEvent] = useState<LoginEvent | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<ThreatAlert | null>(null);

  // Create Organization Form State
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [orgForm, setOrgForm] = useState({
    name: '',
    code: '',
    email: '',
    address: '',
    contactNumber: '',
  });

  // ThreatGraph Canvas State
  const [graphNodes, setGraphNodes] = useState<ThreatGraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<ThreatGraphEdge[]>([]);
  const [selectedGraphNode, setSelectedGraphNode] = useState<ThreatGraphNode | null>(null);
  const [graphFilterRisk, setGraphFilterRisk] = useState('all');

  // What-If Simulator State
  const [simParams, setSimParams] = useState({
    userId: 'EMP-101 (Rahul Joshi)',
    failedAttempts: 8,
    ipAddress: '45.23.11.90',
    isUnknownIp: true,
    loginHour: 3,
    location: 'Frankfurt, Germany',
    isUnusualLocation: true,
    isSharedIp: true,
  });
  const [simResult, setSimResult] = useState<SimulatorResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Admin Stats
      const resStats = await fetch('/api/dashboard/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resStats.ok) setStats(await resStats.json());

      // 2. Events
      const resEvt = await fetch('/api/events', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resEvt.ok) setEvents(await resEvt.json());

      // 3. Organizations
      const resOrgs = await fetch('/api/organizations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resOrgs.ok) setOrganizations(await resOrgs.json());

      // 4. Alerts
      const resAlt = await fetch('/api/alerts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resAlt.ok) setAlerts(await resAlt.json());

      // 5. ThreatGraph
      const resGraph = await fetch('/api/threat-graph', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resGraph.ok) {
        const gData = await resGraph.json();
        setGraphNodes(gData.nodes || []);
        setGraphEdges(gData.edges || []);
      }

      // 6. Rules
      const resRules = await fetch('/api/rules', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resRules.ok) setRules(await resRules.json());

      // 7. Audit Logs
      const resAudit = await fetch('/api/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resAudit.ok) setAuditLogs(await resAudit.json());
    } catch (e) {
      console.error('Failed to fetch admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(orgForm),
      });
      if (res.ok) {
        setShowCreateOrgModal(false);
        setOrgForm({ name: '', code: '', email: '', address: '', contactNumber: '' });
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOrgStatusToggle = async (id: string, currentStatus: string) => {
    if (!token) return;
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await fetch(`/api/organizations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAlertStatusUpdate = async (alertId: string, newStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/alerts/${alertId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, note: `Status updated to ${newStatus} by Super Admin` }),
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunSimulation = async () => {
    if (!token) return;
    setSimLoading(true);
    try {
      const res = await fetch('/api/simulator/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(simParams),
      });
      if (res.ok) {
        setSimResult(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimLoading(false);
    }
  };

  const handleExportCsv = () => {
    window.location.href = '/api/reports/login';
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-950/80 border-red-500/50 text-red-300';
      case 'HIGH':
        return 'bg-orange-950/80 border-orange-500/50 text-orange-300';
      case 'MEDIUM':
        return 'bg-amber-950/80 border-amber-500/50 text-amber-300';
      default:
        return 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300';
    }
  };

  // Filtered Events
  const filteredEvents = events.filter((e) => {
    if (filterOrg !== 'all' && e.organizationId !== filterOrg) return false;
    if (filterRisk !== 'all' && e.riskLevel !== filterRisk) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.employeeName.toLowerCase().includes(q) ||
        e.ipAddress.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.organizationName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const RISK_COLORS = ['#10B981', '#F59E0B', '#F97316', '#EF4444'];

  return (
    <div className="space-y-6">
      
      {/* Super Admin Tab Navigation */}
      <div className="border-b border-slate-800 bg-slate-950/60 -mx-6 px-6 pb-2">
        <div className="max-w-7xl mx-auto flex space-x-2 overflow-x-auto text-xs font-mono">
          {[
            { id: 'overview', label: 'Central SOC Dashboard', icon: <Activity className="w-3.5 h-3.5" /> },
            { id: 'organizations', label: `Organizations (${organizations.length})`, icon: <Building2 className="w-3.5 h-3.5" /> },
            { id: 'alerts', label: `Threat Alerts (${alerts.length})`, icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> },
            { id: 'graph', label: 'ThreatGraph Canvas', icon: <Network className="w-3.5 h-3.5 text-purple-400" /> },
            { id: 'simulator', label: 'What-If Attack Simulator', icon: <Cpu className="w-3.5 h-3.5 text-cyan-400" /> },
            { id: 'rules', label: 'Detection Rules & Scoring', icon: <Sliders className="w-3.5 h-3.5" /> },
            { id: 'audit', label: 'Audit Trail', icon: <FileText className="w-3.5 h-3.5" /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === t.id
                  ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-bold shadow-inner'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: OVERVIEW DASHBOARD */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          
          {/* Top 6 KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400">Total Organizations</span>
              <div className="text-xl font-bold text-white mt-1">{stats.totalOrganizations}</div>
              <div className="text-[10px] text-cyan-400 mt-1">Multi-Tenant Isolated</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400">Total Employees</span>
              <div className="text-xl font-bold text-white mt-1">{stats.totalEmployees}</div>
              <div className="text-[10px] text-slate-400 mt-1">Across all tenants</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400">Total Login Events</span>
              <div className="text-xl font-bold text-white mt-1">{stats.totalLoginEvents}</div>
              <div className="text-[10px] text-emerald-400 mt-1">{stats.successfulLogins} Successful</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400">Failed Logins</span>
              <div className="text-xl font-bold text-amber-400 mt-1">{stats.failedLogins}</div>
              <div className="text-[10px] text-amber-400/80 mt-1">Under baseline review</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400">Suspicious Events</span>
              <div className="text-xl font-bold text-orange-400 mt-1">{stats.suspiciousEvents}</div>
              <div className="text-[10px] text-orange-400/80 mt-1">Risk Score ≥ 30</div>
            </div>

            <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/40">
              <span className="text-[11px] text-red-300">Critical Threats</span>
              <div className="text-xl font-bold text-red-400 mt-1">{stats.criticalAlerts}</div>
              <div className="text-[10px] text-red-400/80 mt-1">Score 80–100</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Chart 1: Risk Distribution (Donut) */}
            <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-4 flex items-center justify-between">
                <span>Risk Level Breakdown</span>
                <span className="text-cyan-400 font-mono text-[11px]">0-100 Spectrum</span>
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {stats.riskDistribution?.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0B1120', borderColor: '#334155', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
                {stats.riskDistribution?.map((item: any, i: number) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_COLORS[i] }}></span>
                    <span className="text-slate-400 truncate">{item.name}:</span>
                    <span className="text-white font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Organization-wise Activity (Bar Chart) */}
            <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-4 flex items-center justify-between">
                <span>Organization Activity & Anomalies</span>
                <span className="text-cyan-400 font-mono text-[11px]">Tenant Breakdown</span>
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.orgBreakdown}>
                    <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickFormatter={(val) => val.split(' ')[0]} />
                    <YAxis stroke="#64748B" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B1120', borderColor: '#334155', borderRadius: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <Bar dataKey="total" name="Total Logins" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="suspicious" name="Suspicious" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Suspicious IPs Box */}
            <div className="lg:col-span-3 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur space-y-3 font-mono">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-400" />
                <span>Top Correlated IPs</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Source IPs correlated across multiple user accounts and failed attempts.
              </p>
              <div className="space-y-2 mt-2 text-xs">
                {stats.topSuspiciousIps?.map((ipItem: any) => (
                  <div key={ipItem.ip} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-300">{ipItem.ip}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
                        {ipItem.incidentCount} Fails
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>{ipItem.location}</span>
                      <span>Targeting {ipItem.uniqueAccounts} Accounts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Recent Telemetry Activity Table */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Live Ingested Telemetry Feed (All Organizations)
                </h3>
                <p className="text-xs text-slate-400">
                  Automatically collected on employee login. Real-time deterministic risk scores & explanations.
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search employee, IP, or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 pl-9 pr-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Tenant:</span>
                <select
                  value={filterOrg}
                  onChange={(e) => setFilterOrg(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="all">All Organizations</option>
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Risk:</span>
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="LOW">LOW (0-29)</option>
                  <option value="MEDIUM">MEDIUM (30-59)</option>
                  <option value="HIGH">HIGH (60-79)</option>
                  <option value="CRITICAL">CRITICAL (80-100)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Event ID</th>
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Organization</th>
                    <th className="py-2.5 px-3">Origin IP</th>
                    <th className="py-2.5 px-3">Result & Fails</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3 text-center">Score</th>
                    <th className="py-2.5 px-3 text-right">Explanations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/50 text-slate-300">
                  {filteredEvents.slice(0, 15).map((evt) => (
                    <tr
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className="hover:bg-slate-900/60 transition cursor-pointer"
                    >
                      <td className="py-2.5 px-3 text-cyan-400 font-bold">{evt.id}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{evt.employeeName}</td>
                      <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{evt.organizationName}</td>
                      <td className="py-2.5 px-3">{evt.ipAddress}</td>
                      <td className="py-2.5 px-3">
                        {evt.loginSuccess ? (
                          <span className="text-emerald-400 font-medium">SUCCESS</span>
                        ) : (
                          <span className="text-red-400 font-medium">FAILED ({evt.failedAttempts})</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{evt.location}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold ${getRiskBadge(evt.riskLevel)}`}>
                          {evt.riskScore} · {evt.riskLevel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="text-cyan-400 hover:underline">View Reasons →</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MULTI-ORGANIZATIONS MANAGEMENT */}
      {activeTab === 'organizations' && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                <Building2 className="w-5 h-5 text-cyan-400" />
                Centralized Organization Registry ({organizations.length})
              </h3>
              <p className="text-xs text-slate-400">
                Super Admin registers client organizations and oversees tenant account managers.
              </p>
            </div>

            <button
              onClick={() => setShowCreateOrgModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Organization</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {organizations.map((org) => (
              <div key={org.id} className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 font-mono text-[10px] font-bold">
                      {org.code}
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">{org.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{org.address}</p>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold ${
                      org.status === 'ACTIVE'
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                        : 'bg-red-950/80 border-red-500/50 text-red-300'
                    }`}
                  >
                    {org.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 text-[10px]">Manager In Charge:</span>
                    <div className="text-white font-bold truncate mt-0.5">{org.managerName || 'Unassigned'}</div>
                    <div className="text-[10px] text-slate-400 truncate">{org.managerEmail}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">Active Employees:</span>
                    <div className="text-white font-bold mt-0.5">{org.employeeCount} Registered</div>
                    <div className="text-[10px] text-cyan-400">Isolated Tenant</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800">
                  <span className="text-slate-500">Contact: {org.contactNumber}</span>
                  <button
                    onClick={() => handleOrgStatusToggle(org.id, org.status)}
                    className="text-xs text-cyan-400 hover:underline cursor-pointer"
                  >
                    {org.status === 'ACTIVE' ? 'Deactivate Org' : 'Activate Org'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: THREAT ALERTS & INVESTIGATION */}
      {activeTab === 'alerts' && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Centralized Threat Alert Investigation
              </h3>
              <p className="text-xs text-slate-400">
                Only Super Admin can investigate alerts, review plain-English reasons, and update resolution statuses.
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 font-mono text-xs font-bold">
              {alerts.length} Flagged Incidents
            </span>
          </div>

          <div className="space-y-3 font-mono">
            {alerts.map((alt) => (
              <div
                key={alt.id}
                className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 font-bold text-xs">
                      {alt.alertCode}
                    </span>
                    <div>
                      <span className="text-sm font-bold text-white font-sans">{alt.employeeName}</span>
                      <span className="text-xs text-slate-400 ml-2">({alt.organizationName})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold ${getRiskBadge(alt.riskLevel)}`}>
                      {alt.riskScore} · {alt.riskLevel}
                    </span>

                    <select
                      value={alt.status}
                      onChange={(e) => handleAlertStatusUpdate(alt.id, e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1 focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="NEW">NEW</option>
                      <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
                    </select>
                  </div>
                </div>

                {/* Plain-English Reasons */}
                <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 space-y-1.5 text-xs">
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    Explainable Detection Reasons:
                  </div>
                  {alt.reasons?.map((r, i) => (
                    <div key={i} className="text-slate-200 flex items-start gap-2">
                      <span className="text-cyan-400 shrink-0">▸</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-800/30 text-xs text-blue-200">
                  <strong className="text-blue-300 uppercase tracking-wider font-mono text-[10px] block mb-0.5">
                    Recommended Response (Administrator Review Only):
                  </strong>
                  {alt.recommendations && alt.recommendations.join(' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: THREATGRAPH RELATIONSHIP GRAPH */}
      {activeTab === 'graph' && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                <Network className="w-5 h-5 text-purple-400" />
                ThreatGraph Interactive Relationship Visualization
              </h3>
              <p className="text-xs text-slate-400">
                Visualizes correlation across Organizations → Employees → Telemetry Events → Origin IPs → Threat Alerts.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-400">Filter Severity:</span>
              <select
                value={graphFilterRisk}
                onChange={(e) => setGraphFilterRisk(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none"
              >
                <option value="all">All Entities</option>
                <option value="CRITICAL">Critical Only</option>
                <option value="HIGH">High & Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Visual Canvas Panel */}
            <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-5 min-h-[460px] relative overflow-hidden flex flex-col justify-between">
              <div className="text-[11px] font-mono text-slate-500 mb-2 flex items-center justify-between">
                <span>CANVAS: ACTIVE DYNAMIC GRAPH ({graphNodes.length} NODES · {graphEdges.length} EDGES)</span>
                <span className="text-purple-400">Click any node to inspect telemetry</span>
              </div>

              {/* Node Hierarchy Clusters */}
              <div className="space-y-6">
                {/* Level 1: Organizations */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-2">
                    Tier 1: Multi-Tenant Organizations
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {graphNodes
                      .filter((n) => n.type === 'organization')
                      .map((node) => (
                        <button
                          key={node.id}
                          onClick={() => setSelectedGraphNode(node)}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer font-mono text-xs ${
                            selectedGraphNode?.id === node.id
                              ? 'bg-purple-950 border-purple-500 text-white ring-2 ring-purple-500/50'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-bold text-purple-300 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{node.label}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">{node.subtitle}</div>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Level 2: Target Employees */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-2">
                    Tier 2: Employees Correlated
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {graphNodes
                      .filter((n) => n.type === 'employee')
                      .slice(0, 8)
                      .map((node) => (
                        <button
                          key={node.id}
                          onClick={() => setSelectedGraphNode(node)}
                          className={`p-2 rounded-lg border text-left transition cursor-pointer font-mono text-xs ${
                            selectedGraphNode?.id === node.id
                              ? 'bg-cyan-950 border-cyan-500 text-white ring-2 ring-cyan-500/50'
                              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-bold text-white">{node.label}</div>
                          <div className="text-[10px] text-slate-500">{node.subtitle}</div>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Level 3: Suspicious Correlated IPs & Incidents */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-2">
                    Tier 3: Attack Correlation (Shared IPs & Threat Alerts)
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {graphNodes
                      .filter((n) => n.type === 'ip' || n.type === 'alert')
                      .map((node) => {
                        const isAlert = node.type === 'alert';
                        const isSharedIp = node.subtitle?.includes('Shared');
                        return (
                          <button
                            key={node.id}
                            onClick={() => setSelectedGraphNode(node)}
                            className={`p-3 rounded-xl border text-left transition cursor-pointer font-mono text-xs ${
                              selectedGraphNode?.id === node.id
                                ? 'bg-red-950 border-red-500 text-white ring-2 ring-red-500/50'
                                : isSharedIp
                                ? 'bg-red-950/40 border-red-700 text-red-300'
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="font-bold flex items-center gap-1.5">
                              {isAlert ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <Network className="w-3.5 h-3.5 text-red-400" />
                              )}
                              <span>{node.label}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">{node.subtitle}</div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Correlation Note */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 mt-6">
                ℹ️ <strong>Correlation Notice:</strong> A shared IP or foreign geolocation indicates a correlation for review, not definitive proof of an account compromise.
              </div>
            </div>

            {/* Right Node Details Panel */}
            <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-5 font-mono space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
                Entity Inspection Sidebar
              </h4>

              {selectedGraphNode ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Selected Node ID</span>
                    <div className="text-cyan-400 font-bold">{selectedGraphNode.id}</div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Entity Class</span>
                    <div className="text-white font-bold uppercase">{selectedGraphNode.type}</div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Label & Title</span>
                    <div className="text-white font-bold">{selectedGraphNode.label}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">{selectedGraphNode.subtitle}</div>
                  </div>

                  {selectedGraphNode.riskScore !== undefined && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase">Calculated Risk Score</span>
                      <div className="text-lg font-bold text-red-400">
                        {selectedGraphNode.riskScore} / 100 ({selectedGraphNode.riskLevel})
                      </div>
                    </div>
                  )}

                  {selectedGraphNode.data && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-[11px]">
                      <span className="text-[10px] text-slate-500 uppercase block mb-1">Raw Telemetry Attributes</span>
                      {Object.entries(selectedGraphNode.data)
                        .filter(([k]) => !['reasons', 'recommendations'].includes(k))
                        .slice(0, 6)
                        .map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-slate-400">{k}:</span>
                            <span className="text-slate-200 truncate max-w-[140px]">{String(v)}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Click any node on the graph canvas to inspect its details and connections.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* VIEW 5: WHAT-IF ATTACK SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 font-mono">
          <div className="md:col-span-7 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                What-If Login Threat Simulator
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                Allows Super Admin to adjust telemetry parameters to observe explainable score shifts. Generates zero real authentication attempts.
              </p>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  setSimParams({
                    userId: 'EMP-101 (Rahul Joshi)',
                    failedAttempts: 0,
                    ipAddress: '192.168.1.50',
                    isUnknownIp: false,
                    loginHour: 10,
                    location: 'Pune, India',
                    isUnusualLocation: false,
                    isSharedIp: false,
                  })
                }
                className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-emerald-400 text-xs cursor-pointer"
              >
                Normal Login Baseline (Score 0)
              </button>

              <button
                type="button"
                onClick={() =>
                  setSimParams({
                    userId: 'EMP-101 (Rahul Joshi)',
                    failedAttempts: 12,
                    ipAddress: '45.23.11.90',
                    isUnknownIp: true,
                    loginHour: 3,
                    location: 'Frankfurt, Germany',
                    isUnusualLocation: true,
                    isSharedIp: true,
                  })
                }
                className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-red-500/50 text-red-400 text-xs cursor-pointer"
              >
                Severe Multi-Vector Attack (Score 100)
              </button>
            </div>

            {/* Controls */}
            <div className="space-y-4 text-xs pt-2">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Failed Login Attempts:</span>
                  <span className="text-white font-bold">{simParams.failedAttempts} attempts</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={simParams.failedAttempts}
                  onChange={(e) => setSimParams({ ...simParams, failedAttempts: Number(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Login Hour (0-23):</span>
                  <span className="text-white font-bold">{simParams.loginHour}:00 hrs</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={simParams.loginHour}
                  onChange={(e) => setSimParams({ ...simParams, loginHour: Number(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer">
                  <span>Unknown IP Address</span>
                  <input
                    type="checkbox"
                    checked={simParams.isUnknownIp}
                    onChange={(e) => setSimParams({ ...simParams, isUnknownIp: e.target.checked })}
                    className="accent-cyan-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer">
                  <span>Unusual Geo-Location</span>
                  <input
                    type="checkbox"
                    checked={simParams.isUnusualLocation}
                    onChange={(e) => setSimParams({ ...simParams, isUnusualLocation: e.target.checked })}
                    className="accent-cyan-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer col-span-2">
                  <span>Correlated Shared Suspicious IP (≥ 3 accounts with failures)</span>
                  <input
                    type="checkbox"
                    checked={simParams.isSharedIp}
                    onChange={(e) => setSimParams({ ...simParams, isSharedIp: e.target.checked })}
                    className="accent-cyan-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={simLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition cursor-pointer"
              >
                {simLoading ? 'Evaluating Rules...' : 'Execute What-If Analysis'}
              </button>
            </div>
          </div>

          {/* Results Box */}
          <div className="md:col-span-5 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Simulation Diagnostic Output
            </h4>

            {simResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Calculated Score</span>
                    <div className="text-2xl font-black text-white mt-0.5">{simResult.riskScore} / 100</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full border text-xs font-bold ${getRiskBadge(simResult.riskLevel)}`}>
                    {simResult.riskLevel}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase">Triggered Deterministic Rules:</span>
                  {simResult.triggeredRules.length === 0 ? (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                      ✓ No anomaly triggered. Baseline normal event.
                    </div>
                  ) : (
                    simResult.triggeredRules.map((r, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <div className="flex justify-between font-bold text-white">
                          <span>{r.ruleName}</span>
                          <span className="text-cyan-400">+{r.points} pts</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-sans">{r.reason}</p>
                      </div>
                    ))
                  )}
                </div>

                {simResult.recommendations.length > 0 && (
                  <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-800/40 text-[11px] text-blue-200">
                    <strong className="text-blue-300 block mb-1">Recommended Response:</strong>
                    {simResult.recommendations.join(' ')}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 text-xs">
                Click "Execute What-If Analysis" to view real-time score shifts.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 6: DETECTION RULES CONFIGURATION */}
      {activeTab === 'rules' && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                Deterministic Scoring Rules Configuration
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Points and thresholds are stored in the database. Super Admin can adjust parameters dynamically.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((r) => (
              <div key={r.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{r.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold">
                    +{r.points} pts
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">Key: {r.ruleKey}</div>
                <p className="text-slate-400 font-sans">{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 7: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-4 font-mono text-xs">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Immutable Security Audit Trail
          </h3>
          <p className="text-xs text-slate-400 font-sans">
            Captures all administrative and security actions across organizations.
          </p>

          <div className="divide-y divide-slate-800/80 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold text-[10px]">
                      {log.action}
                    </span>
                    <span className="text-slate-400">Actor:</span>
                    <span className="text-white font-bold">{log.actor}</span>
                  </div>
                  <p className="text-slate-300 font-sans">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE ORGANIZATION MODAL */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Register New Organization</h3>
              <button onClick={() => setShowCreateOrgModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Security Corp"
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Organization Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. APEX"
                  value={orgForm.code}
                  onChange={(e) => setOrgForm({ ...orgForm, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="contact@apexcorp.com"
                  value={orgForm.email}
                  onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Tower A, Pune, Maharashtra"
                  value={orgForm.address}
                  onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateOrgModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold"
                >
                  Register Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVENT DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-cyan-400 font-bold">{selectedEvent.id}</span>
                <h3 className="text-base font-bold text-white font-sans">{selectedEvent.employeeName}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500">Organization:</span>
                <div className="text-white font-bold mt-0.5">{selectedEvent.organizationName}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500">Origin IP:</span>
                <div className="text-white font-bold mt-0.5">{selectedEvent.ipAddress}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500">Timestamp:</span>
                <div className="text-white font-bold mt-0.5">{new Date(selectedEvent.timestamp).toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500">Result & Fails:</span>
                <div className="text-white font-bold mt-0.5">
                  {selectedEvent.loginSuccess ? 'SUCCESS' : `FAILED (${selectedEvent.failedAttempts})`}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-500">Calculated Risk Score:</span>
                <div className="text-xl font-bold text-white mt-0.5">{selectedEvent.riskScore} / 100</div>
              </div>
              <span className={`px-3 py-1 rounded-full border font-bold ${getRiskBadge(selectedEvent.riskLevel)}`}>
                {selectedEvent.riskLevel}
              </span>
            </div>

            {selectedEvent.detectionReasons && selectedEvent.detectionReasons.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Explainable Detection Reasons:</span>
                {selectedEvent.detectionReasons.map((r, i) => (
                  <div key={i} className="text-slate-200">
                    ▸ {r}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
