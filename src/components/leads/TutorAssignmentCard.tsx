import { useState } from 'react';
import { Calendar, Clock, Star, MessageSquare, CheckCircle2, XCircle, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, formatDate } from '@/lib/utils';
import type { TutorAssignment } from '@/types';

interface Props {
  assignment: TutorAssignment;
  onUpdate: (id: string, data: Partial<TutorAssignment>) => void;
  onSelect: (id: string) => void;
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  demo_scheduled: 'bg-blue-100 text-blue-700',
  demo_completed: 'bg-purple-100 text-purple-700',
  selected: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
};

// Simple icon mapping - using only valid icons
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock size={12} />;
    case 'demo_scheduled':
      return <Calendar size={12} />;
    case 'demo_completed':
      return <CheckCircle2 size={12} />;
    case 'selected':
      return <UserCheck size={12} />;
    case 'rejected':
      return <XCircle size={12} />;
    case 'confirmed':
      return <CheckCircle2 size={12} />;
    default:
      return <Clock size={12} />;
  }
};

export default function TutorAssignmentCard({ assignment, onUpdate, onSelect }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [feedback, setFeedback] = useState(assignment.feedback || '');
  const [rating, setRating] = useState(assignment.rating || 0);
  const [status, setStatus] = useState(assignment.status);
  const [demoDate, setDemoDate] = useState(assignment.demoDate || '');
  const [demoTime, setDemoTime] = useState(assignment.demoTime || '');
  const [saving, setSaving] = useState(false);

  const handleSaveFeedback = async () => {
    setSaving(true);
    try {
      await onUpdate(assignment.id, {
        feedback,
        rating,
        status,
        demoDate: demoDate || undefined,
        demoTime: demoTime || undefined,
      });
      setIsExpanded(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border rounded-lg bg-card hover:shadow-md transition-shadow">
      {/* Header - Always visible */}
      <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">
              {assignment.tutorName?.charAt(0) || 'T'}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-foreground">{assignment.tutorName}</h4>
              <span className="text-xs text-muted-foreground font-mono">{assignment.tutorCode}</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar size={12} />
                Assigned: {formatDate(assignment.assignedDate)}
              </span>
              {assignment.demoDate && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={12} />
                  Demo: {formatDate(assignment.demoDate)} {assignment.demoTime && `at ${assignment.demoTime}`}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Rating Stars */}
          {assignment.rating ? (
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={14} className={n <= (assignment.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'} />
              ))}
            </div>
          ) : null}

          {/* Status Badge */}
          <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1', STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100')}>
            {getStatusIcon(status)}
            {status.replace(/_/g, ' ')}
          </span>

          {/* Expand/Collapse Icon */}
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
            {isExpanded ? '−' : '+'}
          </Button>
        </div>
      </div>

      {/* Expanded Feedback Form */}
      {isExpanded && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Demo Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Demo Date</label>
              <Input
                type="date"
                value={demoDate}
                onChange={(e) => setDemoDate(e.target.value)}
                className="h-8"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Demo Time</label>
              <Input
                type="time"
                value={demoTime}
                onChange={(e) => setDemoTime(e.target.value)}
                className="h-8"
              />
            </div>
          </div>

          {/* Status Update */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="demo_scheduled">Demo Scheduled</SelectItem>
                <SelectItem value="demo_completed">Demo Completed</SelectItem>
                <SelectItem value="selected">Selected</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rating */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star size={20} className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'} />
                </button>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
              <MessageSquare size={14} /> Feedback Notes
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Write feedback about the tutor's demo performance..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveFeedback}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Feedback'}
            </Button>
            {status === 'selected' && (
              <Button
                size="sm"
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => onSelect(assignment.id)}
              >
                Confirm Tutor
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}