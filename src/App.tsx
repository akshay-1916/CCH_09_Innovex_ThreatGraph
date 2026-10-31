/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/PublicWebsite/LandingPage';
import {
  AboutPage,
  FaqPage,
  PrivacyPage,
  TermsPage,
  RegistrationPage,
} from './components/PublicWebsite/PublicPages';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { OrgManagerDashboard } from './components/OrgManagerDashboard';
import { EmployeeDashboard } from './components/EmployeeDashboard';

type PublicView = 'landing' | 'about' | 'faq' | 'privacy' | 'terms' | 'register' | 'login';

const MainApp: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [publicView, setPublicView] = useState<PublicView>('landing');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center text-slate-400 font-mono text-sm space-y-4">
        <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
        <div>CONNECTING TO THREATGRAPH MULTI-TENANT SOC...</div>
      </div>
    );
  }

  // If Authenticated -> Render Role-Specific Dashboard
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto p-6">
          {user.role === 'SUPER_ADMIN' && <SuperAdminDashboard />}
          {user.role === 'ORGANIZATION_MANAGER' && <OrgManagerDashboard />}
          {user.role === 'EMPLOYEE' && <EmployeeDashboard />}
        </main>

        <footer className="border-t border-slate-800/80 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500 font-mono">
          <p className="max-w-4xl mx-auto">
            ⚠️ <strong className="text-slate-400">Security Disclaimer:</strong> ThreatGraph is an explainable early-warning and monitoring system. Rule-based detections and risk scores are deterministic aids for administrator review, not a guarantee of attack prevention. No machine learning or black-box logic is utilized.
          </p>
        </footer>
      </div>
    );
  }

  // If Not Authenticated -> Render Public Website Screens
  switch (publicView) {
    case 'about':
      return <AboutPage onBack={() => setPublicView('landing')} onNavigateLogin={() => setPublicView('login')} />;
    case 'faq':
      return <FaqPage onBack={() => setPublicView('landing')} onNavigateLogin={() => setPublicView('login')} />;
    case 'privacy':
      return <PrivacyPage onBack={() => setPublicView('landing')} onNavigateLogin={() => setPublicView('login')} />;
    case 'terms':
      return <TermsPage onBack={() => setPublicView('landing')} onNavigateLogin={() => setPublicView('login')} />;
    case 'register':
      return <RegistrationPage onBack={() => setPublicView('landing')} onNavigateLogin={() => setPublicView('login')} />;
    case 'login':
      return <LoginPage />;
    case 'landing':
    default:
      return (
        <LandingPage
          onNavigateLogin={() => setPublicView('login')}
          onNavigateRegister={() => setPublicView('register')}
          onNavigateTab={(tab) => setPublicView(tab as PublicView)}
        />
      );
  }
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
