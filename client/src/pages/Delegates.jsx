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
  Database,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Layout from '../components/common/Layout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import DelegateDrawerModal from '../components/common/DelegateDrawerModal';

const Delegates = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // 1. FILTERS & PAGINATION STATE
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 2000; // Large limit to enable scrolling/filtering on page without pagination clicks

  // 2. MODAL / DRAWER STATE
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDelegate, setSelectedDelegate] = useState(null);

  // 3. GOOGLE SHEETS IMPORT STATE
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);

  // Debounce search input
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

  // REACT QUERY: FETCH DELEGATES
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['delegates', debouncedSearch, statusFilter, assignedFilter, page],
    queryFn: async () => {
      const response = await api.get('/delegates', {
        params: {
          search: debouncedSearch || undefined,
          status: statusFilter || undefined,
          assignedTo: assignedFilter || undefined,
          page,
          limit
        }
      });
      return response.data;
    },
    keepPreviousData: true
  });

  const handleOpenCreateDrawer = () => {
    setSelectedDelegate(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (delegate) => {
    setSelectedDelegate(delegate);
    setIsDrawerOpen(true);
  };

  // Status badge styling
  const statusStyles = {
    PENDING: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-450 dark:bg-amber-950/20 dark:border-amber-900/30',
    AGREED: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/30',
    DECLINED: 'text-red-650 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/20 dark:border-red-900/30'
  };

  const delegatesList = data?.data || [];
  
  // Aggregate stats from the matching list
  const totalLeads = delegatesList.length;
  const agreedCount = delegatesList.filter(d => d.status === 'AGREED').length;
  const pendingCount = delegatesList.filter(d => d.status === 'PENDING').length;
  const declinedCount = delegatesList.filter(d => d.status === 'DECLINED').length;

  return (
    <Layout>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left space-y-0.5">
          <span className="text-xs uppercase font-bold text-brand-500 tracking-wider">
            Liaison desk
          </span>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white leading-tight">
            Campus Delegates Pipeline
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Import prospective delegates from spreadsheets, call and log outcomes, and assign unique codes.
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
            Register Delegate Lead
          </Button>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm flex items-center gap-4 text-left">
          <div className="p-3 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-650 dark:text-zinc-300">
            <Building size={20} />
          </div>
          <div>
            <p className="text-zinc-450 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Total Leads</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight mt-0.5">{totalLeads}</h3>
          </div>
        </Card>

        <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm flex items-center gap-4 text-left">
          <div className="p-3 rounded-md bg-amber-500/10 text-amber-500">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-amber-500/80 text-[10px] font-bold uppercase tracking-wider">Pending (To Call)</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 leading-tight mt-0.5">{pendingCount}</h3>
          </div>
        </Card>

        <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm flex items-center gap-4 text-left">
          <div className="p-3 rounded-md bg-emerald-500/10 text-emerald-550 dark:text-emerald-400">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-emerald-550 dark:text-emerald-400/80 text-[10px] font-bold uppercase tracking-wider">Agreed Delegates</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5">{agreedCount}</h3>
          </div>
        </Card>

        <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm flex items-center gap-4 text-left">
          <div className="p-3 rounded-md bg-red-500/10 text-red-500">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-red-500/80 text-[10px] font-bold uppercase tracking-wider">Declined</p>
            <h3 className="text-2xl font-bold text-red-650 dark:text-red-400 leading-tight mt-0.5">{declinedCount}</h3>
          </div>
        </Card>
      </div>

      {/* Scoped Filter Block */}
      <Card className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search name, college, email..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm"
          />

          <div className="text-left">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-700 dark:text-zinc-300 py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            >
              <option value="">Liaison Status (All)</option>
              <option value="PENDING">Pending (New)</option>
              <option value="AGREED">Agreed (Yes)</option>
              <option value="DECLINED">Declined (No)</option>
            </select>
          </div>

          {['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'].includes(currentUser?.role) && (
            <div className="text-left">
              <select
                value={assignedFilter}
                onChange={(e) => setAssignedFilter(e.target.value)}
                className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-700 dark:text-zinc-300 py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
              >
                <option value="">Assigned Owner (All)</option>
                {executivesData?.data?.map((exec) => (
                  <option key={exec.id || exec._id} value={exec.id || exec._id}>
                    {exec.name} ({exec.role?.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Main Results Table */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-x-auto min-h-[380px] max-h-[500px]">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/70 border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 select-none">
              <tr>
                <th className="px-6 py-4">Student Info</th>
                <th className="px-6 py-4">College / Campus</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Referrals (Cnv/Asg)</th>
                <th className="px-6 py-4">Assigned Owner</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
              {isLoading && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-zinc-450 dark:text-zinc-500 select-none">
                    <svg className="animate-spin h-6 w-6 text-brand-500 mx-auto mb-2.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Fetching delegates logs database...</span>
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-red-500 font-medium select-none">
                    <AlertCircle size={24} className="mx-auto mb-2 text-red-400" />
                    <span>Error loading campus delegates: {error?.message || 'Database server error.'}</span>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && totalLeads === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-zinc-450 dark:text-zinc-500 select-none">
                    <GraduationCap size={32} className="mx-auto mb-2.5 text-zinc-300 dark:text-zinc-700" />
                    <p className="font-semibold text-sm">No campus delegates found</p>
                    <p className="text-xs text-zinc-400 mt-1">Try resetting filters or import new delegate leads from Google Sheets.</p>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && delegatesList.map((d) => (
                <tr
                  key={d._id || d.id}
                  onDoubleClick={() => handleOpenEditDrawer(d)}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4.5">
                    <div className="font-semibold text-zinc-900 dark:text-white group-hover:text-brand-500 transition-colors">
                      {d.name}
                    </div>
                    {d.department && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-450 mt-0.5">{d.department}</div>
                    )}
                  </td>
                  <td className="px-6 py-4.5">
                    <div className="text-zinc-700 dark:text-zinc-350">{d.campus}</div>
                  </td>
                  <td className="px-6 py-4.5 space-y-1">
                    {d.phone && (
                      <div className="text-xs text-zinc-650 dark:text-zinc-350 flex items-center gap-1.5">
                        <Phone size={11} className="text-zinc-400" />
                        <span>{d.phone} {d.whatsapp && d.whatsapp !== d.phone && `(WA: ${d.whatsapp})`}</span>
                      </div>
                    )}
                    {d.email && (
                      <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                        <Mail size={11} className="text-zinc-400" />
                        <span>{d.email}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusStyles[d.status] || ''}`}>
                      {d.status === 'AGREED' ? 'Agreed (Yes)' : d.status === 'DECLINED' ? 'Declined (No)' : 'Pending (New)'}
                    </span>
                    {d.code && (
                      <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 mt-1 font-mono uppercase">
                        Code: {d.code}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4.5 font-mono text-xs">
                    <div className="text-zinc-750 dark:text-zinc-250">
                      <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{d.convertedLeadsCount || 0}</strong>
                      <span className="text-zinc-400"> / </span>
                      <span>{d.assignedLeadsCount || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4.5">
                    <div className="text-xs text-zinc-700 dark:text-zinc-350">
                      {d.assignedTo?.name || <span className="text-zinc-400 italic">Unassigned</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4.5 text-right">
                    <button
                      onClick={() => handleOpenEditDrawer(d)}
                      className="p-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-brand-500 dark:hover:text-brand-400 transition-colors inline-flex items-center"
                      title="Inspect / Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Scrollable Status Footer */}
        {!isLoading && !isError && delegatesList.length > 0 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <span>
              Showing {delegatesList.length} matching delegate prospects. Double click any row to inspect details.
            </span>
            <span>
              Total: <strong className="font-semibold text-zinc-900 dark:text-white">{delegatesList.length}</strong>
            </span>
          </div>
        )}
      </Card>

      {/* Delegate Properties Modal Drawer */}
      {isDrawerOpen && (
        <DelegateDrawerModal
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          delegate={selectedDelegate}
        />
      )}

      {/* Google Sheets Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Campus Delegate Leads from Google Sheets"
        className="max-w-xl"
      >
        <div className="space-y-5 text-left text-zinc-700 dark:text-zinc-300">
          {!importResult ? (
            <>
              <div className="p-4 rounded bg-brand-500/5 border border-brand-500/20 text-xs space-y-2">
                <p className="font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">How to import:</p>
                <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                  <li>Open your Google Sheet containing delegate contacts.</li>
                  <li>Click <strong>Share</strong> in the top-right corner.</li>
                  <li>Under <strong>General access</strong>, change settings to <strong>"Anyone with the link can view"</strong> (Viewer).</li>
                  <li>Copy the spreadsheet sharing link and paste it below.</li>
                </ol>
              </div>

              <div className="p-4 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs space-y-2">
                <p className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Required & Optional Columns (Auto-Mapped):</p>
                <p className="leading-relaxed">
                  The sheet must include columns for <strong>"Name"</strong> (Delegate Name) and <strong>"College"</strong> (or Campus/School). Optional columns: <strong>"Email"</strong>, <strong>"Phone"</strong>, <strong>"WhatsApp"</strong> (or Alternate Phone), and <strong>"Department"</strong> (or Branch/Course/Year).
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
                <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs text-red-650 dark:text-red-400">
                  {importError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={isImporting}
                  className="px-4 py-2 text-sm font-semibold uppercase tracking-wider"
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
                      const response = await api.post('/delegates/import-sheets', { sheetUrl });
                      setImportResult(response.data.data);
                      queryClient.invalidateQueries(['delegates']);
                    } catch (err) {
                      setImportError(err.response?.data?.message || 'Failed to import Google Sheet. Please check the URL and sharing settings.');
                    } finally {
                      setIsImporting(false);
                    }
                  }}
                  isLoading={isImporting}
                  disabled={!sheetUrl.trim() || isImporting}
                  className="px-4 py-2 text-sm font-semibold uppercase tracking-wider"
                >
                  Import Leads
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4 py-3 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <CheckCircle size={24} />
              </div>
              <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Import Completed Successfully</h4>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded max-w-sm mx-auto text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Imported Leads:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{importResult.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Skipped Duplicates:</span>
                  <span className="font-bold text-zinc-400">{importResult.skipped}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-center">
                <Button
                  variant="primary"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-6 py-2 text-sm font-semibold uppercase tracking-wider"
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

export default Delegates;
