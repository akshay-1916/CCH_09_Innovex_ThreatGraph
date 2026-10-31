import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginEvent } from '../types';
import {
  Shield,
  Building2,
  Clock,
  MapPin,
  Laptop,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Check,
  X,
  Send,
  Calendar,
  LogOut,
} from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const { user, token, logout } = useAuth();

  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Change Password State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Report Unfamiliar Login Modal State
  const [reportModalEvent, setReportModalEvent] = useState<LoginEvent | null>(null);
  const [reportComments, setReportComments] = useState('');
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployeeData();
  }, [token]);

  const fetchEmployeeData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/employee', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }

      const resHist = await fetch('/api/events/my-history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resHist.ok) {
        setEvents(await resHist.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setPasswordMsg(null);
    try {
      const res = await fetch('/api/employee/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg({ type: 'success', text: 'Password successfully updated!' });
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPasswordMsg({ type: 'error', text: data.error || 'Failed to update password' });
      }
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Error updating password' });
    }
  };

  const handleReportUnfamiliar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !reportModalEvent) return;
    try {
      const res = await fetch('/api/employee/report-unfamiliar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ eventId: reportModalEvent.id, comments: reportComments }),
      });
      if (res.ok) {
        setReportSuccess('Your incident report has been securely submitted to the Centralized Security Team.');
        setReportComments('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const lastLogin = events.length > 0 ? events[0] : null;

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
            Employee Security Portal
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
            Welcome back, {user?.name || user?.username}
          </h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>{user?.designation}</span>
            <span className="text-slate-600">•</span>
            <span>{user?.department}</span>
            <span className="text-slate-600">•</span>
            <strong className="text-slate-200">{user?.organizationName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowPasswordModal(true);
              setPasswordMsg(null);
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Change Password</span>
          </button>
        </div>
      </div>

      {/* Security Baseline & Last Login Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Last Detected Session</span>
          </span>
          {lastLogin ? (
            <div>
              <div className="text-sm font-bold text-white mt-1">
                {new Date(lastLogin.timestamp).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                IP: <strong className="text-slate-300">{lastLogin.ipAddress}</strong> · {lastLogin.location}
              </div>
            </div>
          ) : (
            <div className="text-slate-500">First active session</div>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Standard Working Hours</span>
          </span>
          <div className="text-sm font-bold text-white mt-1">
            {profile?.normalStartHour || 9}:00 - {profile?.normalEndHour || 18}:00 IST
          </div>
          <div className="text-[11px] text-slate-400">Logins outside this window trigger an early warning flag.</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Account Security Status</span>
          </span>
          <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Active & Normal</span>
          </div>
          <div className="text-[11px] text-slate-400">All recent authentication telemetry verified.</div>
        </div>
      </div>

      {/* Personal Login History Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Your Personal Login History ({events.length} Recorded Sessions)
            </h3>
            <p className="text-xs text-slate-400">
              Every time you log in, your session timestamp, IP address, device, and location are captured automatically.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-500">
            Notice unfamiliar activity? Click <strong>Report Unfamiliar</strong>.
          </div>
        </div>

        <div className="border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Session Time</th>
                <th className="py-2.5 px-3">Origin IP</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Device & Browser</th>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-3 text-right">Security Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/50 text-slate-300">
              {events.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-900/60 transition">
                  <td className="py-2.5 px-3 font-bold text-white">
                    {new Date(evt.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3">{evt.ipAddress}</td>
                  <td className="py-2.5 px-3 text-slate-400">{evt.location}</td>
                  <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{evt.deviceId}</td>
                  <td className="py-2.5 px-3">
                    {evt.loginSuccess ? (
                      <span className="text-emerald-400 font-bold">SUCCESS</span>
                    ) : (
                      <span className="text-red-400 font-bold">FAILED</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => {
                        setReportModalEvent(evt);
                        setReportSuccess(null);
                        setReportComments('');
                      }}
                      className="px-2.5 py-1 rounded-lg border border-red-800/60 hover:bg-red-950/40 text-red-300 text-[11px] transition cursor-pointer"
                    >
                      Report Unfamiliar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Change Account Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordMsg && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : 'bg-red-950/60 border-red-500/50 text-red-300'
                }`}
              >
                {passwordMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT UNFAMILIAR LOGIN MODAL */}
      {reportModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-bold text-white">Report Unfamiliar Login Attempt</h3>
              </div>
              <button onClick={() => setReportModalEvent(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 space-y-2">
                <div className="font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Report Received!</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans">{reportSuccess}</p>
                <button
                  onClick={() => setReportModalEvent(null)}
                  className="w-full py-2 rounded-xl bg-slate-800 text-white font-bold mt-2"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleReportUnfamiliar} className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div>Timestamp: <strong className="text-white">{new Date(reportModalEvent.timestamp).toLocaleString()}</strong></div>
                  <div>Origin IP: <strong className="text-cyan-400">{reportModalEvent.ipAddress}</strong></div>
                  <div>Location: <strong className="text-white">{reportModalEvent.location}</strong></div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Explain why this attempt is unfamiliar:</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. I was not at this location / I do not recognize this IP or device."
                    value={reportComments}
                    onChange={(e) => setReportComments(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setReportModalEvent(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Security Report</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
