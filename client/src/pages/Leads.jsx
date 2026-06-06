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
  MessageSquare,
  Database,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Layout from '../components/common/Layout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import LeadDrawerModal from '../components/common/LeadDrawerModal';
import Modal from '../components/ui/Modal';

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
  const limit = 2000;

  // 2. LEAD MODAL DRAWER STATE
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // 3. GOOGLE SHEETS IMPORT STATE
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);

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

  // Status Colors template
  const statusStyles = {
    NEW: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-900/30',
    CONTACTED: 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/20 dark:border-purple-900/30',
    IN_PROGRESS: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-900/30',
    CONVERTED: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/30',
    LOST: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/20 dark:border-red-900/30'
  };

  return (
    <Layout>
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left space-y-0.5">
          <span className="text-xs uppercase font-bold text-brand-500 tracking-wider">
            Sales Desk
          </span>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white leading-tight">
            Leads Pipeline
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Register prospects, trace status conversions, schedule follow-ups, and log comments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <Button
            variant="outline"
            onClick={() => {
              setSheetUrl('');
              setImportResult(null);
              setImportError(null);
              setIsImportModalOpen(true);
            }}
            className="flex items-center gap-1.5 py-2.5 px-4 font-semibold text-sm uppercase tracking-wider border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <Database size={14} className="text-zinc-500 dark:text-zinc-400" />
            Import Google Sheet
          </Button>

          <Button
            variant="primary"
            onClick={handleOpenCreateDrawer}
            className="flex items-center gap-1.5 py-2.5 px-4 font-semibold text-sm uppercase tracking-wider"
          >
            <Plus size={14} />
            Register Lead
          </Button>
        </div>
      </div>

      {/* Scoped Filter Block */}
      <Card className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search name, email, phone..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm"
          />

          <div className="text-left">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-700 dark:text-zinc-300 py-3 px-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="CONVERTED">Converted</option>
              <option value="LOST">Lost</option>
            </select>
          </div>

          <div className="text-left">
            <select
              value={sourceFilter}
              onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
              className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-700 dark:text-zinc-300 py-3 px-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            >
              <option value="">All Sources</option>
              <option value="Manual">Manual</option>
              <option value="CSV Import">CSV Import</option>
              <option value="Google Sheets">Google Sheets</option>
            </select>
          </div>

          {/* Assignment filter visible to Admins/Managers only */}
          {['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'].includes(currentUser?.role) ? (
            <div className="text-left">
              <select
                value={assignedFilter}
                onChange={(e) => { setAssignedFilter(e.target.value); setPage(1); }}
                className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-700 dark:text-zinc-300 py-3 px-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
              >
                <option value="">All Assigned Executives</option>
                {executivesData?.data?.map((exec) => {
                  const execId = exec.id || exec._id;
                  return (
                    <option key={execId} value={execId}>
                      {exec.name} ({exec.role?.replace('_', ' ')})
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <div className="hidden md:block" />
          )}
        </div>
      </Card>

      {/* Grid List View Table */}
      <Card className="p-0 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 overflow-hidden relative min-h-[300px] shadow-sm">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-zinc-950/60 z-20 transition-colors duration-150">
            <svg className="animate-spin h-7 w-7 text-brand-500 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Fetching pipeline leads...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center p-12 text-zinc-500 dark:text-zinc-400 text-xs">
            <AlertCircle size={32} className="text-red-500 mb-3" />
            <span>Failed to load leads pipeline: {error?.message || 'Server connection error.'}</span>
          </div>
        )}

        {!isLoading && !isError && data?.data?.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 text-zinc-500 dark:text-zinc-400 text-xs">
            <Briefcase size={32} className="text-zinc-300 dark:text-zinc-700 mb-3" />
            <span>No leads registered matching filter specifications.</span>
          </div>
        )}

        {!isLoading && !isError && data?.data?.length > 0 && (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-white dark:bg-zinc-900 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Lead Prospect
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Contact Details
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Assigned Executive
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Deal Amount
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Follow-Up Date
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                {data.data.map((lead) => {
                  return (
                    <tr
                      key={lead._id || lead.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/15 transition-colors duration-150"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-650 dark:text-zinc-300">
                            {lead.name ? lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'L'}
                          </div>
                          <div className="text-left space-y-0.5">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">{lead.name || 'Unknown Name'}</p>
                            {lead.college && (
                              <p className="text-xs text-zinc-550 dark:text-zinc-400 font-semibold leading-tight mt-0.5">
                                {lead.college}
                              </p>
                            )}
                            <p className="text-xs text-zinc-450 dark:text-zinc-550 mt-1">
                              Source: <strong className="font-semibold">{lead.source}</strong>
                              {lead.delegate && (
                                <>
                                  {' '}• Campus: <span className="px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 font-mono text-[11px] border border-brand-500/20">{lead.delegate.code}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-left space-y-0.5 text-xs">
                          <p className="text-zinc-700 dark:text-zinc-300 font-medium">{lead.email || 'No email registered'}</p>
                          <p className="text-zinc-450 dark:text-zinc-500 font-mono mt-0.5">{lead.phone || 'No phone registered'}</p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {lead.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-brand-500/10 text-brand-500 flex items-center justify-center text-xs font-bold">
                              {lead.assignedTo.name[0].toUpperCase()}
                            </div>
                            <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                              {lead.assignedTo.name}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-block text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-450 dark:text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-750">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-block text-xs font-bold border rounded px-2.5 py-0.5 uppercase tracking-wider ${statusStyles[lead.status]}`}>
                          {lead.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                        {lead.amount ? `$${lead.amount.toLocaleString()}` : '$0'}
                        <p className="text-[10px] text-zinc-400 mt-0.5 font-sans font-normal uppercase">
                          {lead.paymentStatus || 'PENDING'}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-xs text-zinc-500 dark:text-zinc-450">
                        {lead.followUpDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-brand-500" />
                            <span>{new Date(lead.followUpDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-650 italic">No follow-up</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {lead.notes?.length > 0 && (
                            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-0.5 mr-1">
                              <MessageSquare size={13} />
                              {lead.notes.length}
                            </span>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditDrawer(lead)}
                            className="p-1.5 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                          >
                            <Edit2 size={13} />
                          </Button>

                          {/* Deletion locked for non-admins */}
                          {['SUPER_ADMIN', 'ADMIN'].includes(currentUser?.role) && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteLead(lead._id || lead.id, lead.name)}
                              className="p-1.5"
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

        {/* Scrollable Status Footer */}
        {!isLoading && !isError && data?.data && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <span>
              Showing all matching leads. Scroll to browse the full list.
            </span>
            <span>
              Total: <strong className="font-semibold text-zinc-900 dark:text-white">{data.data.length} leads</strong>
            </span>
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

      {/* Google Sheets Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Leads from Google Sheets"
        className="max-w-xl"
      >
        <div className="space-y-5 text-left text-zinc-700 dark:text-zinc-300">
          {!importResult ? (
            <>
              <div className="p-4 rounded bg-brand-500/5 border border-brand-500/20 text-xs space-y-2">
                <p className="font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">How to import:</p>
                <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                  <li>Open your Google Sheet containing leads.</li>
                  <li>Click <strong>Share</strong> in the top-right corner.</li>
                  <li>Under <strong>General access</strong>, change setting to <strong>"Anyone with the link can view"</strong> (Viewer).</li>
                  <li>Copy the spreadsheet link and paste it below.</li>
                </ol>
              </div>

              <div className="p-4 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs space-y-2">
                <p className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Supported Columns (Auto-Mapped):</p>
                <p className="leading-relaxed">
                  The sheet must include a <strong>"Name"</strong> or <strong>"Lead Name"</strong> column. Optional columns: <strong>"Email"</strong>, <strong>"Phone"</strong>, <strong>"Campus"</strong> (Campus Name or Delegate Code), <strong>"Status"</strong>, <strong>"Amount"</strong>, and <strong>"Notes"</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <Input
                  label="Google Sheet Sharing URL"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  disabled={isImporting}
                  className="text-sm"
                />
              </div>

              {importError && (
                <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs text-red-600 dark:text-red-400">
                  {importError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={isImporting}
                  className="px-4 py-2 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    if (!sheetUrl.trim()) {
                      setImportError('Please enter a Google Sheet URL.');
                      return;
                    }
                    setIsImporting(true);
                    setImportError(null);
                    try {
                      const response = await api.post('/leads/import-sheets', { sheetUrl });
                      setImportResult(response.data.data);
                      queryClient.invalidateQueries(['leads']);
                    } catch (err) {
                      setImportError(err.response?.data?.message || 'Failed to import Google Sheets. Please check the URL and sharing settings.');
                    } finally {
                      setIsImporting(false);
                    }
                  }}
                  isLoading={isImporting}
                  disabled={!sheetUrl.trim() || isImporting}
                  className="px-4 py-2 text-sm"
                >
                  Import Leads
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-5 py-2 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <Plus size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Import Successful</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Your Google Sheets data has been processed.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850">
                  <p className="text-[10px] uppercase font-bold text-zinc-450 dark:text-zinc-500 tracking-wider">Leads Imported</p>
                  <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{importResult.count}</p>
                </div>
                <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850">
                  <p className="text-[10px] uppercase font-bold text-zinc-450 dark:text-zinc-500 tracking-wider">Duplicates Skipped</p>
                  <p className="text-xl font-extrabold text-zinc-600 dark:text-zinc-400 mt-1">{importResult.skipped}</p>
                </div>
              </div>

              <div className="flex justify-center border-t border-zinc-100 dark:border-zinc-800 pt-5">
                <Button
                  variant="primary"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-6 py-2 text-sm uppercase tracking-wider font-semibold"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
};

export default Leads;
