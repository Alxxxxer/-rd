import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, User, Calendar, ShieldCheck, Plus, AlertCircle, FileText, Send, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Card from '../ui/Card';

const LeadDrawerModal = ({ isOpen, onClose, lead }) => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // 1. DYNAMIC FORM STATE
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('Manual');
  const [status, setStatus] = useState('NEW');
  const [assignedTo, setAssignedTo] = useState('');
  const [delegate, setDelegate] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [initialNote, setInitialNote] = useState('');

  // 2. ACTIVE COMMENTS STATE
  const [newNoteText, setNewNoteText] = useState('');
  const [formError, setFormError] = useState(null);

  // Pre-fill form if editing an existing lead
  useEffect(() => {
    if (lead) {
      setName(lead.name || '');
      setEmail(lead.email || '');
      setPhone(lead.phone || '');
      setSource(lead.source || 'Manual');
      setStatus(lead.status || 'NEW');
      setAssignedTo(lead.assignedTo?.id || lead.assignedTo?._id || '');
      setDelegate(lead.delegate?.id || lead.delegate?._id || lead.delegate || '');
      
      // Standardize Date format to YYYY-MM-DD for date inputs
      if (lead.followUpDate) {
        setFollowUpDate(new Date(lead.followUpDate).toISOString().split('T')[0]);
      } else {
        setFollowUpDate('');
      }
    } else {
      // Clear forms for new registrations
      setName('');
      setEmail('');
      setPhone('');
      setSource('Manual');
      setStatus('NEW');
      setAssignedTo(currentUser?.role === 'SALES_EXECUTIVE' ? currentUser.id : '');
      setDelegate('');
      setFollowUpDate('');
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
      email,
      phone,
      source,
      status,
      assignedTo: assignedTo || null,
      delegate: delegate || null,
      followUpDate: followUpDate || null
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
      className="max-w-2xl md:p-6"
    >
      {formError && (
        <div className="mb-4 p-4 rounded bg-red-950/20 border border-red-900/30 text-red-400 text-xs flex items-center gap-2 text-left animate-fade-in">
          <AlertCircle size={16} />
          <span>{formError}</span>
        </div>
      )}

      {/* Forms & Notes Grid splitting */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        
        {/* Left Hand: Core Forms inputs */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Lead Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="block w-full bg-slate-950 border border-slate-800 focus:border-brand-500/50 rounded-lg text-sm text-slate-300 py-3 px-4 focus:outline-none"
              >
                <option value="Manual">Manual</option>
                <option value="CSV Import">CSV Import</option>
                <option value="Google Sheets">Google Sheets</option>
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pipeline Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="block w-full bg-slate-950 border border-slate-800 focus:border-brand-500/50 rounded-lg text-sm text-slate-300 py-3 px-4 focus:outline-none"
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="CONVERTED">Converted</option>
                <option value="LOST">Lost</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Assignment Dropdown visible to Admins/Managers only */}
            {canManageAssignment ? (
              <>
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Assign Executive
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="block w-full bg-slate-950 border border-slate-800 focus:border-brand-500/50 rounded-lg text-sm text-slate-300 py-3 px-4 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {executivesData?.data?.map((exec) => (
                      <option key={exec.id} value={exec.id}>
                        {exec.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Assign Campus Delegate
                  </label>
                  <select
                    value={delegate}
                    onChange={(e) => setDelegate(e.target.value)}
                    className="block w-full bg-slate-950 border border-slate-800 focus:border-brand-500/50 rounded-lg text-sm text-slate-300 py-3 px-4 focus:outline-none"
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
                <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-lg">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Assigned Owner</p>
                  <p className="text-xs text-slate-300 font-medium mt-1 flex items-center gap-1.5">
                    <User size={13} className="text-brand-400" />
                    {lead?.assignedTo?.name || currentUser?.name} (Assigned to You)
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-lg">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Campus Delegate</p>
                  <p className="text-xs text-slate-300 font-medium mt-1 flex items-center gap-1.5">
                    <GraduationCap size={13} className="text-brand-400" />
                    {lead?.delegate?.campus ? `${lead.delegate.campus} (${lead.delegate.code})` : 'None Linked'}
                  </p>
                </div>
              </>
            )}

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Calendar size={12} className="text-brand-400" />
                Follow-Up Schedule
              </label>
              <input
                type="date"
                id="followUpDate"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="block w-full bg-slate-950 border border-slate-800 focus:border-brand-500/50 rounded-lg text-sm text-slate-300 py-3 px-4 focus:outline-none input-glow"
              />
            </div>
          </div>

          {!lead && (
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <MessageSquare size={12} className="text-brand-400" />
                Initial Contact Note
              </label>
              <textarea
                placeholder="Logged brief summary of first contact or context..."
                value={initialNote}
                onChange={(e) => setInitialNote(e.target.value)}
                rows={3}
                className="block w-full bg-slate-950 border border-slate-800 focus:border-brand-500/50 rounded-lg text-sm text-slate-300 py-2.5 px-4 focus:outline-none input-glow resize-none font-sans"
              />
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isLoading || updateMutation.isLoading}
            >
              {lead ? 'Save Changes' : 'Register Prospect'}
            </Button>
          </div>
        </form>

        {/* Right Hand: Notes Chronological Timeline */}
        <div className="flex flex-col h-full min-h-[300px] border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-6">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <MessageSquare size={14} className="text-indigo-400" />
            Notes & History Logs
          </span>

          {!lead ? (
            // Form creation notice helper
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-600 bg-slate-950/20 border border-dashed border-slate-900 rounded-lg">
              <FileText size={28} className="mb-2" />
              <p className="text-xs">
                History logs are initialized once the prospect is registered. Use "Initial Contact Note" to append first files.
              </p>
            </div>
          ) : (
            <>
              {/* Chronological descending notes timelines scroll block */}
              <div className="flex-1 overflow-y-auto max-h-[350px] space-y-3.5 pr-1.5 mb-4">
                {(leadDetails?.data?.notes || lead.notes || []).length === 0 ? (
                  <div className="text-center p-6 text-xs text-slate-600 border border-dashed border-slate-900 rounded-lg">
                    No notes logged on this pipeline.
                  </div>
                ) : (
                  [...(leadDetails?.data?.notes || lead.notes || [])]
                    .reverse() // Display descending chronological order
                    .map((note, index) => {
                      return (
                        <div
                          key={note._id || index}
                          className="p-3 rounded-lg bg-slate-950 border border-slate-900 text-xs space-y-2 relative"
                        >
                          <p className="text-slate-300 font-sans leading-normal whitespace-pre-line text-left">
                            {note.text}
                          </p>
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase">
                            <span className="text-brand-400">
                              {note.createdBy?.name || 'User'}
                            </span>
                            <span>•</span>
                            <span className="text-slate-600 font-sans tracking-wide">
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
                    className="block w-full bg-slate-950 border border-slate-800 focus:border-brand-500/50 rounded-lg text-xs text-slate-300 py-2.5 pl-3 pr-10 focus:outline-none input-glow resize-none font-sans"
                    disabled={addNoteMutation.isLoading}
                  />
                  <button
                    type="submit"
                    className="absolute right-2.5 bottom-2.5 p-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors focus:outline-none"
                    disabled={addNoteMutation.isLoading || !newNoteText.trim()}
                  >
                    <Send size={12} />
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
