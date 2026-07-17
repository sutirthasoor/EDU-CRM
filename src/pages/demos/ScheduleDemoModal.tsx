import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { updateLead } from '../../hooks/useLeads';
import type { Lead, Tutor } from '../../types';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
  tutors: Tutor[];
  tutorId?: string;
}

export default function ScheduleDemoModal({ open, onClose, lead, tutors, tutorId: propTutorId }: Props) {
  const [selectedTutorId, setSelectedTutorId] = useState(propTutorId || '');
  const [demoDate, setDemoDate] = useState('');
  const [demoTime, setDemoTime] = useState('');
  const [meetingType, setMeetingType] = useState<'in-person' | 'online'>('in-person');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const assignedTutors = tutors.filter((t) => lead?.assignedTutors?.includes(t.id));

  const handleSave = async () => {
    if (!demoDate) {
      toast.error('Please select a demo date');
      return;
    }

    setSaving(true);
    try {
      if (!lead) return;

      const currentAssignments = lead.tutorAssignments || [];
      const targetTutorId = selectedTutorId || propTutorId;
      
      if (targetTutorId) {
        // Update specific tutor's assignment
        const updatedAssignments = currentAssignments.map(a => 
          a.tutorId === targetTutorId 
            ? { 
                ...a, 
                demoDate, 
                // Only include demoTime if it has a value
                ...(demoTime && { demoTime }),
                meetingType,
                // Only include meetingLink if meeting type is online and link exists
                ...(meetingType === 'online' && link && { meetingLink: link }),
                // Only include notes if they have a value
                ...(notes && { notes }),
                status: 'demo_scheduled' 
              }
            : a
        );

        // Create update data WITHOUT undefined values
        const updateData: any = {
          tutorAssignments: updatedAssignments,
          status: 'demo_scheduled'
        };

        await updateLead(lead.id, updateData);

        toast.success('Demo scheduled successfully');
      } 
      else if (assignedTutors.length === 1) {
        // Create update data WITHOUT undefined values
        const updateData: any = {
          status: 'demo_scheduled',
          demoStatus: 'scheduled',
          meetingType,
        };

        // Only add fields if they have values
        if (demoDate) updateData.demoDate = demoDate;
        if (demoTime) updateData.demoTime = demoTime;
        if (meetingType === 'online' && link) updateData.meetingLink = link;
        if (notes) updateData.demoNotes = notes;
        
        await updateLead(lead.id, updateData);
        
        toast.success('Demo scheduled successfully');
      } else {
        toast.error('Please select a tutor');
        return;
      }

      onClose();
    } catch (error) {
      console.error('Error scheduling demo:', error);
      toast.error('Failed to schedule demo');
    } finally {
      setSaving(false);
    }
  };

  const getTutorName = (id: string) => {
    return tutors.find(t => t.id === id)?.name || id;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Demo Class</DialogTitle>
          {lead && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{lead.studentName} · {lead.leadId}</p>
              {propTutorId && (
                <p className="text-xs font-medium text-primary">Tutor: {getTutorName(propTutorId)}</p>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="space-y-3 py-1">
          {!propTutorId && assignedTutors.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Select Tutor</label>
              <select 
                value={selectedTutorId} 
                onChange={(e) => setSelectedTutorId(e.target.value)}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/60"
              >
                <option value="">-- Select tutor --</option>
                {assignedTutors.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.tutorId})</option>
                ))}
              </select>
            </div>
          )}

          {propTutorId && (
            <div className="bg-primary/5 p-2 rounded-lg">
              <p className="text-xs font-medium text-primary">Scheduling for: {getTutorName(propTutorId)}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Date *</label>
              <input 
                type="date" 
                value={demoDate} 
                onChange={(e) => setDemoDate(e.target.value)}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/60" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Time *</label>
              <input 
                type="time" 
                value={demoTime} 
                onChange={(e) => setDemoTime(e.target.value)}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/60" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Meeting Type</label>
            <div className="flex gap-2">
              {(['in-person', 'online'] as const).map((t) => (
                <button 
                  key={t} 
                  onClick={() => setMeetingType(t)}
                  className={`flex-1 text-sm py-1.5 rounded-lg border transition-colors ${meetingType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-background hover:bg-muted'}`}
                >
                  {t === 'in-person' ? 'In-person' : 'Online'}
                </button>
              ))}
            </div>
          </div>

          {meetingType === 'online' && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Meeting Link</label>
              <input 
                type="url" 
                value={link} 
                onChange={(e) => setLink(e.target.value)} 
                placeholder="https://meet.google.com/..."
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/60" 
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Notes</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              rows={2} 
              placeholder="Any special instructions..."
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/60 resize-none" 
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !demoDate || !demoTime || (!propTutorId && assignedTutors.length > 1 && !selectedTutorId)}
          >
            {saving ? 'Saving...' : 'Schedule Demo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}