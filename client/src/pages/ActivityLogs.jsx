import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Info, Terminal, Activity, AlertCircle, Clock, Monitor } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/common/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const ActivityLogs = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const limit = 12;

  // Selected log object for detail inspection Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 1. FETCH AUDIT LOGS WITH REACT QUERY
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['activity-logs', actionFilter, page],
    queryFn: async () => {
      const response = await api.get('/users/activity-logs', {
        params: {
          action: actionFilter || undefined,
          page,
          limit
        }
      });
      return response.data;
    },
    keepPreviousData: true
  });

  const handleActionFilterChange = (e) => {
    setActionFilter(e.target.value);
    setPage(1); // Reset to page 1
  };

  const handleOpenDetails = (log) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  // Human readable translations for audit event codes
  const actionLabels = {
    AUTH_LOGIN_SUCCESS: 'Sign In Successful',
    AUTH_LOGIN_FAILED: 'Sign In Failed',
    AUTH_LOGIN_BLOCKED: 'Login Blocked (Deactivated)',
    AUTH_LOGOUT: 'Sign Out Successful',
    AUTH_FORGOT_PASSWORD_REQUEST: 'Forgot Password Requested',
    AUTH_RESET_PASSWORD_SUCCESS: 'Password Reset Completed',
    USER_CREATE: 'New Account Created',
    USER_UPDATE: 'Account Details Modified'
  };

  const getActionBadgeColor = (action) => {
    if (action.includes('SUCCESS') || action.includes('CREATE')) {
      return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/30';
    }
    if (action.includes('FAILED') || action.includes('BLOCKED')) {
      return 'text-red-650 bg-red-50 border-red-200 dark:text-red-450 dark:bg-red-950/20 dark:border-red-900/30';
    }
    if (action.includes('UPDATE')) {
      return 'text-brand-600 bg-brand-50 border-brand-200 dark:text-brand-400 dark:bg-brand-950/20 dark:border-brand-900/30';
    }
    return 'text-zinc-650 bg-zinc-100 border-zinc-200 dark:text-zinc-400 dark:bg-zinc-850 dark:border-zinc-800';
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="text-left space-y-0.5">
        <span className="text-xs uppercase font-bold text-brand-500 tracking-wider">
          Compliance Room
        </span>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white leading-tight">
          System Activity Logs
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Real-time secure audit logs tracing administrative and authentication actions.
        </p>
      </div>

      {/* Log Filter Row */}
      <Card className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 text-sm font-bold uppercase tracking-wider">
            <History size={14} className="text-brand-500" />
            <span>Operational Filters</span>
          </div>

          <div className="text-left w-full sm:w-64">
            <select
              value={actionFilter}
              onChange={handleActionFilterChange}
              className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-700 dark:text-zinc-300 py-3 px-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            >
              <option value="">All Actions</option>
              <option value="AUTH_LOGIN_SUCCESS">Sign In Successful</option>
              <option value="AUTH_LOGIN_FAILED">Sign In Failed</option>
              <option value="USER_CREATE">New Account Created</option>
              <option value="USER_UPDATE">Account Details Modified</option>
              <option value="AUTH_FORGOT_PASSWORD_REQUEST">Forgot Password Requested</option>
              <option value="AUTH_RESET_PASSWORD_SUCCESS">Password Reset Completed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Log Table Container */}
      <Card className="p-0 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 overflow-hidden relative min-h-[300px] shadow-sm">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-zinc-950/60 z-20 transition-colors duration-150">
            <svg className="animate-spin h-7 w-7 text-brand-500 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm text-zinc-550 dark:text-zinc-400">Restoring audit stream...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center p-12 text-zinc-550 dark:text-zinc-400 text-sm">
            <AlertCircle size={32} className="text-red-500 mb-2" />
            <span>Failed to load activity logs: {error?.message || 'Server error.'}</span>
          </div>
        )}

        {!isLoading && !isError && data?.data?.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 text-zinc-550 dark:text-zinc-400 text-sm">
            <Activity size={32} className="text-zinc-300 dark:text-zinc-700 mb-2" />
            <span>No activity records available.</span>
          </div>
        )}

        {!isLoading && !isError && data?.data?.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60">
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Operator
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Action Event
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Client IP Address
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Timestamp
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-right">
                    Inspector
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                {data.data.map((log) => {
                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/15 transition-colors duration-150"
                    >
                      <td className="px-5 py-3.5">
                        {log.user ? (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-650 dark:text-zinc-300">
                              {log.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <div className="text-left space-y-0.5">
                              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200 leading-none">{log.user.name}</p>
                              <p className="text-xs text-zinc-450 dark:text-zinc-550">{log.user.email}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-850 border border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 dark:text-zinc-600">
                              ANON
                            </div>
                            <span className="text-sm text-zinc-450 dark:text-zinc-500 font-semibold italic leading-none">Anonymous</span>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`inline-block text-xs font-bold border rounded px-2 py-0.5 uppercase tracking-wider ${getActionBadgeColor(log.action)}`}>
                          {actionLabels[log.action] || log.action.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-sm font-mono text-zinc-550 dark:text-zinc-450">
                        {log.ipAddress || 'Internal Call'}
                      </td>

                      <td className="px-5 py-3.5 text-sm text-zinc-550 dark:text-zinc-450">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetails(log)}
                          className="p-1.5 border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                        >
                          <Info size={12} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isError && data?.pagination?.totalPages > 1 && (
          <div className="px-5 py-3.5 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-sm text-zinc-500 dark:text-zinc-400 shadow-sm">
            <span>
              Showing Page <strong>{data.pagination.page}</strong> of <strong>{data.pagination.totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="py-1 px-3 text-sm"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.min(prev + 1, data.pagination.totalPages))}
                disabled={page === data.pagination.totalPages}
                className="py-1 px-3 text-sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Structured Details Inspector Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Event Details Inspector"
      >
        {selectedLog && (
          <div className="space-y-4 text-left">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded flex items-center gap-2">
                <Clock size={14} className="text-brand-500 animate-pulse" />
                <div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Date & Time</p>
                  <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-0.5">{new Date(selectedLog.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
              
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded flex items-center gap-2">
                <Terminal size={14} className="text-emerald-500" />
                <div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Action Event</p>
                  <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-0.5 truncate">{selectedLog.action}</p>
                </div>
              </div>
            </div>

            {selectedLog.userAgent && (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-550">
                  <Monitor size={12} />
                  <span className="text-xs font-bold uppercase tracking-wider">User Agent Metadata</span>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-350 break-all leading-normal font-sans">
                  {selectedLog.userAgent}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <span className="block text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">
                Audit Raw Payload
              </span>
              <pre className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-4 rounded text-sm text-brand-650 dark:text-brand-400 font-mono overflow-x-auto select-all leading-relaxed max-h-48 scrollbar">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-850">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
                className="py-1.5 px-3.5 text-sm font-semibold"
              >
                Close Inspector
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default ActivityLogs;
