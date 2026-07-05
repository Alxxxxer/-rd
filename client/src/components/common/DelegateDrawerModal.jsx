import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, User, Calendar, ShieldCheck, Send, GraduationCap, Building, Phone, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const DelegateDrawerModal = ({ isOpen, onClose, delegate }) => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // 1. DYNAMIC FORM STATE
  const [name, setName] = useState('');
  const [campus, setCampus] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [code, setCode] = useState('');
  const [userId, setUserId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  // 2. COMMENTS/NOTES STATE
  const [newNoteText, setNewNoteText] = useState('');
  const [formError, setFormError] = useState(null);

  // Pre-fill form if editing an existing delegate
  useEffect(() => {
    if (delegate) {
      setName(delegate.name || '');
      setCampus(delegate.campus || '');
      setEmail(delegate.email || '');
      setPhone(delegate.phone || '');
      setWhatsapp(delegate.whatsapp || '');
      setDepartment(delegate.department || '');
      setStatus(delegate.status || 'PENDING');
      setCode(delegate.code || '');
      setUserId(delegate.user?.id || delegate.user?._id || delegate.user || '');
      setAssignedTo(delegate.assignedTo?.id || delegate.assignedTo?._id || delegate.assignedTo || '');
    } else {
      setName('');
      setCampus('');
      setEmail('');
      setPhone('');
      setWhatsapp('');
      setDepartment('');
      setStatus('PENDING');
      setCode('');
      setUserId('');
      setAssignedTo(currentUser?.role === 'SALES_EXECUTIVE' ? (currentUser.id || currentUser._id) : '');
    }
    setFormError(null);
    setNewNoteText('');
  }, [delegate, isOpen, currentUser]);

  // Query executive users list for assignment
  const { data: executivesData } = useQuery({
    queryKey: ['executives'],
    queryFn: async () => {
      const response = await api.get('/users', { params: { limit: 100 } });
      return response.data;
    },
    enabled: ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'].includes(currentUser?.role)
  });

  // Query CRM users list for account linking
  const { data: usersData } = useQuery({
    queryKey: ['crm-users-select'],
    queryFn: async () => {
      const response = await api.get('/users', { params: { limit: 200 } });
      return response.data;
    },
    enabled: ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'].includes(currentUser?.role)
  });

  // Query specific Delegate details for real-time notes updates
  const { data: delegateDetails } = useQuery({
    queryKey: ['delegate-details', delegate?._id || delegate?.id],
    queryFn: async () => {
      const response = await api.get(`/delegates/${delegate?._id || delegate?.id}`);
      return response.data.data;
    },
    enabled: !!delegate && isOpen
  });

  // REACT QUERY: CREATE MUTATION
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/delegates', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['delegates']);
      onClose();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create delegate lead.');
    }
  });

  // REACT QUERY: UPDATE MUTATION
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.patch(`/delegates/${delegate?._id || delegate?.id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['delegates']);
      queryClient.invalidateQueries(['delegate-details', delegate?._id || delegate?.id]);
      setNewNoteText('');
      if (!newNoteText.trim()) {
        onClose();
      }
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to update delegate profile.');
    }
  });

  // Form Submission
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError(null);

    // Code is required when status is AGREED
    if (status === 'AGREED' && !code.trim()) {
      setFormError('A unique Delegate Code is required when status is set to Agreed.');
      return;
    }

    const payload = {
      name,
      campus,
      email: email || '',
      phone: phone || '',
      whatsapp: whatsapp || '',
      department: department || '',
      status,
      code: status === 'AGREED' ? code.toUpperCase() : undefined,
      userId: userId || null,
      assignedTo: assignedTo || null
    };

    if (delegate) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleAddNoteSubmit = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    updateMutation.mutate({ noteText: newNoteText.trim() });
  };

  const canManageAssignment = ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'].includes(currentUser?.role);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={delegate ? `Delegate Prospect: ${name}` : 'Register New Delegate Lead'}
      className="max-w-5xl md:p-8"
    >
      {formError && (
        <div className="mb-4 p-3.5 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-650 dark:text-red-400 text-xs flex items-center gap-2 text-left animate-fade-in">
          <span>{formError}</span>
        </div>
      )}

      {/* Forms & Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
        
        {/* Left Side: Core Form Inputs */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <Input
              label="Delegate Name"
              type="text"
              id="name"
              placeholder="Varun Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="College/University"
              type="text"
              id="campus"
              placeholder="e.g. AMU College"
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <Input
              label="Email Address"
              type="email"
              id="email"
              placeholder="varun@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Department / Course"
              type="text"
              id="department"
              placeholder="e.g. BBA 2nd Year"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <Input
              label="Phone Number"
              type="tel"
              id="phone"
              placeholder="8178088501"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <Input
              label="WhatsApp / Alternate"
              type="tel"
              id="whatsapp"
              placeholder="8178088501"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Liaison Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-700 dark:text-zinc-300 py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
              >
                <option value="PENDING">Pending (New)</option>
                <option value="AGREED">Agreed (Wants to be Delegate)</option>
                <option value="DECLINED">Declined (Not Interested)</option>
              </select>
            </div>

            {status === 'AGREED' && (
              <Input
                label="Delegate Code (Required)"
                type="text"
                id="code"
                placeholder="e.g. DEL-AMU-01"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Linked User Account Selection */}
            {canManageAssignment ? (
              <div className="space-y-1 text-left">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  CRM User Account
                </label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-700 dark:text-zinc-300 py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                >
                  <option value="">None (Unlinked)</option>
                  {usersData?.data?.map((u) => (
                    <option key={u.id || u._id} value={u.id || u._id}>
                      {u.name} ({u.role?.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              delegate?.user && (
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-455 dark:text-zinc-500">
                    Linked CRM Account
                  </label>
                  <div className="flex items-center gap-1.5 px-3 py-2.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 text-sm text-zinc-650 dark:text-zinc-350">
                    <User size={14} className="text-zinc-400" />
                    <span>{delegate.user?.name}</span>
                  </div>
                </div>
              )
            )}

            {/* Assigned Executive Selection */}
            {canManageAssignment ? (
              <div className="space-y-1 text-left">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Assigned Owner
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-700 dark:text-zinc-300 py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                >
                  <option value="">Unassigned</option>
                  {executivesData?.data?.map((exec) => (
                    <option key={exec.id || exec._id} value={exec.id || exec._id}>
                      {exec.name} ({exec.role?.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-455 dark:text-zinc-500">
                  Assigned Owner
                </label>
                <div className="flex items-center gap-1.5 px-3 py-2.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 text-sm text-zinc-650 dark:text-zinc-350">
                  <User size={14} className="text-zinc-400" />
                  <span>{delegate?.assignedTo?.name || 'Unassigned'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300"
            >
              Close
            </Button>
            
            {/* Self Assignment option for quick claiming */}
            {!canManageAssignment && !assignedTo && (
              <Button
                variant="outline"
                type="button"
                onClick={() => setAssignedTo(currentUser?.id || currentUser?._id)}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-brand-600 border-brand-200 hover:bg-brand-50/50 dark:text-brand-400 dark:border-brand-900/50 dark:hover:bg-brand-950/20"
              >
                Claim Lead
              </Button>
            )}

            <Button
              variant="primary"
              type="submit"
              isLoading={createMutation.isLoading || updateMutation.isLoading}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
            >
              Save Details
            </Button>
          </div>
        </form>

        {/* Right Side: Notes and History */}
        <div className="flex flex-col h-[520px] bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-850 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-brand-500" />
              <span className="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Call & Liaison Logs</span>
            </div>
            {delegateDetails?.notes?.length > 0 && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                {delegateDetails.notes.length} notes
              </span>
            )}
          </div>

          {/* Notes scroll list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!delegate ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 dark:text-zinc-500">
                <ShieldCheck size={28} className="mb-2 text-zinc-300 dark:text-zinc-700" />
                <p className="text-xs">Interaction history is populated after registering the delegate lead.</p>
              </div>
            ) : !delegateDetails?.notes || delegateDetails.notes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 dark:text-zinc-500">
                <MessageSquare size={28} className="mb-2 text-zinc-300 dark:text-zinc-700" />
                <p className="text-xs">No call logs or notes yet. Start recording your calls below!</p>
              </div>
            ) : (
              delegateDetails.notes.map((note) => (
                <div key={note._id || note.id} className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-md shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-zinc-450 dark:text-zinc-500 font-sans border-b border-zinc-100 dark:border-zinc-850/50 pb-1.5">
                    <span className="font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      {note.createdBy?.name || 'Staff User'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(note.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {note.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Add note form */}
          {delegate && (
            <form onSubmit={handleAddNoteSubmit} className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-850 flex gap-2">
              <input
                type="text"
                placeholder="Log a call or text message..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                disabled={updateMutation.isLoading}
                className="flex-1 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 rounded px-3 py-2 focus:outline-none focus:border-brand-500 dark:focus:border-brand-500/80 text-zinc-750 dark:text-zinc-250 transition-colors"
              />
              <Button
                variant="primary"
                type="submit"
                isLoading={updateMutation.isLoading && !!newNoteText.trim()}
                disabled={!newNoteText.trim() || updateMutation.isLoading}
                className="px-3 py-2 flex items-center justify-center"
              >
                <Send size={13} />
              </Button>
            </form>
          )}
        </div>

      </div>
    </Modal>
  );
};

export default DelegateDrawerModal;
