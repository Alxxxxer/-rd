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
  TrendingUp,
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

  // Query all delegates to check for already linked user accounts across all pages
  const { data: allDelegatesData } = useQuery({
    queryKey: ['delegates', 'all-list'],
    queryFn: async () => {
      const response = await api.get('/delegates', { params: { limit: 1000 } });
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
    const uId = u.id || u._id;
    if (!uId) return false;

    // If editing, the selected user is allowed
    const selectedUserId = selectedDelegate?.user?.id || selectedDelegate?.user?._id;
    if (selectedDelegate && selectedUserId && uId === selectedUserId) {
      return true;
    }
    // Only show active sales executives/managers that aren't already linked (checking across all pages)
    const fullDelegatesList = allDelegatesData?.data || [];
    const alreadyLinked = fullDelegatesList.some(d => {
      const dUserId = d.user?.id || d.user?._id;
      return dUserId && uId && dUserId === uId;
    });
    return !alreadyLinked && u.status === 'ACTIVE';
  }) || [];

  return (
    <Layout>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left space-y-0.5">
          <span className="text-xs uppercase font-bold text-brand-500 tracking-wider">
            Campus Network
          </span>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white leading-tight">
            Campus Delegates
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Provision delegate profiles, view assigned leads distribution, and track conversion rates.
          </p>
        </div>

        {isAuthorized && (
          <Button
            variant="primary"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 py-2.5 px-4 self-start md:self-auto font-semibold text-sm uppercase tracking-wider"
          >
            <Plus size={14} />
            Register Delegate
          </Button>
        )}
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-zinc-450 dark:text-zinc-550 text-xs font-bold uppercase tracking-wider">
                Total Delegates
              </h3>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{totalDelegates}</p>
            </div>
            <div className="p-2 bg-brand-500/10 text-brand-500 rounded">
              <GraduationCap size={18} />
            </div>
          </div>
          <p className="text-xs text-zinc-450 dark:text-zinc-550 mt-3.5 font-medium">Linked campus network accounts</p>
        </Card>

        <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-zinc-450 dark:text-zinc-550 text-xs font-bold uppercase tracking-wider">
                Assigned Leads
              </h3>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{totalAssigned}</p>
            </div>
            <div className="p-2 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded">
              <Target size={18} />
            </div>
          </div>
          <p className="text-xs text-zinc-450 dark:text-zinc-550 mt-3.5 font-medium">Pipeline leads assigned to delegates</p>
        </Card>

        <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-zinc-450 dark:text-zinc-550 text-xs font-bold uppercase tracking-wider">
                Converted Leads
              </h3>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{totalConverted}</p>
            </div>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded">
              <CheckCircle size={18} />
            </div>
          </div>
          <p className="text-xs text-zinc-450 dark:text-zinc-550 mt-3.5 font-medium">Successful sales conversions</p>
        </Card>

        <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-zinc-450 dark:text-zinc-550 text-xs font-bold uppercase tracking-wider">
                Avg. Conversion
              </h3>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{overallConvRate}%</p>
            </div>
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-xs text-zinc-450 dark:text-zinc-550 mt-3.5 font-medium">Calculated from total leads</p>
        </Card>
      </div>

      {/* Filter Options Bar */}
      <Card className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            placeholder="Search campus name or unique code..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="hidden sm:flex justify-end items-center text-xs text-zinc-400 dark:text-zinc-500 gap-1.5 font-sans">
            <Award size={13} className="text-amber-500" />
            <span>Leaderboards can be viewed in the sidebar menu.</span>
          </div>
        </div>
      </Card>

      {/* Grid of Delegate Cards */}
      <div className="relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-zinc-950/60 z-20 transition-colors duration-150">
            <svg className="animate-spin h-7 w-7 text-brand-500 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Loading campus delegates network...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center p-12 text-zinc-500 dark:text-zinc-400 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
            <AlertCircle size={32} className="text-red-500 mb-2" />
            <span>Failed to load delegates: {error?.message || 'Server connection error.'}</span>
          </div>
        )}

        {!isLoading && !isError && delegatesList.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 text-zinc-500 dark:text-zinc-400 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
            <GraduationCap size={32} className="text-zinc-300 dark:text-zinc-700 mb-2" />
            <span>No campus delegate profiles registered yet.</span>
          </div>
        )}

        {!isLoading && !isError && delegatesList.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              {delegatesList.map((delegate) => {
                const assigned = delegate.assignedLeadsCount || 0;
                const converted = delegate.convertedLeadsCount || 0;
                const conversionRate = assigned > 0 ? ((converted / assigned) * 100).toFixed(0) : '0';

                return (
                  <Card
                    key={delegate._id || delegate.id}
                    className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 relative flex flex-col justify-between group transition-all duration-150 shadow-sm"
                  >
                    <div>
                      {/* Top Row: Initials avatar, and update */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-650 dark:text-zinc-300">
                            {delegate.user?.name ? delegate.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CD'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 truncate leading-none">
                              {delegate.user?.name || 'Unknown User'}
                            </h4>
                            <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-0.5 truncate">{delegate.user?.email || 'No email associated'}</p>
                          </div>
                        </div>

                        {isAuthorized && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(delegate)}
                            className="p-1 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 bg-transparent rounded"
                          >
                            <Edit2 size={13} />
                          </Button>
                        )}
                      </div>

                      {/* Campus name / Code container */}
                      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 rounded-md space-y-2 mb-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Building size={14} className="text-zinc-400" />
                          <span className="text-zinc-700 dark:text-zinc-300 font-semibold truncate flex-1 leading-none">
                            {delegate.campus}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold uppercase">
                          <span className="text-zinc-450 dark:text-zinc-500">Campus Code</span>
                          <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 font-mono tracking-wider">
                            {delegate.code}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Conversion Stats Indicators */}
                    <div className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850">
                          <p className="text-xs text-zinc-450 dark:text-zinc-500 uppercase tracking-wide font-bold">Assigned</p>
                          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{assigned}</p>
                        </div>
                        <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850">
                          <p className="text-xs text-zinc-450 dark:text-zinc-500 uppercase tracking-wide font-bold">Converted</p>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{converted}</p>
                        </div>
                      </div>

                      {/* Conversion progress bar */}
                      <div className="space-y-1.5 text-left">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-zinc-450 dark:text-zinc-500 uppercase tracking-wide">Conversion Rate</span>
                          <span className="text-zinc-700 dark:text-zinc-300">{conversionRate}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-855 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300 bg-brand-500"
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
              <div className="px-5 py-3.5 flex items-center justify-between border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30 text-xs text-zinc-500 dark:text-zinc-400 shadow-sm">
                <span>
                  Showing Page <strong>{data.pagination.page}</strong> of <strong>{data.pagination.totalPages}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="py-1 px-3 text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.min(prev + 1, data.pagination.totalPages))}
                    disabled={page === data.pagination.totalPages}
                    className="py-1 px-3 text-xs"
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
          <div className="mb-4 p-3 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-650 dark:text-red-400 text-xs flex items-center gap-2 text-left">
            <AlertCircle size={14} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {!selectedDelegate ? (
            <div className="space-y-1 text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-550 dark:text-zinc-400">
                Select User Account Reference
              </label>
              <select
                value={formData.userId}
                onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-700 dark:text-zinc-300 py-3 px-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                required
              >
                <option value="">Choose active staff...</option>
                {availableUsers.map((user) => {
                  const uId = user.id || user._id;
                  return (
                    <option key={uId} value={uId}>
                      {user.name} ({user.role?.replace('_', ' ')}) — {user.email}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-zinc-400 dark:text-zinc-550 font-sans">
                Only active staff accounts not currently mapped to a campus delegate can be selected.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-md text-left">
              <p className="text-xs text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-wider">Linked Staff Owner</p>
              <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium mt-1">
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

          <div className="flex gap-2.5 justify-end pt-3.5 border-t border-zinc-100 dark:border-zinc-850">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="py-2 px-3.5 text-sm font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="py-2 px-3.5 text-sm font-semibold uppercase tracking-wider"
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
