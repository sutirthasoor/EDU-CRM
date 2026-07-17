import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, LayoutList, Kanban, Search, Download, Shield, Trash2, Edit, Star } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import LeadFormModal from '../components/leads/LeadFormModal';
import LeadTableView from '../components/leads/LeadTableView';
import KanbanView from '../components/leads/KanbanView';
import LeadDetailModal from '../components/leads/LeadDetailModal';
import TutorFeedbackModal from '../components/leads/TutorFeedbackModal';
import { useLeadsPaginated, addLead, updateLead, deleteLead } from '../hooks/useLeads';
import { useTutors } from '../hooks/useTutors';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import type { Lead, LeadStatus } from '../types';
import { generateRequirementPosterPDF } from '../utils/pdfGenerator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import toast from 'react-hot-toast';

type ViewMode = 'table' | 'kanban';

const SOURCES = ['website', 'whatsapp', 'phone', 'referral', 'walk_in', 'ads'] as const;
const STATUS_LIST: LeadStatus[] = [
  'new', 'contacted', 'requirement_collected', 'profiles_sent', 'awaiting_approval',
  'demo_scheduled', 'demo_completed', 'feedback_received', 'tutor_approved',
  'tutor_confirmed', 'converted', 'lost',
];

// Helper to safely format date from Firestore Timestamp
const formatDateSafe = (dateValue: any): string => {
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

// Helper to get Date object from any date value
const getDateFromLead = (lead: Lead): Date | null => {
  if (!lead.createdAt) return null;
  
  try {
    if (lead.createdAt?.toDate && typeof lead.createdAt.toDate === 'function') {
      const d = lead.createdAt.toDate();
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof lead.createdAt === 'string') {
      const d = new Date(lead.createdAt);
      return isNaN(d.getTime()) ? null : d;
    }
    if (lead.createdAt instanceof Date) {
      return isNaN(lead.createdAt.getTime()) ? null : lead.createdAt;
    }
    return null;
  } catch {
    return null;
  }
};

// Rating Modal Component
function RatingModal({ 
  open, 
  onClose, 
  lead, 
  onRatingSubmit 
}: { 
  open: boolean; 
  onClose: () => void; 
  lead: Lead | null; 
  onRatingSubmit: (leadId: string, rating: number, comment: string) => Promise<void>;
}) {
  const [rating, setRating] = useState(lead?.rating || 0);
  const [comment, setComment] = useState(lead?.ratingComment || '');
  const [hoverRating, setHoverRating] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lead) {
      setRating(lead.rating || 0);
      setComment(lead.ratingComment || '');
    }
  }, [lead, open]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!lead) return;
    
    setSaving(true);
    try {
      await onRatingSubmit(lead.id, rating, comment);
      toast.success('Rating saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving rating:', error);
      toast.error('Failed to save rating');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="text-amber-400" />
            Rate Lead
          </DialogTitle>
          {lead && (
            <p className="text-sm text-muted-foreground mt-1">
              {lead.studentName} • {lead.leadId}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Rating *</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={cn(
                      'transition-colors',
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground'
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {rating === 5 && '⭐ Excellent lead - Highly promising'}
                {rating === 4 && '👍 Good lead - Strong potential'}
                {rating === 3 && '📌 Average lead - May convert with effort'}
                {rating === 2 && '⚠️ Below average - Low priority'}
                {rating === 1 && '❌ Poor lead - Unlikely to convert'}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Comments (Optional)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add notes about this lead's quality, potential, special requirements..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Rating'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatsBar({ leads }: { leads: Lead[] }) {
  const stats = [
    { label: 'Total', value: leads?.length || 0, color: 'text-foreground' },
    { label: 'New', value: leads?.filter((l) => l.status === 'new').length || 0, color: 'text-blue-600' },
    { label: 'In Progress', value: leads?.filter((l) => !['new', 'converted', 'lost'].includes(l.status)).length || 0, color: 'text-amber-600' },
    { label: 'Converted', value: leads?.filter((l) => l.status === 'converted').length || 0, color: 'text-emerald-600' },
    { label: 'Lost', value: leads?.filter((l) => l.status === 'lost').length || 0, color: 'text-red-500' }
  ];
  return (
    <div className="flex flex-wrap gap-3">
      {stats.map(({ label, value, color }) => (
        <div key={label} className="bg-card border border-border rounded-lg px-4 py-2.5 flex items-center gap-2 shadow-sm">
          <span className={cn('text-xl font-bold tabular-nums', color)}>{value}</span>
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function LeadsPage() {
  const { 
    leads, 
    loading, 
    loadingMore, 
    hasMore, 
    loadLeads, 
    loadMore 
  } = useLeadsPaginated(30);
  const { tutors } = useTutors();
  const { userRole } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState<Lead | null>(null);
  const [ratingLead, setRatingLead] = useState<Lead | null>(null);

  const [view, setView] = useState<ViewMode>('table');
  const [formOpen, setFormOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [feedbackTutor, setFeedbackTutor] = useState<{ tutor: any; leadName: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const canEdit = userRole === 'admin' || userRole === 'superadmin' || userRole === 'counsellor';
  const isSuperAdmin = userRole === 'superadmin';

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState(''); // For debounced input
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  
  const onStatusFilter = (v: string | null) => setStatusFilter(v ?? 'all');
  const onSourceFilter = (v: string | null) => setSourceFilter(v ?? 'all');
  const onUrgencyFilter = (v: string | null) => setUrgencyFilter(v ?? 'all');
  const onRatingFilter = (v: string | null) => setRatingFilter(v ?? 'all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Debounced search (300ms)
  const debounceTimer = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchInput]);

  // Reload leads when filters change
  useEffect(() => {
    loadLeads({ 
      status: statusFilter !== 'all' ? statusFilter : undefined,
      source: sourceFilter !== 'all' ? sourceFilter : undefined
    });
  }, [statusFilter, sourceFilter, loadLeads]);

  const filtered = useMemo(() => {
    if (!leads) return [];
    
    const q = search.toLowerCase();
    return leads.filter((l) => {
      const matchSearch = !q
        || l.studentName?.toLowerCase().includes(q)
        || l.phone?.includes(q)
        || l.leadId?.toLowerCase().includes(q)
        || (l.parentName ?? '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || l.status === statusFilter;
      const matchSource = sourceFilter === 'all' || l.source === sourceFilter;
      const matchUrgency = urgencyFilter === 'all' || l.urgency === urgencyFilter;
      
      const matchRating = ratingFilter === 'all' ||
        (ratingFilter === '5' && (l.rating || 0) === 5) ||
        (ratingFilter === '4' && (l.rating || 0) === 4) ||
        (ratingFilter === '3' && (l.rating || 0) === 3) ||
        (ratingFilter === 'below3' && (l.rating || 0) < 3) ||
        (ratingFilter === 'unrated' && (!l.rating || l.rating === 0));
      
      const matchDate = (() => {
        if (!dateFrom && !dateTo) return true;
        const createdDate = getDateFromLead(l);
        if (!createdDate) return true;
        
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (createdDate < fromDate) return false;
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (createdDate > toDate) return false;
        }
        return true;
      })();
      
      return matchSearch && matchStatus && matchSource && matchUrgency && matchRating && matchDate;
    });
  }, [leads, search, statusFilter, sourceFilter, urgencyFilter, ratingFilter, dateFrom, dateTo]);

  const handleAdd = async (data: Omit<Lead, 'id' | 'leadId' | 'createdAt' | 'updatedAt'>) => {
    if (!canEdit) {
      toast.error('Only admins and counselors can add leads');
      return;
    }
    setSaving(true);
    try {
      await addLead(data);
      setFormOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePoster = (lead: Lead) => {
    generateRequirementPosterPDF({
      leadId: lead.leadId,
      studentName: lead.studentName,
      subjects: lead.subjects || [],
      class: lead.class,
      budget: lead.budget || 'Negotiable',
      location: `${lead.zone || ''} ${lead.area || ''} ${lead.subArea || ''}`.trim() || 'Kolkata',
      contact: lead.phone || 'Contact us',
      requirements: lead.notes,
      postedBy: 'Excellence Consultants',
      studentGender: lead.genderPreference === 'male' ? 'Male' : lead.genderPreference === 'female' ? 'Female' : 'Not specified',
      school: lead.school || lead.guardianAddress?.split(',')[0] || 'Not specified',
      board: lead.board || 'Not specified',
      days: 'Weekly 4 Days (Monday to Thursday)',
      time: lead.preferredTimings || 'Evening',
      tuitionMode: lead.mode,
      preferredTimings: lead.preferredTimings || 'Flexible',
      startDate: lead.startDate ? new Date(lead.startDate).toLocaleDateString() : 'Immediate',
      urgency: lead.urgency || 'Medium',
    });
  };
  
  const handleEdit = async (data: Omit<Lead, 'id' | 'leadId' | 'createdAt' | 'updatedAt'>) => {
    if (!canEdit) {
      toast.error('Only admins and counselors can edit leads');
      return;
    }
    if (!editLead) return;
    setSaving(true);
    try {
      await updateLead(editLead.id, data);
      setEditLead(null);
      setFormOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLead = async (lead: Lead) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can delete leads');
      return;
    }
    try {
      await deleteLead(lead.id);
      toast.success('Lead deleted successfully');
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead');
    }
  };

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    if (!canEdit) {
      toast.error('Only admins and counselors can change lead status');
      return;
    }
    await updateLead(id, { status });
  };

  const handleRatingSubmit = async (leadId: string, rating: number, comment: string) => {
    await updateLead(leadId, { 
      rating, 
      ratingComment: comment,
      ratingDate: new Date().toISOString(),
      ratedBy: userRole || 'admin'
    });
  };

  const handleTutorClick = (tutor: any, leadName: string) => {
    setFeedbackTutor({ tutor, leadName });
  };

  const openNew = () => {
    if (!canEdit) {
      toast.error('Only admins and counselors can add leads');
      return;
    }
    setEditLead(null);
    setFormOpen(true);
  };
  
  const openEdit = (l: Lead) => {
    if (!canEdit) {
      toast.error('Only admins and counselors can edit leads');
      return;
    }
    setEditLead(l);
    setFormOpen(true);
  };

  return (
    <AppLayout title="Leads Management" onNewLead={openNew}>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-20 flex-shrink-0 p-6 space-y-5 bg-background border-b border-border shadow-sm">
          {/* Admin Badge for non-admin users */}
          {!canEdit && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
              <Shield size={16} className="text-amber-600" />
              <p className="text-xs text-amber-700">
                You are viewing leads. Only Admins, Super Admins, and Counselors can add, edit, or change lead status.
              </p>
            </div>
          )}

          {/* Stats bar */}
          <StatsBar leads={leads || []} />

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  className="pl-8 h-8" 
                  placeholder="Search name, phone, ID…" 
                  value={searchInput} 
                  onChange={(e) => setSearchInput(e.target.value)} 
                />
              </div>
              <Select value={statusFilter} onValueChange={onStatusFilter}>
                <SelectTrigger className="w-36 h-8"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_LIST.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={onSourceFilter}>
                <SelectTrigger className="w-32 h-8"><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={urgencyFilter} onValueChange={onUrgencyFilter}>
                <SelectTrigger className="w-28 h-8"><SelectValue placeholder="Urgency" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="high">🔴 High</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="low">🟢 Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ratingFilter} onValueChange={onRatingFilter}>
                <SelectTrigger className="w-28 h-8"><SelectValue placeholder="Rating" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars ⭐⭐⭐⭐⭐</SelectItem>
                  <SelectItem value="4">4 Stars ⭐⭐⭐⭐</SelectItem>
                  <SelectItem value="3">3 Stars ⭐⭐⭐</SelectItem>
                  <SelectItem value="below3">Below 3 Stars</SelectItem>
                  <SelectItem value="unrated">Unrated</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" className="h-8 w-36" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="From date" />
              <Input type="date" className="h-8 w-36" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="To date" />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setView('table')}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                    view === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>
                  <LayoutList size={13} />Table
                </button>
                <button
                  onClick={() => setView('kanban')}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                    view === 'kanban' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>
                  <Kanban size={13} />Kanban
                </button>
              </div>
            </div>
          </div>

          {/* Count row */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {leads?.length || 0} leads
            </p>
          </div>
        </div>

        {/* Scrollable Content Section */}
        <div className="flex-1 overflow-auto">
          {view === 'table' ? (
            <div className="p-6">
              <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <LeadTableView
                    leads={filtered}
                    loading={loading}
                    onView={setViewLead}
                    onEdit={openEdit}
                    onStatusChange={handleStatusChange}
                    onGeneratePoster={handleGeneratePoster}
                    onDelete={setDeleteConfirm}
                    onRate={setRatingLead}
                    tutors={tutors}
                    userRole={userRole}
                  />
                </div>
              </div>
              {/* Load More Button */}
              <div className="mt-4 text-center">
                {loadingMore && (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                )}
                {hasMore && !loadingMore && (
                  <Button variant="outline" onClick={loadMore} className="w-full">
                    Load More Leads
                  </Button>
                )}
                {!hasMore && leads.length > 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No more leads to load</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6">
              <KanbanView
                leads={filtered}
                onStatusChange={handleStatusChange}
                onEdit={openEdit}
              />
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <LeadFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditLead(null); }}
        onSubmit={editLead ? handleEdit : handleAdd}
        initial={editLead}
        loading={saving}
      />

      {/* Detail Modal */}
      <LeadDetailModal 
        lead={viewLead} 
        onClose={() => setViewLead(null)} 
        onUpdate={async (id, data) => {
          if (canEdit) {
            await updateLead(id, data);
          } else {
            toast.error('Only admins can update leads');
          }
        }}
        tutors={tutors}
      />

      {/* Rating Modal */}
      <RatingModal
        open={!!ratingLead}
        onClose={() => setRatingLead(null)}
        lead={ratingLead}
        onRatingSubmit={handleRatingSubmit}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 size={18} />
              Delete Lead
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-3">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this lead?
            </p>
            {deleteConfirm && (
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-foreground">{deleteConfirm.studentName}</p>
                <p className="text-xs text-muted-foreground">Lead ID: {deleteConfirm.leadId}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Phone: {deleteConfirm.phone}
                </p>
              </div>
            )}
            <p className="text-xs text-red-600">
              This action cannot be undone. Only Super Admins can delete leads.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirm && handleDeleteLead(deleteConfirm)}
              disabled={!isSuperAdmin}
            >
              {isSuperAdmin ? 'Delete Lead' : 'Only Super Admin can delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tutor Feedback Modal */}
      {feedbackTutor && (
        <TutorFeedbackModal
          open={!!feedbackTutor}
          onClose={() => setFeedbackTutor(null)}
          tutor={feedbackTutor.tutor}
          leadName={feedbackTutor.leadName}
        />
      )}
    </AppLayout>
  );
}