import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, User, Briefcase, Shield, Cpu, Zap } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between overflow-x-hidden relative font-inter">
      {/* Background glowing blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-sky-500/10 blur-[150px] pointer-events-none" />
      
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center pulse-ring shadow-glow-primary">
            <Sparkles className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-outfit">
              FINCE
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest -mt-1 font-mono">Financial Intel</p>
          </div>
        </div>
        <div className="text-xs text-slate-400 font-mono bg-slate-800/80 border border-slate-700/50 px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span>GATEWAY_PORTAL // SECURE_SSL</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full px-6 py-12 flex-1 flex flex-col justify-center items-center gap-12 z-10">
        
        {/* Tagline section */}
        <div className="text-center space-y-4 max-w-2xl animate-fade-in">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-primary/15 border border-primary/25 text-primary">
            Next-Gen AI Financial Operating System
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-outfit leading-none pt-2">
            Choose Your <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Financial Workspace</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto font-medium">
            Access customized accounting frameworks, Gemini AI intelligence audits, and smart analytics designed specifically for either household operations or business ledgering.
          </p>
        </div>

        {/* Portal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl animate-slide-up">
          
          {/* Personal Workspace Card */}
          <div className="bg-slate-950/40 backdrop-blur-glass border border-slate-800 rounded-3xl p-8 flex flex-col justify-between hover:border-primary/45 transition-all duration-500 hover:shadow-[0_12px_40px_rgba(230,45,169,0.08)] group relative overflow-hidden">
            {/* Glow accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/20 transition-all duration-500" />
            
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold font-mono tracking-widest text-primary uppercase bg-primary/5 px-2.5 py-1 rounded-md border border-primary/10">
                  PERSONAL SPACE
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold font-outfit text-white">Household & Individual OS</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Perfect for managing personal spend limits, linking family expense sharing codes, tracking SaaS renewals, and auditing saving strategies.
                </p>
              </div>

              <div className="border-t border-slate-800/80 pt-5 space-y-3.5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Included Capabilities</h4>
                <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                  <li className="flex items-center gap-2.5">
                    <span className="text-primary font-bold">🌸</span>
                    <span>Intelligent Family Budget Allotment</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-primary font-bold">📊</span>
                    <span>Dynamic Wellness Score Progression Ring</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-primary font-bold">💸</span>
                    <span>Active Subscriptions & Renewal Tracker</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-primary font-bold">🤖</span>
                    <span>Generative AI Household Savings Advisory</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => navigate('/personal')}
              className="mt-8 w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-slate-900 font-extrabold text-xs tracking-wider uppercase shadow-glow-primary hover:shadow-lg hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Enter Personal Space</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Business Workspace Card */}
          <div className="bg-slate-950/40 backdrop-blur-glass border border-slate-800 rounded-3xl p-8 flex flex-col justify-between hover:border-sky-500/45 transition-all duration-500 hover:shadow-[0_12px_40px_rgba(14,165,233,0.08)] group relative overflow-hidden">
            {/* Glow accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-sky-500/20 transition-all duration-500" />
            
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <Briefcase className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold font-mono tracking-widest text-sky-400 uppercase bg-sky-500/5 px-2.5 py-1 rounded-md border border-sky-500/10">
                  BUSINESS PORTAL
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold font-outfit text-white">Corporate Ledger & Accounts</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Tailored for startups, micro-SMEs, and independent contractors to automate corporate receipts, run background audit controls, and track taxes.
                </p>
              </div>

              <div className="border-t border-slate-800/80 pt-5 space-y-3.5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Included Capabilities</h4>
                <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                  <li className="flex items-center gap-2.5">
                    <span className="text-sky-400">⚡</span>
                    <span>Multimodal Gemini 2.5 Flash Invoice OCR</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-sky-400">🔍</span>
                    <span>Background Duplicate Invoice Scan Control</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-sky-400">⚠️</span>
                    <span>Statistical Spending Spike Anomaly Detection</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-sky-400">📈</span>
                    <span>Corporate GST & Input Tax Growth Trackers</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => navigate('/business')}
              className="mt-8 w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-400 text-slate-900 font-extrabold text-xs tracking-wider uppercase shadow-[0_4px_14px_0_rgba(14,165,233,0.2)] hover:shadow-lg hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Enter Business Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 z-10">
        <div>© 2026 FINCE Inc. Built with Gemini Multimodal AI & OCR systems.</div>
        <div className="flex gap-6 font-medium">
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy Agreement</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Terms of Enterprise</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
