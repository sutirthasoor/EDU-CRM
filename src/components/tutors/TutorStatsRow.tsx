import { BookUser, Users, Star, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tutor } from '@/types';

interface Props { tutors: Tutor[]; }

export default function TutorStatsRow({ tutors }: Props) {
  const total = tutors.length;
  const active = tutors.filter((t) => t.isActive).length;

  const rated = tutors.filter((t) => (t.rating ?? 0) > 0);
  const avgRating = rated.length > 0
    ? (rated.reduce((s, t) => s + (t.rating ?? 0), 0) / rated.length).toFixed(1)
    : '—';

  const thisMonth = (() => {
    const now = new Date();
    return tutors.filter((t) => {
      if (!t.createdAt) return false;
      const d = new Date(t.createdAt as unknown as string);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  })();

  const stats = [
    { label: 'Total Tutors', value: total, icon: Users, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Active Tutors', value: active, icon: BookUser, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    { label: 'Avg Rating', value: avgRating, icon: Star, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { label: 'Added This Month', value: thisMonth, icon: CalendarPlus, iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, iconBg, iconColor }) => (
        <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
            <Icon size={18} className={iconColor} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
