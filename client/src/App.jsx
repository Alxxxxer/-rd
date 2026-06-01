import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ShieldCheck, LayoutDashboard, UserCheck, Activity, Users as UsersIcon, Calendar, ArrowUpRight, History as HistoryIcon, Target, TrendingUp, CheckCircle, Clock, ArrowRight, GraduationCap, Trophy } from 'lucide-react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
        <svg className="animate-spin h-10 w-10 text-brand-500 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm font-semibold tracking-wider text-slate-400 font-sans uppercase animate-pulse">
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <svg className="animate-spin h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24">
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

  const isLoaderActive = isLeadsLoading || isDelegatesLoading || (isUsersLoading && ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'].includes(user?.role));

  const isExecutive = user?.role === 'SALES_EXECUTIVE';

  return (
    <Layout>
      {/* Loading overlay indicator */}
      {isLoaderActive && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-50">
          <svg className="animate-spin h-10 w-10 text-brand-500 mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-slate-300 tracking-widest uppercase animate-pulse">Initializing Dashboard Context...</span>
        </div>
      )}

      {/* Header bar */}
      <div className="text-left space-y-1">
        <span className="text-xs uppercase font-bold text-brand-400 tracking-wider">
          {isExecutive ? 'Staff Panel' : 'Control Center'}
        </span>
        <h1 className="text-3xl font-extrabold text-white">
          {isExecutive ? 'My Sales Console' : 'Operations Dashboard'}
        </h1>
        <p className="text-sm text-slate-400">
          {isExecutive 
            ? 'Track your active pipeline, personal conversion metrics, and linked campus code.' 
            : 'General metrics, system-wide sales conversion, staff accounts, and delegate oversight.'}
        </p>
      </div>

      {/* Atmospheric dynamic highlight welcome banner */}
      <Card className="border-brand-500/10 bg-brand-950/5 relative overflow-hidden p-6 md:p-8 text-left">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 blur-3xl rounded-full" />
        <div className="space-y-4 max-w-3xl relative z-10">
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-950/80 border border-brand-500/30 text-[10px] font-bold text-brand-400 uppercase tracking-wide">
              <ShieldCheck size={12} />
              Session Verified & Secure
            </div>
            {isExecutive && myDelegateProfile && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 uppercase tracking-wide animate-pulse">
                <GraduationCap size={12} />
                Campus: {myDelegateProfile.campus} ({myDelegateProfile.code})
              </div>
            )}
          </div>
          <h2 className="text-3xl font-extrabold text-white leading-tight">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            {isExecutive 
              ? `You are currently linked as a Sales Executive. Below is your real-time performance summary. Use the sidebar to inspect your assigned leads pipeline and competitive leaderboards!`
              : `System operations are healthy. You are logged in with administrative clearance (${user?.role?.replace('_', ' ')}). You can provision staff users, link campus delegates, assign leads, and inspect system audit ledgers.`}
          </p>
        </div>
      </Card>

      {/* Dynamic Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        <Card className="relative overflow-hidden p-6 border-slate-900 bg-slate-950/30">
          <div className="absolute top-0 right-0 w-20 h-20 bg-brand-500/5 blur-2xl rounded-full" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider font-sans">
                {isExecutive ? 'My Assigned Leads' : 'Total Leads Pipeline'}
              </h3>
              <p className="text-3xl font-bold text-slate-100">{totalLeadsCount}</p>
            </div>
            <div className="p-2.5 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-xl">
              <Target size={20} />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4">Active prospects assigned</p>
        </Card>

        <Card className="relative overflow-hidden p-6 border-slate-900 bg-slate-950/30">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 blur-2xl rounded-full" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider font-sans">
                Converted leads
              </h3>
              <p className="text-3xl font-bold text-slate-100">{convertedLeadsCount}</p>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <CheckCircle size={20} />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4">Prospects successfully converted</p>
        </Card>

        <Card className="relative overflow-hidden p-6 border-slate-900 bg-slate-950/30">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 blur-2xl rounded-full" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider font-sans">
                Conversion Rate
              </h3>
              <p className="text-3xl font-bold text-slate-100">{conversionRate}%</p>
            </div>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full" 
                style={{ width: `${Math.min(Number(conversionRate), 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500">Converted vs total leads</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden p-6 border-slate-900 bg-slate-950/30">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 blur-2xl rounded-full" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider font-sans">
                {isExecutive ? 'Pending Follow-ups' : 'Campus Network'}
              </h3>
              <p className="text-3xl font-bold text-slate-100">
                {isExecutive ? pendingFollowupsCount : delegates.length}
              </p>
            </div>
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
              {isExecutive ? <Clock size={20} /> : <GraduationCap size={20} />}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4">
            {isExecutive ? 'Scheduled follow-ups needing attention' : 'Active campus delegates profiles'}
          </p>
        </Card>
      </div>

      {/* Grid: Split pane displaying Recent Leads & Quick actions side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        
        {/* Left 2 Columns: Recent leads list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide font-sans">
              {isExecutive ? 'My Recent Prospects' : 'Recent Leads Pipeline'}
            </h3>
            <a href="/leads" className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all pipeline
              <ArrowRight size={12} />
            </a>
          </div>

          <Card className="p-0 border-slate-900 bg-slate-950/20 overflow-hidden">
            {leads.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-600">
                No active prospects registered in your pipeline.
              </div>
            ) : (
              <div className="divide-y divide-slate-900/50">
                {leads.slice(0, 4).map((lead) => {
                  const statusColors = {
                    NEW: 'text-sky-400 bg-sky-950/20 border-sky-900/30',
                    CONTACTED: 'text-purple-400 bg-purple-950/20 border-purple-900/30',
                    IN_PROGRESS: 'text-amber-400 bg-amber-950/20 border-amber-900/30',
                    CONVERTED: 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30',
                    LOST: 'text-red-400 bg-red-950/20 border-red-900/30'
                  };

                  return (
                    <div 
                      key={lead._id || lead.id} 
                      className="p-4 flex items-center justify-between hover:bg-slate-900/10 transition duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                          {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{lead.name}</p>
                          <p className="text-[10px] text-slate-500">Source: {lead.source}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`inline-block text-[9px] font-bold border rounded px-2.5 py-0.5 uppercase tracking-wide ${statusColors[lead.status]}`}>
                          {lead.status}
                        </span>
                        <div className="hidden sm:block text-[10px] text-slate-500">
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

        {/* Right 1 Column: Quick Action Cards */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide font-sans">
            Console Actions
          </h3>

          <Card className="p-4 border-slate-900 bg-slate-950/40 space-y-3.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Navigation Links</p>
            
            <div className="space-y-3">
              <a
                href="/leads"
                className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 hover:border-brand-500/30 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-brand-950/20 text-brand-400 rounded-md">
                    <Target size={14} />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">Prospects Pipeline</span>
                </div>
                <ArrowRight size={12} className="text-slate-600 group-hover:text-brand-400 transition" />
              </a>

              <a
                href="/leaderboard"
                className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 hover:border-brand-500/30 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-amber-950/20 text-amber-400 rounded-md">
                    <Trophy size={14} />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">Ranked Leaderboard</span>
                </div>
                <ArrowRight size={12} className="text-slate-600 group-hover:text-amber-400 transition" />
              </a>

              {['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'].includes(user?.role) && (
                <>
                  <a
                    href="/delegates"
                    className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 hover:border-brand-500/30 flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-indigo-950/20 text-indigo-400 rounded-md">
                        <GraduationCap size={14} />
                      </div>
                      <span className="text-xs font-semibold text-slate-300">Campus Delegates</span>
                    </div>
                    <ArrowRight size={12} className="text-slate-600 group-hover:text-indigo-400 transition" />
                  </a>

                  <a
                    href="/users"
                    className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 hover:border-brand-500/30 flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-purple-950/20 text-purple-400 rounded-md">
                        <UsersIcon size={14} />
                      </div>
                      <span className="text-xs font-semibold text-slate-300">Provision Users</span>
                    </div>
                    <ArrowRight size={12} className="text-slate-600 group-hover:text-purple-400 transition" />
                  </a>
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
    </QueryClientProvider>
  );
}

export default App;
