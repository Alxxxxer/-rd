import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  History,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Target,
  GraduationCap,
  Trophy
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE']
    },
    {
      name: 'Leads',
      path: '/leads',
      icon: Target,
      roles: ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE']
    },
    {
      name: 'Campus Delegates',
      path: '/delegates',
      icon: GraduationCap,
      roles: ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE']
    },
    {
      name: 'Leaderboard',
      path: '/leaderboard',
      icon: Trophy,
      roles: ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE']
    },
    {
      name: 'Users',
      path: '/users',
      icon: Users,
      roles: ['SUPER_ADMIN', 'ADMIN']
    },
    {
      name: 'Activity Logs',
      path: '/activity-logs',
      icon: History,
      roles: ['SUPER_ADMIN', 'ADMIN']
    }
  ];

  // Filters navigation items based on the active user's roles
  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <aside
      className={`
        h-screen sticky top-0 bg-slate-950/70 border-r border-slate-900 flex flex-col justify-between transition-all duration-300 z-30
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Dynamic atmospheric side background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-600/5 via-transparent to-transparent pointer-events-none" />

      <div className="z-10">
        {/* Branding header */}
        <div className={`flex items-center border-b border-slate-900 ${isCollapsed ? 'py-5 px-2 justify-center' : 'p-6 justify-between'}`}>
          {isCollapsed ? (
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 hover:bg-brand-500/20 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center"
              title="Expand Sidebar"
            >
              <ShieldCheck size={20} />
            </button>
          ) : (
            <>
              <Link to="/" className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
                  <ShieldCheck size={20} />
                </div>
                <span className="font-extrabold text-sm tracking-tight text-white">
                  Sales<span className="text-gradient">CRM</span>
                </span>
              </Link>

              <button
                onClick={() => setIsCollapsed(true)}
                className="hidden md:flex p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors"
                title="Collapse Sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            </>
          )}
        </div>

        {/* Navigation list */}
        <nav className={`space-y-1.5 flex-1 ${isCollapsed ? 'py-4 px-2' : 'p-4'}`}>
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`
                  flex items-center rounded-lg text-sm font-medium transition-all duration-300 relative group
                  ${isCollapsed ? 'justify-center p-3' : 'gap-3.5 px-4 py-3'}
                  ${isActive 
                    ? 'bg-brand-600/25 border border-brand-500/30 text-white font-semibold' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 border border-transparent'}
                `}
              >
                {/* Active left indicator strip */}
                {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-500 rounded-r" />
                )}
                
                <Icon size={18} className={isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'} />
                
                {!isCollapsed && <span>{item.name}</span>}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-16 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap shadow-glass z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile bottom footer */}
      <div className={`border-t border-slate-900 bg-slate-950/40 z-10 ${isCollapsed ? 'py-4 px-2' : 'p-4'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center gap-0' : 'gap-3 justify-between'}`}>
          {!isCollapsed && (
            <div className="text-left max-w-[130px] space-y-0.5">
              <p className="text-sm font-bold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider bg-brand-950/50 border border-brand-500/20 px-2 py-0.5 rounded text-brand-400">
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={`
              p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-950/10 rounded-lg transition-all duration-300
              ${isCollapsed ? 'w-full flex items-center justify-center' : ''}
            `}
          >
            <LogOut size={16} />
            {isCollapsed && (
              <div className="absolute left-16 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs font-semibold text-red-400 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap shadow-glass z-50">
                Sign Out
              </div>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
