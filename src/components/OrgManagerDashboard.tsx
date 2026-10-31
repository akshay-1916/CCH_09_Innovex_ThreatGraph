import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LoginEvent } from '../types';
import {
  Building2,
  Users,
  UserPlus,
  Key,
  ShieldCheck,
  Activity,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Lock,
  RefreshCw,
  Plus,
  Edit2,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';

export const OrgManagerDashboard: React.FC = () => {
  const { user, token } = useAuth();

  const [activeTab, setActiveTab] = useState<'employees' | 'logins'>('employees');
  const [stats, setStats] = useState<any>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter
  const [empSearch, setEmpSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');

  // Modals
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [addEmpForm, setAddEmpForm] = useState({
    username: '',
    name: '',
    email: '',
    department: 'Engineering',
    designation: 'Software Engineer',
    password: '',
  });
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; pass: string } | null>(null);

  const [resetPassModal, setResetPassModal] = useState<{ empId: string; empName: string } | null>(null);
  const [newTempPassword, setNewTempPassword] = useState<string | null>(null);

  // Selected Employee for History Modal
  const [historyEmp, setHistoryEmp] = useState<User | null>(null);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Organization Dashboard stats
      const resStats = await fetch('/api/dashboard/organization', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resStats.ok) setStats(await resStats.json());

      // 2. Employees (Tenant isolated)
      const resEmps = await fetch('/api/employees', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resEmps.ok) setEmployees(await resEmps.json());

      // 3. Organization Events (Tenant isolated)
      const resEvts = await fetch('/api/events', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resEvts.ok) setEvents(await resEvts.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(addEmpForm),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedCredentials({ username: data.employee.username, pass: data.temporaryPassword });
        setAddEmpForm({ username: '', name: '', email: '', department: 'Engineering', designation: 'Software Engineer', password: '' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (empId: string, currentStatus: boolean) => {
    if (!token) return;
    try {
      await fetch(`/api/employees/${empId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active: !currentStatus }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetPassword = async (empId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/employees/${empId}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setNewTempPassword(data.temporaryPassword);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCsv = () => {
    window.location.href = '/api/reports/login';
  };

  const filteredEmployees = employees.filter((emp) => {
    if (!empSearch) return true;
    const q = empSearch.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.username.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      (emp.department && emp.department.toLowerCase().includes(q))
    );
  });

  const filteredEvents = events.filter((evt) => {
    if (!eventSearch) return true;
    const q = eventSearch.toLowerCase();
    return (
      evt.employeeName.toLowerCase().includes(q) ||
      evt.ipAddress.toLowerCase().includes(q) ||
      evt.location.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Organization Header & Isolation Notice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-cyan-950/80 border border-cyan-500/30 rounded-2xl text-cyan-400 shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{user?.organizationName}</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400">
                TENANT CONFINED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Organization Manager: <strong className="text-slate-200">{user?.name}</strong> ({user?.email})
            </p>
          </div>
        </div>

        {/* Tenant Isolation Badge */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Strict Tenant Boundary Active</span>
          </div>
          <div className="text-[11px] text-slate-500 font-sans">
            You can only access employees and login records of <strong>{user?.organizationName}</strong>. Administrative threat analysis and foreign org access are blocked (403 Forbidden).
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400">Total Employees</span>
            <div className="text-xl font-bold text-white mt-1">{stats.totalEmployees}</div>
            <div className="text-[10px] text-cyan-400 mt-1">In your organization</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400">Active Accounts</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">{stats.activeEmployees}</div>
            <div className="text-[10px] text-emerald-400/80 mt-1">Authorized access</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400">Inactive Accounts</span>
            <div className="text-xl font-bold text-slate-400 mt-1">{stats.inactiveEmployees}</div>
            <div className="text-[10px] text-slate-500 mt-1">Suspended / Pending</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400">Total Login Events</span>
            <div className="text-xl font-bold text-white mt-1">{stats.totalLoginEvents}</div>
            <div className="text-[10px] text-slate-400 mt-1">Recorded automatically</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400">Failed Attempts</span>
            <div className="text-xl font-bold text-amber-400 mt-1">{stats.failedLogins}</div>
            <div className="text-[10px] text-amber-400/80 mt-1">Failed passwords</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'employees'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-bold shadow-inner'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Employee Management ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logins')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'logins'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-bold shadow-inner'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Organization Login Telemetry ({events.length})</span>
        </button>
      </div>

      {/* TAB 1: EMPLOYEE MANAGEMENT TABLE */}
      {activeTab === 'employees' && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                <Users className="w-4 h-4 text-cyan-400" />
                Employee Roster & Credential Management
              </h3>
              <p className="text-xs text-slate-400">
                Register new employees, issue credentials, reset passwords, and toggle account activation.
              </p>
            </div>

            <button
              onClick={() => {
                setShowAddEmpModal(true);
                setCreatedCredentials(null);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/40"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Employee</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative max-w-md font-mono text-xs">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by employee name, username, or department..."
              value={empSearch}
              onChange={(e) => setEmpSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Employees Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Emp ID</th>
                  <th className="py-2.5 px-3">Name & Email</th>
                  <th className="py-2.5 px-3">Department & Role</th>
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/50 text-slate-300">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-900/60 transition">
                    <td className="py-2.5 px-3 text-cyan-400 font-bold">{emp.id}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white font-sans">{emp.name}</div>
                      <div className="text-[11px] text-slate-500">{emp.email}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-white">{emp.department}</div>
                      <div className="text-[11px] text-slate-500">{emp.designation}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-semibold">{emp.username}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                          emp.active
                            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                            : 'bg-red-950/80 border-red-500/50 text-red-300'
                        }`}
                      >
                        {emp.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setResetPassModal({ empId: emp.id, empName: emp.name });
                            setNewTempPassword(null);
                          }}
                          title="Reset Password"
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white transition cursor-pointer"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setHistoryEmp(emp)}
                          title="View Login History"
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white transition cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(emp.id, emp.active)}
                          className={`px-2 py-1 rounded-lg border text-[10px] font-bold cursor-pointer transition ${
                            emp.active
                              ? 'border-red-800 text-red-400 hover:bg-red-950/40'
                              : 'border-emerald-800 text-emerald-400 hover:bg-emerald-950/40'
                          }`}
                        >
                          {emp.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ORGANIZATION LOGIN TELEMETRY */}
      {activeTab === 'logins' && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                <Activity className="w-4 h-4 text-cyan-400" />
                Employee Login History ({user?.organizationName})
              </h3>
              <p className="text-xs text-slate-400">
                Live record of employee logins captured automatically by the backend.
              </p>
            </div>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 font-mono text-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Org Report (CSV)</span>
            </button>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Event ID</th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Origin IP</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/50 text-slate-300">
                {filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-900/60 transition">
                    <td className="py-2.5 px-3 text-cyan-400 font-bold">{evt.id}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{evt.employeeName}</td>
                    <td className="py-2.5 px-3">{evt.ipAddress}</td>
                    <td className="py-2.5 px-3 text-slate-400">{new Date(evt.timestamp).toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      {evt.loginSuccess ? (
                        <span className="text-emerald-400 font-bold">SUCCESS</span>
                      ) : (
                        <span className="text-red-400 font-bold">FAILED ({evt.failedAttempts})</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{evt.location}</td>
                    <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">{evt.deviceId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add New Employee ({user?.organizationName})</h3>
              <button onClick={() => setShowAddEmpModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdCredentials ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 space-y-2">
                <div className="font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Employee Registered & Credentials Generated!</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-white space-y-1">
                  <div>Username: <strong className="text-cyan-400">{createdCredentials.username}</strong></div>
                  <div>Temporary Password: <strong className="text-emerald-400">{createdCredentials.pass}</strong></div>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Provide these credentials to the employee. They will be prompted to change their password on first login.
                </p>
                <button
                  onClick={() => setShowAddEmpModal(false)}
                  className="w-full mt-2 py-2 rounded-xl bg-slate-800 text-white font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddEmployee} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Manisha Rao"
                      value={addEmpForm.name}
                      onChange={(e) => setAddEmpForm({ ...addEmpForm, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Username</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. emp_manisha"
                      value={addEmpForm.username}
                      onChange={(e) => setAddEmpForm({ ...addEmpForm, username: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Corporate Email</label>
                  <input
                    type="email"
                    required
                    placeholder="manisha@abctech.com"
                    value={addEmpForm.email}
                    onChange={(e) => setAddEmpForm({ ...addEmpForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Department</label>
                    <input
                      type="text"
                      placeholder="Software Engineering"
                      value={addEmpForm.department}
                      onChange={(e) => setAddEmpForm({ ...addEmpForm, department: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Designation</label>
                    <input
                      type="text"
                      placeholder="Software Engineer"
                      value={addEmpForm.designation}
                      onChange={(e) => setAddEmpForm({ ...addEmpForm, designation: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddEmpModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold"
                  >
                    Register & Generate Credentials
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Reset Password</h3>
              <button onClick={() => setResetPassModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-400 font-sans">
              Issue a temporary password for employee <strong className="text-white">{resetPassModal.empName}</strong>.
            </p>

            {newTempPassword ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 space-y-2">
                <span className="text-emerald-400 font-bold">New Temporary Password Generated:</span>
                <div className="p-3 bg-slate-950 rounded-lg text-lg font-black text-white">{newTempPassword}</div>
                <button
                  onClick={() => setResetPassModal(null)}
                  className="w-full py-2 rounded-xl bg-slate-800 text-white font-bold mt-2"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="flex justify-end gap-2 pt-3">
                <button
                  onClick={() => setResetPassModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleResetPassword(resetPassModal.empId)}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Generate Reset Password
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EMPLOYEE LOGIN HISTORY MODAL */}
      {historyEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 font-mono text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-cyan-400 font-bold">{historyEmp.id}</span>
                <h3 className="text-base font-bold text-white font-sans">{historyEmp.name} Login History</h3>
              </div>
              <button onClick={() => setHistoryEmp(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/80 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              {events.filter((e) => e.userId === historyEmp.id).length === 0 ? (
                <div className="p-6 text-center text-slate-500">No login attempts recorded yet for this account.</div>
              ) : (
                events
                  .filter((e) => e.userId === historyEmp.id)
                  .map((evt) => (
                    <div key={evt.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="text-white font-bold">{evt.ipAddress} · {evt.location}</div>
                        <div className="text-slate-500 text-[11px]">{new Date(evt.timestamp).toLocaleString()}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${evt.loginSuccess ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                        {evt.loginSuccess ? 'SUCCESS' : `FAILED (${evt.failedAttempts})`}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
