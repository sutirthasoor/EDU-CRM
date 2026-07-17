import React, { useState, useMemo } from 'react';
import { cn, getStatusColor } from '../../lib/utils';
import { Eye, Edit, FileText, MoreVertical, MapPin, Bus, Train, Landmark, Download, Trash2, Star, Search, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import type { Lead } from '../../types';
import toast from 'react-hot-toast';

interface LeadTableViewProps {
  leads: Lead[];
  loading: boolean;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onStatusChange: (id: string, status: string) => void;
  onGeneratePoster: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
  onRate?: (lead: Lead) => void;
  tutors?: any[];
  userRole?: string | null;
}

const STATUS_LIST = [
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

// Helper to get approved tutor name
const getTutorName = (lead: Lead, tutors: any[]): string => {
  if (lead.confirmedTutorId) {
    const tutor = tutors.find(t => t.id === lead.confirmedTutorId);
    if (tutor) return tutor.name;
  }
  
  if (lead.tutorAssignments && lead.tutorAssignments.length > 0) {
    const confirmedAssignment = lead.tutorAssignments.find(a => a.status === 'confirmed');
    if (confirmedAssignment) {
      return confirmedAssignment.tutorName || 'Tutor Confirmed';
    }
    
    const selectedAssignment = lead.tutorAssignments.find(a => a.status === 'selected');
    if (selectedAssignment) {
      return selectedAssignment.tutorName || 'Tutor Selected';
    }
  }
  
  return '—';
};

export default function LeadTableView({
  leads,
  loading,
  onView,
  onEdit,
  onStatusChange,
  onGeneratePoster,
  onDelete,
  onRate,
  tutors = [],
  userRole,
}: LeadTableViewProps) {
  // NEW: Subject search state
  const [subjectSearch, setSubjectSearch] = useState('');

  // NEW: Filter leads by subject
  const filteredLeads = useMemo(() => {
    if (!subjectSearch.trim()) return leads;
    
    const searchTerm = subjectSearch.toLowerCase().trim();
    return leads.filter((lead) => {
      // Check if any subject matches the search term
      return lead.subjects?.some(subject => 
        subject.toLowerCase().includes(searchTerm)
      );
    });
  }, [leads, subjectSearch]);

  // Get unique subjects for autocomplete/dropdown (optional feature)
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    leads.forEach(lead => {
      lead.subjects?.forEach(subject => subjects.add(subject));
    });
    return Array.from(subjects).sort();
  }, [leads]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const isSuperAdmin = userRole === 'superadmin';

  return (
    <div>
      {/* NEW: Subject Search Bar */}
      <div className="p-3 border-b border-border bg-muted/20">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by subject..."
            value={subjectSearch}
            onChange={(e) => setSubjectSearch(e.target.value)}
            className="pl-9 pr-8 h-8 text-sm"
          />
          {subjectSearch && (
            <button
              onClick={() => setSubjectSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {subjectSearch && (
          <p className="text-xs text-muted-foreground mt-2">
            Showing {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} with subject matching "{subjectSearch}"
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide sticky left-0 bg-muted/50 z-20 w-[80px]">Lead ID</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide sticky left-[80px] bg-muted/50 z-20 w-[140px]">Student Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide sticky left-[220px] bg-muted/50 z-20 w-[120px]">Parent/Guardian</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[100px]">Phone</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[80px]">Class</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[180px]">Subjects</th>
<th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[160px]">School/College</th> {/* NEW COLUMN */}
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[120px]">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[200px]">Address Details</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[100px]">Source</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[80px]">Urgency</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[120px]">Counsellor</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[120px]">Approved Tutor</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[100px]">Start Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[100px]">Rating</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[120px]">Created</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide sticky right-0 bg-muted/50 z-20 w-[120px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={16} className="text-center py-12 text-muted-foreground">
                  {subjectSearch ? (
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="text-muted-foreground/30" />
                      <p>No leads found with subject matching "{subjectSearch}"</p>
                      <button
                        onClick={() => setSubjectSearch('')}
                        className="text-xs text-primary hover:underline"
                      >
                        Clear search
                      </button>
                    </div>
                  ) : (
                    'No leads found'
                  )}
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono font-medium sticky left-0 bg-card z-10">{lead.leadId}</td>
                  <td className="px-4 py-3 sticky left-[80px] bg-card z-10">
                    <div>
                      <p className="font-medium text-foreground">{lead.studentName}</p>
                      {lead.email && <p className="text-xs text-muted-foreground">{lead.email}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 sticky left-[220px] bg-card z-10">
                    <div>
                      <p className="text-sm">{lead.parentName || '—'}</p>
                      {lead.guardianName && lead.guardianName !== lead.parentName && (
                        <p className="text-xs text-muted-foreground">Guardian: {lead.guardianName}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{lead.phone}</td>
                  <td className="px-4 py-3 text-sm">{lead.class}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {lead.subjects?.slice(0, 3).map((s) => (
                        <span 
                          key={s} 
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded',
                            subjectSearch && s.toLowerCase().includes(subjectSearch.toLowerCase())
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground'
                          )}
                        >
                          {s}
                        </span>
                      ))}
                      {lead.subjects?.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{lead.subjects.length - 3}</span>
                      )}
                    </div>
                  </td>
<td className="px-4 py-3 text-sm">
  {lead.schoolCollegeName || '—'}
</td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.status}
                      onChange={(e) => onStatusChange(lead.id, e.target.value)}
                      className={cn(
                        'text-xs px-2 py-1 rounded-full border-0 cursor-pointer font-medium',
                        getStatusColor(lead.status)
                      )}
                    >
                      {STATUS_LIST.map((status) => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1 max-w-[200px]">
                      {lead.guardianAddress && (
                        <div className="flex items-start gap-1 text-xs">
                          <MapPin size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground truncate">{lead.guardianAddress}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {lead.landmark && (
                          <span className="inline-flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded">
                            <Landmark size={10} />
                            {lead.landmark}
                          </span>
                        )}
                        {lead.busStop && (
                          <span className="inline-flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded">
                            <Bus size={10} />
                            {lead.busStop}
                          </span>
                        )}
                        {lead.metroStation && (
                          <span className="inline-flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded">
                            <Train size={10} />
                            {lead.metroStation}
                          </span>
                        )}
                      </div>
                      {(lead.zone || lead.area || lead.subArea) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {[lead.zone, lead.area, lead.subArea].filter(Boolean).join(' › ')}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize">{lead.source.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      lead.urgency === 'high' ? 'bg-red-100 text-red-700' :
                      lead.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    )}>
                      {lead.urgency}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{lead.assignedCounsellor || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-primary">
                    {getTutorName(lead, tutors)}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {lead.startDate ? formatDateSafe(lead.startDate) : '—'}
                  </td>
                  {/* Rating Column */}
                  <td className="px-4 py-3">
                    {lead.rating ? (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} size={12} className={n <= lead.rating! ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">{lead.rating}/5</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onRate?.(lead)}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                      >
                        <Star size={12} /> Rate
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {formatDateSafe(lead.createdAt)}
                  </td>
                  <td className="px-4 py-3 sticky right-0 bg-card z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="h-8 w-8 flex items-center justify-center cursor-pointer hover:bg-muted rounded-md">
                          <MoreVertical className="h-4 w-4" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(lead)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(lead)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Lead
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onGeneratePoster(lead)}>
                          <FileText className="mr-2 h-4 w-4" /> Generate Poster
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRate?.(lead)}>
                          <Star className="mr-2 h-4 w-4" /> Rate Lead
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          // Download lead data as JSON
                          const leadData = JSON.stringify(lead, null, 2);
                          const blob = new Blob([leadData], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `lead_${lead.leadId}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success('Lead data downloaded');
                        }}>
                          <Download className="mr-2 h-4 w-4" /> Download Data
                        </DropdownMenuItem>
                        {isSuperAdmin && onDelete && (
                          <DropdownMenuItem 
                            onClick={() => onDelete(lead)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Lead
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}