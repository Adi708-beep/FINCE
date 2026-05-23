import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Shield, 
  Scan, 
  ArrowLeft,
  Loader,
  Briefcase,
  FileText,
  TrendingUp,
  Percent
} from 'lucide-react';

const BusinessAuth = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Simulator State
  const [simStatus, setSimStatus] = useState('idle'); // 'idle' | 'scanning' | 'analyzing' | 'done'
  const [simProgress, setSimProgress] = useState(0);

  const mockInvoice = `
    AMAZON WEB SERVICES INC.
    BILLING INVOICE #AWS-902482
    DUE DATE: 2026-06-15
    
    1  EC2 STANDARD CLOUD INSTANCE   ₹8,500.00
    1  AURORA SERVERLESS DATABASE    ₹6,200.00
    1  SIMPLE STORAGE SERVICE (S3)   ₹1,800.00
    
    SUBTOTAL                     ₹16,500.00
    GSTIN: 29AAFCA8239F1Z0
    GST TAX (18%)                ₹2,970.00
    TOTAL AMOUNT DUE             ₹19,470.00
  `;

  const runSimulation = () => {
    if (simStatus !== 'idle') return;
    setSimStatus('scanning');
    setSimProgress(0);

    let scanInterval = setInterval(() => {
      setSimProgress(prev => {
        if (prev >= 100) {
          clearInterval(scanInterval);
          setSimStatus('analyzing');
          setTimeout(() => {
            setSimStatus('done');
          }, 1200);
          return 100;
        }
        return prev + 20;
      });
    }, 120);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (isLogin) {
        await login(email, password, 'business');
      } else {
        await register(username, email, password, 'business');
      }
      navigate('/dashboard');
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between overflow-x-hidden relative font-inter">
      {/* Sky Blue radial glow */}
      <div className="absolute top-[20%] left-[-15%] w-[500px] h-[500px] rounded-full bg-sky-500/10 blur-[130px] pointer-events-none" />
      
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-sky-400 transition-colors bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 hover:border-sky-500/20 px-3.5 py-2 rounded-xl shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Gateway</span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <Briefcase className="w-4.5 h-4.5 text-sky-400" />
          </div>
          <span className="text-xs font-bold font-mono tracking-widest text-sky-400 uppercase bg-sky-500/5 px-2.5 py-1 rounded-md border border-sky-500/10">
            BUSINESS PORTAL
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        
        {/* Left column: Simulator & Features */}
        <div className="lg:col-span-7 space-y-6 animate-fade-in">
          <div className="space-y-3">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-sky-500/10 border border-sky-500/20 text-sky-400">
              Enterprise Ledger Gateway
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-outfit leading-none">
              Automate Corporate Accounts Payable <br />
              <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                With Gemini Multimodal OCR
              </span>
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xl font-medium">
              Upload vendor invoices and corporate bills. FINCE automatically extracts critical billing structures like invoice numbers, GST identification numbers, due dates, taxes, and triggers duplicate checks & spending spikes warnings instantly.
            </p>
          </div>

          {/* Simulator Panel */}
          <div className="bg-slate-950/50 backdrop-blur-glass border border-slate-800 p-6 rounded-3xl relative overflow-hidden max-w-xl">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Scan className="w-4.5 h-4.5 text-sky-400" />
                <span className="text-xs font-bold font-outfit text-slate-200">Accounts Invoice Simulator</span>
              </div>
              {simStatus === 'idle' && (
                <button 
                  onClick={runSimulation}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-emerald-400 text-slate-900 font-extrabold text-[10px] tracking-wider uppercase shadow-[0_4px_14px_0_rgba(14,165,233,0.15)] active:scale-95 transition-all"
                >
                  Simulate OCR
                </button>
              )}
              {simStatus !== 'idle' && simStatus !== 'done' && (
                <div className="flex items-center gap-1.5 text-[10px] text-sky-400 font-mono animate-pulse">
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                  <span>{simStatus === 'scanning' ? `SCANNING (${simProgress}%)` : 'AI STRUCTURING...'}</span>
                </div>
              )}
              {simStatus === 'done' && (
                <button 
                  onClick={() => setSimStatus('idle')}
                  className="text-[10px] text-slate-500 hover:text-slate-300 underline font-bold"
                >
                  Reset Demo
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 h-60">
              {/* Receipt Visualizer */}
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-4 font-mono text-[9px] text-slate-400 relative overflow-hidden select-none">
                {simStatus === 'scanning' && (
                  <div 
                    className="absolute left-0 w-full h-0.5 bg-sky-400 shadow-[0_2px_8px_rgba(14,165,233,0.4)] z-10"
                    style={{ 
                      top: `${simProgress}%`,
                      transition: 'top 120ms linear' 
                    }}
                  />
                )}
                <div className={simStatus === 'scanning' ? 'opacity-50' : 'opacity-100 transition-opacity duration-300'}>
                  {mockInvoice.split('\n').map((line, idx) => (
                    <div key={idx} className="whitespace-pre truncate">{line}</div>
                  ))}
                </div>
              </div>

              {/* Extraction Result Visualizer */}
              <div className="bg-slate-900/30 rounded-2xl border border-slate-800/50 p-4 flex flex-col justify-center items-center">
                {simStatus === 'idle' && (
                  <div className="text-center space-y-2.5 p-3">
                    <FileText className="w-7 h-7 text-slate-600 mx-auto" />
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      Click the simulator button to parse corporate details into corporate ledger categories.
                    </p>
                  </div>
                )}

                {simStatus === 'scanning' && (
                  <div className="w-full space-y-3">
                    <div className="h-3.5 bg-slate-800 rounded w-3/4 animate-pulse" />
                    <div className="h-3.5 bg-slate-800 rounded w-1/2 animate-pulse" />
                    <div className="h-8 bg-slate-800 rounded w-full animate-pulse" />
                    <div className="h-10 bg-slate-800 rounded w-full animate-pulse" />
                  </div>
                )}

                {simStatus === 'analyzing' && (
                  <div className="text-center space-y-2">
                    <Loader className="w-7 h-7 text-sky-400 animate-spin mx-auto" />
                    <p className="text-[10px] text-sky-400 font-bold font-mono">GEMINI INGESTION ENGAGED...</p>
                  </div>
                )}

                {simStatus === 'done' && (
                  <div className="w-full h-full flex flex-col justify-between text-[11px] space-y-1.5">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                      <span className="font-bold text-white text-[11px] truncate max-w-[100px]">AWS Inc.</span>
                      <span className="px-2 py-0.5 rounded-full text-[8px] bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">Cloud Infra</span>
                    </div>

                    <div className="space-y-0.5 flex-1 overflow-y-auto font-mono text-slate-400 text-[9px]">
                      <div className="flex justify-between text-[8px] text-slate-500">
                        <span>Inv No: AWS-902482</span>
                        <span>Due: 2026-06-15</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span>1x EC2 Servers</span>
                        <span className="text-slate-200">₹8,500</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1x Aurora DB</span>
                        <span className="text-slate-200">₹6,200</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1x S3 Storage</span>
                        <span className="text-slate-200">₹1,800</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-850 pt-1 text-[9px] space-y-0.5 font-semibold text-slate-400">
                      <div className="flex justify-between">
                        <span>GSTIN</span>
                        <span className="text-slate-300 font-mono">29AAFCA8239F1Z0</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (18%)</span>
                        <span className="text-slate-200 font-mono">₹2,970.00</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold text-sky-400 text-xs border-t border-slate-800 pt-1">
                      <span>Total Due</span>
                      <span className="font-mono">₹19,470.00</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Auth Card */}
        <div className="lg:col-span-5 flex justify-center animate-slide-up">
          <div className="bg-slate-950/40 backdrop-blur-glass border border-slate-800 p-8 w-full max-w-md rounded-3xl hover:border-sky-500/20 transition-all shadow-[0_8px_32px_0_rgba(14,165,233,0.02)] relative">
            <h3 className="text-2xl font-bold font-outfit text-white mb-2">
              {isLogin ? 'Access Business Portal' : 'Register Corporate Workspace'}
            </h3>
            <p className="text-slate-400 text-xs mb-6 leading-relaxed font-semibold">
              {isLogin 
                ? 'Sign in to access corporate OpEx, GST ledgers, and duplicate monitors.' 
                : 'Register your startup or SME workspace to automate invoice ledgering.'}
            </p>

            {authError && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-semibold leading-normal">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Company Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. razorpay_inc"
                    className="w-full bg-slate-900 border border-slate-800/80 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-sky-500 text-slate-100 placeholder-slate-500 shadow-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Business Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="accounts@razorpay.com"
                  className="w-full bg-slate-900 border border-slate-800/80 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-sky-500 text-slate-100 placeholder-slate-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Ledger Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800/80 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-sky-500 text-slate-100 placeholder-slate-500 shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 text-slate-900 font-extrabold text-xs tracking-wider uppercase shadow-[0_4px_14px_0_rgba(14,165,233,0.15)] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {authLoading ? (
                  <Loader className="w-4 h-4 animate-spin text-slate-900" />
                ) : (
                  <span>{isLogin ? 'Access Business Portal' : 'Register Corporate Workspace'}</span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs">
              <span className="text-slate-400 font-semibold">
                {isLogin ? "Don't have an account?" : 'Already registered?'}
              </span>{' '}
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setAuthError('');
                }}
                className="text-sky-400 hover:text-sky-300 font-bold underline transition-colors"
              >
                {isLogin ? 'Register Workspace' : 'Log In'}
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-5 border-t border-slate-850 text-xs text-slate-500 text-center sm:text-left">
        © 2026 FINCE Business. Corporate sandbox protected by Gemini-2.5-Flash audits.
      </footer>
    </div>
  );
};

export default BusinessAuth;
