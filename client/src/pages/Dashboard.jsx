import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  AreaChart, Area, 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, 
  CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingDown, 
  Receipt, 
  Percent, 
  Calendar, 
  Users, 
  Plus, 
  AlertCircle,
  TrendingUp,
  Link2,
  X,
  Loader,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#8B5CF6', '#E62DA9', '#FEDC85', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#6B7280'];

const Dashboard = () => {
  const { getHeaders, user, linkFamily, leaveFamily } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [familyInputCode, setFamilyInputCode] = useState('');
  const [familyMessage, setFamilyMessage] = useState({ text: '', isError: false });

  // AI Savings Audit State
  const [auditReport, setAuditReport] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');

  // spending charts state
  const [spendingPeriod, setSpendingPeriod] = useState('monthly'); // 'daily' | 'monthly' | 'yearly'

  // manual spending modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualMerchant, setManualMerchant] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualCategory, setManualCategory] = useState('Groceries');
  const [manualDescription, setManualDescription] = useState('');
  const [manualError, setManualError] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  const categoriesList = [
    "Groceries", 
    "Utilities", 
    "Food & Dining", 
    "Entertainment", 
    "Travel & Transport", 
    "Shopping", 
    "Health & Personal Care", 
    "Housing", 
    "Others"
  ];

  // Markdown parsing helper for AI Auditor
  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      let isBullet = false;
      let cleanLine = line;
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        isBullet = true;
        cleanLine = line.trim().replace(/^[-*]\s+/, '');
      }

      // Parse bold tags in cleanLine
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(cleanLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(cleanLine.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-bold text-slate-900">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < cleanLine.length) {
        parts.push(cleanLine.substring(lastIndex));
      }

      const content = parts.length > 0 ? parts : cleanLine;

      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc pl-1 mb-1 text-slate-600 font-medium">
            {content}
          </li>
        );
      }
      
      if (cleanLine.startsWith('###')) {
        return <h5 key={idx} className="text-xs font-bold text-slate-800 mt-3 mb-1">{cleanLine.replace(/^###\s+/, '')}</h5>;
      }
      if (cleanLine.startsWith('##')) {
        return <h4 key={idx} className="text-sm font-bold text-slate-900 mt-4 mb-1.5">{cleanLine.replace(/^##\s+/, '')}</h4>;
      }
      if (cleanLine.startsWith('#')) {
        return <h3 key={idx} className="text-base font-bold text-slate-950 mt-5 mb-2">{cleanLine.replace(/^#\s+/, '')}</h3>;
      }

      if (cleanLine.trim() === '') return <div key={idx} className="h-1.5" />;

      return <p key={idx} className="mb-1 text-slate-600 font-medium">{content}</p>;
    });
  };

  // Fetch Dashboard details
  const fetchDashboardData = async () => {
    try {
      const headers = getHeaders();
      setAuditLoading(true);
      setAuditError('');
      
      const [analyticsRes, budgetsRes, auditRes] = await Promise.all([
        fetch(`${API_URL}/api/analytics`, { headers }),
        fetch(`${API_URL}/api/budgets`, { headers }),
        fetch(`${API_URL}/api/ai/audit`, { headers })
      ]);

      if (analyticsRes.ok) {
        const analyticsJson = await analyticsRes.json();
        setAnalyticsData(analyticsJson);
      }
      if (budgetsRes.ok) {
        const budgetsJson = await budgetsRes.json();
        setBudgets(budgetsJson);
      }
      if (auditRes.ok) {
        const auditJson = await auditRes.json();
        setAuditReport(auditJson.report);
      } else {
        setAuditError('Failed to fetch AI spending pattern comparison report.');
      }
    } catch (err) {
      console.error('Error fetching dashboard details:', err);
      setAuditError('Network error connecting to the AI Auditor.');
    } finally {
      setLoading(false);
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Family Operations
  const handleLinkFamily = async (e) => {
    e.preventDefault();
    if (!familyInputCode.trim()) return;
    try {
      setFamilyMessage({ text: '', isError: false });
      const data = await linkFamily(familyInputCode);
      setFamilyMessage({ text: data.message, isError: false });
      familyInputCode('');
      fetchDashboardData();
    } catch (err) {
      setFamilyMessage({ text: err.message, isError: true });
    }
  };

  const handleLeaveFamily = async () => {
    if (!window.confirm('Are you sure you want to unlink from your family group?')) return;
    try {
      setFamilyMessage({ text: '', isError: false });
      const data = await leaveFamily();
      setFamilyMessage({ text: data.message, isError: false });
      fetchDashboardData();
    } catch (err) {
      setFamilyMessage({ text: err.message, isError: true });
    }
  };

  // Manual spending log submission
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualError('');
    if (!manualMerchant || !manualAmount || !manualDate || !manualCategory) {
      setManualError('Merchant, amount, date and category are required.');
      return;
    }

    setManualLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/invoices/manual`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          merchant: manualMerchant,
          amount: Number(manualAmount),
          date: manualDate,
          category: manualCategory,
          description: manualDescription
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to log spending manually.');
      }

      setManualMerchant('');
      setManualAmount('');
      setManualDate(new Date().toISOString().split('T')[0]);
      setManualCategory('Groceries');
      setManualDescription('');
      setShowManualModal(false);

      // Refresh Dashboard Data
      fetchDashboardData();
      alert('Manual spending entry saved successfully!');
    } catch (err) {
      setManualError(err.message);
    } finally {
      setManualLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col justify-center items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-500 font-mono">Aggregating financial data...</span>
      </div>
    );
  }

  // Summary Metrics
  const summary = analyticsData?.summary || { totalExpenses: 0, monthlyExpenses: 0, transactionCount: 0 };
  const overallBudget = budgets.find(b => b.category === 'overall') || { limit: 0, spent: 0, remaining: 0, percentage: 0 };
  const mockTax = (summary.totalExpenses * 0.08).toFixed(2);

  // Format Dynamic Spending Trend Data
  const getChartData = () => {
    if (spendingPeriod === 'daily') {
      return (analyticsData?.dailySpending || []).map(item => ({
        name: new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        amount: item.amount
      }));
    }
    if (spendingPeriod === 'yearly') {
      return (analyticsData?.yearlySpending || []).map(item => ({
        name: item.name,
        amount: item.amount
      }));
    }
    return (analyticsData?.monthlySpending || []).map(item => ({
      name: item.name,
      amount: item.amount
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      {/* Welcome & Quick manual spending Action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-outfit">Welcome back, {user?.username || 'User'}!</h2>
          <p className="text-xs text-slate-500 mt-1">Here is your financial status overview and budget allocations.</p>
        </div>
        <button
          onClick={() => setShowManualModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-slate-900 font-extrabold text-xs rounded-xl shadow-glow-primary hover:shadow-md transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Log Manual Expense
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Expenses */}
        <div className="bg-white border border-slate-200 p-6 border-l-4 border-l-primary flex items-center justify-between rounded-2xl shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Ledger Spend</span>
            <h3 className="text-2xl font-bold font-outfit text-slate-900">₹{summary.totalExpenses.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-500 font-semibold">
              Avg/trans: ₹{summary.transactionCount > 0 ? (summary.totalExpenses / summary.transactionCount).toFixed(2) : '0.00'} | {summary.transactionCount} entries
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl font-outfit shadow-sm select-none animate-pulse">
            ₹
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="bg-white border border-slate-200 p-6 border-l-4 border-l-secondary flex items-center justify-between rounded-2xl shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spent This Month</span>
            <h3 className="text-2xl font-bold font-outfit text-slate-900">₹{summary.monthlyExpenses.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400">Current calendar month</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-bold text-xl font-outfit shadow-sm select-none">
            ₹
          </div>
        </div>

        {/* GST/Tax */}
        <div className="bg-white border border-slate-200 p-6 border-l-4 border-l-success flex items-center justify-between rounded-2xl shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Tax / GST</span>
            <h3 className="text-2xl font-bold font-outfit text-slate-900">₹{mockTax}</h3>
            <p className="text-[10px] text-slate-400">Avg 8% receipt tax</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center text-success font-bold text-xl font-outfit shadow-sm select-none">
            ₹
          </div>
        </div>

        {/* Budget Remaining */}
        <div className="bg-white border border-slate-200 p-6 border-l-4 border-l-warning flex items-center justify-between rounded-2xl shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Budget Remaining</span>
            <h3 className="text-2xl font-bold font-outfit text-slate-900">
              {overallBudget.limit > 0 ? `₹${overallBudget.remaining.toLocaleString()}` : '₹0'}
            </h3>
            <p className="text-[10px] text-slate-400">
              {overallBudget.limit > 0 
                ? `Limit: ₹${overallBudget.limit} (${overallBudget.percentage}%)` 
                : 'No global budget defined'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center text-warning font-bold text-xl font-outfit shadow-sm select-none">
            ₹
          </div>
        </div>
      </div>

      {/* Section: Spending Trends (Separate Monthly & Yearly) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Spending Trend (Area Chart) */}
        <div className="bg-white border border-slate-200 p-6 lg:col-span-6 flex flex-col justify-between rounded-2xl shadow-sm">
          <div>
            <h4 className="font-bold text-base text-slate-900">Monthly Spending Trend</h4>
            <p className="text-xs text-slate-500 mb-4">Expenditure timeline over the last 12 months</p>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={(analyticsData?.monthlySpending || []).map(item => ({ name: item.name, amount: item.amount }))}>
                <defs>
                  <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.06)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} 
                  labelClassName="text-slate-400 font-mono text-xs"
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#8B5CF6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorMonthly)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Yearly Spending Growth (Bar Chart) */}
        <div className="bg-white border border-slate-200 p-6 lg:col-span-6 flex flex-col justify-between rounded-2xl shadow-sm">
          <div>
            <h4 className="font-bold text-base text-slate-900">Yearly Spending History</h4>
            <p className="text-xs text-slate-500 mb-4">Expenditure growth comparison across fiscal years</p>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(analyticsData?.yearlySpending || []).map(item => ({ name: item.name, amount: item.amount }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.06)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} 
                  labelClassName="text-slate-400 font-mono text-xs"
                />
                <Bar 
                  dataKey="amount" 
                  fill="#E62DA9" 
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row: Category Pie and AI Savings Auditor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (Pie Chart) */}
        <div className="bg-white border border-slate-200 p-6 lg:col-span-4 flex flex-col justify-between rounded-2xl shadow-sm">
          <div>
            <h4 className="font-bold text-base text-slate-900 mb-1">Expense Categories</h4>
            <p className="text-xs text-slate-500 mb-4">Pie share distribution</p>
          </div>
          
          <div className="h-56 relative flex items-center justify-center">
            {analyticsData?.categoryDistribution && analyticsData.categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {analyticsData.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.06)', borderRadius: '12px' }}
                    itemStyle={{ color: '#0f172a' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-400 font-medium">No categorizations. Upload an invoice!</div>
            )}
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-2 justify-center mt-3 max-h-16 overflow-y-auto">
            {analyticsData?.categoryDistribution?.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Savings Comparison System Panel */}
        <div className="bg-white border border-slate-200 p-6 lg:col-span-8 flex flex-col justify-between rounded-2xl shadow-sm border-l-4 border-l-primary relative overflow-hidden">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button 
              onClick={fetchDashboardData}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Refresh AI analysis"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400 hover:text-slate-800" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <h4 className="font-bold text-base text-slate-900 font-outfit">AI Spend Auditor & Saving Assistant</h4>
            </div>
            <p className="text-xs text-slate-500 mb-4">Gemini-powered comparative audit of your monthly spending patterns</p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-64 pr-1">
            {auditLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs text-slate-500 font-medium font-mono">Comparing current month vs. last month trends...</span>
              </div>
            ) : auditError ? (
              <div className="p-4 bg-error/5 border border-error/20 rounded-xl text-xs text-error font-medium">
                {auditError}
              </div>
            ) : auditReport ? (
              <div className="text-xs leading-relaxed space-y-2">
                {renderMarkdown(auditReport)}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-slate-400 font-medium">
                Upload invoices across multiple months to unlock spending pattern audits.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Family Space and Top Merchants */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Merchants (Bar Chart) */}
        <div className="bg-white border border-slate-200 p-6 lg:col-span-7 rounded-2xl shadow-sm">
          <h4 className="font-bold text-base text-slate-900 mb-1">Top Spend Outlets</h4>
          <p className="text-xs text-slate-500 mb-6 font-inter">Leading merchants by aggregate amount</p>
          
          <div className="h-60">
            {analyticsData?.topMerchants && analyticsData.topMerchants.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.topMerchants}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.06)', borderRadius: '12px' }}
                    itemStyle={{ color: '#0f172a' }}
                  />
                  <Bar dataKey="amount" fill="#FEDC85" radius={[6, 6, 0, 0]}>
                    {analyticsData.topMerchants.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">No merchant histories found.</div>
            )}
          </div>
        </div>

        {/* Collaborative Family Board */}
        <div className="bg-white border border-slate-200 p-6 lg:col-span-5 flex flex-col justify-between rounded-2xl shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-secondary" />
              <h4 className="font-bold text-base text-slate-900">Family Ledger Group</h4>
            </div>
            <p className="text-xs text-slate-500">Link databases to merge budget calculations & analytics</p>
          </div>

          <div className="my-6 space-y-4">
            {user?.familyCode ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-500 block uppercase font-mono mb-1">Share this Code with Family</span>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-mono font-bold text-secondary tracking-widest">{user.familyCode}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(user.familyCode);
                        alert('Family code copied to clipboard!');
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                    >
                      <Link2 className="w-3.5 h-3.5" /> Copy Code
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleLeaveFamily}
                  className="w-full py-2.5 rounded-xl border border-error/20 hover:bg-error/10 text-error text-xs font-semibold transition-colors"
                >
                  Disconnect from Group
                </button>
              </div>
            ) : (
              <form onSubmit={handleLinkFamily} className="space-y-3">
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-xs text-slate-500 font-medium">
                  You are currently tracking expenses independently. Enter a family member's code to sync.
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={familyInputCode}
                    onChange={(e) => setFamilyInputCode(e.target.value)}
                    placeholder="Enter Family Code"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-secondary text-slate-800 font-mono uppercase shadow-sm animate-fade-in"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary-hover text-slate-900 font-extrabold text-xs glow-button shadow-sm"
                  >
                    Sync Group
                  </button>
                </div>
              </form>
            )}

            {familyMessage.text && (
              <div className={`p-2.5 rounded-lg text-xs font-medium ${
                familyMessage.isError ? 'bg-error/10 text-error border border-error/20' : 'bg-success/10 text-success border border-success/20'
              }`}>
                {familyMessage.text}
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 leading-normal font-medium">
            Group synchronization immediately merges invoices and budget limits under a collaborative account view.
          </div>
        </div>
      </div>

      {/* Monthly Budget Checkup */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="font-bold text-base text-slate-900">Monthly Budgets Progress</h4>
            <p className="text-xs text-slate-500">Breakdown by categorized allocations</p>
          </div>
          <button
            onClick={() => navigate('/budgets')}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Adjust Budgets
          </button>
        </div>

        {budgets.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 font-medium">
            No budgets configured. Click "Adjust Budgets" to assign limits.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => {
              const pct = budget.percentage;
              let barColor = 'bg-success';
              let textColor = 'text-success';

              if (pct >= 100) {
                barColor = 'bg-error';
                textColor = 'text-error';
              } else if (pct >= 80) {
                barColor = 'bg-warning';
                textColor = 'text-warning';
              }

              return (
                <div key={budget._id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 shadow-sm hover:shadow transition-all duration-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm capitalize text-slate-900">{budget.category}</span>
                    <span className={`text-xs font-mono font-semibold ${textColor}`}>{pct}%</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200/50 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`${barColor} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>Spent: ₹{budget.spent}</span>
                    <span>Limit: ₹{budget.limit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Expense Modal Popup */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-slate-200 rounded-2xl text-slate-800 space-y-6 animate-fade-in shadow-2xl relative">
            <button
              onClick={() => {
                setShowManualModal(false);
                setManualError('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold font-outfit text-slate-900 mb-1">Log Manual Expense</h3>
              <p className="text-xs text-slate-500">Add an expense transaction directly to calculate budget allocations.</p>
            </div>

            {manualError && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-xs text-error font-medium">
                {manualError}
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <div>
                <label className="block mb-1.5">Merchant Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazon, Cafe Coffee Day"
                  value={manualMerchant}
                  onChange={(e) => setManualMerchant(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 normal-case font-medium focus:outline-none focus:border-primary shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="e.g. 500"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 normal-case font-mono focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>
                <div>
                  <label className="block mb-1.5">Date *</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 normal-case font-mono focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5">Expense Category *</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 normal-case font-medium focus:outline-none focus:border-primary shadow-sm"
                >
                  {categoriesList.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1.5">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Starbucks coffee with friends"
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 normal-case font-medium focus:outline-none focus:border-primary shadow-sm"
                />
              </div>

              <div className="pt-2 flex gap-3 justify-end tracking-normal normal-case">
                <button
                  type="button"
                  onClick={() => {
                    setShowManualModal(false);
                    setManualError('');
                  }}
                  className="px-4 py-2.5 border border-slate-200 bg-white text-xs font-bold text-slate-500 rounded-xl shadow-sm hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-slate-900 font-extrabold text-xs rounded-xl shadow-glow-primary hover:shadow-md transition-all flex items-center gap-1.5"
                >
                  {manualLoading ? (
                    <Loader className="w-4 h-4 animate-spin animate-spin-fast" />
                  ) : (
                    <span>Log Expense</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
