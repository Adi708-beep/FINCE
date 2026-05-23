import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  UploadCloud, 
  History, 
  PiggyBank, 
  MessageSquare, 
  Bell, 
  LogOut, 
  Users, 
  X, 
  Check, 
  Sparkles,
  ChevronRight,
  Menu
} from 'lucide-react';

const WorkspaceBadge = () => {
  const { mode } = useAuth();
  if (mode === 'business') {
    return (
      <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-50 border border-sky-100 rounded-full text-[10px] font-bold text-sky-600 shadow-[0_2px_8px_rgba(14,165,233,0.05)] select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
        <span>Business Space</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/5 border border-primary/10 rounded-full text-[10px] font-bold text-primary shadow-[0_2px_8px_rgba(230,45,169,0.05)] select-none">
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      <span>Personal Space</span>
    </div>
  );
};

const Navigation = ({ children }) => {
  const { user, logout, alerts, markAlertsAsRead, clearAlerts, mode } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = alerts.filter(a => !a.read).length;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload Invoice', path: '/upload', icon: UploadCloud },
    { name: 'History', path: '/history', icon: History },
    { name: 'Budgets', path: '/budgets', icon: PiggyBank },
    { name: 'AI Chat', path: '/chat', icon: MessageSquare }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-inter">
      {/* Mobile Top Navbar */}
      <header className="md:hidden bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center pulse-ring shadow-glow-primary">
            <Sparkles className="w-4 h-4 text-slate-900" />
          </div>
          <span className="font-outfit font-extrabold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            FINCE
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <WorkspaceBadge />
          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 relative shadow-sm transition-all"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* Mobile Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden z-40 animate-fade-in">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-primary" />
                    <span className="font-bold text-xs text-slate-800">Alerts ({unreadCount})</span>
                  </div>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {alerts.length === 0 ? (
                    <div className="p-5 text-center text-slate-400 text-[11px] font-medium">
                      No financial alerts.
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div 
                        key={alert._id} 
                        className={`p-3 text-[11px] leading-relaxed transition-colors hover:bg-slate-50 ${
                          !alert.read ? 'bg-primary/[0.02] border-l-2 border-l-primary' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <p className="text-slate-600 font-medium">{alert.message}</p>
                          {!alert.read && <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1 shrink-0" />}
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-1 font-mono">
                          {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {alerts.length > 0 && (
                  <div className="p-2 border-t border-slate-100 flex justify-between bg-slate-50 text-[10px] font-bold">
                    <button 
                      onClick={markAlertsAsRead} 
                      className="text-primary hover:text-primary-hover flex items-center gap-1 font-semibold"
                    >
                      <Check className="w-3 h-3" /> Mark read
                    </button>
                    <button 
                      onClick={clearAlerts} 
                      className="text-slate-500 hover:text-slate-800 font-semibold"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Menu Drawer Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-all"
          >
            {isOpen ? <X className="w-4 h-4 text-slate-600" /> : <Menu className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside className={`fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between z-50 transform transition-transform duration-300 md:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          {/* Brand Logo inside Drawer */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-glow-primary">
              <Sparkles className="w-4.5 h-4.5 text-slate-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                FINCE
              </h1>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest -mt-1">Financial Intel</p>
            </div>
          </div>

          {/* Nav Links inside Drawer */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => 
                    `flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary text-white font-bold shadow-md shadow-primary/25' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4.5 h-4.5" />
                    <span className="text-xs font-semibold">{item.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Drawer Footer */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          {user && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-outfit font-bold text-slate-700 text-xs">
                  {user.username ? user.username.substring(0, 2).toUpperCase() : 'FI'}
                </div>
                <div>
                  <h4 className="font-bold text-xs leading-tight text-slate-800">{user.username}</h4>
                  <p className="text-[10px] text-slate-400 truncate max-w-[110px]">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-error hover:bg-error/10 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Desktop Sidebar (visible on md screens and larger) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200/80 flex-col justify-between p-6 sticky top-0 h-screen shrink-0">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center pulse-ring shadow-glow-primary">
              <Sparkles className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                FINCE
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest -mt-1">Financial Intel</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20 scale-[1.02]' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                    }`
                  }
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-semibold tracking-wide">{item.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User profile footer */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          {user && (
            <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2.5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center font-outfit font-semibold text-slate-700 text-xs shadow-sm">
                  {user.username ? user.username.substring(0, 2).toUpperCase() : 'FI'}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs leading-tight text-slate-900 truncate max-w-[100px]">{user.username}</h4>
                  <p className="text-[10px] text-slate-400 truncate max-w-[100px]">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={logout} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-error hover:bg-error/10 transition-colors shrink-0"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {user && user.familyCode && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/15 border border-secondary/20 text-[10px] text-slate-700 font-semibold shadow-sm">
              <Users className="w-3.5 h-3.5 text-secondary-hover" />
              <span>Family: <strong className="text-slate-900 font-mono">{user.familyCode}</strong></span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto max-h-screen">
        {/* Header (Top Nav - visible on desktop) */}
        <header className="hidden md:flex h-16 border-b border-slate-100 px-8 items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h2 className="font-outfit text-xl font-bold tracking-wide text-slate-900">
              {navItems.find(item => window.location.pathname.startsWith(item.path))?.name || 'Intelligence Platform'}
            </h2>
          </div>

          {/* Notifications and Stats */}
          <div className="flex items-center gap-4">
            <WorkspaceBadge />
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2.5 rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:bg-slate-50 relative ${
                  unreadCount > 0 ? 'pulse-ring' : ''
                }`}
              >
                <Bell className="w-5 h-5 text-slate-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-white" />
                )}
              </button>

              {/* Notification Dropdown Drawer */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-35 animate-fade-in">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary" />
                      <span className="font-bold text-sm text-slate-900">Notifications ({unreadCount})</span>
                    </div>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {alerts.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs font-medium">
                        No financial alerts at this time. Keep it up!
                      </div>
                    ) : (
                      alerts.map((alert) => (
                        <div 
                          key={alert._id} 
                          className={`p-3.5 border-b border-slate-100 text-xs transition-colors hover:bg-slate-50/50 ${
                            !alert.read ? 'bg-primary/[0.02] border-l-2 border-l-primary' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-slate-700 leading-normal font-medium">{alert.message}</p>
                            {!alert.read && <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1 shrink-0" />}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-1.5 font-mono">
                            {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {alerts.length > 0 && (
                    <div className="p-3 border-t border-slate-100 flex justify-between bg-slate-50 text-xs font-semibold">
                      <button 
                        onClick={markAlertsAsRead} 
                        className="text-primary hover:text-primary-hover flex items-center gap-1 font-semibold"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark all read
                      </button>
                      <button 
                        onClick={clearAlerts} 
                        className="text-slate-500 hover:text-slate-900 font-semibold"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Component */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Navigation;
