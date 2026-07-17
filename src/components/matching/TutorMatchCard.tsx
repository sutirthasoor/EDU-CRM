import { Check, Star, MapPin, BookOpen, Clock, IndianRupee, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tutor, Lead } from '@/types';

interface Props {
  tutor: Tutor;
  lead: Lead;
  selected?: boolean;
  onToggle?: (id: string) => void;
  onViewProfile?: (tutor: Tutor) => void;  // NEW prop
}

export default function TutorMatchCard({ tutor, lead, selected, onToggle, onViewProfile }: Props) {
  // Calculate match score based on lead requirements
  console.log('TutorMatchCard rendered:', tutor.name, 'has onViewProfile:', !!onViewProfile);

  const calculateMatchScore = (tutor: Tutor, lead: Lead): number => {
    let score = 0;
    
    // Subject match (40 points)
    const subjectMatch = tutor.subjectsHandled?.filter(s => lead.subjects?.includes(s)).length || 0;
    score += (subjectMatch / (lead.subjects?.length || 1)) * 40;
    
    // Mode match (20 points)
    if (tutor.preferredMode === lead.mode || tutor.preferredMode === 'both') {
      score += 20;
    }
    
    // Zone match (20 points)
    if (tutor.zone === lead.zone) {
      score += 20;
    }
    
    // Rating (20 points)
    score += (tutor.rating || 0) * 4;
    
    return Math.round(score);
  };

  const matchScore = calculateMatchScore(tutor, lead);

  // Handle card click for selection
  const handleCardClick = () => {
    if (onToggle) {
      onToggle(tutor.id);
    }
  };

  // Handle view profile button click (prevents triggering card selection)
  const handleViewProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();  // Prevents the card click from firing
    if (onViewProfile) {
      onViewProfile(tutor);
    }
  };

  // Handle select button click (prevents triggering card selection)
  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();  // Prevents the card click from firing
    if (onToggle) {
      onToggle(tutor.id);
    }
  };

  const isAlreadyAssigned = lead.tutorAssignments?.some(a => a.tutorId === tutor.id);

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'relative p-4 border rounded-lg transition-all cursor-pointer',
        selected 
          ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
          : 'border-border hover:border-primary/50 hover:bg-muted/30'
      )}
    >
      {/* Selection Checkmark */}
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md">
          <Check size={14} className="text-white" />
        </div>
      )}

      {/* Match Score Badge */}
      <div className={cn(
        'absolute top-3 left-3 text-xs font-medium px-2 py-1 rounded-full',
        matchScore >= 80 ? 'bg-green-100 text-green-700' :
        matchScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
        'bg-gray-100 text-gray-700'
      )}>
        {matchScore}% Match
      </div>

      {/* Tutor Info */}
      <div className="mt-8">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border-2 border-primary/20">
            {tutor.photoBase64 ? (
              <img 
                src={tutor.photoBase64} 
                alt={tutor.name} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-xl font-semibold text-primary">
                {tutor.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground">{tutor.name}</h3>
              <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                {tutor.tutorId}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
              {/* Subjects */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BookOpen size={12} className="text-primary" />
                <span className="truncate">
                  {tutor.subjectsHandled?.slice(0, 2).join(', ')}
                  {tutor.subjectsHandled?.length > 2 && ` +${tutor.subjectsHandled.length - 2}`}
                </span>
              </div>

              {/* Zone */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin size={12} className="text-primary" />
                <span>{tutor.zone || 'No zone'}</span>
              </div>

              {/* Experience */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock size={12} className="text-primary" />
                <span>{tutor.teachingExperience || '0'} yrs</span>
              </div>

              {/* Fee */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <IndianRupee size={12} className="text-primary" />
                <span>{tutor.feeRange || 'Negotiable'}</span>
              </div>
            </div>

            {/* Rating and Action Buttons Row */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={14}
                      className={cn(
                        n <= (tutor.rating || 0) 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'text-muted-foreground/30'
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  ({tutor.rating || 0}/5)
                </span>
              </div>
              
              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-2">
                {/* VIEW PROFILE BUTTON */}
                {/* VIEW PROFILE BUTTON */}
<button
  onClick={handleViewProfileClick}
  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm font-medium"
  title="View Full Profile"
>
  <Eye size={12} />
  View Profile
</button>
                  <Eye size={12} />
                  View Profile
                </button>
                
                {/* SELECT BUTTON - only show if not already assigned */}
                {onToggle && !isAlreadyAssigned && (
                  <button
                    onClick={handleSelectClick}
                    className={cn(
                      'flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors',
                      selected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}
                  >
                    <Check size={12} />
                    {selected ? 'Selected' : 'Select'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Already Assigned Indicator */}
      {isAlreadyAssigned && (
        <div className="absolute bottom-3 right-3 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
          Already Assigned
        </div>
      )}
    </div>
  );
}