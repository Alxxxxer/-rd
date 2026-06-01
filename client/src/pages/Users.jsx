import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  UserPlus,
  Edit2,
  UserX,
  UserCheck,
  Filter,
  ShieldCheck,
  Activity,
  AlertCircle
} from 'lucide-react';
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
      password: '' // Passwords are not edited here
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
      updateUserMutation.mutate({
        id: selectedUser.id,
        updatePayload: {
          name: formData.name,
          role: formData.role
        }
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
      id: userToToggle.id,
      updatePayload: { status: nextStatus }
    });
  };

  // Determine allowed roles for assigning depending on active Admin's access hierarchy
  const getAllowedRoles = () => {
    if (currentUser?.role === 'SUPER_ADMIN') {
      return ['ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'];
    }
    // standard ADMIN can only create MANAGER / EXECUTIVE
    return ['SALES_MANAGER', 'SALES_EXECUTIVE'];
  };

  return (
    <Layout>
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left space-y-1">
          <span className="text-xs uppercase font-bold text-brand-400 tracking-wider">
            Console Center
          </span>
          <h1 className="text-3xl font-extrabold text-white">
            User Accounts
          </h1>
          <p className="text-sm text-slate-400">
            Provision, manage roles, and control access permissions.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 py-3 px-5 self-start md:self-auto"
        >
          <UserPlus size={16} />
          Create Account
        </Button>
      </div>

      {/* Filter Options Bar */}
      <Card className="p-4 border-slate-900 bg-slate-950/40">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search accounts name or email..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex gap-4">
            <div className="w-full space-y-1.5 text-left">
              <select
                value={roleFilter}
                onChange={handleRoleFilterChange}
                className="block w-full bg-slate-900 border border-slate-800 focus:border-brand-500/50 rounded-lg text-sm text-slate-300 py-3 px-4 focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="SALES_MANAGER">Sales Manager</option>
                <option value="SALES_EXECUTIVE">Sales Executive</option>
              </select>
            </div>

            <div className="w-full space-y-1.5 text-left">
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="block w-full bg-slate-900 border border-slate-800 focus:border-brand-500/50 rounded-lg text-sm text-slate-300 py-3 px-4 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DEACTIVATED">Deactivated</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Data Table Grid container */}
      <Card className="p-0 border-slate-900 bg-slate-950/20 overflow-hidden relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 z-20">
            <svg
              className="animate-spin h-8 w-8 text-brand-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs text-slate-400">Fetching records...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-sm">
            <AlertCircle size={36} className="text-red-500 mb-3" />
            <span>Failed to load accounts: {error?.message || 'Server error.'}</span>
          </div>
        )}

        {!isLoading && !isError && data?.data?.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 text-slate-500 text-sm">
            <Activity size={36} className="text-slate-700 mb-3" />
            <span>No user accounts found matching selected filters.</span>
          </div>
        )}

        {!isLoading && !isError && data?.data?.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/60">
                  <th className="px-6 py-4.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Account Profile
                  </th>
                  <th className="px-6 py-4.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Assigned Role
                  </th>
                  <th className="px-6 py-4.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Account Status
                  </th>
                  <th className="px-6 py-4.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Last Session
                  </th>
                  <th className="px-6 py-4.5 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50">
                {data.data.map((user) => {
                  const isSelf = currentUser?.id === user.id;

                  // Render roles distinct styles
                  const roleStyles = {
                    SUPER_ADMIN: 'text-red-400 bg-red-950/20 border-red-900/40',
                    ADMIN: 'text-purple-400 bg-purple-950/20 border-purple-900/40',
                    SALES_MANAGER: 'text-brand-400 bg-brand-950/20 border-brand-900/40',
                    SALES_EXECUTIVE: 'text-slate-400 bg-slate-900/40 border-slate-800'
                  };

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-900/20 transition-colors duration-200"
                    >
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          {/* Round initials avatar */}
                          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-sm font-bold text-slate-300">
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="text-left space-y-0.5">
                            <p className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                              {user.name}
                              {isSelf && (
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4.5">
                        <span className={`inline-block text-[10px] font-bold border rounded px-2.5 py-1 uppercase tracking-wide ${roleStyles[user.role]}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {user.status === 'ACTIVE' ? (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-emerald-400 text-xs">Active</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                              <span className="text-red-400 text-xs">Deactivated</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4.5 text-xs text-slate-400">
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleString() 
                          : 'Never Active'}
                      </td>

                      <td className="px-6 py-4.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Disable update controls on SUPER_ADMIN targets unless active operator is SUPER_ADMIN */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal(user)}
                            className="p-2 border-slate-800 hover:border-brand-500/40 text-slate-400 hover:text-white"
                            disabled={user.role === 'SUPER_ADMIN' && currentUser?.role !== 'SUPER_ADMIN'}
                          >
                            <Edit2 size={13} />
                          </Button>

                          {/* Block self deactivation */}
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleToggleStatus(user)}
                            disabled={isSelf || (user.role === 'SUPER_ADMIN' && currentUser?.role !== 'SUPER_ADMIN')}
                            className={`p-2 border-transparent ${
                              user.status === 'ACTIVE' 
                                ? 'bg-red-950/20 text-red-400 hover:bg-red-950/40' 
                                : 'bg-green-950/20 text-green-400 hover:bg-green-950/40'
                            }`}
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

      {/* Account Creation / Edition Modal */}
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

          {!selectedUser && (
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

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans">
              System Access Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="block w-full bg-slate-950 border border-slate-800 focus:border-brand-500/50 rounded-lg text-sm text-slate-300 py-3 px-4 focus:outline-none"
            >
              {getAllowedRoles().map((role) => (
                <option key={role} value={role}>
                  {role.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

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
