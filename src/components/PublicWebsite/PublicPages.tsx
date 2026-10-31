import React, { useState } from 'react';
import {
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Lock,
  Building2,
  Users,
  ChevronDown,
  ChevronUp,
  Mail,
  Send,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface PublicPageProps {
  onBack: () => void;
  onNavigateLogin: () => void;
}

// 1. ABOUT PAGE
export const AboutPage: React.FC<PublicPageProps> = ({ onBack, onNavigateLogin }) => (
  <div className="min-h-screen bg-[#070B14] text-slate-100 p-6 md:p-12">
    <div className="max-w-4xl mx-auto space-y-8">
      <button onClick={onBack} className="flex items-center gap-2 text-cyan-400 font-mono text-xs hover:underline cursor-pointer">
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </button>

      <div className="space-y-3">
        <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">Platform Blueprint</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">About ThreatGraph</h1>
        <p className="text-slate-300 text-sm leading-relaxed">
          ThreatGraph was engineered to solve one of the most critical vulnerabilities in modern enterprise Security Operations Centers: the lack of explainability in automated cyberattack detection.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-cyan-400 font-bold uppercase text-[11px]">Core Pillar 1</span>
          <h3 className="text-white font-bold text-sm">Deterministic Transparency</h3>
          <p className="text-slate-400 font-sans">
            No black-box models or uncalibrated probabilities. Every alert breaks down into exact rule weights and baseline profile evidence.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-purple-400 font-bold uppercase text-[11px]">Core Pillar 2</span>
          <h3 className="text-white font-bold text-sm">Multi-Tenant Isolation</h3>
          <p className="text-slate-400 font-sans">
            Complete data compartmentalization between organizations. Organization Managers can only see and manage their own employees.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-emerald-400 font-bold uppercase text-[11px]">Core Pillar 3</span>
          <h3 className="text-white font-bold text-sm">Automated Telemetry</h3>
          <p className="text-slate-400 font-sans">
            Server-side event ingestion on every authentication attempt. Captures client IP, device, and timestamp without manual user uploads.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 font-mono text-xs text-slate-300">
        <h3 className="font-bold text-white text-sm">Architectural Stack</h3>
        <p className="text-slate-400 font-sans">
          ThreatGraph is built with Java 17 and Spring Boot 3 on the backend, PostgreSQL for tenant-isolated relational storage, stateless JWT authentication, and a React 19 + Tailwind CSS frontend with Recharts analytics and a dynamic relationship canvas.
        </p>
      </div>
    </div>
  </div>
);

// 2. FAQ PAGE
export const FaqPage: React.FC<PublicPageProps> = ({ onBack }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does ThreatGraph calculate the 0–100 risk score?',
      a: 'The engine evaluates 5 deterministic rules against the employee’s stored historical profile: Multiple failed attempts (+30 pts), Unusual login hours (+15 pts), Unrecognized IP (+20 pts), Anomalous location (+20 pts), and Correlated shared IP (+15 pts). Points are summed once per triggered rule and strictly capped at 100. Any score ≥ 30 triggers an alert.',
    },
    {
      q: 'Why does ThreatGraph avoid using machine-learning models?',
      a: 'Machine learning black-boxes cannot explain why an alert was generated. ThreatGraph is built for auditable compliance: security analysts can inspect the exact evidence (e.g. 12 failed attempts at 3 AM from an unrecognized German IP) and adjust rule weights in real-time.',
    },
    {
      q: 'Can Organization Managers view data from other companies?',
      a: 'No. The backend enforces tenant-level data isolation. Organization Managers can only query, view, and administer employees and login records belonging strictly to their assigned organization ID. Attempts to query foreign data return HTTP 403 Forbidden.',
    },
    {
      q: 'Does ThreatGraph automatically lock out employees?',
      a: 'No. ThreatGraph is an early-warning and monitoring aid designed to assist administrators. Recommendations are displayed for human review; the system does not automatically disconnect or block accounts without administrative action.',
    },
    {
      q: 'Can employees see threat scores or security rules?',
      a: 'No. Employees only have access to their personal security portal, where they can view their own login timestamps, IP addresses, change their password, and report unfamiliar sessions to the Super Admin.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <button onClick={onBack} className="flex items-center gap-2 text-cyan-400 font-mono text-xs hover:underline cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Home</span>
        </button>

        <div className="space-y-2">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">Help & Knowledge Base</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h1>
          <p className="text-slate-400 text-sm">Answers to common architecture, compliance, and scoring questions.</p>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden transition"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full p-4 text-left font-bold text-white flex items-center justify-between cursor-pointer hover:bg-slate-900"
              >
                <span>{faq.q}</span>
                {openIndex === idx ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {openIndex === idx && (
                <div className="px-4 pb-4 pt-1 text-slate-300 font-sans text-xs border-t border-slate-800/60 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 3. PRIVACY & TERMS LEGAL PAGES
export const PrivacyPage: React.FC<PublicPageProps> = ({ onBack }) => (
  <div className="min-h-screen bg-[#070B14] text-slate-100 p-6 md:p-12">
    <div className="max-w-3xl mx-auto space-y-6 font-sans text-xs leading-relaxed text-slate-300">
      <button onClick={onBack} className="flex items-center gap-2 text-cyan-400 font-mono text-xs hover:underline cursor-pointer">
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </button>
      <h1 className="text-3xl font-bold text-white tracking-tight font-mono">Privacy Policy</h1>
      <p className="text-slate-400 font-mono text-[11px]">Last Updated: October 2026</p>

      <section className="space-y-2">
        <h2 className="text-sm font-bold text-white font-mono uppercase">1. Information We Collect</h2>
        <p>ThreatGraph collects authentication telemetry strictly required for cyber threat detection: user identifiers, hashed passwords (via BCrypt), origin IP addresses, login timestamps, device identifiers, and browser user-agent headers.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold text-white font-mono uppercase">2. Multi-Tenant Data Isolation</h2>
        <p>Telemetry recorded under an organization is strictly isolated to that organization. We enforce architectural row-level separation in our relational database to prevent unauthorized access across tenants.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold text-white font-mono uppercase">3. Zero Third-Party Selling</h2>
        <p>We do not sell, rent, or commercialize employee authentication telemetry. All data is exclusively utilized for internal security monitoring and threat correlation by your designated administrators.</p>
      </section>
    </div>
  </div>
);

export const TermsPage: React.FC<PublicPageProps> = ({ onBack }) => (
  <div className="min-h-screen bg-[#070B14] text-slate-100 p-6 md:p-12">
    <div className="max-w-3xl mx-auto space-y-6 font-sans text-xs leading-relaxed text-slate-300">
      <button onClick={onBack} className="flex items-center gap-2 text-cyan-400 font-mono text-xs hover:underline cursor-pointer">
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </button>
      <h1 className="text-3xl font-bold text-white tracking-tight font-mono">Terms and Conditions</h1>
      <p className="text-slate-400 font-mono text-[11px]">Effective Date: October 2026</p>

      <section className="space-y-2">
        <h2 className="text-sm font-bold text-white font-mono uppercase">1. Authorized Corporate Use</h2>
        <p>ThreatGraph is provided exclusively for authorized corporate security monitoring of employee accounts. Unauthorized penetration testing or misuse of credential generation APIs is strictly prohibited.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold text-white font-mono uppercase">2. Early-Warning Advisory Nature</h2>
        <p>ThreatGraph is an explainable monitoring and early-warning advisory tool. Generated risk scores and detection rules assist human security analysts and do not constitute an absolute guarantee of intrusion prevention.</p>
      </section>
    </div>
  </div>
);

// 4. REGISTRATION PAGE
export const RegistrationPage: React.FC<PublicPageProps> = ({ onBack, onNavigateLogin }) => {
  const [regType, setRegType] = useState<'manager' | 'employee'>('manager');
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    orgCode: '',
    orgName: '',
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setSuccess(true);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-center items-center p-6 selection:bg-cyan-500/30">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 backdrop-blur shadow-2xl space-y-6 font-mono text-xs">
        <button onClick={onBack} className="flex items-center gap-2 text-cyan-400 hover:underline cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Page</span>
        </button>

        <div className="text-center space-y-1">
          <div className="p-2.5 bg-cyan-950 border border-cyan-500/30 rounded-xl text-cyan-400 w-fit mx-auto mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Create ThreatGraph Account</h2>
          <p className="text-[11px] text-slate-400 font-sans">
            Register your organization or join an existing corporate tenant.
          </p>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setRegType('manager')}
            className={`py-2 rounded-lg font-bold transition cursor-pointer ${
              regType === 'manager' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'text-slate-400'
            }`}
          >
            Org Manager
          </button>
          <button
            type="button"
            onClick={() => setRegType('employee')}
            className={`py-2 rounded-lg font-bold transition cursor-pointer ${
              regType === 'employee' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'text-slate-400'
            }`}
          >
            Employee
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="font-bold text-sm">Account Registered!</div>
            <p className="text-[11px] text-slate-300 font-sans">
              Your {regType === 'manager' ? 'organization manager' : 'employee'} profile has been initialized with baseline security profiles.
            </p>
            <button
              onClick={onNavigateLogin}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer"
            >
              Proceed to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Vikram Malhotra"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Corporate Email</label>
              <input
                type="email"
                required
                placeholder="vikram@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
              />
            </div>

            {regType === 'manager' ? (
              <div>
                <label className="block text-slate-400 mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Technologies"
                  value={form.orgName}
                  onChange={(e) => setForm({ ...form, orgName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
            ) : (
              <div>
                <label className="block text-slate-400 mb-1">Organization Code (Provided by Manager)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABC or XYZ"
                  value={form.orgCode}
                  onChange={(e) => setForm({ ...form, orgCode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white uppercase"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1">Username</label>
              <input
                type="text"
                required
                placeholder="e.g. vikram_m"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition cursor-pointer shadow-lg shadow-cyan-950/40"
            >
              Register Account & Enforce Isolation
            </button>
          </form>
        )}

        <div className="text-center text-slate-500 text-[11px] pt-2 border-t border-slate-800">
          Already have corporate credentials?{' '}
          <button onClick={onNavigateLogin} className="text-cyan-400 hover:underline cursor-pointer font-bold">
            Sign In here
          </button>
        </div>
      </div>
    </div>
  );
};
