import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  FileText,
  User,
  Users,
  MessageSquare,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Layout from '../components/common/Layout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LeadDrawerModal from '../components/common/LeadDrawerModal';

const Leads = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // 1. FILTERS & PAGINATION STATE
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 8;

  // 2. LEAD MODAL DRAWER STATE
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Debounce search input to limit unnecessary API requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 450);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch executives list for assignment filter dropdown (visible to Admins/Managers only)
  const { data: executivesData } = useQuery({
    queryKey: ['executives'],
    queryFn: async () => {
      const response = await api.get('/users', { params: { limit: 100 } });
      return response.data;
    },
    enabled: ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'].includes(currentUser?.role)
  });

  // 3. REACT QUERY: FETCH LEADS
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['leads', debouncedSearch, statusFilter, sourceFilter, assignedFilter, page],
    queryFn: async () => {
      const response = await api.get('/leads', {
        params: {
          search: debouncedSearch || undefined,
          status: statusFilter || undefined,
          source: sourceFilter || undefined,
          assignedTo: assignedFilter || undefined,
          page,
          limit
        }
      });
      return response.data;
    },
    keepPreviousData: true
  });

  // 4. REACT QUERY: DELETE MUTATION
  const deleteLeadMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/leads/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to delete lead.');
    }
  });

  const handleDeleteLead = (id, name) => {
    if (window.confirm(`Are you absolutely sure you want to delete lead "${name}"?`)) {
      deleteLeadMutation.mutate(id);
    }
  };

  const handleOpenCreateDrawer = () => {
    setSelectedLead(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  // Status HSL colors template
  const statusStyles = {
    NEW: 'text-sky-400 bg-sky-950/20 border-sky-900/30',
    CONTACTED: 'text-purple-400 bg-purple-950/20 border-purple-900/30',
    IN_PROGRESS: 'text-amber-400 bg-amber-950/20 border-amber-900/30',
    CONVERTED: 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30',
    LOST: 'text-red-400 bg-red-950/20 border-red-900/30'
  };

  return (
    <Layout>
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left space-y-1">
          <span className="text-xs uppercase font-bold text-brand-400 tracking-wider">
            Sales Desk
          </span>
          <h1 className="text-3xl font-extrabold text-white">
            Leads Pipeline
          </h1>
          <p className="text-sm text-slate-400">
            Register prospects, trace status conversions, schedule follow-ups, and log comment streams.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreateDrawer}
          className="flex items-center gap-2 py-3 px-5 self-start md:self-auto"
        >
          <Plus size={16} />
          Register Lead
        </Button>
      </div>

      {/* Scoped Filter Block */}
      <Card className="p-4 border-slate-900 bg-slate-950/40">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search name, email, phone..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="space-y-1.5 text-left">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="block w-full bg-slate-900 border border-slate-800 focus:border-brand-500/50 rounded-lg text-sm text-slate-300 py-3 px-4 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="CONVERTED">Converted</option>
              <option value="LOST">Lost</option>
            </select>
          </div>

          <div className="space-y-1.5 text-left">
            <select
              value={sourceFilter}
              onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
              className="block w-full bg-slate-900 border border-slate-800 focus:border-brand-500/50 rounded-lg text-sm text-slate-300 py-3 px-4 focus:outline-none"
            >
              <option value="">All Sources</option>
              <option value="Manual">Manual</option>
              <option value="CSV Import">CSV Import</option>
              <option value="Google Sheets">Google Sheets</option>
            </select>
          </div>

          {/* Assignment filter visible to Admins/Managers only */}
          {['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'].includes(currentUser?.role) && (
            <div className="space-y-1.5 text-left">
              <select
                value={assignedFilter}
                onChange={(e) => { setAssignedFilter(e.target.value); setPage(1); }}
                className="block w-full bg-slate-900 border border-slate-800 focus:border-brand-500/50 rounded-lg text-sm text-slate-300 py-3 px-4 focus:outline-none"
              >
                <option value="">All Assigned Executives</option>
                {executivesData?.data?.map((exec) => (
                  <option key={exec.id} value={exec.id}>
                    {exec.name} ({exec.role?.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Grid List View Table */}
      <Card className="p-0 border-slate-900 bg-slate-950/20 overflow-hidden relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 z-20">
            <svg className="animate-spin h-8 w-8 text-brand-500 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs text-slate-400">Fetching pipeline leads...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-sm">
            <AlertCircle size={36} className="text-red-500 mb-3" />
            <span>Failed to load leads pipeline: {error?.message || 'Server connection error.'}</span>
          </div>
        )}

        {!isLoading && !isError && data?.data?.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 text-slate-500 text-sm">
            <Briefcase size={36} className="text-slate-800 mb-3" />
            <span>No leads registered matching filter specifications.</span>
          </div>
        )}

        {!isLoading && !isError && data?.data?.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/60">
                  <th className="px-6 py-4.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Lead Prospect
                  </th>
                  <th className="px-6 py-4.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Contact Details
                  </th>
                  <th className="px-6 py-4.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Assigned Executive
                  </th>
                  <th className="px-6 py-4.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </th>
                  <th className="px-6 py-4.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Follow-Up Date
                  </th>
                  <th className="px-6 py-4.5 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50">
                {data.data.map((lead) => {
                  return (
                    <tr
                      key={lead._id || lead.id}
                      className="hover:bg-slate-900/20 transition-colors duration-200"
                    >
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                            {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="text-left space-y-0.5">
                            <p className="text-sm font-bold text-slate-200">{lead.name}</p>
                            <p className="text-[10px] text-slate-500 font-sans">
                              Source: <strong>{lead.source}</strong>
                              {lead.delegate && (
                                <>
                                  {' '}• Campus: <span className="px-1 py-0.5 rounded bg-brand-950 text-brand-400 font-mono text-[9px] border border-brand-500/20">{lead.delegate.code}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4.5">
                        <div className="text-left space-y-0.5 text-xs">
                          <p className="text-slate-300">{lead.email || 'No email registered'}</p>
                          <p className="text-slate-500 font-mono">{lead.phone || 'No phone registered'}</p>
                        </div>
                      </td>

                      <td className="px-6 py-4.5">
                        {lead.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-brand-950 border border-brand-500/20 flex items-center justify-center text-[9px] font-bold text-brand-400">
                              {lead.assignedTo.name[0].toUpperCase()}
                            </div>
                            <span className="text-xs text-slate-300 font-medium">
                              {lead.assignedTo.name}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-block text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-500 px-2 py-0.5 rounded">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4.5">
                        <span className={`inline-block text-[9px] font-bold border rounded px-2.5 py-1 uppercase tracking-wider ${statusStyles[lead.status]}`}>
                          {lead.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-6 py-4.5 text-xs text-slate-400">
                        {lead.followUpDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-brand-400" />
                            <span>{new Date(lead.followUpDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">No follow-up scheduled</span>
                        )}
                      </td>

                      <td className="px-6 py-4.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Note icon displaying total comments count */}
                          {lead.notes?.length > 0 && (
                            <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 mr-1">
                              <MessageSquare size={12} />
                              {lead.notes.length}
                            </span>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditDrawer(lead)}
                            className="p-2 border-slate-800 hover:border-brand-500/40 text-slate-400 hover:text-white"
                          >
                            <Edit2 size={13} />
                          </Button>

                          {/* Deletion locked for non-admins */}
                          {['SUPER_ADMIN', 'ADMIN'].includes(currentUser?.role) && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteLead(lead._id || lead.id, lead.name)}
                              className="p-2 border-transparent bg-red-950/20 text-red-400 hover:bg-red-950/40"
                            >
                              <Trash2 size={13} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginated Footer */}
        {!isLoading && !isError && data?.pagination?.totalPages > 1 && (
          <div className="px-6 py-4.5 flex items-center justify-between border-t border-slate-900 bg-slate-950/40 text-xs text-slate-500">
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
      </Card>

      {/* Sliding Lead Properties Drawer modal */}
      {isDrawerOpen && (
        <LeadDrawerModal
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          lead={selectedLead}
        />
      )}
    </Layout>
  );
};

export default Leads;
