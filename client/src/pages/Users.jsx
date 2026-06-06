import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, Edit2, UserX, UserCheck, Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Layout from '../components/common/Layout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const Users = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // 1. STATE FOR SEARCH, FILTERS, AND PAGINATION
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 8;

  // 2. MODAL STATES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Create New Account');
  const [selectedUser, setSelectedUser] = useState(null); // Holds user object if editing
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'SALES_EXECUTIVE' });
  const [formError, setFormError] = useState(null);

  // Debounce search input to limit API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new searches
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  // Reset page when filters change
  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  // 3. REACT QUERY: FETCH USERS
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['users', debouncedSearch, roleFilter, statusFilter, page],
    queryFn: async () => {
      const response = await api.get('/users', {
        params: {
          search: debouncedSearch || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
          page,
          limit
        }
      });
      return response.data;
    },
    keepPreviousData: true
  });

  // 4. REACT QUERY: MUTATION FOR CREATION
  const createUserMutation = useMutation({
    mutationFn: async (newUser) => {
      const response = await api.post('/users', newUser);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create user account.');
    }
  });

  // 5. REACT QUERY: MUTATION FOR UPDATES (ROLE & STATUS)
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updatePayload }) => {
      const response = await api.patch(`/users/${id}`, updatePayload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to update user account.');
    }
  });

  // Helper to reset form variables
  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'SALES_EXECUTIVE' });
    setSelectedUser(null);
    setFormError(null);
  };

  // Open modal for creation
  const handleOpenCreateModal = () => {
    resetForm();
    setModalTitle('Create New Account');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '' // Initialize password input as blank
    });
    setModalTitle(`Edit Profile: ${user.name}`);
    setIsModalOpen(true);
  };

  // Handle Form Submission (Create or Edit)
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError(null);

    if (selectedUser) {
      // Execute Edit Mutation
      const updatePayload = {
        name: formData.name,
        role: formData.role
      };
      if (formData.password) {
        updatePayload.password = formData.password;
      }
      updateUserMutation.mutate({
        id: selectedUser.id || selectedUser._id,
        updatePayload
      });
    } else {
      // Execute Create Mutation
      if (!formData.password) {
        setFormError('Password is required for new accounts.');
        return;
      }
      createUserMutation.mutate(formData);
    }
  };

  // Toggle user status between ACTIVE and DEACTIVATED
  const handleToggleStatus = (userToToggle) => {
    const nextStatus = userToToggle.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
    
    updateUserMutation.mutate({
      id: userToToggle.id || userToToggle._id,
      updatePayload: { status: nextStatus }
    });
  };

  // Determine allowed roles for assigning depending on active Admin's access hierarchy
  const getAllowedRoles = () => {
    const roles = [];
    if (currentUser?.role === 'SUPER_ADMIN') {
      roles.push('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE');
    } else {
      roles.push('SALES_MANAGER', 'SALES_EXECUTIVE');
    }
    // Ensure the current user's role is always selectable to avoid demoting during editing
    if (selectedUser?.role && !roles.includes(selectedUser.role)) {
      roles.push(selectedUser.role);
    }
    return roles;
  };

  return (
    <Layout>
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left space-y-0.5">
          <span className="text-xs uppercase font-bold text-brand-500 tracking-wider">
            Console Center
          </span>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white leading-tight">
            User Accounts
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Provision, manage roles, and control access permissions.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 py-2.5 px-4 self-start md:self-auto font-semibold text-sm uppercase tracking-wider"
        >
          <UserPlus size={14} />
          Create Account
        </Button>
      </div>

      {/* Filter Options Bar */}
      <Card className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            placeholder="Search accounts name or email..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="text-left">
            <select
              value={roleFilter}
              onChange={handleRoleFilterChange}
              className="block w-full bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-700 dark:text-zinc-300 py-3 px-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            >
              <option value="">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="SALES_MANAGER">Sales Manager</option>
              <option value="SALES_EXECUTIVE">Sales Executive</option>
            </select>
          </div>

          <div className="text-left">
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="block w-full bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-700 dark:text-zinc-300 py-3 px-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DEACTIVATED">Deactivated</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Data Table Grid container */}
      <Card className="p-0 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 overflow-hidden relative min-h-[300px] shadow-sm">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-zinc-950/60 z-20 transition-colors duration-150">
            <svg className="animate-spin h-7 w-7 text-brand-500 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Fetching records...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center p-12 text-zinc-550 dark:text-zinc-400 text-xs">
            <AlertCircle size={32} className="text-red-500 mb-3" />
            <span>Failed to load accounts: {error?.message || 'Server error.'}</span>
          </div>
        )}

        {!isLoading && !isError && data?.data?.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 text-zinc-550 dark:text-zinc-400 text-xs">
            <Activity size={32} className="text-zinc-300 dark:text-zinc-700 mb-3" />
            <span>No user accounts found matching selected filters.</span>
          </div>
        )}

        {!isLoading && !isError && data?.data?.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60">
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Account Profile
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Assigned Role
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Account Status
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Last Session
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                {data.data.map((user) => {
                  const isSelf = (currentUser?.id || currentUser?._id) === (user.id || user._id);

                  // Render roles distinct styles
                  const roleStyles = {
                    SUPER_ADMIN: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/20 dark:border-red-900/30',
                    ADMIN: 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/20 dark:border-purple-900/30',
                    SALES_MANAGER: 'text-brand-650 bg-brand-50 border-brand-200 dark:text-brand-400 dark:bg-brand-950/20 dark:border-brand-900/30',
                    SALES_EXECUTIVE: 'text-zinc-650 bg-zinc-100 border-zinc-200 dark:text-zinc-400 dark:bg-zinc-850 dark:border-zinc-800'
                  };

                  return (
                    <tr
                      key={user.id || user._id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/15 transition-colors duration-150"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3.5">
                          {/* initials avatar */}
                          <div className="w-10 h-10 rounded bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-650 dark:text-zinc-300">
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="text-left space-y-0.5">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 leading-tight">
                              {user.name}
                              {isSelf && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 px-1 py-0.2 rounded text-zinc-500">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-0.5">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-block text-xs font-bold border rounded px-2.5 py-0.5 uppercase tracking-wider ${roleStyles[user.role]}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          {user.status === 'ACTIVE' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-emerald-600 dark:text-emerald-400 text-xs">Active</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              <span className="text-red-650 dark:text-red-400 text-xs">Deactivated</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs text-zinc-500 dark:text-zinc-450">
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleString() 
                          : 'Never Active'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                            disabled={user.role === 'SUPER_ADMIN' && currentUser?.role !== 'SUPER_ADMIN'}
                          >
                            <Edit2 size={13} />
                          </Button>

                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleToggleStatus(user)}
                            disabled={isSelf || (user.role === 'SUPER_ADMIN' && currentUser?.role !== 'SUPER_ADMIN')}
                            className="p-1.5"
                          >
                            {user.status === 'ACTIVE' ? <UserX size={13} /> : <UserCheck size={13} />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Dynamic Pagination Bar footer */}
        {!isLoading && !isError && data?.pagination?.totalPages > 1 && (
          <div className="px-5 py-3.5 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs text-zinc-500 dark:text-zinc-400">
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
      </Card>

      {/* Account Creation / Edition Modal */}
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
          <Input
            label="Account Display Name"
            type="text"
            id="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />

          <Input
            label="Email Address"
            type="email"
            id="email"
            placeholder="name@company.com"
            value={formData.email}
            disabled={!!selectedUser} // Cannot change email once account exists
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />

          {selectedUser ? (
            <Input
              label="Reset Password (leave blank to keep current)"
              type="password"
              id="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            />
          ) : (
            <Input
              label="Temporary Password"
              type="password"
              id="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
            />
          )}

          <div className="space-y-1 text-left">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-sans">
              System Access Role
            </label>
            <select
              value={formData.role}
              disabled={selectedUser && ((selectedUser.id || selectedUser._id) === (currentUser?.id || currentUser?._id))}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="block w-full bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-700 dark:text-zinc-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {getAllowedRoles().map((role) => (
                <option key={role} value={role}>
                  {role.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2.5 justify-end pt-3.5 border-t border-zinc-100 dark:border-zinc-850">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="py-2.5 px-4 text-sm font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="py-2.5 px-4 text-sm font-semibold uppercase tracking-wider"
              isLoading={createUserMutation.isLoading || updateUserMutation.isLoading}
            >
              {selectedUser ? 'Save Updates' : 'Provision User'}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Users;
