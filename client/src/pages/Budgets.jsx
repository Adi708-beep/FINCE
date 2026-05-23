import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  PiggyBank, 
  Plus, 
  Trash2, 
  Sparkles, 
  HelpCircle,
  Loader,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, Bar, 
  XAxis, YAxis, 
  CartesianGrid, Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

const Budgets = () => {
  const { getHeaders } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manual Form State
  const [category, setCategory] = useState('overall');
  const [limit, setLimit] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // AI Advice State
  const [aiAdvice, setAiAdvice] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // AI Auto-Allocator Form State
  const [aiTotalLimit, setAiTotalLimit] = useState('');
  const [aiAllocateError, setAiAllocateError] = useState('');
  const [aiAllocateLoading, setAiAllocateLoading] = useState(false);
  const [aiAllocateRationale, setAiAllocateRationale] = useState('');

  const categories = [
    { value: "overall", label: "Overall Monthly Budget" },
    { value: "Groceries", label: "Groceries" },
    { value: "Utilities", label: "Utilities" },
    { value: "Food & Dining", label: "Food & Dining" },
    { value: "Entertainment", label: "Entertainment" },
    { value: "Travel & Transport", label: "Travel & Transport" },
    { value: "Shopping", label: "Shopping" },
    { value: "Health & Personal Care", label: "Health & Personal Care" },
    { value: "Housing", label: "Housing" },
    { value: "Others", label: "Others" }
  ];

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" }
  ];

  const fetchBudgets = async () => {
    try {
      const res = await fetch(`${API_URL}/api/budgets?month=${month}&year=${year}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setBudgets(data);
      }
    } catch (err) {
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAiAdvice = async () => {
    setAiLoading(true);
    setAiAdvice('');
    try {
      const res = await fetch(`${API_URL}/api/ai/report?period=month`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAiAdvice(data.report);
      } else {
        setAiAdvice('Could not retrieve savings advice at this time. Upload more transactions to build your profile!');
      }
    } catch (err) {
      console.error('Error fetching AI advice:', err);
      setAiAdvice('Network connectivity failure while reaching Gemini advice engine.');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [month, year]);

  useEffect(() => {
    if (budgets.length > 0) {
      fetchAiAdvice();
    }
  }, [budgets.length]);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!limit || Number(limit) <= 0) {
      setFormError('Please enter a valid budget limit.');
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/budgets`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          category,
          limit: Number(limit),
          month,
          year
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save budget');
      }

      setLimit('');
      fetchBudgets();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleAiAllocate = async (e) => {
    e.preventDefault();
    setAiAllocateError('');
    setAiAllocateRationale('');
    if (!aiTotalLimit || Number(aiTotalLimit) <= 0) {
      setAiAllocateError('Please enter a valid total target budget limit.');
      return;
    }

    setAiAllocateLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/budgets/ai-allocate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          totalLimit: Number(aiTotalLimit),
          month,
          year
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'AI Auto-allocation process failed.');
      }

      setAiAllocateRationale(data.rationale);
      setAiTotalLimit('');
      fetchBudgets();
      alert('Gemini AI has auto-configured allocations across categories based on spending history!');
    } catch (err) {
      setAiAllocateError(err.message);
    } finally {
      setAiAllocateLoading(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Delete this budget limit?')) return;
    try {
      const res = await fetch(`${API_URL}/api/budgets/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setBudgets(prev => prev.filter(b => b._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      {/* Date Filter selector */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-primary animate-pulse" />
          <span className="font-bold text-sm text-slate-800">Fiscal Period Allocations</span>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="flex-1 sm:flex-initial bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-slate-800 font-medium shadow-sm"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-slate-800 font-mono text-center shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Active Budgets lists and progress */}
        <div className="lg:col-span-8 space-y-6">
          {/* Visual Budget Allocation vs Spending Chart */}
          {!loading && budgets.length > 0 && (
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-base text-slate-800">Budget Limit vs Spending</h3>
                <p className="text-xs text-slate-500">Visual share comparison across categorized limits (in ₹)</p>
              </div>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={budgets.filter(b => b.category !== 'overall')}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
                    <XAxis dataKey="category" stroke="#64748b" fontSize={9} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.06)', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="limit" name="Limit (₹)" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spent" name="Spent (₹)" fill="#E62DA9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="font-bold text-base text-slate-800 border-b border-slate-100 pb-3">Active Allowances</h3>
            
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : budgets.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-3">
                <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto" />
                <p>No budgets established for this month. Create one manually or use AI Auto-Allocation on the right!</p>
              </div>
            ) : (
              <div className="space-y-5">
                {budgets.map((b) => {
                  const pct = b.percentage;
                  let barColor = 'bg-success';
                  let statusText = 'On Track';
                  let textClass = 'text-success';

                  if (pct >= 100) {
                    barColor = 'bg-error';
                    statusText = 'Limit Exceeded';
                    textClass = 'text-error';
                  } else if (pct >= 85) {
                    barColor = 'bg-warning';
                    statusText = 'Approaching Limit';
                    textClass = 'text-warning';
                  }

                  return (
                    <div key={b._id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3.5 transition-all hover:shadow-sm">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm capitalize text-slate-800">{b.category}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 ${textClass}`}>
                            {statusText}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteBudget(b._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-error hover:bg-error/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Bar indicator */}
                      <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`${barColor} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between text-xs font-mono text-slate-600">
                        <div>
                          <span className="text-slate-400 font-sans">Spent:</span> ₹{b.spent.toLocaleString()}
                        </div>
                        <div>
                          <span className="text-slate-400 font-sans">Limit:</span> ₹{b.limit.toLocaleString()}
                        </div>
                        <div>
                          <span className="text-slate-400 font-sans">Remaining:</span>{' '}
                          <span className={b.remaining < 0 ? 'text-error font-bold' : 'text-success'}>
                            ₹{b.remaining.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gemini Advice Container */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm border-l-4 border-l-primary relative overflow-hidden">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button 
                onClick={fetchAiAdvice}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Regenerate saving strategies"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2.5 mb-4">
              <Sparkles className="w-5 h-5 text-primary pulse-ring rounded-full animate-pulse" />
              <h4 className="font-bold text-base text-slate-900 font-outfit">Gemini AI Savings Report</h4>
            </div>

            {aiLoading ? (
              <div className="py-8 flex flex-col items-center gap-2 text-xs text-slate-500">
                <Loader className="w-6 h-6 animate-spin text-primary" />
                <span>Gemini analyzing transaction histories and spending metrics...</span>
              </div>
            ) : aiAdvice ? (
              <div className="text-xs text-slate-600 leading-relaxed font-sans max-w-none whitespace-pre-wrap">
                {aiAdvice}
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-6 text-center">
                Configure your budgets to trigger Gemini analysis recommendations.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Manual Setup form & AI Auto Allocator form */}
        <div className="lg:col-span-4 space-y-6">
          {/* Manual Budget Allocator Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3 font-outfit">Adjust Budget Manually</h3>
            
            {formError && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-xs text-error">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveBudget} className="space-y-4 text-xs font-semibold text-slate-500">
              <div>
                <label className="block text-[10px] uppercase tracking-wider mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-primary text-slate-800 font-medium shadow-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider mb-1.5">Limit Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-primary text-slate-800 font-mono shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-slate-900 font-extrabold text-xs rounded-xl shadow-glow-primary glow-button flex items-center justify-center gap-1.5 mt-2 transition-all"
              >
                {formLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Save Budget Limit
                  </>
                )}
              </button>
            </form>
          </div>

          {/* AI Auto-Allocator Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <h3 className="font-bold text-base text-slate-900 font-outfit">AI Budget Allocator</h3>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal font-medium">
              Enter your total monthly budget target. Gemini will split this target across spending categories dynamically, matching your historical 60-day ledger logs.
            </p>
            
            {aiAllocateError && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-xs text-error font-medium">
                {aiAllocateError}
              </div>
            )}

            <form onSubmit={handleAiAllocate} className="space-y-4 text-xs font-semibold text-slate-500">
              <div>
                <label className="block text-[10px] uppercase tracking-wider mb-1.5">Total Target Budget (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 45000"
                  value={aiTotalLimit}
                  onChange={(e) => setAiTotalLimit(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-primary text-slate-800 font-mono shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={aiAllocateLoading}
                className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-slate-900 font-extrabold text-xs rounded-xl shadow-glow-primary glow-button flex items-center justify-center gap-1.5 mt-2 transition-all"
              >
                {aiAllocateLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-900" /> Auto-Allocate Category Budgets
                  </>
                )}
              </button>
            </form>

            {/* AI Allocator Rationale text output */}
            {aiAllocateRationale && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-[11px] leading-relaxed text-slate-700 animate-fade-in space-y-1.5 font-medium shadow-sm">
                <div className="flex items-center gap-1.5 font-bold text-primary uppercase tracking-wider text-[10px] mb-1">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" /> AI Split Rationale
                </div>
                <p className="whitespace-pre-wrap">{aiAllocateRationale}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Budgets;
