
import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDate, getStatusColor, cn } from '@/lib/utils';
import { Home, MapPin, Bus, Train, Landmark, Phone, Mail, Calendar, BookOpen, GraduationCap, Users, UserCircle, UserPlus } from 'lucide-react';
import type { Lead } from '@/types';
import TutorAssignmentCard from './TutorAssignmentCard';
import AssignTutorModal from './AssignTutorModal';

interface Props {
  lead: Lead | null;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Lead>) => void;
}

const URGENCY_MAP = {
  high: { label: '🔴 High', cls: 'text-red-600' },
  medium: { label: '🟡 Medium', cls: 'text-amber-600' },
  low: { label: '🟢 Low', cls: 'text-emerald-600' },
};

export default function LeadDetailModal({ lead, onClose, onUpdate }: Props) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  if (!lead) return null;

  const urgency = URGENCY_MAP[lead.urgency] ?? { label: lead.urgency, cls: '' };
  const assignments = lead.tutorAssignments || [];

  // Calculate summary stats
  const stats = {
    total: assignments.length,
    demoScheduled: assignments.filter(a => a.status === 'demo_scheduled').length,
    demoCompleted: assignments.filter(a => a.status === 'demo_completed').length,
    selected: assignments.filter(a => a.status === 'selected').length,
    rejected: assignments.filter(a => a.status === 'rejected').length,
    pending: assignments.filter(a => a.status === 'pending').length,
    confirmed: assignments.filter(a => a.status === 'confirmed').length,
  };

  const handleAssignTutors = async (tutorIds: string[]) => {
    // Get full tutor details
    // This would need tutors data - you might want to pass tutors as prop or fetch here
    const newAssignments = tutorIds.map(tutorId => ({
      id: Date.now().toString() + Math.random(),
      tutorId,
      tutorName: 'Tutor Name', // You'll need to get this from tutors list
      tutorCode: 'TUT001', // You'll need to get this from tutors list
      assignedDate: new Date().toISOString(),
      status: 'pending' as const,
    }));

    const updatedAssignments = [...assignments, ...newAssignments];
    
    await onUpdate(lead.id, {
      tutorAssignments: updatedAssignments,
      totalTutorsAssigned: updatedAssignments.length,
    });
  };

  const handleUpdateAssignment = async (assignmentId: string, data: any) => {
    const updatedAssignments = assignments.map(a =>
      a.id === assignmentId ? { ...a, ...data } : a
    );

    // Recalculate stats
    const newStats = {
      total: updatedAssignments.length,
      demoScheduled: updatedAssignments.filter(a => a.status === 'demo_scheduled').length,
      demoCompleted: updatedAssignments.filter(a => a.status === 'demo_completed').length,
      selected: updatedAssignments.filter(a => a.status === 'selected').length,
      rejected: updatedAssignments.filter(a => a.status === 'rejected').length,
      pending: updatedAssignments.filter(a => a.status === 'pending').length,
      confirmed: updatedAssignments.filter(a => a.status === 'confirmed').length,
    };

    await onUpdate(lead.id, {
      tutorAssignments: updatedAssignments,
      totalTutorsAssigned: newStats.total,
      demoScheduled: newStats.demoScheduled,
      demoCompleted: newStats.demoCompleted,
      tutorsSelected: newStats.selected,
      tutorsRejected: newStats.rejected,
      tutorsPending: newStats.pending,
    });

    // Check if a tutor was confirmed
    const confirmedAssignment = updatedAssignments.find(a => a.status === 'confirmed');
    if (confirmedAssignment && lead.status !== 'tutor_confirmed') {
      // Move lead to tutor_confirmed
      await onUpdate(lead.id, {
        status: 'tutor_confirmed',
        confirmedTutorId: confirmedAssignment.tutorId,
      });
    }
  };

  const handleConfirmTutor = async (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    await handleUpdateAssignment(assignmentId, { status: 'confirmed' });
  };

  return (
    <Dialog open={!!lead} onOpenChange={(o) => !o && onClose()}>
      {/* INCREASED WIDTH - changed from max-w-3xl to max-w-5xl */}
      <DialogContent 
  className="w-full max-h-[90vh] overflow-y-auto" 
  style={{ maxWidth: '1400px' }}
>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base">{lead.studentName}</DialogTitle>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{lead.leadId}</p>
            </div>
            <span className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full', getStatusColor(lead.status))}>
              {lead.status.replace(/_/g, ' ')}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* ===== TUTOR ASSIGNMENT SUMMARY ===== */}
          {assignments.length > 0 && (
            <section className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 flex items-center gap-1">
                <Users size={14} /> Tutor Assignment Summary
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="text-xl font-bold text-primary">{stats.total}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <p className="text-xl font-bold text-blue-600">{stats.demoScheduled}</p>
                  <p className="text-[10px] text-blue-600">Demo Sched</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 text-center">
                  <p className="text-xl font-bold text-purple-600">{stats.demoCompleted}</p>
                  <p className="text-[10px] text-purple-600">Demo Done</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-xl font-bold text-green-600">{stats.selected}</p>
                  <p className="text-[10px] text-green-600">Selected</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2 text-center">
                  <p className="text-xl font-bold text-red-600">{stats.rejected}</p>
                  <p className="text-[10px] text-red-600">Rejected</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-2 text-center">
                  <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
                  <p className="text-[10px] text-yellow-600">Pending</p>
                </div>
              </div>
            </section>
          )}

          {/* ===== TUTOR ASSIGNMENTS LIST ===== */}
          {assignments.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 flex items-center gap-1">
                <Users size={14} /> Assigned Tutors ({assignments.length})
              </h3>
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <TutorAssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onUpdate={handleUpdateAssignment}
                    onSelect={handleConfirmTutor}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ===== GUARDIAN & ADDRESS SECTION ===== */}
          <section>
            <h3 className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 pb-1 border-b border-border flex items-center gap-1">
              <Home size={14} /> Guardian & Address
            </h3>
            {/* INCREASED TO 3 COLUMNS for better layout with more space */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <UserCircle size={16} className="text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Guardian</p>
                  <p className="text-sm font-medium">{lead.guardianName || lead.parentName || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">{lead.guardianAddress || '—'}</p>
                </div>
              </div>
              {/* Location Info - now in its own column */}
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm">
                    {lead.subArea
                      ? `${lead.subArea}, ${lead.area}, ${lead.zone}`
                      : lead.area
                      ? `${lead.area}, ${lead.zone}`
                      : lead.zone || '—'}
                  </p>
                </div>
              </div>
              
              {/* Landmark - now full width in second row */}
              {lead.landmark && (
                <div className="flex items-start gap-2 col-span-3">
                  <Landmark size={16} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Landmark</p>
                    <p className="text-sm">{lead.landmark}</p>
                  </div>
                </div>
              )}
              
              {/* Transport Info - in 2 columns */}
              <div className="grid grid-cols-2 gap-4 col-span-3">
                {lead.busStop && (
                  <div className="flex items-start gap-2">
                    <Bus size={16} className="text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Bus Stop</p>
                      <p className="text-sm">{lead.busStop}</p>
                    </div>
                  </div>
                )}
                {lead.metroStation && (
                  <div className="flex items-start gap-2">
                    <Train size={16} className="text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Metro</p>
                      <p className="text-sm">{lead.metroStation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ===== CONTACT ===== */}
          <section>
            <h3 className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 pb-1 border-b border-border flex items-center gap-1">
              <Phone size={14} /> Contact
            </h3>
            {/* INCREASED TO 3 COLUMNS */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <Phone size={16} className="text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm">{lead.phone}</p>
                </div>
              </div>
              {lead.alternatePhone && (
                <div className="flex items-start gap-2">
                  <Phone size={16} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Alternate</p>
                    <p className="text-sm">{lead.alternatePhone}</p>
                  </div>
                </div>
              )}
              {lead.email && (
                <div className="flex items-start gap-2">
                  <Mail size={16} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm">{lead.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Calendar size={16} className="text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Urgency</p>
                  <p className={cn('text-sm font-medium', urgency.cls)}>{urgency.label}</p>
                </div>
              </div>
            </div>
          </section>

          {/* ===== ACADEMIC REQUIREMENTS ===== */}
          <section>
            <h3 className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 pb-1 border-b border-border flex items-center gap-1">
              <BookOpen size={14} /> Requirements
            </h3>
            {/* INCREASED TO 3 COLUMNS */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Class/Board</p>
                <p className="text-sm">Class {lead.class} • {lead.board}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Subjects</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {lead.subjects.map((s) => (
                    <span key={s} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mode</p>
                <p className="text-sm capitalize">{lead.mode}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="text-sm">{lead.budget || '—'}</p>
              </div>
              {lead.preferredTimings && (
                <div>
                  <p className="text-xs text-muted-foreground">Preferred Timings</p>
                  <p className="text-sm">{lead.preferredTimings}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="text-sm">{lead.startDate ? formatDate(lead.startDate) : '—'}</p>
              </div>
{/* NEW: School/College Name Field */}
    <div className="col-span-3">
      <p className="text-xs text-muted-foreground">School / College</p>
      <p className="text-sm font-medium">{lead.schoolCollegeName || '—'}</p>
    </div>
    
    {/* University Field (if exists) */}
    {lead.universityName && (
      <div className="col-span-3">
        <p className="text-xs text-muted-foreground">University</p>
        <p className="text-sm">{lead.universityName}</p>
      </div>
    )}
            </div>
          </section>

          {/* ===== NOTES ===== */}
          {lead.notes && (
            <section>
              <h3 className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 pb-1 border-b border-border">Notes</h3>
              <p className="text-sm bg-muted/30 rounded-lg p-3">{lead.notes}</p>
            </section>
          )}
        </div>
      </DialogContent>

      {/* Assign Tutor Modal */}
      <AssignTutorModal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={handleAssignTutors}
        existingAssignments={assignments.map(a => a.tutorId)}
      />
    </Dialog>
  );
}