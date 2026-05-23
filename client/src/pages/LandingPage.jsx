import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Shield, 
  Cpu, 
  Scan, 
  MessageSquare, 
  TrendingUp, 
  ArrowRight,
  Loader
} from 'lucide-react';

const LandingPage = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Demo Simulator State
  const [simStatus, setSimStatus] = useState('idle'); // 'idle' | 'scanning' | 'analyzing' | 'done'
  const [simProgress, setSimProgress] = useState(0);

  const mockReceipt = `
    WHOLE FOODS MARKET
    STORE #10243
    AUSTIN, TX 78701
    
    1  ORGANIC MILK 1/2 GAL     ₹4.59
    1  FRESH BLUEBERRIES 6OZ    ₹3.99
    2  AVOCADOS HASS            ₹2.50
    
    SUBTOTAL                 ₹11.08
    TAX 8.25%                 ₹0.91
    TOTAL                    ₹11.99
    
    THANK YOU FOR SHOPPING!
  `;

  const runSimulation = () => {
    if (simStatus !== 'idle') return;
    setSimStatus('scanning');
    setSimProgress(0);

    // Simulate scanning (OCR)
    let scanInterval = setInterval(() => {
      setSimProgress(prev => {
        if (prev >= 100) {
          clearInterval(scanInterval);
          setSimStatus('analyzing');
          // Simulate Gemini analysis
          setTimeout(() => {
            setSimStatus('done');
          }, 1500);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkbg overflow-x-hidden flex flex-col justify-between">
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center pulse-ring shadow-glow-primary">
            <Sparkles className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              FINCE
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest -mt-1">Financial Intel</p>
          </div>
        </div>
        <div className="text-xs text-gray-400 font-mono">
          SYSTEM_TIME: <span className="text-secondary">2026-05-23</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-12 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Side: Copy and Simulator */}
        <div className="lg:col-span-7 space-y-8 animate-slide-up">
          <div className="space-y-4">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-primary/10 border border-primary/20 text-primary">
              AI-Powered Expense Intelligence
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none text-slate-900 font-outfit">
              Turn Invoices into <br />
              <span className="gradient-text font-bold">Financial Intelligence</span>
            </h2>
            <p className="text-slate-600 text-base max-w-xl leading-relaxed">
              FINCE scans receipts locally, extracts items using Gemini AI, links families together, tracks budgets dynamically, and lets you chat with an advanced AI financial analyst.
            </p>
          </div>

          {/* OCR Simulator Demo */}
          <div className="glass-panel p-6 border border-darkborder max-w-xl relative overflow-hidden">
            {/* Background grids */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Scan className="w-4.5 h-4.5 text-primary" />
                <span className="text-sm font-bold font-outfit text-slate-800">Gemini OCR & Parse Simulator</span>
              </div>
              {simStatus === 'idle' && (
                <button 
                  onClick={runSimulation}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-slate-900 font-extrabold text-xs glow-button flex items-center gap-1.5 shadow-sm"
                >
                  Simulate Scan <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {simStatus !== 'idle' && simStatus !== 'done' && (
                <div className="flex items-center gap-1.5 text-xs text-secondary font-mono animate-pulse">
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                  <span>{simStatus === 'scanning' ? `OCR scanning (${simProgress}%)` : 'Gemini structuring...'}</span>
                </div>
              )}
              {simStatus === 'done' && (
                <button 
                  onClick={() => setSimStatus('idle')}
                  className="text-xs text-slate-500 hover:text-slate-900 underline font-medium"
                >
                  Reset Demo
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-64">
              {/* Receipt mockup */}
              <div className="bg-slate-100/50 rounded-xl border border-darkborder p-4 font-mono text-[10px] text-slate-700 relative overflow-hidden select-none">
                {simStatus === 'scanning' && (
                  <div 
                    className="absolute left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary shadow-glow-primary z-10"
                    style={{ 
                      top: `${simProgress}%`,
                      transition: 'top 150ms linear' 
                    }}
                  />
                )}
                <div className={`transition-opacity duration-300 ${simStatus === 'scanning' ? 'opacity-70' : 'opacity-100'}`}>
                  {mockReceipt.split('\n').map((line, idx) => (
                    <div key={idx} className="whitespace-pre truncate">{line}</div>
                  ))}
                </div>
              </div>

              {/* Parsed JSON Mockup */}
              <div className="bg-slate-50/50 rounded-xl border border-darkborder p-4 flex flex-col justify-center items-center">
                {simStatus === 'idle' && (
                  <div className="text-center space-y-2 p-4">
                    <Cpu className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">Click "Simulate Scan" to watch Gemini extract itemized structures.</p>
                  </div>
                )}

                {simStatus === 'scanning' && (
                  <div className="w-full space-y-3">
                    <div className="h-4 bg-slate-200/55 rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-slate-200/55 rounded w-1/2 animate-pulse" />
                    <div className="h-10 bg-slate-200/55 rounded w-full animate-pulse" />
                    <div className="h-12 bg-slate-200/55 rounded w-full animate-pulse" />
                  </div>
                )}

                {simStatus === 'analyzing' && (
                  <div className="text-center space-y-2">
                    <Loader className="w-8 h-8 text-primary animate-spin mx-auto" />
                    <p className="text-xs text-primary font-semibold font-mono">Gemini-2.5-Flash processing OCR text...</p>
                  </div>
                )}

                {simStatus === 'done' && (
                  <div className="w-full h-full flex flex-col justify-between animate-fade-in text-xs space-y-2.5">
                    <div className="flex justify-between items-center border-b border-darkborder pb-1.5">
                      <span className="font-bold text-slate-800 text-[13px]">Whole Foods Market</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-success/10 text-success border border-success/20 font-semibold">Groceries</span>
                    </div>

                    <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[110px] text-[11px] font-mono text-slate-500">
                      <div className="flex justify-between">
                        <span>1x Organic Milk</span>
                        <span className="text-slate-800 font-bold">₹4.59</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1x Fresh Blueberries</span>
                        <span className="text-slate-800 font-bold">₹3.99</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2x Avocados Hass</span>
                        <span className="text-slate-800 font-bold">₹2.50</span>
                      </div>
                    </div>

                    <div className="border-t border-darkborder pt-1.5 flex justify-between font-semibold text-slate-700">
                      <span>Tax (GST)</span>
                      <span>₹0.91</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-primary">
                      <span>Total Amount</span>
                      <span>₹11.99</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="glass-panel p-8 w-full max-w-md border border-darkborder shadow-glow-primary/5 relative">
            <h3 className="text-2xl font-bold font-outfit text-slate-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h3>
            <p className="text-slate-500 text-xs mb-6">
              {isLogin 
                ? 'Enter your credentials to access your financial center' 
                : 'Get started with real-time receipt uploads and budget limits'}
            </p>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. aditya_saha"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-slate-800 placeholder-slate-400 shadow-sm transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-slate-800 placeholder-slate-400 shadow-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-slate-800 placeholder-slate-400 shadow-sm transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-slate-900 font-extrabold shadow-glow-primary glow-button flex items-center justify-center gap-2 mt-2 disabled:opacity-50 transition-all"
              >
                {authLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <span>{isLogin ? 'Sign In' : 'Register Account'}</span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs">
              <span className="text-slate-400">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
              </span>{' '}
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setAuthError('');
                }}
                className="text-primary hover:text-primary-hover font-semibold underline transition-colors"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 border-t border-darkborder flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>© 2026 FINCE Inc. Built with Gemini AI and OCR technologies.</div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-800 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-800 transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
