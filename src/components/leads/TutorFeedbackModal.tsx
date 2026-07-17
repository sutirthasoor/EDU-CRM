import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, Calendar, Clock, MessageSquare, UserCheck, Award } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import type { Tutor } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  tutor: Tutor | null;
  leadName?: string;
}

export default function TutorFeedbackModal({ open, onClose, tutor, leadName }: Props) {
  if (!tutor) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck size={18} className="text-primary" />
            Tutor Feedback Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Tutor Header */}
          <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xl font-semibold text-primary">
                {tutor.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">{tutor.name}</h3>
              <p className="text-xs text-muted-foreground font-mono">{tutor.tutorId}</p>
              {leadName && (
                <p className="text-xs text-primary mt-1">Feedback for: {leadName}</p>
              )}
            </div>
          </div>

          {/* Rating Section */}
          {tutor.rating ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-amber-600" />
                  <span className="font-medium text-amber-700">Overall Rating</span>
                </div>
                <span className="text-sm font-semibold text-amber-700">{tutor.rating}/5</span>
              </div>
              <div className="flex items-center gap-1 justify-center py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={28}
                    className={cn(
                      star <= tutor.rating! 
                        ? 'fill-amber-400 text-amber-400' 
                        : 'text-muted-foreground/30'
                    )}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">No rating available</p>
            </div>
          )}

          {/* Feedback Comment */}
          {tutor.ratingComment ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-primary" />
                <span className="text-sm font-medium text-foreground">Feedback Comment</span>
              </div>
              <div className="bg-muted/20 p-4 rounded-lg border border-border">
                <p className="text-sm text-foreground leading-relaxed">"{tutor.ratingComment}"</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Feedback Comment</span>
              </div>
              <div className="bg-muted/20 p-4 rounded-lg border border-border text-center">
                <p className="text-sm text-muted-foreground italic">No feedback comment provided</p>
              </div>
            </div>
          )}

          {/* Tutor Details Grid */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-muted/10 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar size={12} /> Experience
              </p>
              <p className="text-sm font-medium text-foreground">
                {tutor.teachingExperience || 'Not specified'}
              </p>
            </div>
            <div className="bg-muted/10 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Clock size={12} /> Availability
              </p>
              <p className="text-sm font-medium text-foreground">
                {tutor.availability || 'Not specified'}
              </p>
            </div>
          </div>

          {/* Subjects */}
          {tutor.subjectsHandled && tutor.subjectsHandled.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Subjects Handled</p>
              <div className="flex flex-wrap gap-1.5">
                {tutor.subjectsHandled.map((subject) => (
                  <span key={subject} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Classes */}
          {tutor.classesHandled && tutor.classesHandled.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Classes Handled</p>
              <div className="flex flex-wrap gap-1.5">
                {tutor.classesHandled.map((cls) => (
                  <span key={cls} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                    Class {cls}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}