import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Search, Eye, CheckCircle2, UserCheck,
  Ticket, Clock, AlertCircle, Filter, X, Loader2,
} from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { useTickets, addTicket, updateTicket } from '../hooks/useTickets';
import { useLeads } from '../hooks/useLeads';
import { useTutors } from '../hooks/useTutors';
import { cn, getStatusColor } from '../lib/utils';
import type { SupportTicket } from '../types';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import toast from 'react-hot-toast';

// ─── Constants ───────────────────────────────────────────────────────────────

const ISSUE_LABELS: Record<SupportTicket['issue'], string> = {
  tutor_absent: 'Tutor Absent',
  student_absent: 'Student Absent',
  timing_conflict: 'Timing Conflict',
  performance: 'Performance',
  replacement_request: 'Replacement',
  other: 'Other',
};

const ISSUE_COLORS: Record<SupportTicket['issue'], string> = {
  tutor_absent: 'bg-orange-100 text-orange-800',
  student_absent: 'bg-blue-100 text-blue-800',
  timing_conflict: 'bg-purple-100 text-purple-800',
  performance: 'bg-rose-100 text-rose-800',
  replacement_request: 'bg-amber-100 text-amber-800',
  other: 'bg-gray-100 text-gray-700',
};

const PRIORITY_CONFIG = {
  high: { label: 'High', dot: '🔴', bar: 'bg-red-500', badge: 'bg-red-100 text-red-800' },
  medium: { label: 'Medium', dot: '🟡', bar: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-800' },
  low: { label: 'Low', dot: '🟢', bar: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
};

const STATUS_LABELS: Record<SupportTicket['status'], string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

// Helper to safely format date from Firestore Timestamp
const formatTicketDate = (dateValue: any): string => {
  if (!dateValue) return '—';
  
  try {
    if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
      const d = dateValue.toDate();
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return '—';
    }
    if (typeof dateValue === 'string') {
      const d = new Date(dateValue);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return dateValue;
    }
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return '—';
  } catch {
    return '—';
  }
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
      <div className={cn('w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: SupportTicket['status'] }) {
  return (
    <span className={cn('status-badge text-xs px-2 py-0.5 rounded-full font-medium', getStatusColor(status))}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── Create Ticket Modal (FIXED - Loads ALL data) ─────────────────────────────

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY_FORM = {
  issue: 'other' as SupportTicket['issue'],
  leadId: '',
  tutorId: '',
  studentName: '',
  description: '',
  priority: 'medium' as SupportTicket['priority'],
  assignedTo: '',
};

function CreateTicketModal({ open, onClose }: CreateModalProps) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [tutorSearch, setTutorSearch] = useState('');
  
  // Store all data loaded from database
  const [allLeads, setAllLeads] = useState<{ id: string; leadId: string; studentName: string }[]>([]);
  const [allTutors, setAllTutors] = useState<{ id: string; tutorId: string; name: string }[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingTutors, setLoadingTutors] = useState(false);
  const [leadsLoaded, setLeadsLoaded] = useState(false);
  const [tutorsLoaded, setTutorsLoaded] = useState(false);

  // Load ALL leads when modal opens
  useEffect(() => {
    if (open && !leadsLoaded && !loadingLeads) {
      loadAllLeads();
    }
  }, [open, leadsLoaded]);

  // Load ALL tutors when modal opens
  useEffect(() => {
    if (open && !tutorsLoaded && !loadingTutors) {
      loadAllTutors();
    }
  }, [open, tutorsLoaded]);

  const loadAllLeads = async () => {
    setLoadingLeads(true);
    try {
      const leadsQuery = query(collection(db, 'leads'));
      const snapshot = await getDocs(leadsQuery);
      
      const leadsList: { id: string; leadId: string; studentName: string }[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        leadsList.push({
          id: doc.id,
          leadId: data.leadId || data.lead_id || data.ticketId || doc.id.slice(0, 8),
          studentName: data.studentName || data.student_name || data.name || data.fullName || 'Unknown Lead'
        });
      });
      
      setAllLeads(leadsList);
      setLeadsLoaded(true);
      console.log(`✅ Loaded ${leadsList.length} leads for search`);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoadingLeads(false);
    }
  };

  const loadAllTutors = async () => {
    setLoadingTutors(true);
    try {
      const tutorsQuery = query(collection(db, 'tutors'));
      const snapshot = await getDocs(tutorsQuery);
      
      const tutorsList: { id: string; tutorId: string; name: string }[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        tutorsList.push({
          id: doc.id,
          tutorId: data.tutorId || data.tutor_id || data.id || doc.id.slice(0, 8),
          name: data.name || data.fullName || data.displayName || 'Unknown Tutor'
        });
      });
      
      setAllTutors(tutorsList);
      setTutorsLoaded(true);
      console.log(`✅ Loaded ${tutorsList.length} tutors for search`);
    } catch (error) {
      console.error('Error loading tutors:', error);
      toast.error('Failed to load tutors');
    } finally {
      setLoadingTutors(false);
    }
  };

  // Filter leads based on search (client-side on loaded data)
  const filteredLeads = useMemo(() => {
    if (!leadSearch.trim()) return [];
    const searchLower = leadSearch.toLowerCase();
    return allLeads.filter(lead => 
      lead.studentName.toLowerCase().includes(searchLower) ||
      lead.leadId.toLowerCase().includes(searchLower)
    ).slice(0, 20);
  }, [allLeads, leadSearch]);

  // Filter tutors based on search (client-side on loaded data)
  const filteredTutors = useMemo(() => {
    if (!tutorSearch.trim()) return [];
    const searchLower = tutorSearch.toLowerCase();
    return allTutors.filter(tutor => 
      tutor.name.toLowerCase().includes(searchLower) ||
      tutor.tutorId.toLowerCase().includes(searchLower)
    ).slice(0, 20);
  }, [allTutors, tutorSearch]);

  const selectedLead = allLeads.find(l => l.id === form.leadId);
  const selectedTutor = allTutors.find(t => t.id === form.tutorId);

  const set = (field: string, val: string | null) => setForm(f => ({ ...f, [field]: val ?? '' }));

  const handleSubmit = async () => {
    if (!form.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    
    setSaving(true);
    try {
      const ticketData: any = {
        issue: form.issue,
        description: form.description,
        priority: form.priority,
        status: 'open',
        resolution: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (form.leadId) ticketData.leadId = form.leadId;
      if (form.tutorId) ticketData.tutorId = form.tutorId;
      if (form.studentName) ticketData.studentName = form.studentName;
      if (form.assignedTo) ticketData.assignedTo = form.assignedTo;

      await addTicket(ticketData);
      
      setForm({ ...EMPTY_FORM });
      setLeadSearch('');
      setTutorSearch('');
      toast.success('Ticket created successfully');
      onClose();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket size={18} className="text-primary" /> New Support Ticket
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Issue Type *</label>
            <Select value={form.issue} onValueChange={v => set('issue', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ISSUE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Related Lead - Searchable */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Related Lead</label>
            {selectedLead ? (
              <div className="flex items-center justify-between p-2 border border-border rounded-md bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedLead.studentName}</p>
                  <p className="text-xs text-muted-foreground">{selectedLead.leadId}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, leadId: '', studentName: '' }))} className="h-7 px-2">Clear</Button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    className="w-full rounded-md border border-input bg-background pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Search by name or lead ID..."
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    disabled={loadingLeads}
                  />
                  {leadSearch && (
                    <button onClick={() => { setLeadSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X size={13} />
                    </button>
                  )}
                </div>
                {loadingLeads && (
                  <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-card border border-border rounded-md shadow-lg z-10 text-center">
                    <Loader2 size={16} className="animate-spin mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground mt-1">Loading leads...</p>
                  </div>
                )}
                {leadSearch && !loadingLeads && filteredLeads.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-card border border-border rounded-md shadow-lg z-10">
                    {filteredLeads.map((lead) => (
                      <button
                        key={lead.id}
                        className="w-full text-left p-2 hover:bg-muted transition-colors border-b border-border last:border-0"
                        onClick={() => {
                          setForm(f => ({ ...f, leadId: lead.id, studentName: lead.studentName }));
                          setLeadSearch('');
                        }}
                      >
                        <p className="text-sm font-medium truncate">{lead.studentName}</p>
                        <p className="text-xs text-muted-foreground">{lead.leadId}</p>
                      </button>
                    ))}
                  </div>
                )}
                {leadSearch && !loadingLeads && filteredLeads.length === 0 && leadsLoaded && (
                  <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-card border border-border rounded-md shadow-lg z-10 text-center">
                    <p className="text-xs text-muted-foreground">No leads found</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Related Tutor - Searchable */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Related Tutor</label>
            {selectedTutor ? (
              <div className="flex items-center justify-between p-2 border border-border rounded-md bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedTutor.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedTutor.tutorId}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, tutorId: '' }))} className="h-7 px-2">Clear</Button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    className="w-full rounded-md border border-input bg-background pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Search by name or tutor ID..."
                    value={tutorSearch}
                    onChange={(e) => setTutorSearch(e.target.value)}
                    disabled={loadingTutors}
                  />
                  {tutorSearch && (
                    <button onClick={() => { setTutorSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X size={13} />
                    </button>
                  )}
                </div>
                {loadingTutors && (
                  <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-card border border-border rounded-md shadow-lg z-10 text-center">
                    <Loader2 size={16} className="animate-spin mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground mt-1">Loading tutors...</p>
                  </div>
                )}
                {tutorSearch && !loadingTutors && filteredTutors.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-card border border-border rounded-md shadow-lg z-10">
                    {filteredTutors.map((tutor) => (
                      <button
                        key={tutor.id}
                        className="w-full text-left p-2 hover:bg-muted transition-colors border-b border-border last:border-0"
                        onClick={() => {
                          setForm(f => ({ ...f, tutorId: tutor.id }));
                          setTutorSearch('');
                        }}
                      >
                        <p className="text-sm font-medium truncate">{tutor.name}</p>
                        <p className="text-xs text-muted-foreground">{tutor.tutorId}</p>
                      </button>
                    ))}
                  </div>
                )}
                {tutorSearch && !loadingTutors && filteredTutors.length === 0 && tutorsLoaded && (
                  <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-card border border-border rounded-md shadow-lg z-10 text-center">
                    <p className="text-xs text-muted-foreground">No tutors found</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Description *</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              placeholder="Describe the issue..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Priority</label>
              <Select value={form.priority} onValueChange={v => set('priority', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="high">🔴 High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Assigned To</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Staff name"
                value={form.assignedTo}
                onChange={e => set('assignedTo', e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-border text-foreground hover:bg-muted transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !form.description.trim()} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5">
            {saving ? 'Creating...' : 'Create Ticket'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Detail/Resolve Modal ────────────────────────────────────────────────────

function DetailModal({ ticket, onClose }: { ticket: SupportTicket; onClose: () => void }) {
  const [status, setStatus] = useState<SupportTicket['status']>(ticket.status);
  const [resolution, setResolution] = useState(ticket.resolution ?? '');
  const [saving, setSaving] = useState(false);

  const handleResolve = async () => {
    if (!resolution.trim()) return;
    setSaving(true);
    try {
      await updateTicket(ticket.id, { status: 'resolved', resolution });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async () => {
    setSaving(true);
    try {
      await updateTicket(ticket.id, { status, resolution: resolution || undefined });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const p = PRIORITY_CONFIG[ticket.priority];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono text-primary text-base">{ticket.ticketId}</span>
            <span className="text-muted-foreground">— Ticket Detail</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-muted/30 rounded-lg p-4 border border-border">
            <InfoRow label="Issue Type" value={<span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ISSUE_COLORS[ticket.issue])}>{ISSUE_LABELS[ticket.issue]}</span>} />
            <InfoRow label="Priority" value={<span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', p.badge)}>{p.dot} {p.label}</span>} />
            <InfoRow label="Student" value={ticket.studentName ?? '—'} />
            <InfoRow label="Status" value={<StatusBadge status={ticket.status} />} />
            <InfoRow label="Assigned To" value={ticket.assignedTo ?? 'Unassigned'} />
            <InfoRow label="Created" value={formatTicketDate(ticket.createdAt)} />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Description</p>
            <p className="text-sm text-foreground bg-secondary/30 rounded-lg p-3 border border-border leading-relaxed">{ticket.description}</p>
          </div>

          {ticket.status !== 'resolved' && (
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Update Ticket</p>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Status</label>
                <Select value={status} onValueChange={v => v && setStatus(v as SupportTicket['status'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Resolution Notes</label>
                <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={3} placeholder="Describe how the issue was resolved..." value={resolution} onChange={e => setResolution(e.target.value)} />
              </div>
            </div>
          )}

          {ticket.status === 'resolved' && ticket.resolution && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Resolution</p>
              <p className="text-sm text-foreground bg-green-50 rounded-lg p-3 border border-green-200 leading-relaxed">{ticket.resolution}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-border text-foreground hover:bg-muted transition-colors">Close</button>
          {ticket.status !== 'resolved' && (
            <>
              <button onClick={handleStatusUpdate} disabled={saving} className="px-4 py-2 text-sm rounded-md border border-primary text-primary hover:bg-primary/10 transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Update Status'}</button>
              <button onClick={handleResolve} disabled={saving || !resolution.trim()} className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"><CheckCircle2 size={14} /> Resolve Ticket</button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <div className="text-sm text-foreground mt-0.5">{value}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SupportTicketsPage() {
  const { tickets, loading: ticketsLoading } = useTickets();
  const { leads, loading: leadsLoading } = useLeads();
  const { tutors, loading: tutorsLoading } = useTutors();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SupportTicket['status']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | SupportTicket['priority']>('all');
  const [issueFilter, setIssueFilter] = useState<'all' | SupportTicket['issue']>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [viewTicket, setViewTicket] = useState<SupportTicket | null>(null);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      resolvedToday: tickets.filter(t => {
        if (t.status !== 'resolved' || !t.updatedAt) return false;
        const date = t.updatedAt?.toDate ? t.updatedAt.toDate() : new Date(t.updatedAt);
        return date >= today;
      }).length,
    };
  }, [tickets]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tickets.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (issueFilter !== 'all' && t.issue !== issueFilter) return false;
      if (q) {
        const inId = t.ticketId?.toLowerCase().includes(q);
        const inStudent = t.studentName?.toLowerCase().includes(q);
        const inDesc = t.description?.toLowerCase().includes(q);
        if (!inId && !inStudent && !inDesc) return false;
      }
      return true;
    });
  }, [tickets, search, statusFilter, priorityFilter, issueFilter]);

  const handleAssign = async (ticket: SupportTicket) => {
    const name = prompt('Assign to (staff name):');
    if (name) await updateTicket(ticket.id, { assignedTo: name, status: 'in_progress' });
  };

  // Show loading only on initial load
  if (ticketsLoading && tickets.length === 0) {
    return (
      <AppLayout title="Support Tickets">
        <div className="p-6 flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading tickets...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Support Tickets">
      <div className="p-6 space-y-5">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Open Tickets" value={stats.open} icon={AlertCircle} color="bg-red-500" />
          <StatCard label="In Progress" value={stats.inProgress} icon={Clock} color="bg-amber-500" />
          <StatCard label="Resolved Today" value={stats.resolvedToday} icon={CheckCircle2} color="bg-green-500" />
          <StatCard label="Total Tickets" value={tickets.length} icon={Ticket} color="bg-blue-500" />
        </div>

        {/* Toolbar */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Search ticket ID, student, description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <FilterSelect value={statusFilter} onChange={v => setStatusFilter(v as typeof statusFilter)} options={[
                { value: 'all', label: 'All Status' },
                { value: 'open', label: 'Open' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'resolved', label: 'Resolved' },
              ]} />
              <FilterSelect value={priorityFilter} onChange={v => setPriorityFilter(v as typeof priorityFilter)} options={[
                { value: 'all', label: 'All Priority' },
                { value: 'high', label: '🔴 High' },
                { value: 'medium', label: '🟡 Medium' },
                { value: 'low', label: '🟢 Low' },
              ]} />
              <FilterSelect value={issueFilter} onChange={v => setIssueFilter(v as typeof issueFilter)} options={[
                { value: 'all', label: 'All Issues' },
                ...Object.entries(ISSUE_LABELS).map(([k, v]) => ({ value: k, label: v })),
              ]} />
            </div>

            <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap flex-shrink-0">
              <Plus size={15} /> New Ticket
            </button>
          </div>

          {(statusFilter !== 'all' || priorityFilter !== 'all' || issueFilter !== 'all') && (
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Filter size={11} /> Active filters:</span>
              {statusFilter !== 'all' && <Chip label={`Status: ${STATUS_LABELS[statusFilter as SupportTicket['status']]}`} onRemove={() => setStatusFilter('all')} />}
              {priorityFilter !== 'all' && <Chip label={`Priority: ${PRIORITY_CONFIG[priorityFilter as SupportTicket['priority']].label}`} onRemove={() => setPriorityFilter('all')} />}
              {issueFilter !== 'all' && <Chip label={`Issue: ${ISSUE_LABELS[issueFilter as SupportTicket['issue']]}`} onRemove={() => setIssueFilter('all')} />}
            </div>
          )}
        </div>

        {/* Tickets Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Tickets <span className="ml-1.5 text-xs font-normal text-muted-foreground">({filtered.length})</span></span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Ticket size={32} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No tickets found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your filters or create a new ticket</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Ticket ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Student / Lead</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Issue Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Description</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Priority</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Assigned To</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Created</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(ticket => {
                    const p = PRIORITY_CONFIG[ticket.priority];
                    return (
                      <tr key={ticket.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3"><span className="font-mono text-xs font-semibold text-primary">{ticket.ticketId}</span></td>
                        <td className="px-4 py-3"><p className="font-medium text-foreground">{ticket.studentName ?? '—'}</p>{ticket.leadId && <p className="text-xs text-muted-foreground">{ticket.leadId}</p>}</td>
                        <td className="px-4 py-3"><span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ISSUE_COLORS[ticket.issue])}>{ISSUE_LABELS[ticket.issue]}</span></td>
                        <td className="px-4 py-3 max-w-xs"><p className="text-sm text-foreground truncate" title={ticket.description}>{ticket.description.length > 60 ? ticket.description.slice(0, 60) + '…' : ticket.description}</p></td>
                        <td className="px-4 py-3"><span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', p.badge)}>{p.dot} {p.label}</span></td>
                        <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                        <td className="px-4 py-3"><p className="text-xs text-muted-foreground">{ticket.assignedTo ?? <span className="italic text-muted-foreground/60">Unassigned</span>}</p></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatTicketDate(ticket.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <ActionBtn title="View" icon={<Eye size={13} />} onClick={() => setViewTicket(ticket)} />
                            {ticket.status !== 'resolved' && <ActionBtn title="Resolve" icon={<CheckCircle2 size={13} />} onClick={() => setViewTicket(ticket)} className="text-green-600 hover:bg-green-50" />}
                            <ActionBtn title="Assign" icon={<UserCheck size={13} />} onClick={() => handleAssign(ticket)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showCreate && <CreateTicketModal open={showCreate} onClose={() => setShowCreate(false)} />}
      {viewTicket && <DetailModal ticket={viewTicket} onClose={() => setViewTicket(null)} />}
    </AppLayout>
  );
}

// ─── Tiny Helpers ─────────────────────────────────────────────────────────────

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="text-sm rounded-md border border-input bg-background px-2.5 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-primary/60 ml-0.5"><X size={10} /></button>
    </span>
  );
}

function ActionBtn({ title, icon, onClick, className }: { title: string; icon: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <button title={title} onClick={onClick} className={cn('w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors', className)}>
      {icon}
    </button>
  );
}