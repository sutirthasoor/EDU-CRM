import { Star, Eye, Check } from 'lucide-react';
import type { Tutor } from '../../types';
import { cn } from '../../lib/utils';
import { calculateMatchScore, getMatchBadgeColor } from './MatchScoreUtils';
import type { Lead } from '../../types';

interface Props {
  tutor: Tutor;
  lead: Lead | null;  // Make lead optional/nullable
  selected: boolean;
  onToggle: (id: string) => void;
  onViewProfile?: (tutor: Tutor) => void;
}

export default function TutorMatchCard({ tutor, lead, selected, onToggle, onViewProfile }: Props) {
  // Only calculate score if lead exists
  const score = lead ? calculateMatchScore(tutor, lead) : 0;
  const rating = tutor.rating ?? 0;

  const handleViewProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewProfile) {
      onViewProfile(tutor);
    }
  };

  const handleCardClick = () => {
    onToggle(tutor.id);
  };

  return (
    <div
      className={cn(
        'border rounded-lg p-3.5 transition-all duration-150 cursor-pointer',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div
          className={cn(
            'mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors',
            selected ? 'bg-primary border-primary' : 'border-border bg-background'
          )}
        >
          {selected && <span className="text-primary-foreground text-[10px] font-bold leading-none">✓</span>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-foreground">{tutor.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{tutor.tutorId}</p>
            </div>
            {/* Only show match score if lead exists */}
            {lead && (
              <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', getMatchBadgeColor(score))}>
                {score}% Match
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 mt-1.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={11}
                className={i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">{rating > 0 ? rating.toFixed(1) : 'No rating'}</span>
            {tutor.teachingExperience && (
              <span className="text-xs text-muted-foreground ml-2">· {tutor.teachingExperience} exp</span>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mt-2">
            {tutor.subjectsHandled.slice(0, 4).map((s) => (
              <span
                key={s}
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded',
                  lead && lead.subjects?.includes(s)  // Safely check lead subjects
                    ? 'bg-emerald-100 text-emerald-800 font-medium'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {s}
              </span>
            ))}
            {tutor.subjectsHandled.length > 4 && (
              <span className="text-xs text-muted-foreground">+{tutor.subjectsHandled.length - 4}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
            <span className="capitalize">📍 {tutor.zone || 'N/A'}</span>
            <span className="capitalize">🎓 {tutor.preferredMode}</span>
            {tutor.feeRange && <span>💰 {tutor.feeRange}</span>}
            <span className={cn('ml-auto', tutor.isActive ? 'text-emerald-600' : 'text-red-500')}>
              {tutor.isActive ? '● Active' : '● Inactive'}
            </span>
          </div>

          {/* View Profile Button */}
          <div className="mt-3 pt-2 border-t border-border">
            <button
              onClick={handleViewProfileClick}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
              <Eye size={12} />
              View Full Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}