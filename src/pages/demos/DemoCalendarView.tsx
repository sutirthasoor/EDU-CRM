import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Lead } from '../../types';
import { cn } from '../../lib/utils';

interface Props {
  leads: Lead[];
  onSelectDay: (date: string) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const STATUS_PILL: Record<string, string> = {
  scheduled: 'bg-purple-100 text-purple-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
  rescheduled: 'bg-amber-100 text-amber-800',
};

export default function DemoCalendarView({ leads, onSelectDay }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const demosByDate: Record<string, Lead[]> = {};
  leads.forEach((l) => {
    if (!l.demoDate) return;
    const d = new Date(l.demoDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate().toString();
      demosByDate[key] = [...(demosByDate[key] || []), l];
    }
  });

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayDate = now.getDate();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft size={16} />
        </button>
        <h3 className="text-sm font-semibold text-foreground">{MONTHS[month]} {year}</h3>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS.map((d) => (
          <div key={d} className="text-center py-2 text-xs font-semibold text-muted-foreground">{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          const demos = day ? (demosByDate[day.toString()] ?? []) : [];
          const isToday = isCurrentMonth && day === todayDate;
          return (
            <div
              key={idx}
              onClick={() => day && onSelectDay(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
              className={cn(
                'min-h-[80px] p-1.5 border-b border-r border-border/50 transition-colors',
                day ? 'cursor-pointer hover:bg-muted/30' : 'bg-muted/10',
                idx % 7 === 6 && 'border-r-0'
              )}
            >
              {day && (
                <>
                  <span className={cn(
                    'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1',
                    isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                  )}>{day}</span>
                  <div className="space-y-0.5">
                    {demos.slice(0, 2).map((l) => (
                      <div key={l.id} className={cn('text-[10px] px-1 rounded truncate font-medium', STATUS_PILL[l.demoStatus ?? 'scheduled'])}>
                        {l.studentName.split(' ')[0]}
                      </div>
                    ))}
                    {demos.length > 2 && (
                      <div className="text-[10px] text-muted-foreground px-1">+{demos.length - 2} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
