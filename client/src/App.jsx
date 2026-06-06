import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ShieldCheck, LayoutDashboard, UserCheck, Activity, Users as UsersIcon, Calendar, ArrowUpRight, History as HistoryIcon, Target, TrendingUp, CheckCircle, Clock, ArrowRight, GraduationCap, Trophy, DollarSign } from 'lucide-react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import api from './services/api';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Users from './pages/Users';
import ActivityLogs from './pages/ActivityLogs';
import Leads from './pages/Leads';
import Delegates from './pages/Delegates';
import Leaderboard from './pages/Leaderboard';
import Layout from './components/common/Layout';
import Card from './components/ui/Card';

// Create a global Query Client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// 1. Protected Route Wrapper (Ensures authentication)
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-150 transition-colors duration-150">
        <svg className="animate-spin h-8 w-8 text-brand-500 mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-[10px] font-bold tracking-wider text-zinc-450 dark:text-zinc-500 font-sans uppercase animate-pulse">
          Securing session context...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// 2. Role-Based Route Wrapper (Ensures access clearances)
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors duration-150">
        <svg className="animate-spin h-7 w-7 text-brand-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// 3. High-fidelity Live Dashboard Home
const DashboardHome = () => {
  const { user } = useAuth();

  // 1. Fetch leads for dynamic statistics
  const { data: leadsData, isLoading: isLeadsLoading } = useQuery({
    queryKey: ['dashboard-leads'],
    queryFn: async () => {
      const response = await api.get('/leads', { params: { limit: 1000 } });
      return response.data;
    }
  });

  // 2. Fetch delegates to display current executive's delegate code or general delegate counts
  const { data: delegatesData, isLoading: isDelegatesLoading } = useQuery({
    queryKey: ['dashboard-delegates'],
    queryFn: async () => {
      const response = await api.get('/delegates', { params: { limit: 1000 } });
      return response.data;
    }
  });

  // 3. Fetch system-wide users count if Super Admin/Admin
  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ['dashboard-users-count'],
    queryFn: async () => {
      const response = await api.get('/users', { params: { limit: 1000 } });
      return response.data;
    },
    enabled: ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'].includes(user?.role)
  });

  const leads = leadsData?.data || [];
  const delegates = delegatesData?.data || [];
  const users = usersData?.data || [];

  // Find if this Sales Executive is registered as a Delegate
  const myDelegateProfile = delegates.find(d => d.user?.id === user?.id || d.user?._id === user?.id);

  // Compute stats metrics dynamically
  const totalLeadsCount = leads.length;
  const convertedLeadsCount = leads.filter(l => l.status === 'CONVERTED').length;
  const conversionRate = totalLeadsCount > 0 ? ((convertedLeadsCount / totalLeadsCount) * 100).toFixed(0) : '0';
  
  // Pending follow-ups: leads with active followUpDate
  const pendingFollowupsCount = leads.filter(l => l.followUpDate && l.status !== 'CONVERTED' && l.status !== 'LOST').length;

  const totalRevenue = leads
    .filter(l => l.paymentStatus === 'PAID')
    .reduce((sum, l) => sum + (l.amount || 0), 0);
  const pendingRevenue = leads
    .filter(l => l.paymentStatus === 'PENDING' && l.status !== 'LOST')
    .reduce((sum, l) => sum + (l.amount || 0), 0);
  const averageDealSize = leads.filter(l => l.paymentStatus === 'PAID').length > 0
    ? Math.round(totalRevenue / leads.filter(l => l.paymentStatus === 'PAID').length)
    : 0;

  // Pie Chart 1: Lead Status Breakdown
  const statusData = [
    { name: 'New', value: leads.filter(l => l.status === 'NEW').length, color: '#3b5cff' },
    { name: 'Contacted', value: leads.filter(l => l.status === 'CONTACTED').length, color: '#a855f7' },
    { name: 'In Progress', value: leads.filter(l => l.status === 'IN_PROGRESS').length, color: '#f59e0b' },
    { name: 'Converted', value: leads.filter(l => l.status === 'CONVERTED').length, color: '#10b981' },
    { name: 'Lost', value: leads.filter(l => l.status === 'LOST').length, color: '#ef4444' }
  ].filter(item => item.value > 0);

  // Pie Chart 2: Lead Sources Breakdown
  const sourceMap = {};
  leads.forEach(l => {
    const src = l.source || 'Manual';
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  });
  const sourceColors = {
    'Manual': '#6366f1',
    'CSV Import': '#06b6d4',
    'Google Sheets': '#14b8a6'
  };
  const sourceData = Object.keys(sourceMap).map(src => ({
    name: src,
    value: sourceMap[src],
    color: sourceColors[src] || '#8b5cf6'
  })).filter(item => item.value > 0);

  const isLoaderActive = isLeadsLoading || isDelegatesLoading || (isUsersLoading && ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'].includes(user?.role));

  const isExecutive = user?.role === 'SALES_EXECUTIVE';

  return (
    <Layout>
      {/* Loading overlay indicator */}
      {isLoaderActive && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-zinc-50/70 dark:bg-zinc-950/80 z-50 transition-colors duration-150">
          <svg className="animate-spin h-8 w-8 text-brand-500 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase animate-pulse">Initializing Dashboard Context...</span>
        </div>
      )}

      {/* Header bar */}
      <div className="text-left space-y-1">
        <span className="text-xs uppercase font-bold text-brand-500 tracking-wider leading-none">
          {isExecutive ? 'Executive Desk' : 'Control Center'}
        </span>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white leading-tight">
          {isExecutive ? 'My Sales Console' : 'Operations Dashboard'}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {isExecutive 
            ? 'Track your active prospects pipeline, personal conversions, and linked campus code.' 
            : 'General system stats, sales metrics conversions, staff database, and delegate arena overview.'}
        </p>
      </div>

      {/* Flat welcome banner */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 text-left shadow-sm">
        <div className="space-y-3.5">
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border border-zinc-200/50 dark:border-zinc-700/50">
              <ShieldCheck size={13} className="text-brand-500" />
              Session Verified & Secure
            </div>
            {isExecutive && myDelegateProfile && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-50 dark:bg-emerald-950/20 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border border-emerald-200/50 dark:border-emerald-900/20">
                <GraduationCap size={13} />
                Campus: {myDelegateProfile.campus} ({myDelegateProfile.code})
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-3xl leading-relaxed">
            {isExecutive 
              ? `You are currently linked as a Sales Executive. Below is your real-time performance summary. Use the sidebar to inspect your assigned leads pipeline and competitive leaderboards!`
              : `System operations are healthy. You are logged in with administrative clearance (${user?.role?.replace('_', ' ')}). You can provision staff users, link campus delegates, assign leads, and inspect system audit logs.`}
          </p>
        </div>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-zinc-400 dark:text-zinc-550 text-xs font-bold uppercase tracking-wider">
                {isExecutive ? 'My Assigned Leads' : 'Total Leads Pipeline'}
              </h3>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{totalLeadsCount}</p>
            </div>
            <div className="p-2 bg-brand-500/10 text-brand-500 rounded">
              <Target size={18} />
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-3.5">Active prospects assigned</p>
        </Card>

        <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-zinc-400 dark:text-zinc-550 text-xs font-bold uppercase tracking-wider">
                Converted Leads
              </h3>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{convertedLeadsCount}</p>
            </div>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded">
              <CheckCircle size={18} />
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-3.5">Prospects successfully converted</p>
        </Card>

        <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-zinc-400 dark:text-zinc-550 text-xs font-bold uppercase tracking-wider">
                Conversion Rate
              </h3>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{conversionRate}%</p>
            </div>
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3.5 space-y-1">
            <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-850 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full" 
                style={{ width: `${Math.min(Number(conversionRate), 100)}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">Converted vs total leads</p>
          </div>
        </Card>

        <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-zinc-400 dark:text-zinc-550 text-xs font-bold uppercase tracking-wider">
                {isExecutive ? 'Pending Follow-ups' : 'Campus Network'}
              </h3>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {isExecutive ? pendingFollowupsCount : delegates.length}
              </p>
            </div>
            <div className="p-2 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded">
              {isExecutive ? <Clock size={18} /> : <GraduationCap size={18} />}
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-3.5">
            {isExecutive ? 'Scheduled follow-ups needing attention' : 'Active campus delegates profiles'}
          </p>
        </Card>
      </div>

      {/* Analytics Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm flex flex-col h-[340px]">
          <h3 className="text-zinc-700 dark:text-zinc-350 text-sm font-bold uppercase tracking-wider mb-2">
            Lead Status Distribution
          </h3>
          <div className="flex-1 min-h-0 relative">
            {statusData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">No active leads data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.95)', borderColor: '#3f3f46', borderRadius: '6px' }}
                    itemStyle={{ color: '#fff', fontSize: '13px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm flex flex-col h-[340px]">
          <h3 className="text-zinc-700 dark:text-zinc-350 text-sm font-bold uppercase tracking-wider mb-2">
            Lead Sources Breakdown
          </h3>
          <div className="flex-1 min-h-0 relative">
            {sourceData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">No active leads data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.95)', borderColor: '#3f3f46', borderRadius: '6px' }}
                    itemStyle={{ color: '#fff', fontSize: '13px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm flex flex-col justify-between h-[340px]">
          <div>
            <h3 className="text-zinc-700 dark:text-zinc-350 text-sm font-bold uppercase tracking-wider mb-4">
              Revenue & Deal Dynamics
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                <div className="flex items-center gap-2">
                  <DollarSign className="text-emerald-500" size={18} />
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Total Revenue</span>
                </div>
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">${totalRevenue.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                <div className="flex items-center gap-2">
                  <DollarSign className="text-amber-500" size={18} />
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Pending Pipeline</span>
                </div>
                <span className="text-xl font-extrabold text-amber-600 dark:text-amber-500 font-mono">${pendingRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-450">
            <span className="font-semibold">Avg. Deal Value:</span>
            <span className="font-bold text-zinc-800 dark:text-white font-mono">${averageDealSize.toLocaleString()}</span>
          </div>
        </Card>
      </div>

      {/* Grid: Recent Leads & Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        
        {/* Recent leads list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-sans">
              {isExecutive ? 'My Recent Prospects' : 'Recent Leads Pipeline'}
            </h3>
            <Link to="/leads" className="text-sm font-semibold text-brand-500 hover:text-brand-650 flex items-center gap-0.5 transition-colors">
              View pipeline
              <ArrowRight size={14} />
            </Link>
          </div>

          <Card className="p-0 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden shadow-sm">
            {leads.length === 0 ? (
              <div className="p-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
                No active prospects registered in your pipeline.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {leads.slice(0, 4).map((lead) => {
                  const statusColors = {
                    NEW: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-900/30',
                    CONTACTED: 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/20 dark:border-purple-900/30',
                    IN_PROGRESS: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-900/30',
                    CONVERTED: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/30',
                    LOST: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/20 dark:border-red-900/30'
                  };

                  return (
                    <div 
                      key={lead._id || lead.id} 
                      className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/10 transition duration-150"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center text-xs font-bold text-zinc-650 dark:text-zinc-300">
                          {lead.name ? lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'L'}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{lead.name || 'Unknown Name'}</p>
                          {lead.college && (
                            <p className="text-xs text-zinc-550 dark:text-zinc-400 font-semibold leading-tight mt-0.5">
                              {lead.college}
                            </p>
                          )}
                          <p className="text-xs text-zinc-400 dark:text-zinc-550 mt-1">Source: {lead.source}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`inline-block text-xs font-bold border rounded px-2.5 py-0.5 uppercase tracking-wider ${statusColors[lead.status]}`}>
                          {lead.status}
                        </span>
                        <div className="hidden sm:block text-xs text-zinc-450 dark:text-zinc-500">
                          {lead.followUpDate ? `Follow up: ${new Date(lead.followUpDate).toLocaleDateString()}` : 'No schedule'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Action Cards */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-sans">
            Console Actions
          </h3>

          <Card className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-3.5 shadow-sm">
            <p className="text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">Quick Navigation Links</p>
            
            <div className="space-y-2.5">
              <Link
                to="/leads"
                className="p-3.5 rounded border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-brand-500/20 dark:hover:border-brand-500/30 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-brand-500/10 text-brand-500 rounded">
                    <Target size={14} />
                  </div>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Prospects Pipeline</span>
                </div>
                <ArrowRight size={14} className="text-zinc-400 group-hover:text-brand-500 transition-colors" />
              </Link>

              <Link
                to="/leaderboard"
                className="p-3.5 rounded border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-brand-500/20 dark:hover:border-brand-500/30 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded">
                    <Trophy size={14} />
                  </div>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Ranked Leaderboard</span>
                </div>
                <ArrowRight size={14} className="text-zinc-400 group-hover:text-amber-500 transition-colors" />
              </Link>

              {['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'].includes(user?.role) && (
                <>
                  <Link
                    to="/delegates"
                    className="p-3.5 rounded border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-brand-500/20 dark:hover:border-brand-500/30 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded">
                        <GraduationCap size={14} />
                      </div>
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Campus Delegates</span>
                    </div>
                    <ArrowRight size={14} className="text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                  </Link>

                  <Link
                    to="/users"
                    className="p-3.5 rounded border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-brand-500/20 dark:hover:border-brand-500/30 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-purple-500/10 text-purple-500 rounded">
                        <UsersIcon size={14} />
                      </div>
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Provision Users</span>
                    </div>
                    <ArrowRight size={14} className="text-zinc-400 group-hover:text-purple-500 transition-colors" />
                  </Link>
                </>
              )}
            </div>
          </Card>
        </div>

      </div>
    </Layout>
  );
};

// 4. Main App Routing Engine
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Shielded Home Dashboard */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardHome />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/leads"
                element={
                  <ProtectedRoute>
                    <Leads />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/delegates"
                element={
                  <ProtectedRoute>
                    <Delegates />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <Leaderboard />
                  </ProtectedRoute>
                }
              />

              {/* Shielded Admin routes */}
              <Route
                path="/users"
                element={
                  <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                    <Users />
                  </RoleRoute>
                }
              />

              <Route
                path="/activity-logs"
                element={
                  <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                    <ActivityLogs />
                  </RoleRoute>
                }
              />

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
