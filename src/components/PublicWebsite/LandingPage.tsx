import React, { useState } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Building2,
  Cpu,
  Network,
  Lock,
  Activity,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Mail,
  Send,
  Eye,
  Sliders,
  ChevronDown,
} from 'lucide-react';

interface LandingPageProps {
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
  onNavigateTab: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateLogin,
  onNavigateRegister,
  onNavigateTab,
}) => {
  const [contactForm, setContactForm] = useState({ name: '', email: '', org: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Public Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigateTab('home')}>
            <div className="p-2 bg-cyan-950 border border-cyan-500/40 rounded-xl text-cyan-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">ThreatGraph</span>
              <span className="text-[10px] ml-2 font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                ENTERPRISE SOC
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-mono text-slate-300">
            <button onClick={() => onNavigateTab('home')} className="hover:text-cyan-400 transition cursor-pointer">
              Home
            </button>
            <button onClick={() => onNavigateTab('about')} className="hover:text-cyan-400 transition cursor-pointer">
              About
            </button>
            <button onClick={() => onNavigateTab('faq')} className="hover:text-cyan-400 transition cursor-pointer">
              Help & FAQ
            </button>
            <button onClick={() => onNavigateTab('contact')} className="hover:text-cyan-400 transition cursor-pointer">
              Contact
            </button>
          </nav>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <button
              onClick={onNavigateLogin}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 hover:text-white transition cursor-pointer font-bold"
            >
              Sign In
            </button>
            <button
              onClick={onNavigateRegister}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white transition cursor-pointer font-bold shadow-lg shadow-cyan-950/40"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 px-6 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>CENTRALIZED MULTI-TENANT CYBERSECURITY MONITORING</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Explainable Cyber Threat Detection with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">Zero Black-Box Guesswork</span>
          </h1>

          <p className="text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Monitor employee authentication across multiple organizations. ThreatGraph replaces opaque machine-learning models with deterministic, auditable rules that explain exactly <em>why</em> an alert was generated down to individual points.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 font-mono text-xs">
            <button
              onClick={onNavigateLogin}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition flex items-center gap-2 shadow-xl shadow-cyan-950/50 cursor-pointer"
            >
              <span>Launch Live SOC Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateTab('about')}
              className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition cursor-pointer"
            >
              Explore Architecture
            </button>
          </div>
        </div>
      </section>

      {/* Comparison: Explainable Deterministic vs Opaque Black-Box */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Why Deterministic Explainability Outperforms Opaque AI
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            In enterprise security operations, an alert without an auditable explanation creates confusion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-mono text-xs font-bold uppercase">
              <XCircle className="w-5 h-5 shrink-0" />
              <span>Opaque Black-Box Machine Learning</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 font-sans">
              <li className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span>Flags an account as "Anomalous: 89%" with zero auditable explanation.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span>Analyst cannot determine if flag was caused by travel, off-hours work, or bad credentials.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span>High rate of false positives with no traceable rule weights or parameter audit.</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-cyan-950/20 border border-cyan-500/40 space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>ThreatGraph Deterministic Rules</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 font-sans">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Mathematically calculated 0–100 score capped at 100 with individual point breakdowns.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Shows exact evidence: <em>12 failed attempts (+30), login at 3 AM outside working hours (+15), foreign location (+20)</em>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Super Admin can configure point weights and thresholds directly from the dashboard.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works Workflow */}
      <section className="py-16 px-6 bg-slate-950/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">
              Automated Lifecycle
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              From Employee Login to Centralized Threat Mitigation
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-mono text-xs">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="p-2 w-fit rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 block font-bold">
                STEP 01
              </span>
              <h3 className="font-bold text-white text-sm">Tenant Provisioning</h3>
              <p className="text-slate-400 text-xs font-sans leading-relaxed">
                Organization Managers register employees and issue temporary credentials under strict tenant isolation.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="p-2 w-fit rounded-lg bg-blue-950 border border-blue-800 text-blue-400 block font-bold">
                STEP 02
              </span>
              <h3 className="font-bold text-white text-sm">Automatic Ingestion</h3>
              <p className="text-slate-400 text-xs font-sans leading-relaxed">
                Whenever an employee authenticates, IP, device, timestamp, and location are captured automatically in PostgreSQL.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="p-2 w-fit rounded-lg bg-purple-950 border border-purple-800 text-purple-400 block font-bold">
                STEP 03
              </span>
              <h3 className="font-bold text-white text-sm">Detection & Scoring</h3>
              <p className="text-slate-400 text-xs font-sans leading-relaxed">
                Engine evaluates 5 deterministic rules against profile baselines and computes 0–100 risk score.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="p-2 w-fit rounded-lg bg-red-950 border border-red-800 text-red-400 block font-bold">
                STEP 04
              </span>
              <h3 className="font-bold text-white text-sm">ThreatGraph Review</h3>
              <p className="text-slate-400 text-xs font-sans leading-relaxed">
                Super Admin reviews plain-English reasons, visualizes correlations on ThreatGraph, and updates alert status.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-6 max-w-4xl mx-auto w-full">
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">Contact ThreatGraph Security</h3>
            <p className="text-slate-400 text-xs font-mono">
              Request multi-tenant deployment assistance or speak with our platform architects.
            </p>
          </div>

          {contactSubmitted ? (
            <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-center font-mono text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="font-bold text-sm">Message Successfully Dispatched!</div>
              <p className="text-slate-300">Our enterprise security team will respond within 24 business hours.</p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Malhotra"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    placeholder="vikram@enterprise.org"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Organization Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Global Technologies"
                  value={contactForm.org}
                  onChange={(e) => setContactForm({ ...contactForm, org: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Inquiry or Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your security monitoring requirements..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/40"
              >
                <Send className="w-4 h-4" />
                <span>Submit Enterprise Inquiry</span>
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Public Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-8 font-mono text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-white font-bold">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>ThreatGraph SOC Platform</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-400">
            <button onClick={() => onNavigateTab('about')} className="hover:text-white cursor-pointer">About</button>
            <button onClick={() => onNavigateTab('faq')} className="hover:text-white cursor-pointer">Help & FAQ</button>
            <button onClick={() => onNavigateTab('privacy')} className="hover:text-white cursor-pointer">Privacy Policy</button>
            <button onClick={() => onNavigateTab('terms')} className="hover:text-white cursor-pointer">Terms & Conditions</button>
            <button onClick={onNavigateLogin} className="hover:text-cyan-400 cursor-pointer font-bold">SOC Login</button>
          </div>

          <div>© 2026 ThreatGraph Inc. All rights reserved.</div>
        </div>

        <div className="max-w-4xl mx-auto text-center mt-6 text-[11px] text-slate-600 border-t border-slate-900 pt-4 font-sans">
          ⚠️ <strong>Compliance Disclaimer:</strong> ThreatGraph is an early-warning telemetry monitoring platform. Rule-based scores and alerts are deterministic aids for administrator review, not a guarantee of attack prevention.
        </div>
      </footer>

    </div>
  );
};
