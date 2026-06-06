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
        h-screen sticky top-0 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-900 flex flex-col justify-between transition-all duration-200 z-30
        ${isCollapsed ? 'w-20' : 'w-72'}
      `}
    >
      <div className="z-10 flex flex-col h-full">
        {/* Branding header */}
        <div className={`flex items-center border-b border-zinc-200 dark:border-zinc-900 ${isCollapsed ? 'py-4 px-2 justify-center' : 'p-5 justify-between'}`}>
          {isCollapsed ? (
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1.5 rounded bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
              title="Expand Sidebar"
            >
              <ShieldCheck size={18} />
            </button>
          ) : (
            <>
              <Link to="/" className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-brand-500/10 text-brand-500">
                  <ShieldCheck size={18} />
                </div>
                <span className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-white">
                  Sales<span className="text-brand-500">CRM</span>
                </span>
              </Link>

              <button
                onClick={() => setIsCollapsed(true)}
                className="hidden md:flex p-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                title="Collapse Sidebar"
              >
                <ChevronLeft size={14} />
              </button>
            </>
          )}
        </div>

        {/* Navigation list */}
        <nav className={`space-y-1 flex-1 py-4 ${isCollapsed ? 'px-1.5' : 'px-3'}`}>
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`
                  flex items-center rounded text-xs font-medium transition-all duration-150 relative group
                  ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}
                  ${isActive 
                    ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white font-semibold border-l-2 border-brand-500 pl-2.5 dark:pl-2.5' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 border-l-2 border-transparent'}
                `}
              >
                <Icon size={16} className={isActive ? 'text-brand-500' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'} />
                
                {!isCollapsed && <span>{item.name}</span>}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-14 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-semibold text-zinc-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap shadow-md z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile bottom footer */}
      <div className={`border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/20 z-10 ${isCollapsed ? 'py-3 px-1.5' : 'p-3'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2 justify-between'}`}>
          {!isCollapsed && (
            <div className="text-left max-w-[120px] space-y-0.5">
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate leading-none">{user?.name}</p>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 truncate leading-none">{user?.email}</p>
              <span className="inline-block mt-1 text-[8px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={`
              p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 rounded transition-all duration-150 relative group
              ${isCollapsed ? 'w-full flex items-center justify-center' : ''}
            `}
          >
            <LogOut size={14} />
            {isCollapsed && (
              <div className="absolute left-14 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-semibold text-red-400 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap shadow-md z-50">
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
