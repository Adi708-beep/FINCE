import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  UploadCloud, 
  History, 
  Target, 
  MessageSquare, 
  Bell, 
  LogOut, 
  Users, 
  X, 
  Check, 
  Sparkles,
  ChevronRight,
  Menu,
  IndianRupee,
  Settings
} from 'lucide-react';
import logo2 from '../assets/images/logo2.jpeg';

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
    { name: 'AI Chat', path: '/chat', icon: MessageSquare },
    { name: 'Income Setup', path: '/transactions', icon: IndianRupee },
    { name: 'Budgets', path: '/budgets', icon: Target },
    { name: 'Upload Invoice', path: '/upload', icon: UploadCloud },
    { name: 'History', path: '/history', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Top Navbar */}
      <header className="md:hidden bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-outfit font-extrabold text-lg bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            fince
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
                <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* Mobile Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden z-40 animate-fade-in">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-purple-600" />
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
                          !alert.read ? 'bg-purple-500/[0.02] border-l-2 border-l-purple-600' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <p className="text-slate-600 font-medium">{alert.message}</p>
                          {!alert.read && <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-1 shrink-0" />}
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
                      className="text-purple-600 hover:text-purple-700 flex items-center gap-1 font-semibold"
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
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                fince
              </h1>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest -mt-1 font-mono">Financial Intel</p>
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
                        ? 'bg-gradient-to-r from-blue-600 to-purple-650 text-white font-bold shadow-md shadow-blue-500/25' 
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

      {/* Desktop Sidebar - Narrow Vertical Rail as shown in given pictures */}
      <aside className="hidden md:flex w-20 md:w-24 h-screen bg-white border-r border-gray-100 flex-col items-center py-8 shadow-sm flex-shrink-0 sticky top-0 z-20">
        
        {/* Brand Icon Logo */}
        <div className="mb-12 w-12 h-12 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-300" onClick={() => navigate('/dashboard')}>
          {logo2 ? (
            <img src={logo2} alt="Brand Logo" className="w-full h-full object-cover rounded-xl shadow-sm border border-slate-100" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              f
            </div>
          )}
        </div>

        {/* Vertical Icon Nav Items */}
        <nav className="flex flex-col gap-6 flex-1 w-full items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={item.name}
                className={({ isActive }) =>
                  `relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? 'bg-gradient-to-br from-blue-500 to-purple-650 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active vertical border indicator pill on the right border */}
                    {isActive && (
                      <div className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-l-md" />
                    )}
                    <Icon className="w-[22px] h-[22px]" />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Profile and Logout Buttons */}
        <div className="mt-auto flex flex-col items-center gap-5">
          {user && (
            <div 
              className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center font-semibold text-slate-700 text-xs shadow-sm cursor-pointer hover:border-blue-500 transition-colors"
              title={`${user.username} (${user.email})`}
            >
              {user.username ? user.username.substring(0, 2).toUpperCase() : 'FI'}
            </div>
          )}
          <button 
            onClick={logout}
            className="w-12 h-12 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all duration-300"
            title="Logout"
          >
            <LogOut className="w-5.5 h-5.5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto max-h-screen">
        {/* Header (Top Nav - visible on desktop) */}
        <header className="hidden md:flex h-16 border-b border-slate-100 px-8 items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
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
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-purple-600 rounded-full ring-2 ring-white" />
                )}
              </button>

              {/* Notification Dropdown Drawer */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-30 animate-fade-in">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-purple-600" />
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
                            !alert.read ? 'bg-purple-600/[0.02] border-l-2 border-l-purple-600' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-slate-700 leading-normal font-medium">{alert.message}</p>
                            {!alert.read && <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-1 shrink-0" />}
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
                        className="text-purple-600 hover:text-purple-700 flex items-center gap-1 font-semibold"
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
