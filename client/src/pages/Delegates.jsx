import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  Search,
  Plus,
  Edit2,
  AlertCircle,
  Building,
  Target,
  Trophy,
  Users as UsersIcon,
  TrendingUp,
  Percent,
  CheckCircle,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Layout from '../components/common/Layout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const Delegates = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // 1. FILTERS & PAGINATION STATE
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 8;

  // 2. REGISTER / UPDATE MODAL STATE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Register Campus Delegate');
  const [selectedDelegate, setSelectedDelegate] = useState(null);
  const [formData, setFormData] = useState({ userId: '', campus: '', code: '' });
  const [formError, setFormError] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 450);

    return () => clearTimeout(handler);
  }, [search]);

  // 3. REACT QUERY: FETCH DELEGATES
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['delegates', debouncedSearch, page],
    queryFn: async () => {
      const response = await api.get('/delegates', {
        params: {
          search: debouncedSearch || undefined,
          page,
          limit
        }
      });
      return response.data;
    },
    keepPreviousData: true
  });

  // Query all users to choose from for registering new delegate profiles
  const { data: usersData } = useQuery({
    queryKey: ['all-users-list'],
    queryFn: async () => {
      const response = await api.get('/users', { params: { limit: 100 } });
      return response.data;
    },
    enabled: ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'].includes(currentUser?.role)
  });

  // 4. REACT QUERY: CREATE MUTATION
  const createDelegateMutation = useMutation({
    mutationFn: async (newDelegate) => {
      const response = await api.post('/delegates', newDelegate);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['delegates']);
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to register delegate.');
    }
  });

  // 5. REACT QUERY: UPDATE MUTATION
  const updateDelegateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await api.patch(`/delegates/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['delegates']);
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to update delegate.');
    }
  });

  const resetForm = () => {
    setFormData({ userId: '', campus: '', code: '' });
    setSelectedDelegate(null);
    setFormError(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setModalTitle('Register Campus Delegate');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (delegate) => {
    setSelectedDelegate(delegate);
    setFormData({
      userId: delegate.user?.id || delegate.user?._id || '',
      campus: delegate.campus,
      code: delegate.code
    });
    setModalTitle(`Edit Delegate Profile: ${delegate.code}`);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError(null);

    if (selectedDelegate) {
      updateDelegateMutation.mutate({
        id: selectedDelegate._id || selectedDelegate.id,
        payload: {
          campus: formData.campus,
          code: formData.code
        }
      });
    } else {
      if (!formData.userId) {
        setFormError('Please select a user account to link.');
        return;
      }
      createDelegateMutation.mutate(formData);
    }
  };

  const isAuthorized = ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'].includes(currentUser?.role);

  // Compute overall stats metrics if delegates are loaded
  const delegatesList = data?.data || [];
  const totalDelegates = data?.pagination?.total || delegatesList.length;
  
  // Aggregate stats from the current page/results for inline indicators
  const totalAssigned = delegatesList.reduce((sum, d) => sum + (d.assignedLeadsCount || 0), 0);
  const totalConverted = delegatesList.reduce((sum, d) => sum + (d.convertedLeadsCount || 0), 0);
  const overallConvRate = totalAssigned > 0 ? ((totalConverted / totalAssigned) * 100).toFixed(1) : '0.0';

  // Filter out users who already have delegate profiles to avoid duplicate linking
  const availableUsers = usersData?.data?.filter(u => {
    // If editing, the selected user is allowed
    if (selectedDelegate && (u.id === selectedDelegate.user?.id || u.id === selectedDelegate.user?._id)) {
      return true;
    }
    // Only show active sales executives/managers that aren't already linked
    const alreadyLinked = delegatesList.some(d => d.user?.id === u.id || d.user?._id === u.id);
    return !alreadyLinked && u.status === 'ACTIVE';
  }) || [];

  return (
    <Layout>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left space-y-1">
          <span className="text-xs uppercase font-bold text-brand-400 tracking-wider">
            Campus Network
          </span>
          <h1 className="text-3xl font-extrabold text-white">
            Campus Delegates
          </h1>
          <p className="text-sm text-slate-400">
            Provision delegate profiles, view assigned leads distribution, and track conversion rates.
          </p>
        </div>

        {isAuthorized && (
          <Button
            variant="primary"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 py-3 px-5 self-start md:self-auto"
          >
            <Plus size={16} />
            Register Delegate
          </Button>
        )}
      </div>

      {/* Atmospheric High-Fidelity Stats Overview grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        <Card className="relative overflow-hidden p-6 border-slate-900 bg-slate-950/30">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 blur-2xl rounded-full" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                Total Delegates
              </h3>
              <p className="text-3xl font-bold text-slate-100">{totalDelegates}</p>
            </div>
            <div className="p-2.5 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-xl">
              <GraduationCap size={20} />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4">Linked campus network accounts</p>
        </Card>

        <Card className="relative overflow-hidden p-6 border-slate-900 bg-slate-950/30">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 blur-2xl rounded-full" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                Assigned Leads
              </h3>
              <p className="text-3xl font-bold text-slate-100">{totalAssigned}</p>
            </div>
            <div className="p-2.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl">
              <Target size={20} />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4">Pipeline leads assigned to delegates</p>
        </Card>

        <Card className="relative overflow-hidden p-6 border-slate-900 bg-slate-950/30">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                Converted Leads
              </h3>
              <p className="text-3xl font-bold text-slate-100">{totalConverted}</p>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <CheckCircle size={20} />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4">Successful sales conversions</p>
        </Card>

        <Card className="relative overflow-hidden p-6 border-slate-900 bg-slate-950/30">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                Avg. Conversion
              </h3>
              <p className="text-3xl font-bold text-slate-100">{overallConvRate}%</p>
            </div>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4">Calculated from total leads</p>
        </Card>
      </div>

      {/* Filter Options Bar */}
      <Card className="p-4 border-slate-900 bg-slate-950/40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Search campus name or unique code..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="hidden md:flex justify-end items-center text-xs text-slate-500 gap-1.5 font-sans">
            <Award size={14} className="text-amber-400" />
            <span>Leaderboards can be viewed in the sidebar menu.</span>
          </div>
        </div>
      </Card>

      {/* Grid of Delegate Cards */}
      <div className="relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 z-20">
            <svg className="animate-spin h-8 w-8 text-brand-500 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs text-slate-400">Loading campus delegates network...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-sm bg-slate-950/20 border border-slate-900 rounded-2xl">
            <AlertCircle size={36} className="text-red-500 mb-3" />
            <span>Failed to load delegates: {error?.message || 'Server connection error.'}</span>
          </div>
        )}

        {!isLoading && !isError && delegatesList.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 text-slate-500 text-sm bg-slate-950/20 border border-slate-900 rounded-2xl">
            <GraduationCap size={36} className="text-slate-800 mb-3" />
            <span>No campus delegate profiles registered yet.</span>
          </div>
        )}

        {!isLoading && !isError && delegatesList.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              {delegatesList.map((delegate) => {
                const assigned = delegate.assignedLeadsCount || 0;
                const converted = delegate.convertedLeadsCount || 0;
                const conversionRate = assigned > 0 ? ((converted / assigned) * 100).toFixed(0) : '0';

                return (
                  <Card
                    key={delegate._id || delegate.id}
                    className="p-5 border-slate-900 hover:border-brand-500/30 bg-slate-950/30 relative flex flex-col justify-between group transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 blur-2xl rounded-full group-hover:bg-brand-500/10 transition-all" />
                    
                    <div>
                      {/* Top Row: Initials avatar, and dynamic role */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                            {delegate.user?.name ? delegate.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CD'}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-200 line-clamp-1">
                              {delegate.user?.name || 'Unknown User'}
                            </h4>
                            <p className="text-[10px] text-slate-500">{delegate.user?.email || 'No email associated'}</p>
                          </div>
                        </div>

                        {isAuthorized && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(delegate)}
                            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-900 border border-transparent rounded"
                          >
                            <Edit2 size={12} />
                          </Button>
                        )}
                      </div>

                      {/* Campus name / Code container */}
                      <div className="p-3.5 bg-slate-900/40 border border-slate-900/60 rounded-xl space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-xs">
                          <Building size={14} className="text-slate-500" />
                          <span className="text-slate-400 font-semibold truncate flex-1">
                            {delegate.campus}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-slate-500 uppercase tracking-wide">Campus Code</span>
                          <span className="px-2 py-0.5 rounded bg-brand-950/80 border border-brand-500/20 text-brand-400 font-mono tracking-wider">
                            {delegate.code}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Conversion Stats Indicators */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 rounded bg-slate-900/20 border border-slate-900/40">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wide font-bold">Assigned</p>
                          <p className="text-sm font-bold text-slate-300">{assigned}</p>
                        </div>
                        <div className="p-2 rounded bg-slate-900/20 border border-slate-900/40">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wide font-bold">Converted</p>
                          <p className="text-sm font-bold text-emerald-400">{converted}</p>
                        </div>
                      </div>

                      {/* Dynamic computed conversion progress bar */}
                      <div className="space-y-1.5 text-left">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-slate-500 uppercase tracking-wide">Conversion Rate</span>
                          <span className="text-slate-300">{conversionRate}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                              Number(conversionRate) >= 60 
                                ? 'from-emerald-500 to-green-400' 
                                : Number(conversionRate) >= 30 
                                ? 'from-amber-500 to-amber-400' 
                                : 'from-indigo-500 to-brand-500'
                            }`}
                            style={{ width: `${Math.min(Number(conversionRate), 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {data?.pagination?.totalPages > 1 && (
              <div className="px-6 py-4.5 flex items-center justify-between border border-slate-900 rounded-xl bg-slate-950/40 text-xs text-slate-500">
                <span>
                  Showing Page <strong>{data.pagination.page}</strong> of <strong>{data.pagination.totalPages}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.min(prev + 1, data.pagination.totalPages))}
                    disabled={page === data.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Register / Update Profile Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
      >
        {formError && (
          <div className="mb-4 p-4 rounded bg-red-950/20 border border-red-900/30 text-red-400 text-xs flex items-center gap-2 text-left">
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-5">
          {!selectedDelegate ? (
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Select User Account Reference
              </label>
              <select
                value={formData.userId}
                onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                className="block w-full bg-slate-950 border border-slate-800 focus:border-brand-500/50 rounded-lg text-sm text-slate-300 py-3 px-4 focus:outline-none"
                required
              >
                <option value="">Choose active staff...</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role?.replace('_', ' ')}) — {user.email}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 font-sans">
                Only active staff accounts not currently mapped to a campus delegate can be selected.
              </p>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-lg text-left">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Linked Staff Owner</p>
              <p className="text-xs text-slate-300 font-medium mt-1">
                {selectedDelegate.user?.name} ({selectedDelegate.user?.email})
              </p>
            </div>
          )}

          <Input
            label="Campus Name"
            type="text"
            id="campus"
            placeholder="E.g., Stanford University"
            value={formData.campus}
            onChange={(e) => setFormData(prev => ({ ...prev, campus: e.target.value }))}
            required
          />

          <Input
            label="Unique Delegate Code"
            type="text"
            id="code"
            placeholder="E.g., STANFORD-DEL-01"
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
            required
          />

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createDelegateMutation.isLoading || updateDelegateMutation.isLoading}
            >
              {selectedDelegate ? 'Save Updates' : 'Provision Delegate'}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Delegates;
