import { useState } from 'react';
import { Search } from 'lucide-react';
import type { Lead } from '../../types';
import { cn } from '../../lib/utils';

interface Props {
  leads: Lead[];
  selectedId: string | null;
  onSelect: (lead: Lead) => void;
}

const ELIGIBLE_STATUSES = ['requirement_collected', 'profiles_sent', 'awaiting_approval'];

export default function LeadPickerPanel({ leads, selectedId, onSelect }: Props) {
  const [search, setSearch] = useState('');

  const eligible = leads.filter(
    (l) =>
      ELIGIBLE_STATUSES.includes(l.status) &&
      (l.studentName.toLowerCase().includes(search.toLowerCase()) ||
        l.leadId.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground mb-3">Select Lead</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-lg outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {eligible.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            <p className="font-medium">No eligible leads</p>
            <p className="text-xs mt-1">Leads need 'requirement collected' status</p>
          </div>
        ) : (
          eligible.map((lead) => (
            <button
              key={lead.id}
              onClick={() => onSelect(lead)}
              className={cn(
                'w-full text-left px-4 py-3 transition-colors hover:bg-muted/40',
                selectedId === lead.id ? 'bg-primary/5 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{lead.studentName}</p>
                  <p className="text-xs font-mono text-muted-foreground">{lead.leadId}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">Class {lead.class}</p>
                  <p className="text-xs text-primary font-medium capitalize">{lead.mode}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {lead.subjects.slice(0, 3).map((s) => (
                  <span key={s} className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                    {s}
                  </span>
                ))}
                {lead.subjects.length > 3 && (
                  <span className="text-xs text-muted-foreground">+{lead.subjects.length - 3}</span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
