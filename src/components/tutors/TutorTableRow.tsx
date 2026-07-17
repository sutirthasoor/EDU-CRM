import { memo } from 'react';
import { Pencil, Trash2, Star, Camera, GraduationCap, School, Building2, BookOpen, MapPin, Layers, Download, User, Heart } from 'lucide-react';
import { generateTutorProfilePDF } from '@/utils/tutorPdfGenerator';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Tutor } from '@/types';

interface Props {
  tutor: Tutor;
  onEdit: (t: Tutor) => void;
  onDelete: (t: Tutor) => void;
  onToggleStatus: (t: Tutor) => void;
}

const MODE_COLORS: Record<string, string> = {
  home: 'bg-blue-100 text-blue-700',
  online: 'bg-purple-100 text-purple-700',
  both: 'bg-teal-100 text-teal-700',
};

const TutorTableRow = memo(({ tutor, onEdit, onDelete, onToggleStatus }: Props) => {
  const subjects = tutor.subjectsHandled ?? [];
  const classes = tutor.classesHandled ?? [];
  const shownSubjects = subjects.slice(0, 2);
  const extraSubjects = subjects.length - 2;
  const shownClasses = classes.slice(0, 2);
  const extraClasses = classes.length - 2;
  const preferredAreas = tutor.preferredAreas ?? [];

  const handleDeleteClick = () => {
    if (typeof onDelete === 'function') {
      onDelete(tutor);
    }
  };
  
  const handleDownloadProfile = () => {
    try {
      generateTutorProfilePDF(tutor);
      toast.success('Profile PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate profile PDF');
    }
  };
  
  const handleEditClick = () => {
    if (typeof onEdit === 'function') {
      onEdit(tutor);
    }
  };

  const handleToggleClick = () => {
    if (typeof onToggleStatus === 'function') {
      onToggleStatus(tutor);
    }
  };

  return (
    <tr className="hover:bg-muted/30 transition-colors group">
      {/* 1. Photo */}
      <td className="px-4 py-3">
        {tutor.photoBase64 ? (
          <img 
            src={tutor.photoBase64} 
            alt={tutor.name} 
            className="w-10 h-10 rounded-full object-cover border-2 border-border"
            loading="lazy"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border-2 border-border">
            <Camera size={16} className="text-muted-foreground" />
          </div>
        )}
      </td>
      
      {/* 2. Tutor ID */}
      <td className="px-4 py-3">
        <span className="font-mono text-xs font-semibold text-primary">{tutor.tutorId}</span>
      </td>
      
      {/* 3. Name & Contact */}
      <td className="px-4 py-3">
        <p className="font-medium text-foreground text-sm">{tutor.name}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <span>📞</span> {tutor.phone}
        </p>
        {tutor.email && (
          <p className="text-xs text-muted-foreground truncate max-w-[150px] flex items-center gap-1">
            <span>✉️</span> {tutor.email}
          </p>
        )}
      </td>
      
      {/* 4. Location */}
      <td className="px-4 py-3 max-w-[200px]">
        <div className="space-y-1">
          {tutor.zone && (
            <div className="flex items-center gap-1 text-xs font-medium text-foreground">
              <MapPin size={12} className="text-primary flex-shrink-0" />
              <span>{tutor.zone}</span>
            </div>
          )}
          {tutor.area && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground pl-4">
              <Layers size={10} className="text-muted-foreground/70 flex-shrink-0" />
              <span>{tutor.area}</span>
            </div>
          )}
          {tutor.subArea && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground pl-8">
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
              <span>{tutor.subArea}</span>
            </div>
          )}
        </div>
      </td>
      
      {/* 5. Preferred Areas */}
      <td className="px-4 py-3 max-w-[180px]">
        <div className="space-y-1">
          {preferredAreas.length > 0 ? (
            <>
              <div className="flex items-center gap-1 text-xs font-medium text-primary">
                <Heart size={12} />
                <span>Preferred Areas</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {preferredAreas.slice(0, 3).map((area) => (
                  <span key={area} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    {area}
                  </span>
                ))}
                {preferredAreas.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{preferredAreas.length - 3}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span className="text-xs text-muted-foreground/60 italic">—</span>
          )}
        </div>
      </td>
      
      {/* 6. Present Qualification */}
      <td className="px-4 py-3 max-w-[200px]">
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">{tutor.presentQualification || '—'}</p>
          {tutor.presentCollegeName && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 size={10} />
              {tutor.presentCollegeName}
            </p>
          )}
        </div>
      </td>
      
      {/* 7. Last Qualification */}
      <td className="px-4 py-3 max-w-[200px]">
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">{tutor.lastQualification || '—'}</p>
          {tutor.lastCollegeName && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 size={10} />
              {tutor.lastCollegeName}
            </p>
          )}
        </div>
      </td>
      
      {/* 8. Class 12 Details (Replacing Extra Qualification) */}
      <td className="px-4 py-3 max-w-[180px]">
        <div className="space-y-1">
          {tutor.class12SchoolName && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <School size={10} className="text-primary flex-shrink-0" />
              <span className="truncate">{tutor.class12SchoolName}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-1">
            {tutor.class12Board && (
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                {tutor.class12Board}
              </span>
            )}
            {tutor.class12Stream && (
              <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded capitalize">
                {tutor.class12Stream}
              </span>
            )}
            {tutor.class12Year && (
              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                {tutor.class12Year}
              </span>
            )}
          </div>
          {!tutor.class12SchoolName && !tutor.class12Board && !tutor.class12Stream && (
            <span className="text-xs text-muted-foreground/60 italic">—</span>
          )}
        </div>
      </td>
      
      {/* 9. About Me */}
      <td className="px-4 py-3 max-w-[200px]">
        {tutor.aboutMe ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs font-medium text-primary">
              <User size={12} />
              <span>About</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {tutor.aboutMe}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/60 italic">—</span>
        )}
      </td>
      
      {/* 10. Classes Handled */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {shownClasses.map((cls) => (
            <span key={cls} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
              {cls}
            </span>
          ))}
          {extraClasses > 0 && (
            <span className="text-[10px] text-muted-foreground">+{extraClasses}</span>
          )}
          {classes.length === 0 && (
            <span className="text-xs text-muted-foreground/60 italic">—</span>
          )}
        </div>
      </td>
      
      {/* 11. Subjects Handled */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {shownSubjects.map((s) => (
            <span key={s} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
              {s}
            </span>
          ))}
          {extraSubjects > 0 && (
            <span className="text-[10px] text-muted-foreground">+{extraSubjects}</span>
          )}
          {subjects.length === 0 && (
            <span className="text-xs text-muted-foreground/60 italic">—</span>
          )}
        </div>
      </td>
      
      {/* 12. Mode */}
      <td className="px-4 py-3">
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', 
          MODE_COLORS[tutor.preferredMode] ?? 'bg-gray-100 text-gray-700'
        )}>
          {tutor.preferredMode}
        </span>
      </td>
      
      {/* 13. Experience */}
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {tutor.teachingExperience || '—'}
      </td>
      
      {/* 14. Fee Range */}
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {tutor.feeRange || '—'}
      </td>
      
      {/* 15. Rating */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} size={12}
              className={cn(n <= (tutor.rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
          ))}
          <span className="text-xs text-muted-foreground ml-1">{tutor.rating ?? 0}</span>
        </div>
      </td>
      
      {/* 16. Status */}
      <td className="px-4 py-3">
        <button onClick={handleToggleClick}
          className={cn('text-xs px-2.5 py-0.5 rounded-full font-medium transition-colors cursor-pointer',
            tutor.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
          )}>
          {tutor.isActive ? 'Active' : 'Inactive'}
        </button>
      </td>
      
      {/* 17. Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon-sm" onClick={handleDownloadProfile} title="Download Profile">
            <Download size={13} className="text-primary" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleEditClick} title="Edit">
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleDeleteClick} title="Delete"
            className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 size={13} />
          </Button>
        </div>
      </td>
    </tr>
  );
});

TutorTableRow.displayName = 'TutorTableRow';

export default TutorTableRow;