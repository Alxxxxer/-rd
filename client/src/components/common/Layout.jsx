import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Bell, ShieldCheck } from 'lucide-react';

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <div className="h-screen flex bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Dynamic background lighting elements */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-600/5 blur-[120px] pointer-events-none animate-glow" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none animate-glow" style={{ animationDelay: '2s' }} />

      {/* Reusable Collapsible Navigation Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Workspace Scrolling area */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        
        {/* Top Header Navbar */}
        <header className="h-16 border-b border-slate-900 bg-slate-950/40 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-400 font-sans uppercase">
            <ShieldCheck size={14} className="text-brand-500" />
            <span>Sales CRM</span>
            <span className="text-slate-700 font-normal">/</span>
            <span className="text-slate-300">Console Desk</span>
          </div>

          <div className="flex items-center gap-4">
            {/* System Status Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[9px] font-bold text-slate-400 font-sans tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEM ONLINE
            </div>

            {/* Notification bell placeholder */}
            <button className="p-1.5 rounded-lg border border-slate-900 bg-slate-950/20 text-slate-400 hover:text-white hover:border-slate-800 transition-colors relative">
              <Bell size={14} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-brand-500 rounded-full" />
            </button>

            {/* Vertical divider */}
            <div className="w-px h-5 bg-slate-900" />

            {/* User Profile avatar info */}
            {user && (
              <div className="flex items-center gap-3 text-left">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-200 line-clamp-1">{user.name}</p>
                  <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-brand-400 font-sans">
                    {user.role?.replace('_', ' ')}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                  {user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto space-y-8 z-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
