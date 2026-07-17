import { useState, useMemo } from 'react';
import { CalendarDays, List, CalendarCheck, Star, Clock, ChevronDown, ChevronUp, Users, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import { useLeads, updateLead } from '../hooks/useLeads';
import { useTutors } from '../hooks/useTutors';
import type { Lead, TutorAssignment } from '../types';
import { cn, formatDate, getStatusColor } from '../lib/utils';
import ScheduleDemoModal from './demos/ScheduleDemoModal';
import DemoFeedbackModal from '../components/demos/DemoFeedbackModal';
import DemoCalendarView from './demos/DemoCalendarView';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  demo_scheduled: 'bg-blue-100 text-blue-700',
  demo_completed: 'bg-purple-100 text-purple-700',
  selected: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

type ViewMode = 'list' | 'calendar';

function StatusBadge({ status }: { status: string }) {
  return <span className={cn('status-badge', getStatusColor(status))}>{status.replace(/_/g, ' ')}</span>;
}

function EmptyDemos() {
  return (
    <tr>
      <td colSpan={9} className="py-14 text-center text-sm text-muted-foreground">
        <CalendarCheck size={28} className="mx-auto mb-2 text-muted-foreground/40" />
        No demo records found
       </td>
     </tr>
  );
}

export default function DemoSchedulingPage() {
  const { leads, loading, refreshLeads } = useLeads();
  const { tutors } = useTutors();
  const [view, setView] = useState<ViewMode>('list');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<{ lead: Lead; tutorId: string } | null>(null);
  const [feedbackData, setFeedbackData] = useState<{ lead: Lead; tutorId: string } | null>(null);
  const [filterTutor, setFilterTutor] = useState<string>('all');

  // Get all leads that have tutor assignments
  const leadsWithAssignments = useMemo(() => {
    return leads.filter(l => l.tutorAssignments && l.tutorAssignments.length > 0);
  }, [leads]);
const handleFeedbackSaved = async () => {
  console.log('Feedback saved, refreshing leads...');
  await refreshLeads();
};
  // Flatten all assignments for display
  const allDemoEntries = useMemo(() => {
    const entries: Array<{ lead: Lead; assignment: TutorAssignment }> = [];
    
    leadsWithAssignments.forEach(lead => {
      lead.tutorAssignments?.forEach(assignment => {
        // Only show assignments that are in demo flow (not cancelled)
        if (['pending', 'demo_scheduled', 'demo_completed', 'selected', 'rejected'].includes(assignment.status)) {
          entries.push({ lead, assignment });
        }
      });
    });

    // Filter by tutor if selected
    if (filterTutor !== 'all') {
      return entries.filter(e => e.assignment.tutorId === filterTutor);
    }

    // Filter by date if in calendar view with selected day
    if (view === 'calendar' && selectedDay) {
      return entries.filter(e => e.assignment.demoDate?.startsWith(selectedDay));
    }

    return entries;
  }, [leadsWithAssignments, filterTutor, view, selectedDay]);

  const getTutorName = (id?: string) => {
    if (!id) return '—';
    return tutors.find((t) => t.id === id)?.name ?? id;
  };

  // ========== HANDLER FUNCTIONS ==========
  const handleSchedule = (lead: Lead, tutorId: string) => {
    setScheduleData({ lead, tutorId });
  };

  const handleCompleteDemo = async (leadId: string, assignmentId?: string) => {
    if (!confirm('Mark this demo as completed?')) return;
    
    try {
      if (assignmentId) {
        const lead = leads.find(l => l.id === leadId);
        if (lead && lead.tutorAssignments) {
          const updatedAssignments = lead.tutorAssignments.map(assignment => {
            if (assignment.id === assignmentId) {
              return {
                ...assignment,
                status: 'demo_completed',
                completedAt: new Date().toISOString()
              };
            }
            return assignment;
          });
          
          await updateLead(leadId, { tutorAssignments: updatedAssignments });
          toast.success('Demo marked as completed');
          await refreshLeads();
        }
      }
    } catch (error) {
      console.error('Error completing demo:', error);
      toast.error('Failed to mark demo as completed');
    }
  };

  const handleCancel = async (leadId: string, assignmentId?: string) => {
    if (!confirm('Are you sure you want to cancel this demo?')) return;
    
    try {
      if (assignmentId) {
        const lead = leads.find(l => l.id === leadId);
        if (lead && lead.tutorAssignments) {
          const updatedAssignments = lead.tutorAssignments.map(assignment => {
            if (assignment.id === assignmentId) {
              return {
                ...assignment,
                status: 'cancelled',
                demoDate: null,
                demoTime: null,
                cancelledAt: new Date().toISOString()
              };
            }
            return assignment;
          });
          
          const updateData: any = {
            tutorAssignments: updatedAssignments,
            updatedAt: new Date().toISOString()
          };
          
          const hasOtherScheduled = updatedAssignments.some(a => a.status === 'demo_scheduled' && a.demoDate);
          if (!hasOtherScheduled) {
            updateData.status = 'new';
          }
          
          await updateLead(leadId, updateData);
          toast.success('Demo cancelled successfully');
          await refreshLeads();
        }
      }
    } catch (error) {
      console.error('Error cancelling demo:', error);
    }
  };

  const handleGiveFeedback = (lead: Lead, tutorId: string) => {
    setFeedbackData({ lead, tutorId });
  };

  // Get unique tutors for filter dropdown
  const uniqueTutors = useMemo(() => {
    const tutorIds = new Set<string>();
    allDemoEntries.forEach(e => tutorIds.add(e.assignment.tutorId));
    return tutors.filter(t => tutorIds.has(t.id));
  }, [allDemoEntries, tutors]);

  return (
    <AppLayout title="Demo Scheduling">
      <div className="p-5 space-y-5 animate-fade-in">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <p className="text-xs text-muted-foreground">
              {allDemoEntries.length} demo{allDemoEntries.length !== 1 ? 's' : ''} scheduled
            </p>
            
            {/* Tutor Filter */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-muted-foreground" />
              <select
                value={filterTutor}
                onChange={(e) => setFilterTutor(e.target.value)}
                className="text-xs bg-background border border-border rounded px-2 py-1"
              >
                <option value="all">All Tutors</option>
                {uniqueTutors.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
              {(['list', 'calendar'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => { setView(v); setSelectedDay(null); }}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                    view === v ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                  {v === 'list' ? <List size={13} /> : <CalendarDays size={13} />}
                  {v === 'list' ? 'List View' : 'Calendar'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar view */}
        {view === 'calendar' && (
          <div className="space-y-4">
            <DemoCalendarView 
              leads={leadsWithAssignments} 
              onSelectDay={(d) => setSelectedDay(d === selectedDay ? null : d)} 
            />
            {selectedDay && (
              <div className="text-sm text-muted-foreground font-medium">
                Showing demos for {formatDate(selectedDay)} ({allDemoEntries.length} results)
              </div>
            )}
          </div>
        )}

        {/* Demos Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {view === 'calendar' && selectedDay && (
            <div className="px-5 py-3 border-b border-border text-sm font-medium text-foreground">
              Demos on {formatDate(selectedDay)}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="w-8 px-4 py-3"></th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Lead ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Tutor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Date & Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Feedback</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Rating</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-muted rounded w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : allDemoEntries.length === 0 ? (
                  <EmptyDemos />
                ) : (
                  allDemoEntries.map(({ lead, assignment }) => (
                    <TutorAssignmentRow
                      key={`${lead.id}-${assignment.id}`}
                      assignment={assignment}
                      lead={lead}
                      tutors={tutors}
                      onSchedule={handleSchedule}
                      onComplete={handleCompleteDemo}
                      onFeedback={handleGiveFeedback}
                      onCancel={handleCancel}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Section */}
        {allDemoEntries.length > 0 && (
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 flex items-center gap-1">
              <Users size={14} /> Demo Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="text-xl font-bold text-primary">{allDemoEntries.length}</p>
                <p className="text-[10px] text-muted-foreground">Total Demos</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2 text-center">
                <p className="text-xl font-bold text-blue-600">
                  {allDemoEntries.filter(e => e.assignment.status === 'demo_scheduled').length}
                </p>
                <p className="text-[10px] text-blue-600">Scheduled</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-2 text-center">
                <p className="text-xl font-bold text-purple-600">
                  {allDemoEntries.filter(e => e.assignment.status === 'demo_completed').length}
                </p>
                <p className="text-[10px] text-purple-600">Completed</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <p className="text-xl font-bold text-green-600">
                  {allDemoEntries.filter(e => e.assignment.status === 'selected').length}
                </p>
                <p className="text-[10px] text-green-600">Selected</p>
              </div>
              <div className="bg-red-50 rounded-lg p-2 text-center">
                <p className="text-xl font-bold text-red-600">
                  {allDemoEntries.filter(e => e.assignment.status === 'rejected').length}
                </p>
                <p className="text-[10px] text-red-600">Rejected</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {scheduleData && (
        <ScheduleDemoModal
          open={!!scheduleData}
          onClose={() => setScheduleData(null)}
          lead={scheduleData.lead}
          tutorId={scheduleData.tutorId}
          tutors={tutors}
        />
      )}
      
      {feedbackData && (
  <DemoFeedbackModal
    open={!!feedbackData}
    onClose={() => setFeedbackData(null)}
    lead={feedbackData.lead}
    tutorId={feedbackData.tutorId}
    onFeedbackSaved={handleFeedbackSaved}
  />
)}
    </AppLayout>
  );
}

// TutorAssignmentRow Component
function TutorAssignmentRow({ 
  assignment, 
  lead,
  tutors,
  onSchedule,
  onComplete,
  onFeedback,
  onCancel 
}: { 
  assignment: TutorAssignment; 
  lead: Lead;
  tutors: any[];
  onSchedule: (lead: Lead, tutorId: string) => void;
  onComplete: (leadId: string, assignmentId?: string) => void;
  onFeedback: (lead: Lead, tutorId: string) => void;
  onCancel: (leadId: string, assignmentId?: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const tutor = tutors.find(t => t.id === assignment.tutorId);

  return (
    <>
      <tr className="hover:bg-muted/20 transition-colors border-t border-border/50">
        <td className="px-4 py-2 pl-8">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </td>
        <td className="px-4 py-2">
          <span className="font-mono text-xs text-muted-foreground">{lead.leadId}</span>
        </td>
        <td className="px-4 py-2">
          <p className="font-medium text-foreground text-sm">{lead.studentName}</p>
          <p className="text-xs text-muted-foreground">Class {lead.class}</p>
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {assignment.tutorName?.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{assignment.tutorName}</p>
              <p className="text-xs text-muted-foreground font-mono">{assignment.tutorCode}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-2 whitespace-nowrap">
          {assignment.demoDate ? (
            <div>
              <p className="text-sm text-foreground">{formatDate(assignment.demoDate)}</p>
              {assignment.demoTime && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={10} />{assignment.demoTime}
                </p>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">Not scheduled</span>
          )}
        </td>
        <td className="px-4 py-2">
          <span className={cn('text-xs px-2 py-0.5 rounded-full', STATUS_COLORS[assignment.status] || 'bg-gray-100 text-gray-700')}>
            {assignment.status.replace(/_/g, ' ')}
          </span>
        </td>
        <td className="px-4 py-2 max-w-[140px]">
          <p className="text-xs text-muted-foreground truncate">
            {assignment.feedback || '—'}
          </p>
        </td>
        <td className="px-4 py-2">
          {assignment.rating ? (
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={11} className={i < assignment.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/20'} />
              ))}
              <span className="text-xs text-muted-foreground ml-1">({assignment.rating}/5)</span>
            </div>
          ) : <span className="text-xs text-muted-foreground">—</span>}
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {assignment.status !== 'demo_completed' && assignment.status !== 'selected' && assignment.status !== 'rejected' && (
              <button
                onClick={() => onSchedule(lead, assignment.tutorId)}
                className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-colors"
              >
                {assignment.demoDate ? 'Reschedule' : 'Schedule'}
              </button>
            )}

            {assignment.status === 'demo_scheduled' && (
              <button
                onClick={() => onComplete(lead.id, assignment.id)}
                className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 font-medium transition-colors"
              >
                ✓ Complete
              </button>
            )}

            {assignment.status === 'demo_completed' && (
              <button
                onClick={() => onFeedback(lead, assignment.tutorId)}
                className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium transition-colors"
              >
                ⭐ Feedback
              </button>
            )}

            {assignment.status === 'demo_scheduled' && (
              <button
                onClick={() => onCancel(lead.id, assignment.id)}
                className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
              >
                ✕ Cancel
              </button>
            )}
          </div>
        </td>
      </tr>
      
      {/* Expanded Feedback View */}
      {expanded && (
        <tr className="bg-muted/20">
          <td colSpan={9} className="px-4 py-3">
            <div className="pl-8 border-l-2 border-primary/30 space-y-3">
              {/* Feedback Section */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <span>📝 Demo Feedback</span>
                </p>
                <p className="text-sm text-foreground bg-background p-3 rounded-lg border border-border">
                  {assignment.feedback || 'No feedback provided yet'}
                </p>
              </div>
              
              {/* Demo Rating */}
              {assignment.rating && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <span>⭐ Demo Rating</span>
                  </p>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} size={14} className={i < assignment.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">({assignment.rating}/5)</span>
                  </div>
                </div>
              )}
              
              {/* Demo Details */}
              {assignment.demoDate && (
                <div className="grid grid-cols-2 gap-4 bg-background/50 p-3 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Demo Date & Time</p>
                    <p className="text-sm text-foreground">
                      {formatDate(assignment.demoDate)} {assignment.demoTime && `at ${assignment.demoTime}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Current Status</p>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full inline-block mt-1', STATUS_COLORS[assignment.status] || 'bg-gray-100')}>
                      {assignment.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Additional Notes */}
              {assignment.notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Additional Notes</p>
                  <p className="text-sm text-foreground bg-background p-2 rounded-lg border border-border">
                    {assignment.notes}
                  </p>
                </div>
              )}
              
              {/* Assignment Info */}
              <div className="text-xs text-muted-foreground border-t border-border/50 pt-2 mt-2">
                <p>Assigned: {formatDate(assignment.assignedDate)}</p>
                {assignment.feedbackDate && <p>Feedback given: {formatDate(assignment.feedbackDate)}</p>}
                {assignment.completedAt && <p>Completed: {formatDate(assignment.completedAt)}</p>}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}