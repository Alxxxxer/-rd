import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, User, Calendar, ShieldCheck, FileText, Send, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const LeadDrawerModal = ({ isOpen, onClose, lead }) => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // 1. DYNAMIC FORM STATE
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('Manual');
  const [status, setStatus] = useState('NEW');
  const [assignedTo, setAssignedTo] = useState('');
  const [delegate, setDelegate] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [paymentMethod, setPaymentMethod] = useState('PENDING');
  const [initialNote, setInitialNote] = useState('');

  // 2. ACTIVE COMMENTS STATE
  const [newNoteText, setNewNoteText] = useState('');
  const [formError, setFormError] = useState(null);

  // Pre-fill form if editing an existing lead
  useEffect(() => {
    if (lead) {
      setName(lead.name || '');
      setCollege(lead.college || '');
      setEmail(lead.email || '');
      setPhone(lead.phone || '');
      setSource(lead.source || 'Manual');
      setStatus(lead.status || 'NEW');
      setAssignedTo(lead.assignedTo?.id || lead.assignedTo?._id || '');
      setDelegate(lead.delegate?.id || lead.delegate?._id || lead.delegate || '');
      setAmount(lead.amount || 0);
      setPaymentStatus(lead.paymentStatus || 'PENDING');
      setPaymentMethod(lead.paymentMethod || 'PENDING');
      
      // Standardize Date format to YYYY-MM-DD for date inputs
      if (lead.followUpDate) {
        setFollowUpDate(new Date(lead.followUpDate).toISOString().split('T')[0]);
      } else {
        setFollowUpDate('');
      }
    } else {
      // Clear forms for new registrations
      setName('');
      setCollege('');
      setEmail('');
      setPhone('');
      setSource('Manual');
      setStatus('NEW');
      setAssignedTo(currentUser?.role === 'SALES_EXECUTIVE' ? (currentUser.id || currentUser._id) : '');
      setDelegate('');
      setFollowUpDate('');
      setAmount(0);
      setPaymentStatus('PENDING');
      setPaymentMethod('PENDING');
      setInitialNote('');
    }
    setFormError(null);
    setNewNoteText('');
  }, [lead, isOpen, currentUser]);

  // Query all active executives for the assignment dropdown list
  const { data: executivesData } = useQuery({
    queryKey: ['executives'],
    queryFn: async () => {
      const response = await api.get('/users', { params: { limit: 100 } });
      return response.data;
    },
    enabled: ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'].includes(currentUser?.role)
  });

  // Query all active delegates for selection
  const { data: delegatesData } = useQuery({
    queryKey: ['delegates-list-select'],
    queryFn: async () => {
      const response = await api.get('/delegates', { params: { limit: 100 } });
      return response.data;
    }
  });

  // Query specific Lead details to keep comment streams updated live
  const { data: leadDetails } = useQuery({
    queryKey: ['lead-details', lead?._id || lead?.id],
    queryFn: async () => {
      const response = await api.get(`/leads/${lead?._id || lead?.id}`);
      return response.data;
    },
    enabled: !!lead
  });

  // 3. REACT QUERY: CREATE MUTATION
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/leads', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      onClose();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create lead record.');
    }
  });

  // 4. REACT QUERY: UPDATE MUTATION
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.patch(`/leads/${lead?._id || lead?.id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      queryClient.invalidateQueries(['lead-details', lead?._id || lead?.id]);
      onClose();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to update lead record.');
    }
  });

  // 5. REACT QUERY: NOTES LEDGER MUTATION
  const addNoteMutation = useMutation({
    mutationFn: async (noteText) => {
      const response = await api.post(`/leads/${lead?._id || lead?.id}/notes`, { text: noteText });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      queryClient.invalidateQueries(['lead-details', lead?._id || lead?.id]);
      setNewNoteText('');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to add comment note.');
    }
  });

  // Form Submission
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      name,
      college: college || '',
      email,
      phone,
      source,
      status,
      assignedTo: assignedTo || null,
      delegate: delegate || null,
      followUpDate: followUpDate || null,
      amount: amount ? Number(amount) : 0,
      paymentStatus,
      paymentMethod
    };

    if (lead) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate({
        ...payload,
        initialNote: initialNote || undefined
      });
    }
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addNoteMutation.mutate(newNoteText.trim());
  };

  const canManageAssignment = ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'].includes(currentUser?.role);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lead ? `Edit Prospect: ${name}` : 'Register New Lead'}
      className="max-w-5xl md:p-8"
    >
      {formError && (
        <div className="mb-4 p-3.5 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-650 dark:text-red-400 text-xs flex items-center gap-2 text-left animate-fade-in">
          <span>{formError}</span>
        </div>
      )}

      {/* Forms & Notes Grid splitting */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
        
        {/* Left Hand: Core Forms inputs */}
        <form onSubmit={handleFormSubmit} className="space-y-3.5">
          <Input
            label="Prospect Name"
            type="text"
            id="name"
            placeholder="Jane Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="College/Campus Name"
            type="text"
            id="college"
            placeholder="e.g. Jamia Millia Islamia"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
          />

          <Input
            label="Email Address"
            type="email"
            id="email"
            placeholder="jane@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Phone Number"
            type="tel"
            id="phone"
            placeholder="+1 555-0199"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Lead Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-700 dark:text-zinc-300 py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
              >
                <option value="Manual">Manual</option>
                <option value="CSV Import">CSV Import</option>
                <option value="Google Sheets">Google Sheets</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Pipeline Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-700 dark:text-zinc-300 py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="CONVERTED">Converted</option>
                <option value="LOST">Lost</option>
              </select>
            </div>
          </div>

          {/* Payment Details Section */}
          <div className="p-3.5 bg-zinc-50/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-md space-y-3">
            <p className="text-xs text-zinc-450 dark:text-zinc-550 font-bold uppercase tracking-wider">Payment & Revenue Details</p>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  Deal Amount ($)
                </label>
                <input
                  type="number"
                  id="amount"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-700 dark:text-zinc-300 py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-700 dark:text-zinc-300 py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
            </div>
            
            {paymentStatus === 'PAID' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-700 dark:text-zinc-300 py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                >
                  <option value="PENDING">Pending</option>
                  <option value="STRIPE">Stripe</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {/* Assignment Dropdown visible to Admins/Managers only */}
            {canManageAssignment ? (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Assign Executive
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-700 dark:text-zinc-300 py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                  >
                    <option value="">Unassigned</option>
                    {executivesData?.data?.map((exec) => {
                      const execId = exec.id || exec._id;
                      return (
                        <option key={execId} value={execId}>
                          {exec.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Assign Campus Delegate
                  </label>
                  <select
                    value={delegate}
                    onChange={(e) => setDelegate(e.target.value)}
                    className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-700 dark:text-zinc-300 py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                  >
                    <option value="">No Delegate Linked</option>
                    {delegatesData?.data?.map((del) => (
                      <option key={del._id || del.id} value={del._id || del.id}>
                        {del.campus} ({del.code}) — {del.user?.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              // Locked indicators for standard Sales Executives
              <>
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-md">
                  <p className="text-xs text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider">Assigned Owner</p>
                  <p className="text-sm text-zinc-850 dark:text-zinc-200 font-medium mt-1 flex items-center gap-1.5">
                    <User size={13} className="text-brand-500" />
                    {lead?.assignedTo?.name || currentUser?.name} (Assigned to You)
                  </p>
                </div>

                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-md">
                  <p className="text-xs text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider">Campus Delegate</p>
                  <p className="text-sm text-zinc-850 dark:text-zinc-200 font-medium mt-1 flex items-center gap-1.5">
                    <GraduationCap size={13} className="text-brand-500" />
                    {lead?.delegate?.campus ? `${lead.delegate.campus} (${lead.delegate.code})` : 'None Linked'}
                  </p>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Calendar size={14} className="text-brand-500" />
                Follow-Up Schedule
              </label>
              <input
                type="date"
                id="followUpDate"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-750 dark:text-zinc-300 py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all font-sans"
              />
            </div>
          </div>

          {!lead && (
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Initial Contact Note
              </label>
              <textarea
                placeholder="Logged brief summary of first contact or context..."
                value={initialNote}
                onChange={(e) => setInitialNote(e.target.value)}
                rows={3}
                className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-sm text-zinc-750 dark:text-zinc-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all resize-none font-sans"
              />
            </div>
          )}

          <div className="flex gap-2.5 justify-end pt-3.5 border-t border-zinc-100 dark:border-zinc-850">
            <Button variant="outline" size="sm" onClick={onClose} className="py-2.5 px-4 text-sm font-semibold">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="py-2.5 px-4 text-sm font-semibold uppercase tracking-wider"
              isLoading={createMutation.isLoading || updateMutation.isLoading}
            >
              {lead ? 'Save Changes' : 'Register Lead'}
            </Button>
          </div>
        </form>

        {/* Right Hand: Notes Timeline */}
        <div className="flex flex-col h-full min-h-[300px] border-t md:border-t-0 md:border-l border-zinc-150 dark:border-zinc-850 pt-5 md:pt-0 md:pl-5">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2.5 flex items-center gap-1">
            <MessageSquare size={13} className="text-brand-500" />
            Notes & History Logs
          </span>

          {!lead ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-5 text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-950 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-md">
              <FileText size={24} className="mb-1.5 text-zinc-300 dark:text-zinc-700" />
              <p className="text-[10px] leading-relaxed">
                History logs are initialized once the prospect is registered. Use "Initial Contact Note" to append first files.
              </p>
            </div>
          ) : (
            <>
              {/* Chronological notes block */}
              <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2.5 pr-1 mb-3">
                {(leadDetails?.data?.notes || lead.notes || []).length === 0 ? (
                  <div className="text-center p-5 text-[10px] text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-md">
                    No notes logged on this pipeline.
                  </div>
                ) : (
                  [...(leadDetails?.data?.notes || lead.notes || [])]
                    .reverse()
                    .map((note, index) => {
                      return (
                        <div
                          key={note._id || index}
                          className="p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs space-y-1.5"
                        >
                          <p className="text-zinc-850 dark:text-zinc-300 font-sans leading-normal whitespace-pre-line text-left">
                            {note.text}
                          </p>
                          <div className="flex items-center gap-1.5 text-[9px] text-zinc-450 dark:text-zinc-500 font-bold uppercase">
                            <span className="text-brand-600 dark:text-brand-400">
                              {note.createdBy?.name || 'User'}
                            </span>
                            <span>•</span>
                            <span className="font-sans font-medium">
                              {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Textarea comment box */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <div className="relative">
                  <textarea
                    placeholder="Add operational comment..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    rows={2}
                    className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 rounded-md text-xs text-zinc-800 dark:text-zinc-300 py-2 pl-3 pr-9 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all resize-none font-sans"
                    disabled={addNoteMutation.isLoading}
                  />
                  <button
                    type="submit"
                    className="absolute right-2 bottom-2 p-1 bg-brand-500 hover:bg-brand-600 text-white rounded transition-colors disabled:opacity-50"
                    disabled={addNoteMutation.isLoading || !newNoteText.trim()}
                  >
                    <Send size={11} />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default LeadDrawerModal;
