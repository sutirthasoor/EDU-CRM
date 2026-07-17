import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Check, X } from 'lucide-react';
import { useTutors } from '@/hooks/useTutors';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  onAssign: (tutorIds: string[]) => void;
  existingAssignments?: string[]; // Already assigned tutor IDs
}

export default function AssignTutorModal({ open, onClose, onAssign, existingAssignments = [] }: Props) {
  const { tutors } = useTutors();
  const [search, setSearch] = useState('');
  const [selectedTutors, setSelectedTutors] = useState<string[]>([]);

  const filteredTutors = tutors?.filter(t => 
    t.isActive &&
    !existingAssignments.includes(t.id) &&
    (t.name.toLowerCase().includes(search.toLowerCase()) ||
     t.tutorId.toLowerCase().includes(search.toLowerCase()) ||
     t.subjectsHandled?.some(s => s.toLowerCase().includes(search.toLowerCase())))
  );

  const toggleTutor = (tutorId: string) => {
    setSelectedTutors(prev =>
      prev.includes(tutorId)
        ? prev.filter(id => id !== tutorId)
        : [...prev, tutorId]
    );
  };

  const handleAssign = () => {
    if (selectedTutors.length === 0) {
      toast.error('Please select at least one tutor');
      return;
    }
    onAssign(selectedTutors);
    setSelectedTutors([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign Tutors to Lead</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative my-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tutors by name, ID, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tutor List */}
        <div className="flex-1 overflow-y-auto min-h-[300px] border border-border rounded-lg">
          {filteredTutors?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No tutors found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTutors?.map((tutor) => (
                <div
                  key={tutor.id}
                  onClick={() => toggleTutor(tutor.id)}
                  className={cn(
                    'p-4 flex items-center gap-4 cursor-pointer transition-colors hover:bg-muted/30',
                    selectedTutors.includes(tutor.id) && 'bg-primary/5'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                    selectedTutors.includes(tutor.id)
                      ? 'bg-primary border-primary'
                      : 'border-border'
                  )}>
                    {selectedTutors.includes(tutor.id) && (
                      <Check size={12} className="text-white" />
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {tutor.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{tutor.name}</h4>
                      <span className="text-xs text-muted-foreground font-mono">{tutor.tutorId}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tutor.subjectsHandled?.slice(0, 3).join(', ')}
                      {tutor.subjectsHandled?.length > 3 && ' ...'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Count */}
        <div className="mt-4 text-sm text-muted-foreground">
          {selectedTutors.length} tutor{selectedTutors.length !== 1 ? 's' : ''} selected
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={selectedTutors.length === 0}>
            Assign {selectedTutors.length > 0 && `(${selectedTutors.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}