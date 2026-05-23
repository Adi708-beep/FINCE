import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  User, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Mail, 
  Phone, 
  UserCheck, 
  Save, 
  RefreshCw, 
  Bell, 
  Sparkles, 
  Smartphone, 
  Lock,
  Loader2,
  AlertCircle
} from 'lucide-react';

const Settings = () => {
  const { getHeaders, user, mode } = useAuth();
  
  // Tab states
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'preferences'
  
  // Profile settings state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Preferences state
  const [alertThreshold, setAlertThreshold] = useState('80');
  const [slackSync, setSlackSync] = useState(false);
  const [emailDigest, setEmailDigest] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [geminiPrecision, setGeminiPrecision] = useState('detailed'); // 'summary' | 'detailed'
  
  // Operational states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch current user details from /me
  const fetchProfileDetails = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setFullName(data.fullName || '');
        setUsername(data.username || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
      }
    } catch (err) {
      console.error('Error fetching profile details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (password && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match!' });
      return;
    }

    setSaving(true);
    try {
      const bodyData = {
        fullName,
        phone,
        email,
        username
      };
      if (password) bodyData.password = password;

      const res = await fetch(`${API_URL}/api/auth/update`, {
        method: 'PUT',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile changes saved successfully!' });
        setPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(data.message || 'Failed to update profile details.');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setMessage({ type: 'success', text: 'Cognitive workspace preferences synced successfully!' });
      setSaving(false);
    }, 800);
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col justify-center items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm text-slate-500 font-mono">Loading profile parameters...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-outfit">Workspace Settings</h1>
        <p className="text-slate-500 mt-1">Configure profile details and AI platform preferences</p>
      </div>

      {/* Message Alert Banner */}
      {message.text && (
        <div className={`p-4 rounded-xl text-xs font-semibold border transition-all animate-fade-in flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Hand Navigation Menu Toggles */}
        <div className="md:col-span-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
              {username ? username.substring(0, 2).toUpperCase() : 'FI'}
            </div>
            <div>
              <h4 className="font-bold text-sm leading-tight text-slate-900 capitalize">{username}</h4>
              <p className="text-[10px] text-slate-400 capitalize font-mono">{mode} Workspace</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => { setActiveTab('profile'); setMessage({ type: '', text: '' }); }}
              className={`flex items-center gap-3 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/10'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User size={15} />
              <span>Profile Settings</span>
            </button>
            
            <button
              onClick={() => { setActiveTab('preferences'); setMessage({ type: '', text: '' }); }}
              className={`flex items-center gap-3 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === 'preferences'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/10'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <SettingsIcon size={15} />
              <span>Workspace Preferences</span>
            </button>
          </div>
        </div>

        {/* Right Hand Config Tab Panels */}
        <div className="md:col-span-8">
          
          {/* TAB 1: Profile Settings Panel */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-slate-150 p-6 md:p-8 rounded-2xl shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="font-bold text-base text-slate-900 font-outfit">Profile Settings</h3>
                <p className="text-xs text-slate-400">Modify your general identity and security credentials</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <User size={15} />
                      </span>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Phone Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Phone size={15} />
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700"
                        placeholder="+91 99999 99999"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Username
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <UserCheck size={15} />
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700"
                        placeholder="johndoe12"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail size={15} />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700"
                        placeholder="accounts@example.com"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                    <Lock size={13} /> Update Password
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 w-full sm:w-fit cursor-pointer text-xs"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={15} />}
                  Save Profile Changes
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Workspace Preferences Panel */}
          {activeTab === 'preferences' && (
            <div className="bg-white border border-slate-150 p-6 md:p-8 rounded-2xl shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="font-bold text-base text-slate-900 font-outfit">Ecosystem Preferences</h3>
                <p className="text-xs text-slate-400">Configure notifications, alert limits, and Gemini AI parsing depth</p>
              </div>

              <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                
                {/* 1. Alert Threshold Config */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                    <label className="uppercase tracking-wider">Alert Threshold Percentage</label>
                    <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{alertThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value)}
                    className="w-full h-1.5 bg-slate-150 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                    Warns your workspace notifications automatically when category expenditures exceed this percentage share.
                  </p>
                </div>

                {/* 2. Toggle Config Panel */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-800">Email Smart Digests</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Weekly comparative summaries processed by AI</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={emailDigest}
                        onChange={(e) => setEmailDigest(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-800">Push App Alerts</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Real-time alerts for duplication spikes & new anomalies</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={pushNotifications}
                        onChange={(e) => setPushNotifications(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-800">Slack Slackbot Integration</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Stream opex invoice notifications to corporate channels</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={slackSync}
                        onChange={(e) => setSlackSync(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* 3. Gemini Precision Mode Selection */}
                <div className="space-y-2 pt-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Gemini AI Insight Depth
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setGeminiPrecision('summary')}
                      className={`flex flex-col gap-1 p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                        geminiPrecision === 'summary'
                          ? 'border-blue-500 bg-blue-50/30'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`text-xs font-bold ${geminiPrecision === 'summary' ? 'text-blue-700' : 'text-slate-700'}`}>High Level Summary</span>
                      <span className="text-[9px] text-slate-400 font-medium leading-normal">Optimized for fast cognitive speed & flat summaries</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGeminiPrecision('detailed')}
                      className={`flex flex-col gap-1 p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                        geminiPrecision === 'detailed'
                          ? 'border-blue-500 bg-blue-50/30'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`text-xs font-bold ${geminiPrecision === 'detailed' ? 'text-blue-700' : 'text-slate-700'}`}>Deep Psychological Narrative</span>
                      <span className="text-[9px] text-slate-400 font-medium leading-normal">Granular analysis on opex anomalies & spending psychology</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 w-full sm:w-fit cursor-pointer text-xs"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={15} />}
                  Sync Workspace Preferences
                </button>

              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default Settings;
