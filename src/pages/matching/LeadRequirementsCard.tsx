import type { Lead } from '../../types';
import { cn } from '../../lib/utils';
import { BookOpen, MapPin, Clock, Wallet, User2, Monitor } from 'lucide-react';

interface Props { lead: Lead }

const Row = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon size={13} className="mt-0.5 text-primary flex-shrink-0" />
      <span className="text-muted-foreground font-medium w-24 flex-shrink-0">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
};

export default function LeadRequirementsCard({ lead }: Props) {
  return (
    <div className="bg-secondary/40 border border-border rounded-lg p-4 space-y-2.5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Requirements</h3>
        <span className={cn('status-badge', 'bg-violet-100 text-violet-800')}>{lead.status.replace(/_/g, ' ')}</span>
      </div>
      <Row icon={BookOpen} label="Class/Board" value={`Class ${lead.class}${lead.board ? ` · ${lead.board}` : ''}`} />
      <Row icon={Monitor} label="Mode" value={lead.mode} />
      <Row icon={MapPin} label="Location" value={lead.location || lead.zone} />
      <Row icon={Wallet} label="Budget" value={lead.budget} />
      <Row icon={Clock} label="Timings" value={lead.preferredTimings} />
      <Row icon={User2} label="Gender Pref." value={lead.genderPreference?.replace('_', ' ')} />
      <div className="pt-1">
        <p className="text-xs text-muted-foreground font-medium mb-1.5">Subjects Needed</p>
        <div className="flex flex-wrap gap-1.5">
          {lead.subjects.map((s) => (
            <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
