import { useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Users,
  GraduationCap,
  BookUser,
  CalendarCheck,
  IndianRupee,
  Ticket,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { useLeads } from '../hooks/useLeads';
import { useTutors } from '../hooks/useTutors';
import { usePayments } from '../hooks/usePayments';
import { useTickets } from '../hooks/useTickets';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { formatDate, formatCurrency, getStatusColor, cn } from '../lib/utils';
import type { Lead, Payment, SupportTicket, Tutor } from '../types';

// ─── Helper functions to find demo data from tutorAssignments ──────────────

function findDemoDate(lead: any): any {
  if (!lead) return null;
  
  if (lead.tutorAssignments && Array.isArray(lead.tutorAssignments)) {
    for (const assignment of lead.tutorAssignments) {
      if (assignment.demoDate) {
        return assignment.demoDate;
      }
    }
  }
  return lead.demoDate || null;
}

function findDemoTime(lead: any): string {
  if (!lead) return '';
  if (lead.tutorAssignments && Array.isArray(lead.tutorAssignments)) {
    for (const assignment of lead.tutorAssignments) {
      if (assignment.demoTime) {
        return assignment.demoTime;
      }
    }
  }
  if (lead.demoTime) return lead.demoTime;
  if (lead.demo_time) return lead.demo_time;
  if (lead.demoTimeSlot) return lead.demoTimeSlot;
  return '';
}

function findTutorForDemo(lead: any, tutors: Tutor[]): Tutor | undefined {
  if (!lead) return undefined;
  if (lead.tutorAssignments && Array.isArray(lead.tutorAssignments)) {
    for (const assignment of lead.tutorAssignments) {
      if (assignment.demoDate && assignment.tutorId) {
        return tutors.find(t => t.id === assignment.tutorId);
      }
    }
  }
  if (lead.selectedTutor) {
    return tutors.find(t => t.id === lead.selectedTutor || t.tutorId === lead.selectedTutor);
  }
  return undefined;
}

// ─── Helper to get subjects safely ─────────────────────────────────────────
function getSubjects(lead: Lead): string[] {
  if (!lead.subjects) return [];
  if (Array.isArray(lead.subjects)) return lead.subjects;
  return [];
}

// ─── Date helpers ───────────────────────────────────────────────────────────

function isThisWeek(dateValue: any): boolean {
  if (!dateValue) return false;
  let d: Date;
  try {
    if (dateValue?.toDate) {
      d = dateValue.toDate();
    } else if (typeof dateValue === 'string') {
      d = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      d = dateValue;
    } else {
      return false;
    }
  } catch {
    return false;
  }
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
}

function formatDateSafe(dateValue: any): string {
  if (!dateValue) return '—';
  try {
    if (dateValue?.toDate) return formatDate(dateValue.toDate());
    if (typeof dateValue === 'string') return formatDate(new Date(dateValue));
    if (dateValue instanceof Date) return formatDate(dateValue);
    return '—';
  } catch {
    return '—';
  }
}

// ─── Skeleton Components ────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl p-4 border border-border shadow-sm animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-muted rounded w-24" />
          <div className="h-8 bg-muted rounded w-16" />
          <div className="h-3 bg-muted rounded w-20" />
        </div>
        <div className="w-10 h-10 bg-muted rounded-lg flex-shrink-0" />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-muted rounded" style={{ width: `${40 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ─── KPI Card Component ─────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
}

function KpiCard({ label, value, icon: Icon, iconBg, iconColor, trend, trendUp, loading }: KpiCardProps) {
  if (loading) return <SkeletonCard />;
  return (
    <div className="bg-card rounded-xl p-4 border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 truncate">{label}</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
          {trend && (
            <div className={cn('flex items-center gap-1 mt-1.5', trendUp ? 'text-emerald-600' : 'text-muted-foreground')}>
              <TrendingUp size={11} />
              <span className="text-[11px] font-medium">{trend}</span>
            </div>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon size={18} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (!status) return <span className="status-badge bg-gray-100 text-gray-600">—</span>;
  return (
    <span className={cn('status-badge', getStatusColor(status))}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6',
  contacted: '#f59e0b',
  requirement_collected: '#8b5cf6',
  profiles_sent: '#06b6d4',
  awaiting_approval: '#f97316',
  demo_scheduled: '#a855f7',
  demo_completed: '#10b981',
  feedback_received: '#14b8a6',
  tutor_approved: '#22c55e',
  tutor_confirmed: '#16a34a',
  converted: '#15803d',
  lost: '#ef4444',
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

// ─── Main Dashboard Component ───────────────────────────────────────────────

export default function DashboardPage() {
  // Use the stats hook for accurate counts
  const stats = useDashboardStats();
  
  // Still need these for charts and recent data
  const { leads, loading: leadsLoading } = useLeads();
  const { tutors, loading: tutorsLoading } = useTutors();
  const { payments, loading: paymentsLoading } = usePayments();
  const { tickets, loading: ticketsLoading } = useTickets();

  const isLoading = leadsLoading || tutorsLoading || paymentsLoading || ticketsLoading || stats.loading;

  // Use stats for KPI values
  const totalLeads = stats.totalLeads;
  const activeStudents = stats.activeStudents;
  const activeTutors = stats.activeTutors;
  const demosThisWeek = stats.demosThisWeek;
  const pendingPayments = stats.pendingPayments;
  const openTickets = stats.openTickets;
  const totalRevenue = stats.totalRevenue;
  const conversionRate = stats.conversionRate;

  const leadStatusData = useMemo(() => {
    if (!leads?.length) return [];
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const status = l.status || 'new';
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([status, count]) => ({
        status: status.replace(/_/g, ' '),
        rawStatus: status,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [leads]);

  const tutorModeData = useMemo(() => {
    if (!tutors?.length) return [];
    const counts = { home: 0, online: 0, both: 0 };
    tutors.forEach((t) => {
      if (t.preferredMode === 'home') counts.home++;
      else if (t.preferredMode === 'online') counts.online++;
      else if (t.preferredMode === 'both') counts.both++;
    });
    return [
      { name: 'Home', value: counts.home },
      { name: 'Online', value: counts.online },
      { name: 'Both', value: counts.both },
    ].filter((d) => d.value > 0);
  }, [tutors]);

  const recentLeads = useMemo(() => {
    if (!leads?.length) return [];
    return [...leads]
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 10);
  }, [leads]);

  const upcomingDemos = useMemo(() => {
    if (!leads || !Array.isArray(leads)) return [];
    return leads.filter(lead => lead && lead.status === 'demo_scheduled').slice(0, 5);
  }, [leads]);

  const pendingPaymentsList = useMemo(() => {
    if (!payments) return [];
    return payments.filter((p) => p.status === 'pending' || p.status === 'overdue').slice(0, 5);
  }, [payments]);

  return (
    <AppLayout title="Dashboard">
      <div className="p-6 space-y-6">
        {/* KPI Cards - Using stats for accurate counts */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard 
              label="Total Leads" 
              value={totalLeads} 
              icon={Users} 
              iconBg="bg-blue-100" 
              iconColor="text-blue-600" 
              loading={stats.loading} 
            />
            <KpiCard 
              label="Active Students" 
              value={activeStudents} 
              icon={GraduationCap} 
              iconBg="bg-emerald-100" 
              iconColor="text-emerald-600" 
              loading={stats.loading} 
            />
            <KpiCard 
              label="Active Tutors" 
              value={activeTutors} 
              icon={BookUser} 
              iconBg="bg-violet-100" 
              iconColor="text-violet-600" 
              loading={stats.loading} 
            />
            <KpiCard 
              label="Demos This Week" 
              value={demosThisWeek} 
              icon={CalendarCheck} 
              iconBg="bg-amber-100" 
              iconColor="text-amber-600" 
              loading={stats.loading} 
            />
            <KpiCard 
              label="Pending Payments" 
              value={pendingPayments} 
              icon={IndianRupee} 
              iconBg="bg-orange-100" 
              iconColor="text-orange-600" 
              loading={stats.loading} 
            />
            <KpiCard 
              label="Open Tickets" 
              value={openTickets} 
              icon={Ticket} 
              iconBg="bg-red-100" 
              iconColor="text-red-600" 
              loading={stats.loading} 
            />
          </div>
        </section>

        {/* Revenue Card - Shows Revenue, Payouts, and Net Profit */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard 
              label="Total Revenue" 
              value={formatCurrency(stats.totalRevenue)} 
              icon={IndianRupee} 
              iconBg="bg-green-100" 
              iconColor="text-green-600" 
              loading={stats.loading} 
            />
            <KpiCard 
              label="Tutor Payouts" 
              value={formatCurrency(stats.totalPayouts)} 
              icon={Users} 
              iconBg="bg-red-100" 
              iconColor="text-red-600" 
              loading={stats.loading} 
            />
            <KpiCard 
              label="Net Profit" 
              value={formatCurrency(stats.netProfit)} 
              icon={TrendingUp} 
              iconBg={stats.netProfit >= 0 ? "bg-blue-100" : "bg-red-100"} 
              iconColor={stats.netProfit >= 0 ? "text-blue-600" : "text-red-600"} 
              loading={stats.loading} 
            />
          </div>
        </section>

        {/* Charts Row */}
        <section className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-3 bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Lead Status Distribution</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Breakdown of all leads by current status</p>
              </div>
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md">{totalLeads} total</span>
            </div>
            {leadsLoading ? (
              <div className="h-52 bg-muted rounded-lg animate-pulse" />
            ) : leadStatusData.length === 0 ? (
              <EmptyChart label="No lead data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={leadStatusData} margin={{ top: 4, right: 4, bottom: 20, left: -20 }}>
                  <XAxis dataKey="status" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]} maxBarSize={36}>
                    {leadStatusData.map((entry) => (
                      <Cell key={entry.rawStatus} fill={STATUS_COLORS[entry.rawStatus] || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="xl:col-span-2 bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-foreground">Tutor Mode Distribution</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Teaching mode preference of active tutors</p>
            </div>
            {tutorsLoading ? (
              <div className="h-52 bg-muted rounded-lg animate-pulse" />
            ) : tutorModeData.length === 0 ? (
              <EmptyChart label="No tutor data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={tutorModeData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {tutorModeData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ fontSize: '12px' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Recent Leads Table */}
        <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Recent Leads</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Latest 10 leads sorted by date</p>
            </div>
            <a href="/leads" className="text-xs font-medium text-primary hover:text-primary/80">View all →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Lead ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Student Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Subject(s)</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Counsellor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leadsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : recentLeads.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No leads found</td></tr>
                ) : (
                  recentLeads.map((lead) => {
                    const subjects = getSubjects(lead);
                    return (
                      <tr key={lead.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => window.location.href = `/leads?view=${lead.id}`}>
                        <td className="px-4 py-3"><span className="font-mono text-xs font-medium text-primary">{lead.leadId || '—'}</span></td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{lead.studentName || '—'}</p>
                          {lead.parentName && <p className="text-xs text-muted-foreground">Parent: {lead.parentName}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {subjects.length === 0 ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              <>
                                {subjects.slice(0, 2).map((s) => (
                                  <span key={s} className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">{s}</span>
                                ))}
                                {subjects.length > 2 && <span className="text-xs text-muted-foreground">+{subjects.length - 2}</span>}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{lead.assignedCounsellor || <span className="italic">Unassigned</span>}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDateSafe(lead.createdAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bottom Row */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-6">
          {/* Upcoming Demos */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                  <CalendarCheck size={13} className="text-amber-600" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">Upcoming Demos</h2>
              </div>
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {upcomingDemos.length} scheduled
              </span>
            </div>
            <div className="divide-y divide-border">
              {leadsLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse h-12 bg-muted rounded-lg" />
                  ))}
                </div>
              ) : upcomingDemos.length === 0 ? (
                <EmptyState icon={CalendarCheck} label="No demos scheduled" />
              ) : (
                upcomingDemos.map((lead) => (
                  <DemoRow key={lead.id} lead={lead} />
                ))
              )}
            </div>
          </div>

          {/* Pending Payments */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-orange-100 flex items-center justify-center">
                  <IndianRupee size={13} className="text-orange-600" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">Pending Payments</h2>
              </div>
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">{pendingPayments} pending</span>
            </div>
            <div className="divide-y divide-border">
              {paymentsLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="animate-pulse h-12 bg-muted rounded-lg" />)}
                </div>
              ) : pendingPaymentsList.length === 0 ? (
                <EmptyState icon={CheckCircle2} label="All payments up to date" />
              ) : (
                pendingPaymentsList.map((payment) => <PaymentRow key={payment.id} payment={payment} />)
              )}
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-52 flex flex-col items-center justify-center gap-2 text-muted-foreground">
      <AlertCircle size={28} className="opacity-30" />
      <p className="text-xs">{label}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
      <Icon size={24} className="opacity-25" />
      <p className="text-xs">{label}</p>
    </div>
  );
}

function DemoRow({ lead }: { lead: Lead }) {
  if (!lead) return null;
  const subjects = getSubjects(lead);
  
  return (
    <div 
      className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 cursor-pointer" 
      onClick={() => window.location.href = `/leads?view=${lead.id}`}
    >
      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
        <CalendarCheck size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{lead.studentName || '—'}</p>
        <p className="text-xs text-muted-foreground truncate">
          {subjects.length === 0 ? 'No subjects' : subjects.slice(0, 2).join(', ')}
        </p>
        <p className="text-[10px] text-primary mt-0.5">
          Status: {lead.status?.replace(/_/g, ' ')}
        </p>
      </div>
    </div>
  );
}

function PaymentRow({ payment }: { payment: Payment }) {
  const isOverdue = payment.status === 'overdue';
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', isOverdue ? 'bg-red-100' : 'bg-orange-100')}>
        <IndianRupee size={14} className={isOverdue ? 'text-red-600' : 'text-orange-600'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{payment.studentName || '—'}</p>
        <p className="text-xs text-muted-foreground">Due: {payment.dueDate ? formatDateSafe(payment.dueDate) : '—'}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(payment.amount)}</span>
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', isOverdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}>
          {isOverdue ? 'Overdue' : 'Pending'}
        </span>
      </div>
    </div>
  );
}