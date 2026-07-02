import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Bell, ShieldCheck, Sun, Moon, Menu } from 'lucide-react';

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [diagnostics, setDiagnostics] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio,
    fontSize: '16px'
  });

  // Auto-collapse sidebar & track browser environment diagnostics
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const updateDiagnostics = () => {
      setDiagnostics({
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio,
        fontSize: window.getComputedStyle(document.documentElement).fontSize
      });
    };
    updateDiagnostics();
    window.addEventListener('resize', updateDiagnostics);

    // Track browser zoom scale changes
    let matchMediaTracker;
    try {
      const mqString = `(resolution: ${window.devicePixelRatio}dppx)`;
      matchMediaTracker = window.matchMedia(mqString);
      matchMediaTracker.addEventListener('change', updateDiagnostics);
    } catch (e) {
      // fallback
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', updateDiagnostics);
      if (matchMediaTracker) {
        matchMediaTracker.removeEventListener('change', updateDiagnostics);
      }
    };
  }, []);

  return (
    <div className="h-screen flex bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 overflow-hidden relative">
      
      {/* Reusable Collapsible Navigation Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Mobile Drawer Backdrop */}
      {!isCollapsed && (
        <div 
          className="md:hidden fixed inset-0 bg-zinc-950/30 backdrop-blur-[1px] z-35 transition-opacity duration-200"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Main Workspace Scrolling area */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950">
        
        {/* Top Header Navbar */}
        <header className="h-20 border-b border-zinc-200 dark:border-zinc-900 bg-white/70 dark:bg-zinc-950/40 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="md:hidden p-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-white mr-1"
              title="Toggle Sidebar"
            >
              <Menu size={16} />
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 font-sans uppercase">
              <ShieldCheck size={14} className="text-brand-500" />
              <span>Sales CRM</span>
              <span className="text-zinc-300 dark:text-zinc-700 font-normal">/</span>
              <span className="text-zinc-800 dark:text-zinc-200">Console Desk</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* System Status Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-[9px] font-bold text-zinc-500 dark:text-zinc-400 font-sans tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEM ONLINE
            </div>

            {/* Notification bell */}
            <button className="p-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-350 dark:hover:border-zinc-750 transition-colors relative">
              <Bell size={14} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-brand-500 rounded-full" />
            </button>

            {/* Light/Dark mode selector */}
                        <button
              onClick={toggleTheme}
              className="p-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-350 dark:hover:border-zinc-750 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Vertical divider */}
            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />

            {/* User Profile avatar info */}
            {user && (
              <div className="flex items-center gap-2.5 text-left">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200 line-clamp-1 leading-none">{user.name}</p>
                  <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-500 dark:text-brand-400 font-sans">
                    {user.role?.replace('_', ' ')}
                  </span>
                </div>
                <div className="w-8 h-8 rounded bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300">
                  {user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 w-full p-6 md:p-8 space-y-6 z-10">
          {children}
        </div>
      </main>

      {/* Viewport & Device Diagnostics Badge (Highly helpful for cross-browser debugging) */}
      <div className="fixed bottom-3 right-3 z-50 p-2.5 rounded-lg bg-zinc-900/95 dark:bg-zinc-950/95 text-white border border-zinc-700/50 backdrop-blur text-[10px] font-mono shadow-xl flex flex-col gap-1 select-none pointer-events-auto opacity-75 hover:opacity-100 transition-opacity">
        <div className="font-bold border-b border-zinc-800 pb-1 mb-1 flex items-center justify-between gap-3">
          <span>🖥️ Browser UI Diagnostics</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-400 font-sans">Viewport:</span>
          <span className="font-semibold">{diagnostics.width}px × {diagnostics.height}px</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-400 font-sans">Browser Zoom:</span>
          <span className="font-semibold text-brand-400">{Math.round(diagnostics.dpr * 100)}% ({diagnostics.dpr}x)</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-400 font-sans">Computed Font:</span>
          <span className="font-semibold text-amber-400">{diagnostics.fontSize}</span>
        </div>
        <div className="text-[8px] text-zinc-500 mt-1 border-t border-zinc-800 pt-1 text-center">
          Press Ctrl + 0 to reset zoom
        </div>
      </div>
    </div>
  );
};

export default Layout;
