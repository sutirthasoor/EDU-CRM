import { useState } from 'react';
import { cn, getStatusColor } from '@/lib/utils';
import type { Lead, LeadStatus } from '@/types';

const COLUMNS: { status: LeadStatus; label: string; color: string }[] = [
  { status: 'new', label: 'New Lead', color: 'border-t-blue-500' },
  { status: 'contacted', label: 'Contacted', color: 'border-t-yellow-500' },
  { status: 'requirement_collected', label: 'Req. Collected', color: 'border-t-violet-500' },
  { status: 'profiles_sent', label: 'Profiles Sent', color: 'border-t-cyan-500' },
  { status: 'demo_scheduled', label: 'Demo Scheduled', color: 'border-t-purple-500' },
  { status: 'demo_completed', label: 'Demo Completed', color: 'border-t-teal-500' },
  { status: 'tutor_confirmed', label: 'Tutor Confirmed', color: 'border-t-emerald-500' },
  { status: 'converted', label: 'Converted', color: 'border-t-green-600' },
];

interface Props {
  leads: Lead[];
  onStatusChange: (id: string, status: LeadStatus) => void;
  onEdit: (l: Lead) => void;
}

function KanbanCard({
  lead,
  onDragStart,
  onClick,
}: {
  lead: Lead;
  onDragStart: () => void;
  onClick: () => void;
}) {
  const subjects = lead.subjects ?? [];
  const urgencyDot = lead.urgency === 'high' ? '🔴' : lead.urgency === 'medium' ? '🟡' : '🟢';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow space-y-2 group"
    >
      <div className="flex items-start justify-between gap-1">
        <span className="font-mono text-[10px] text-primary font-semibold">{lead.leadId}</span>
        <span className="text-[10px]">{urgencyDot}</span>
      </div>
      <p className="text-xs font-semibold text-foreground leading-tight">{lead.studentName}</p>
      <p className="text-[11px] text-muted-foreground">{lead.phone}</p>
      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {subjects.slice(0, 2).map((s) => (
            <span key={s} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">{s}</span>
          ))}
          {subjects.length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{subjects.length - 2}</span>
          )}
        </div>
      )}
      {lead.assignedCounsellor && (
        <p className="text-[10px] text-muted-foreground">👤 {lead.assignedCounsellor}</p>
      )}
    </div>
  );
}

export default function KanbanView({ leads, onStatusChange, onEdit }: Props) {
  const [dragLeadId, setDragLeadId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<LeadStatus | null>(null);

  const handleDrop = (status: LeadStatus) => {
    if (dragLeadId) {
      const lead = leads.find((l) => l.id === dragLeadId);
      if (lead && lead.status !== status) {
        onStatusChange(dragLeadId, status);
      }
    }
    setDragLeadId(null);
    setDragOverCol(null);
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {COLUMNS.map(({ status, label, color }) => {
          const colLeads = leads.filter((l) => l.status === status);
          const isOver = dragOverCol === status;
          return (
            <div
              key={status}
              className={cn(
                'w-52 flex-shrink-0 rounded-xl border border-border bg-muted/30 border-t-4 transition-colors',
                color,
                isOver && 'bg-primary/5 border-primary/30'
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(status); }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={() => handleDrop(status)}
            >
              {/* Column header */}
              <div className="px-3 py-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">{label}</span>
                <span className="text-[10px] font-medium bg-background border border-border text-muted-foreground rounded-full px-1.5 py-0.5 tabular-nums">
                  {colLeads.length}
                </span>
              </div>

              {/* Cards */}
              <div className="px-2 pb-3 space-y-2 min-h-[120px]">
                {colLeads.length === 0 && (
                  <div className={cn(
                    'rounded-lg border-2 border-dashed border-border/50 h-16 flex items-center justify-center transition-colors',
                    isOver && 'border-primary/40 bg-primary/5'
                  )}>
                    <span className="text-[10px] text-muted-foreground/60">Drop here</span>
                  </div>
                )}
                {colLeads.map((lead) => (
                  <KanbanCard
                    key={lead.id}
                    lead={lead}
                    onDragStart={() => setDragLeadId(lead.id)}
                    onClick={() => onEdit(lead)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
