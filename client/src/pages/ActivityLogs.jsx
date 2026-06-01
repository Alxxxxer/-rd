import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  History,
  Info,
  Terminal,
  Activity,
  AlertCircle,
  Clock,
  User,
  Monitor
} from 'lucide-react';
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
      return 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30';
    }
    if (action.includes('FAILED') || action.includes('BLOCKED')) {
      return 'text-red-400 bg-red-950/20 border-red-900/30';
    }
    if (action.includes('UPDATE')) {
      return 'text-brand-400 bg-brand-950/20 border-brand-900/30';
    }
    return 'text-slate-400 bg-slate-900/40 border-slate-800';
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="text-left space-y-1">
        <span className="text-xs uppercase font-bold text-brand-400 tracking-wider">
          Compliance Room
        </span>
        <h1 className="text-3xl font-extrabold text-white">
          System Activity Logs
        </h1>
        <p className="text-sm text-slate-400">
          Real-time secure audit logs tracing administrative and authentication actions.
        </p>
      </div>

      {/* Log Filter Row */}
      <Card className="p-4 border-slate-900 bg-slate-950/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
            <History size={16} className="text-brand-400" />
            <span>Operational Filters</span>
          </div>

          <div className="w-full md:w-72 space-y-1.5 text-left">
            <select
              value={actionFilter}
              onChange={handleActionFilterChange}
              className="block w-full bg-slate-900 border border-slate-800 focus:border-brand-500/50 rounded-lg text-sm text-slate-300 py-3 px-4 focus:outline-none"
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
      <Card className="p-0 border-slate-900 bg-slate-950/20 overflow-hidden relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 z-20">
            <svg className="animate-spin h-8 w-8 text-brand-500 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs text-slate-400">Restoring audit stream...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-sm">
            <AlertCircle size={36} className="text-red-500 mb-3" />
            <span>Failed to load activity logs: {error?.message || 'Server error.'}</span>
          </div>
        )}

        {!isLoading && !isError && data?.data?.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 text-slate-500 text-sm">
            <Activity size={36} className="text-slate-700 mb-3" />
            <span>No activity records available.</span>
          </div>
        )}

        {!isLoading && !isError && data?.data?.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/60">
                  <th className="px-6 py-4.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Operator
                  </th>
                  <th className="px-6 py-4.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Action Event
                  </th>
                  <th className="px-6 py-4.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Client IP Address
                  </th>
                  <th className="px-6 py-4.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Timestamp
                  </th>
                  <th className="px-6 py-4.5 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">
                    Inspector
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50">
                {data.data.map((log) => {
                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-slate-900/20 transition-colors duration-200"
                    >
                      <td className="px-6 py-4.5">
                        {log.user ? (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                              {log.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold text-slate-200">{log.user.name}</p>
                              <p className="text-[10px] text-slate-500">{log.user.email}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-950/60 border border-dashed border-slate-800 flex items-center justify-center text-xs font-bold text-slate-600">
                              ANON
                            </div>
                            <span className="text-xs text-slate-500 font-semibold italic">Anonymous</span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4.5">
                        <span className={`inline-block text-[9px] font-bold border rounded px-2 py-0.5 uppercase tracking-wider ${getActionBadgeColor(log.action)}`}>
                          {actionLabels[log.action] || log.action.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="px-6 py-4.5 text-xs font-mono text-slate-400">
                        {log.ipAddress || 'Internal Call'}
                      </td>

                      <td className="px-6 py-4.5 text-xs text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>

                      <td className="px-6 py-4.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetails(log)}
                          className="p-2 border-slate-800 hover:border-brand-500/40 text-slate-400 hover:text-white"
                        >
                          <Info size={13} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Dynamic Pagination */}
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

      {/* Structured Details Inspector Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Event Details Inspector"
      >
        {selectedLog && (
          <div className="space-y-6 text-left">
            {/* Header Cards summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-950 border border-slate-900 rounded-lg flex items-center gap-2.5">
                <Clock size={16} className="text-brand-400" />
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Date & Time</p>
                  <p className="text-xs text-slate-200 mt-0.5">{new Date(selectedLog.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
              
              <div className="p-3 bg-slate-950 border border-slate-900 rounded-lg flex items-center gap-2.5">
                <Terminal size={16} className="text-emerald-400" />
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Action Event</p>
                  <p className="text-xs text-slate-200 mt-0.5 truncate">{selectedLog.action}</p>
                </div>
              </div>
            </div>

            {selectedLog.userAgent && (
              <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-lg space-y-1">
                <div className="flex items-center gap-2 text-slate-500">
                  <Monitor size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">User Agent Metadata</span>
                </div>
                <p className="text-xs text-slate-300 break-all leading-normal font-sans">
                  {selectedLog.userAgent}
                </p>
              </div>
            )}

            {/* Structured details object JSON formatting */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Audit Raw Payload (details)
              </span>
              <pre className="bg-slate-950 border border-slate-900 p-4.5 rounded-lg text-xs text-brand-300 font-mono overflow-x-auto select-all leading-relaxed">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => setIsDetailModalOpen(false)}
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
