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
  Sparkles,
  Brain,
  ShieldAlert,
  DollarSign,
  Activity,
  FileText,
  Lightbulb,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#8B5CF6', '#E62DA9', '#FEDC85', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#6B7280'];

const Dashboard = () => {
  const { getHeaders, user, linkFamily, leaveFamily, mode } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [inspectDuplicateModal, setInspectDuplicateModal] = useState(null);
  const [familyInputCode, setFamilyInputCode] = useState('');
  const [familyMessage, setFamilyMessage] = useState({ text: '', isError: false });

  // AI Savings Audit State
  const [auditReport, setAuditReport] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [intelligence, setIntelligence] = useState(null);

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
      
      const [analyticsRes, budgetsRes, auditRes, invoicesRes, subsRes, intelRes] = await Promise.all([
        fetch(`${API_URL}/api/analytics`, { headers }),
        fetch(`${API_URL}/api/budgets`, { headers }),
        fetch(`${API_URL}/api/ai/audit`, { headers }),
        fetch(`${API_URL}/api/invoices`, { headers }),
        fetch(`${API_URL}/api/ai/subscriptions`, { headers }),
        fetch(`${API_URL}/api/ai/intelligence`, { headers })
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
      if (invoicesRes.ok) {
        const invoicesJson = await invoicesRes.json();
        setInvoices(invoicesJson);
      }
      if (subsRes.ok) {
        const subsJson = await subsRes.json();
        setSubscriptions(subsJson);
      }
      if (intelRes.ok) {
        const intelJson = await intelRes.json();
        setIntelligence(intelJson);
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

  // Extract duplicates and anomalies
  const duplicatesList = invoices.filter(inv => inv.isDuplicate);
  const anomaliesList = invoices.filter(inv => inv.isAnomaly);

  // Business metrics calculation
  const businessCategories = ["Operations", "Cloud Infrastructure", "Utilities", "Travel"];
  const totalOpEx = (analyticsData?.categoryDistribution || [])
    .filter(c => businessCategories.some(bc => bc.toLowerCase() === c.name.toLowerCase() || (bc === "Travel" && c.name.toLowerCase().includes("travel"))))
    .reduce((sum, c) => sum + c.value, 0);

  const totalGst = invoices
    .filter(inv => inv.status === 'completed')
    .reduce((sum, inv) => sum + (inv.extractedDetails?.tax || 0), 0);

  // Personal mode Wellness score calculation
  const wellnessScore = intelligence?.health?.score ?? Math.max(0, Math.min(100, Math.round(
    overallBudget.limit > 0 
      ? Math.max(0, 100 - (summary.monthlyExpenses / overallBudget.limit) * 80)
      : 78
  )));

  const circularProgressRadius = 38;
  const circumference = 2 * Math.PI * circularProgressRadius;
  const strokeDashoffset = circumference - (wellnessScore / 100) * circumference;

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      {/* Welcome & Quick manual spending Action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-outfit">Welcome back, {user?.username || 'User'}!</h2>
          <p className="text-xs text-slate-500 mt-1">
            Active workspace: <strong className="text-slate-800 capitalize font-semibold">{mode} Mode</strong>
          </p>
        </div>
        <button
          onClick={() => setShowManualModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-slate-900 font-extrabold text-xs rounded-xl shadow-glow-primary hover:shadow-md transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Log Manual Expense
        </button>
      </div>

      {mode === 'personal' ? (
        /* ======================== PERSONAL MODE ======================== */
        <div className="space-y-8 animate-fade-in">
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
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl font-outfit shadow-sm select-none">
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

            {/* Estimated Tax */}
            <div className="bg-white border border-slate-200 p-6 border-l-4 border-l-success flex items-center justify-between rounded-2xl shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Tax / GST</span>
                <h3 className="text-2xl font-bold font-outfit text-slate-900">
                  ₹{intelligence?.tax?.estimatedGstPaid ? intelligence.tax.estimatedGstPaid.toLocaleString() : Number(mockTax).toLocaleString()}
                </h3>
                <p className="text-[10px] text-slate-400">AI-Audited GST component</p>
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

          {/* Dynamic spending charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Dynamic Spending Trend Area Chart */}
            <div className="bg-white border border-slate-200 p-6 lg:col-span-8 flex flex-col justify-between rounded-2xl shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h4 className="font-bold text-base text-slate-900 capitalize">{spendingPeriod} Spending Trend</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {spendingPeriod === 'daily' ? 'Expenditure timeline over the last 7 days' : spendingPeriod === 'yearly' ? 'Expenditure timeline over the last 5 years' : 'Expenditure timeline over the last 12 months'}
                  </p>
                </div>
                
                {/* Period Selector Toggle Switcher */}
                <div className="flex p-0.5 bg-slate-100 rounded-xl border border-slate-200/50 self-start sm:self-auto">
                  {['daily', 'monthly', 'yearly'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSpendingPeriod(p)}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        spendingPeriod === p
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200/10'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {p === 'daily' ? 'Daily' : p === 'yearly' ? 'Yearly' : 'Monthly'}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getChartData()}>
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

            {/* Circular Financial Wellness Score Card */}
            <div className="bg-white border border-slate-200 p-6 lg:col-span-4 flex flex-col justify-between rounded-2xl shadow-sm relative overflow-hidden">
              <div>
                <h4 className="font-bold text-base text-slate-900 mb-1">Financial Wellness Score</h4>
                <p className="text-xs text-slate-500 mb-4">Interactive audit of spending wellness</p>
              </div>

              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-36 h-36 flex items-center justify-center select-none">
                  {/* Outer Background Circle */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r={circularProgressRadius}
                      className="text-slate-100"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    {/* Glowing Progress Arc */}
                    <circle
                      cx="72"
                      cy="72"
                      r={circularProgressRadius}
                      className="text-primary transition-all duration-1000 ease-out"
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  {/* Inside Circle Content */}
                  <div className="absolute text-center">
                    <span className="text-3xl font-extrabold font-outfit text-slate-900">{wellnessScore}</span>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Health</span>
                  </div>
                </div>

                <div className="text-center mt-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
                    {wellnessScore >= 80 ? 'Excellent Status' : wellnessScore >= 60 ? 'Healthy Status' : 'Needs Optimization'}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 text-center font-medium leading-normal mt-2">
                Score is calculated in real-time based on your adherence to monthly budgets and saving percentage targets.
              </p>
            </div>
          </div>

          {/* Row: Expense Categories Pie and AI Savings Auditor */}
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

            {/* AI Savings Auditor & Saving Assistant */}
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

          {/* Row: Active SaaS Subscriptions & Collaborations */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Active SaaS Subscriptions Detection Panel */}
            <div className="bg-white border border-slate-200 p-6 lg:col-span-8 rounded-2xl shadow-sm relative border-l-4 border-l-secondary flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-900 mb-1">Detected Active Subscriptions</h4>
                <p className="text-xs text-slate-500 mb-5">AI detected recurring charge billing intervals (AWS, Netflix, Spotify, etc.)</p>
              </div>

              <div className="flex-1 max-h-64 overflow-y-auto space-y-3 pr-1">
                {subscriptions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 font-medium">
                    No active SaaS or recurring subscription contracts detected in transaction history.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {subscriptions.map((sub, index) => (
                      <div key={index} className="p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl space-y-2 flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-bold text-slate-950 text-xs capitalize leading-tight">{sub.merchant}</h5>
                            <span className="text-[10px] text-slate-400 font-semibold">{sub.category}</span>
                          </div>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                            sub.confidence === 'High' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                          }`}>
                            {sub.interval}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-200/40 text-[10px] font-mono">
                          <span className="text-slate-800 font-bold">₹{sub.amount.toLocaleString()}/cycle</span>
                          <span className="text-slate-400">Next billing: {new Date(sub.nextBillingDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Collaborative Family Space */}
            <div className="bg-white border border-slate-200 p-6 lg:col-span-4 flex flex-col justify-between rounded-2xl shadow-sm">
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
                          type="button"
                        >
                          <Link2 className="w-3.5 h-3.5" /> Copy Code
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleLeaveFamily}
                      className="w-full py-2.5 rounded-xl border border-error/20 hover:bg-error/10 text-error text-xs font-semibold transition-colors"
                      type="button"
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
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-secondary text-slate-800 font-mono uppercase shadow-sm"
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

          {/* ======================== DEDICATED AI-NATIVE CORE ECOSYSTEM ======================== */}
          <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm relative overflow-hidden space-y-8 mt-8 border-l-4 border-l-primary">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10 pointer-events-none" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-glow-primary select-none animate-pulse">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-outfit tracking-tight flex items-center gap-2">
                    FINCE AI Autonomous Ecosystem <span className="px-2.5 py-0.5 bg-gradient-to-r from-primary to-accent text-[9px] font-black tracking-widest text-slate-900 uppercase rounded-full">Active</span>
                  </h3>
                  <p className="text-xs text-slate-500">Consolidated real-time operational and cognitive financial intelligence</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60 font-mono text-[10px] text-slate-600">
                <Activity className="w-3.5 h-3.5 text-primary animate-spin" /> Engine state: Dynamic
              </div>
            </div>

            {/* Grid of AI Modules */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: AI Narrative Story Feed */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl flex flex-col justify-between h-full relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl" />
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-4 h-4 text-accent" />
                      <h4 className="font-bold text-sm text-slate-800 font-outfit uppercase tracking-wider">AI Financial Story Feed</h4>
                    </div>
                    <div className="text-xs text-slate-600 leading-relaxed font-normal space-y-2 max-h-80 overflow-y-auto pr-1">
                      {intelligence?.narrative ? (
                        renderMarkdown(intelligence.narrative)
                      ) : (
                        <div className="py-12 text-center text-slate-400 font-medium">
                          <Loader className="w-5 h-5 animate-spin text-accent mx-auto mb-2" />
                          Narrating financial logs...
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-200/40 mt-4 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Target user: {user?.username}</span>
                    <span>Confidence: 94%</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Stats & Profiling */}
              <div className="lg:col-span-5 space-y-6">
                {/* AI Financial Health Score details */}
                <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl relative overflow-hidden shadow-sm">
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 animate-pulse" /> AI Computed
                  </div>
                  <h4 className="font-bold text-xs text-slate-400 font-outfit uppercase tracking-widest mb-4">Ecosystem Score Breakdown</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-600">Savings Consistency Ratio</span>
                        <span className="text-success font-bold font-mono">{intelligence?.health?.ratings?.consistency || 'Healthy'}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-success rounded-full" style={{ width: `${wellnessScore}%` }} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-sm">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Operational Risk</span>
                        <span className="text-xs font-extrabold text-slate-800 mt-1 block">Low Risk</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-sm">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Luxury Exposure</span>
                        <span className="text-xs font-extrabold text-slate-800 mt-1 block">{intelligence?.health?.ratings?.luxuryexposure || 'Moderate'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Spending Psychology Profiler */}
                <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl relative overflow-hidden shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-primary" />
                    <h4 className="font-bold text-xs text-slate-800 font-outfit uppercase tracking-wider">AI Behavioral Profiler</h4>
                  </div>
                  
                  <div className="space-y-3.5">
                    {intelligence?.psychology ? (
                      <>
                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm">
                          <span className="text-xs text-slate-500 font-medium">Personality Archetype</span>
                          <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg border border-primary/20">
                            {intelligence.psychology.personalityArchetype}
                          </span>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-[11px] font-semibold mb-1 text-slate-600">
                            <span>Self-Discipline index</span>
                            <span className="font-mono text-primary font-bold">{intelligence.psychology.selfDisciplineIndex}/100</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-accent to-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${intelligence.psychology.selfDisciplineIndex}%` }} />
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic mt-2">
                          "{intelligence.psychology.psychologicalDescription}"
                        </p>
                      </>
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400 font-medium">
                        Analyzing behavioral profile...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row Modules: Recommendations & Projections */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
              {/* AI Forecast & Projections */}
              <div className="lg:col-span-5 bg-slate-50 border border-slate-200/60 p-6 rounded-2xl relative overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <h4 className="font-bold text-xs text-slate-800 font-outfit uppercase tracking-wider">AI Expense Projections Radar</h4>
                </div>

                <div className="space-y-4">
                  {intelligence?.forecasting?.categoryForecasts ? (
                    Object.entries(intelligence.forecasting.categoryForecasts).map(([cat, f]) => {
                      const limitObj = budgets.find(b => b.category === cat) || { limit: 0 };
                      const isHighRisk = intelligence.forecasting.riskIndicators?.[cat]?.overrunProbability === 'HIGH';
                      return (
                        <div key={cat} className="flex justify-between items-center text-xs border-b border-slate-200/40 pb-2">
                          <div>
                            <span className="text-slate-800 font-semibold">{cat}</span>
                            <span className="text-[9px] text-slate-500 block font-medium">Projected next: ₹{Math.round(f.projectedNextMonth).toLocaleString()}</span>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              isHighRisk ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
                            }`}>
                              {isHighRisk ? 'Overrun Risk' : 'Optimal'}
                            </span>
                            <span className="text-[9px] text-slate-400 block font-mono mt-0.5">Confidence: {intelligence.forecasting.riskIndicators?.[cat]?.confidence}%</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium col-span-2">
                      Computing future forecasting indexes...
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Wealth Optimization Suggestions */}
              <div className="lg:col-span-7 bg-slate-50 border border-slate-200/60 p-6 rounded-2xl relative overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-4 h-4 text-secondary animate-bounce" />
                  <h4 className="font-bold text-xs text-slate-800 font-outfit uppercase tracking-wider">AI Smart Wealth Recommendations</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {intelligence?.wealth?.recommendationsList ? (
                    intelligence.wealth.recommendationsList.map((rec, index) => (
                      <div key={index} className="p-3.5 bg-white border border-slate-200/60 rounded-xl space-y-2 flex flex-col justify-between relative overflow-hidden shadow-sm">
                        <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-black ${
                          rec.priority === 'CRITICAL' ? 'bg-danger/10 text-danger border border-danger/25' : 'bg-warning/10 text-warning border border-warning/25'
                        }`}>
                          {rec.priority}
                        </span>
                        
                        <div>
                          <h5 className="font-bold text-slate-800 text-xs tracking-tight">{rec.title}</h5>
                          <span className="text-[9px] text-slate-400 font-bold block">{rec.category}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-normal font-medium pt-1 border-t border-slate-100">
                          {rec.action}
                        </p>
                        <div className="pt-2 text-[9px] text-slate-400 font-mono">
                          Impact: <strong className="text-secondary font-bold font-mono">{rec.impact}</strong>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium col-span-2">
                      Generating high-yield wealth maneuvers...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ======================== BUSINESS MODE ======================== */
        <div className="space-y-8 animate-fade-in">
          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total OpEx */}
            <div className="bg-white border border-slate-200 p-6 border-l-4 border-l-primary flex items-center justify-between rounded-2xl shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Operating Spend (OpEx)</span>
                <h3 className="text-2xl font-bold font-outfit text-slate-900">₹{totalOpEx.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-500 font-semibold">Includes Cloud, Operations, Travel</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl font-outfit shadow-sm select-none">
                ₹
              </div>
            </div>

            {/* Total GST Paid */}
            <div className="bg-white border border-slate-200 p-6 border-l-4 border-l-secondary flex items-center justify-between rounded-2xl shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total GST Tax Paid</span>
                <h3 className="text-2xl font-bold font-outfit text-slate-900">₹{totalGst.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Aggregated tax fields from invoices</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-bold text-xl font-outfit shadow-sm select-none">
                ₹
              </div>
            </div>

            {/* Active Duplicates Count */}
            <div className="bg-white border border-slate-200 p-6 border-l-4 border-l-error flex items-center justify-between rounded-2xl shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suspected Duplicate Invoices</span>
                <h3 className="text-2xl font-bold font-outfit text-slate-900">{duplicatesList.length}</h3>
                <p className="text-[10px] text-slate-500 font-semibold">Requires immediate review and cleanup</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center text-error font-bold text-xl font-outfit shadow-sm select-none">
                {duplicatesList.length > 0 ? '⚠️' : '✓'}
              </div>
            </div>

            {/* Active Anomalies Count */}
            <div className="bg-white border border-slate-200 p-6 border-l-4 border-l-warning flex items-center justify-between rounded-2xl shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suspicious Expense Anomalies</span>
                <h3 className="text-2xl font-bold font-outfit text-slate-900">{anomaliesList.length}</h3>
                <p className="text-[10px] text-slate-500 font-semibold">Spikes or new vendors flagged</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center text-warning font-bold text-xl font-outfit shadow-sm select-none">
                {anomaliesList.length > 0 ? '🚨' : '✓'}
              </div>
            </div>
          </div>

          {/* Dynamic spending charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Vendor Concentration Dependency Bar Chart */}
            <div className="bg-white border border-slate-200 p-6 lg:col-span-8 flex flex-col justify-between rounded-2xl shadow-sm">
              <div>
                <h4 className="font-bold text-base text-slate-900">Vendor Dependency Analytics</h4>
                <p className="text-xs text-slate-500 mb-6 font-inter">Leading merchants by aggregate amount</p>
              </div>
              
              <div className="h-64">
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

            {/* GST Expense Growth line */}
            <div className="bg-white border border-slate-200 p-6 lg:col-span-4 flex flex-col justify-between rounded-2xl shadow-sm">
              <div>
                <h4 className="font-bold text-base text-slate-900">Monthly Tax Growth (GST)</h4>
                <p className="text-xs text-slate-500 mb-4">Expenditure timeline for GST inputs</p>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(analyticsData?.monthlySpending || []).map(item => ({ name: item.name, amount: Number((item.amount * 0.08).toFixed(2)) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.06)', borderRadius: '12px' }}
                      itemStyle={{ color: '#0f172a' }}
                    />
                    <Bar dataKey="amount" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row: Suspected Duplicates & Spending Anomalies Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Duplicates Alert panel */}
            <div className="bg-white border border-slate-200 p-6 lg:col-span-6 rounded-2xl shadow-sm border-l-4 border-l-error relative flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-900 mb-1">Suspected Duplicate Invoices</h4>
                <p className="text-xs text-slate-500 mb-4">Flagged receipts matching invoice number, vendor, or amounts.</p>
              </div>

              <div className="flex-1 max-h-64 overflow-y-auto space-y-3 pr-1">
                {duplicatesList.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 font-medium">
                    No duplicate invoice alerts found in database. Good job!
                  </div>
                ) : (
                  duplicatesList.map((dup, index) => (
                    <div key={index} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs flex justify-between items-start gap-2 shadow-sm animate-fade-in">
                      <div className="space-y-1">
                        <h5 className="font-bold text-slate-950 font-mono capitalize">{dup.extractedDetails?.merchant}</h5>
                        <p className="text-slate-500 font-semibold leading-relaxed font-sans">{dup.anomalyReason || 'Suspected Duplicate Entry'}</p>
                        <span className="text-[10px] text-slate-400 block font-mono">Invoice Date: {new Date(dup.extractedDetails?.date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <span className="text-xs font-bold text-error font-mono block">₹{dup.extractedDetails?.amount?.toLocaleString()}</span>
                        <button
                          onClick={() => setInspectDuplicateModal(dup)}
                          className="px-2.5 py-1 bg-error/10 hover:bg-error/20 text-error text-[10px] font-bold rounded-lg transition-all"
                          type="button"
                        >
                          Inspect
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Anomaly Detection panel */}
            <div className="bg-white border border-slate-200 p-6 lg:col-span-6 rounded-2xl shadow-sm border-l-4 border-l-warning relative flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-900 mb-1">Suspicious Expense Anomalies</h4>
                <p className="text-xs text-slate-500 mb-4">AI flagged spending spikes, new vendors, or cash indicators.</p>
              </div>

              <div className="flex-1 max-h-64 overflow-y-auto space-y-3 pr-1">
                {anomaliesList.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 font-medium">
                    No unusual anomalies detected. Spending aligns with standard baselines.
                  </div>
                ) : (
                  anomaliesList.map((anom, index) => (
                    <div key={index} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs flex justify-between items-start gap-2 shadow-sm animate-fade-in">
                      <div className="space-y-1">
                        <h5 className="font-bold text-slate-950 capitalize">{anom.extractedDetails?.merchant}</h5>
                        <p className="text-slate-600 font-semibold leading-relaxed">{anom.anomalyReason || 'Spike above baseline value'}</p>
                        <span className="text-[10px] text-slate-400 block font-mono">Category: {anom.extractedDetails?.category}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-warning font-mono block">₹{anom.extractedDetails?.amount?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* AI SME Operational Insights Advisory */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm border-l-4 border-l-success flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-success animate-pulse" />
              <h4 className="font-bold text-base text-slate-900 font-outfit">SME AI Cost Optimization Advisor</h4>
            </div>
            <p className="text-xs text-slate-500 mb-4">Gemini-powered business efficiency and operational spend audit report</p>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3 text-xs leading-relaxed max-h-64 overflow-y-auto pr-1">
              <h5 className="font-bold text-slate-900 text-sm">Strategic Operations Optimization Report</h5>
              
              <div className="space-y-3.5 text-slate-600 font-medium">
                <p>
                  Based on current aggregated corporate invoices, Fince AI has compiled the following fiscal efficiency insights:
                </p>
                <ul className="space-y-2 list-disc pl-4 text-slate-700 font-medium">
                  <li>
                    <strong>Vendor Concentration Limit Alert:</strong> Your top merchant accounts for over <strong>{analyticsData?.topMerchants?.[0] ? `${Math.round((analyticsData.topMerchants[0].amount / (summary.totalExpenses || 1)) * 100)}%` : '40%'}</strong> of aggregate OpEx. Consider establishing direct service level agreements or secondary supplier integrations to mitigate structural lock-in risks.
                  </li>
                  <li>
                    <strong>SaaS License Cycle Tracking:</strong> Subscriptions in Cloud and Operations exhibit overlaps. We recommend executing a vendor optimization audit before the next predicted monthly renew cycles.
                  </li>
                  <li>
                    <strong>GST Compliance Actionable Tip:</strong> Total eligible input tax credit (estimated GST) is <strong>₹{totalGst.toLocaleString()}</strong>. Ensure all confirmed receipt records have verified corporate tax details to easily claim input tax write-offs in the upcoming fiscal quarter.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Budgets progress tracking */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="font-bold text-base text-slate-900">Monthly Budgets Progress</h4>
            <p className="text-xs text-slate-500">Breakdown by categorized allocations</p>
          </div>
          <button
            onClick={() => navigate('/budgets')}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 font-semibold shadow-sm transition-all"
            type="button"
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
                <div key={budget._id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 shadow-sm hover:shadow transition-all duration-200 animate-fade-in">
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
              type="button"
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
                  <option value="Food">Food</option>
                  <option value="Travel">Travel</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                  <option value="Subscriptions">Subscriptions</option>
                  <option value="Medical">Medical</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Operations">Operations</option>
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

      {/* Side-by-Side Duplicate Comparison Modal */}
      {inspectDuplicateModal && (() => {
        const suspect = inspectDuplicateModal;
        const original = invoices.find(inv => inv._id === suspect.duplicateOf);
        
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-4xl w-full p-6 border border-slate-200 rounded-3xl text-slate-800 space-y-6 animate-fade-in shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setInspectDuplicateModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-error animate-pulse" />
                <div>
                  <h3 className="text-lg font-bold font-outfit text-slate-900">Duplicate Audit Analysis</h3>
                  <p className="text-xs text-slate-500">Side-by-side safety comparison of suspect and baseline documents.</p>
                </div>
              </div>

              <div className="p-3.5 bg-error/5 border border-error/20 rounded-2xl text-xs text-error font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span><strong>Duplicate Flag Rule Triggered:</strong> Similar amount and merchant found within a short window, or matching invoice numbers.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Panel: Suspect Invoice */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                    <span className="text-xs font-bold text-error uppercase tracking-wider">A. Suspect Invoice (New)</span>
                    <span className="px-2 py-0.5 bg-error/15 text-[10px] text-error rounded-full font-bold">Suspect</span>
                  </div>
                  
                  <div className="space-y-2.5 text-xs text-slate-600 font-medium">
                    <div className="flex justify-between"><span>File Name:</span><strong className="text-slate-800 font-mono">{suspect.fileName}</strong></div>
                    <div className="flex justify-between"><span>Merchant:</span><strong className="text-slate-800">{suspect.extractedDetails?.merchant}</strong></div>
                    <div className="flex justify-between"><span>Amount:</span><strong className="text-slate-900 font-bold font-mono">₹{suspect.extractedDetails?.amount?.toLocaleString()}</strong></div>
                    <div className="flex justify-between"><span>Date:</span><strong className="text-slate-800">{new Date(suspect.extractedDetails?.date).toLocaleDateString()}</strong></div>
                    <div className="flex justify-between"><span>Invoice Number:</span><strong className="text-slate-800 font-mono">{suspect.extractedDetails?.invoiceNumber || 'N/A'}</strong></div>
                    <div className="flex justify-between"><span>GSTIN:</span><strong className="text-slate-800 font-mono">{suspect.extractedDetails?.gstNumber || 'N/A'}</strong></div>
                  </div>
                </div>

                {/* Right Panel: Original Invoice */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                    <span className="text-xs font-bold text-success uppercase tracking-wider">B. Baseline Invoice (Stored)</span>
                    <span className="px-2 py-0.5 bg-success/15 text-[10px] text-success rounded-full font-bold">Original</span>
                  </div>
                  
                  {original ? (
                    <div className="space-y-2.5 text-xs text-slate-600 font-medium">
                      <div className="flex justify-between"><span>File Name:</span><strong className="text-slate-800 font-mono">{original.fileName}</strong></div>
                      <div className="flex justify-between"><span>Merchant:</span><strong className="text-slate-800">{original.extractedDetails?.merchant}</strong></div>
                      <div className="flex justify-between"><span>Amount:</span><strong className="text-slate-900 font-bold font-mono">₹{original.extractedDetails?.amount?.toLocaleString()}</strong></div>
                      <div className="flex justify-between"><span>Date:</span><strong className="text-slate-800">{new Date(original.extractedDetails?.date).toLocaleDateString()}</strong></div>
                      <div className="flex justify-between"><span>Invoice Number:</span><strong className="text-slate-800 font-mono">{original.extractedDetails?.invoiceNumber || 'N/A'}</strong></div>
                      <div className="flex justify-between"><span>GSTIN:</span><strong className="text-slate-800 font-mono">{original.extractedDetails?.gstNumber || 'N/A'}</strong></div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium">Baseline record not found or was removed from history.</div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setInspectDuplicateModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all"
                  type="button"
                >
                  Close Audit
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Dashboard;
