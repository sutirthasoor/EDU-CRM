import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateLead } from '@/hooks/useLeads';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  lead: any;
  tutorId: string;
  onFeedbackSaved?: () => void;
}

export default function DemoFeedbackModal({ open, onClose, lead, tutorId, onFeedbackSaved }: Props) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [outcome, setOutcome] = useState<'selected' | 'rejected'>('selected');

  const assignment = lead?.tutorAssignments?.find((a: any) => a.tutorId === tutorId);

  useEffect(() => {
    if (assignment) {
      setRating(assignment.rating || 0);
      setFeedback(assignment.feedback || '');
      // Check if there's an existing outcome
      if (assignment.status === 'rejected') {
        setOutcome('rejected');
      } else {
        setOutcome('selected');
      }
    } else {
      setRating(0);
      setFeedback('');
      setOutcome('selected');
    }
  }, [assignment, open]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    setSaving(true);
    try {
      const updatedAssignments = lead.tutorAssignments.map((a: any) => {
        if (a.tutorId === tutorId) {
          return {
            ...a,
            rating,
            feedback,
            feedbackDate: new Date().toISOString(),
            status: outcome // 'selected' or 'rejected'
          };
        }
        return a;
      });

      await updateLead(lead.id, {
        tutorAssignments: updatedAssignments
      });

      toast.success(`Demo ${outcome === 'selected' ? 'approved' : 'rejected'} successfully`);
      
      if (onFeedbackSaved) {
        await onFeedbackSaved();
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Failed to save feedback');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Demo Feedback</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {lead?.studentName} • Tutor: {assignment?.tutorName}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Rating */}
          <div>
            <label className="text-sm font-medium mb-2 block">Rating *</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none"
                >
                  <Star
                    size={24}
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
          </div>

          {/* Outcome Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Outcome *</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOutcome('selected')}
                className={cn(
                  'flex-1 text-sm py-2 rounded-lg border font-medium transition-colors',
                  outcome === 'selected'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-border bg-background hover:bg-muted'
                )}
              >
                ✅ Approve Tutor
              </button>
              <button
                type="button"
                onClick={() => setOutcome('rejected')}
                className={cn(
                  'flex-1 text-sm py-2 rounded-lg border font-medium transition-colors',
                  outcome === 'rejected'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'border-border bg-background hover:bg-muted'
                )}
              >
                ❌ Reject Tutor
              </button>
            </div>
          </div>

          {/* Feedback Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block">Feedback Notes</label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Write your feedback about the demo..."
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : outcome === 'selected' ? 'Approve & Save' : 'Reject & Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}