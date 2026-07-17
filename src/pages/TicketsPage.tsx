console.log('===================');
console.log('TICKETS PAGE LOADED - VERSION WITH SEARCH BAR');
console.log('===================');
throw new Error('IF YOU SEE THIS ERROR, THE FILE IS LOADING!');
import { useState, useMemo, useEffect } from 'react';
import { Plus, Ticket, CheckCircle2, Clock, AlertCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import { useTickets, addTicket, updateTicket } from '../hooks/useTickets';
import { useLeads } from '../hooks/useLeads';
import { cn, formatDate, getStatusColor } from '../lib/utils';
import type { SupportTicket, TicketStatus } from '../types';

const ISSUE_LABELS: Record<string, string> = {
  tutor_absent: 'Tutor Absent',
  student_absent: 'Student Absent',
  timing_conflict: 'Timing Conflict',
  performance: 'Performance Issue',
  replacement_request: 'Replacement Request',
  other: 'Other',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

const STATUS_ICONS: Record<TicketStatus, React.ElementType> = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle2,
};

function TicketFormModal({
  open,
  onClose,
  ticket,
}: {
  open: boolean;
  onClose: () => void;
  ticket?: SupportTicket | null;
}) {
console.log('🔥 USING THE CORRECT MODAL WITH SEARCH BAR');
  const { leads } = useLeads();
  const [form, setForm] = useState({
    studentName: ticket?.studentName ?? '',
    issue: ticket?.issue ?? 'tutor_absent',
    description: ticket?.description ?? '',
    priority: ticket?.priority ?? 'medium',
    assignedTo: ticket?.assignedTo ?? '',
    resolution: ticket?.resolution ?? '',
    status: ticket?.status ?? 'open',
    leadId: ticket?.leadId ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [searchLead, setSearchLead] = useState('');
  const [showLeadSearch, setShowLeadSearch] = useState(false);

  const set = (key: string, val: string | null) => setForm((f) => ({ ...f, [key]: val ?? '' }));

  // Filter leads based on search
  const filteredLeads = useMemo(() => {
    if (!searchLead) return leads;
    return leads.filter(lead => 
      lead.studentName?.toLowerCase().includes(searchLead.toLowerCase()) ||
      lead.leadId?.toLowerCase().includes(searchLead.toLowerCase()) ||
      lead.phone?.includes(searchLead)
    );
  }, [leads, searchLead]);

  // Handle lead selection
  const handleSelectLead = (lead: any) => {
    setForm(f => ({ 
      ...f, 
      leadId: lead.id,
      studentName: lead.studentName
    }));
    setSearchLead('');
    setShowLeadSearch(false);
  };

  // Clear lead selection
  const handleClearLead = () => {
    setForm(f => ({ ...f, leadId: '', studentName: '' }));
    setSearchLead('');
  };

  const handleSave = async () => {
    if (!form.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    
    setSaving(true);
    try {
      // Prepare ticket data with safe values
      const ticketData = {
        studentName: form.studentName || '',
        issue: form.issue || 'tutor_absent',
        description: form.description || '',
        priority: form.priority || 'medium',
        assignedTo: form.assignedTo || '',
        resolution: form.resolution || '',
        leadId: form.leadId || '',
      };

      console.log('📝 SENDING TICKET DATA:', JSON.stringify(ticketData, null, 2));

      if (ticket) {
        // Update existing ticket
        await updateTicket(ticket.id, {
          ...ticketData,
          status: form.status || 'open',
        });
        toast.success('Ticket updated successfully');
      } else {
        // Create new ticket
        await addTicket({
          ...ticketData,
          status: 'open',
        });
        toast.success('Ticket created successfully');
      }
      
      onClose();
    } catch (error) {
      console.error('❌ Error saving ticket:', error);
      toast.error('Failed to save ticket');
    } finally {
      setSaving(false);
    }
  };

  // Find selected lead details
  const selectedLead = leads.find(l => l.id === form.leadId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {ticket ? 'Update Ticket' : 'Create Support Ticket'}
          {/* Add a badge to confirm it's the new version */}
          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            v2.0
          </span>
        </DialogTitle>
      </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Student Name</label>
              <Input 
                value={form.studentName} 
                onChange={(e) => set('studentName', e.target.value)} 
                placeholder="Student name" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Linked Lead</label>
              <div className="relative">
                {form.leadId && selectedLead ? (
                  <div className="flex items-center justify-between p-2 border border-border rounded-md bg-muted/30">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{selectedLead.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedLead.leadId} | {selectedLead.phone}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearLead}
                      className="h-7 px-2"
                    >
                      Clear
                    </Button>
                  </div>
                ) : (
                  <>
                    <Input
                      placeholder="Search by name, ID, or phone..."
                      value={searchLead}
                      onChange={(e) => {
                        setSearchLead(e.target.value);
                        setShowLeadSearch(true);
                      }}
                      onFocus={() => setShowLeadSearch(true)}
                    />
                    {showLeadSearch && searchLead && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-card border border-border rounded-md shadow-lg z-10">
                        {filteredLeads.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground text-center">
                            No leads found
                          </div>
                        ) : (
                          filteredLeads.map((lead) => (
                            <button
                              key={lead.id}
                              className="w-full text-left p-2 hover:bg-muted transition-colors border-b border-border last:border-0"
                              onClick={() => handleSelectLead(lead)}
                            >
                              <p className="text-sm font-medium">{lead.studentName}</p>
                              <p className="text-xs text-muted-foreground">
                                {lead.leadId} | {lead.phone}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Issue Type</label>
              <Select value={form.issue} onValueChange={(v) => set('issue', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ISSUE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Priority</label>
              <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Description *</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground resize-none outline-none focus:border-primary transition-colors"
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Describe the issue in detail..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Assigned To</label>
            <Input 
              value={form.assignedTo} 
              onChange={(e) => set('assignedTo', e.target.value)} 
              placeholder="Staff member name" 
            />
          </div>
          {ticket && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Resolution Notes</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground resize-none outline-none focus:border-primary transition-colors"
                  rows={2}
                  value={form.resolution}
                  onChange={(e) => set('resolution', e.target.value)}
                  placeholder="How was this issue resolved?"
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : ticket ? 'Update Ticket' : 'Create Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TicketsPage() {
  const { tickets, loading } = useTickets();
  const [formOpen, setFormOpen] = useState(false);
  const [editTicket, setEditTicket] = useState<SupportTicket | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const onStatus = (v: string | null) => setFilterStatus(v ?? 'all');
  const onPriority = (v: string | null) => setFilterPriority(v ?? 'all');

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch =
        !search ||
        t.studentName?.toLowerCase().includes(search.toLowerCase()) ||
        t.ticketId.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tickets, search, filterStatus, filterPriority]);

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  };

  return (
    <AppLayout title="Support Tickets">
      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Tickets', value: stats.total, color: 'text-foreground', bg: 'bg-muted/40' },
            { label: 'Open', value: stats.open, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Resolved', value: stats.resolved, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={cn('rounded-xl p-4 border border-border shadow-sm', bg)}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
              <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={onStatus}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={onPriority}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => { setEditTicket(null); setFormOpen(true); }}>
            <Plus size={14} className="mr-1.5" />
            New Ticket
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Ticket ID', 'Student', 'Issue', 'Priority', 'Status', 'Assigned To', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-muted rounded w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-14 text-muted-foreground">
                      <Ticket size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">No tickets found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((ticket) => {
                    const StatusIcon = STATUS_ICONS[ticket.status];
                    return (
                      <tr key={ticket.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-medium text-primary">{ticket.ticketId}</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {ticket.studentName || <span className="italic text-muted-foreground/60">—</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {ISSUE_LABELS[ticket.issue] || ticket.issue}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', PRIORITY_COLORS[ticket.priority])}>
                            {ticket.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <StatusIcon size={13} className={cn(
                              ticket.status === 'open' ? 'text-red-500' :
                              ticket.status === 'in_progress' ? 'text-amber-500' :
                              'text-emerald-500'
                            )} />
                            <span className={cn('status-badge', getStatusColor(ticket.status))}>
                              {ticket.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {ticket.assignedTo || <span className="italic opacity-60">Unassigned</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                          {ticket.createdAt ? formatDate(ticket.createdAt) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setEditTicket(ticket); setFormOpen(true); }}
                            className="h-7 px-2 text-xs"
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <TicketFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTicket(null); }}
        ticket={editTicket}
      />
    </AppLayout>
  );
}
