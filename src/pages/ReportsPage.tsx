import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, CartesianGrid,
} from 'recharts';
import {
  Users, BookUser, TrendingUp, IndianRupee, Target, Printer,
  Download, ArrowUpRight, CheckCircle2, Clock, Lock,
  Activity, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import { useReportsStats } from '../hooks/useReportsStats';
import { useAuth } from '../contexts/AuthContext';
import { cn, formatCurrency } from '../lib/utils';

// ─── Colors ──────────────────────────────────────────────────────────────────

const CHART_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

// ─── Reusable UI ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, target, icon: Icon, status }: {
  label: string; value: string; target: string; icon: React.ElementType; status: 'good' | 'warn' | 'info';
}) {
  const statusColors = { good: 'text-green-600 bg-green-100', warn: 'text-amber-600 bg-amber-100', info: 'text-blue-600 bg-blue-100' };
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', statusColors[status])}>
          <Icon size={16} />
        </div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">Target: {target}</p>
    </div>
  );
}

function ChartCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-md text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value.toLocaleString()}</span></p>
      ))}
    </div>
  );
};

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({ stats }: { stats: any }) {
  const sourceData = Object.entries(stats.leadsBySource).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
  const convRate = stats.totalLeads ? Math.round((stats.convertedLeads / stats.totalLeads) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard label="Total Leads" value={stats.totalLeads.toLocaleString()} icon={Users} color="bg-blue-500" />
        <SummaryCard label="Conversions" value={stats.convertedLeads.toLocaleString()} icon={CheckCircle2} color="bg-green-500" />
        <SummaryCard label="Conv. Rate" value={`${convRate}%`} icon={TrendingUp} color="bg-purple-500" />
        <SummaryCard label="Active Tutors" value={stats.activeTutors.toLocaleString()} icon={BookUser} color="bg-amber-500" />
        <SummaryCard label="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={IndianRupee} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Monthly Leads vs Conversions">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.leadsByMonth} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="count" name="Leads" fill="#2563eb" radius={[3, 3, 0, 0]} />
              <Bar dataKey="conversions" name="Conversions" fill="#16a34a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue Trend">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={stats.revenueByMonth} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, fill: '#7c3aed' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Lead Source Distribution">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                {sourceData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 min-w-max">
            {sourceData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-xs text-muted-foreground capitalize">{s.name}</span>
                <span className="text-xs font-semibold text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

// ─── Tab: Lead Reports ────────────────────────────────────────────────────────

function LeadReportsTab({ stats }: { stats: any }) {
  const statusData = Object.entries(stats.leadsByStatus)
    .map(([status, count]) => ({ status: status.replace(/_/g, ' '), count }))
    .sort((a, b) => b.count - a.count);
  const sourceData = Object.entries(stats.leadsBySource).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Lead Status Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData} layout="vertical" margin={{ left: 10, right: 20, top: 4, bottom: 4 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis dataKey="status" type="category" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Leads" fill="#2563eb" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Lead Source Analysis">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {sourceData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ─── Tab: Tutor Reports ───────────────────────────────────────────────────────

function TutorReportsTab({ stats }: { stats: any }) {
  const zoneData = Object.entries(stats.tutorsByZone).map(([zone, count]) => ({ zone, count })).sort((a, b) => b.count - a.count);
  const active = stats.activeTutors;
  const inactive = stats.totalTutors - active;

  const activeInactiveData = [
    { name: 'Active', value: active },
    { name: 'Inactive', value: inactive },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Tutors" value={stats.totalTutors.toLocaleString()} icon={BookUser} color="bg-blue-500" />
        <SummaryCard label="Active" value={active.toLocaleString()} icon={CheckCircle2} color="bg-green-500" />
        <SummaryCard label="Inactive" value={inactive.toLocaleString()} icon={Clock} color="bg-gray-500" />
        <SummaryCard label="Zones" value={zoneData.length} icon={Target} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Active vs Inactive">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={activeInactiveData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                <Cell fill="#16a34a" /><Cell fill="#d1d5db" />
              </Pie>
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Zone-wise Distribution">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={zoneData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <XAxis dataKey="zone" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Tutors" fill="#7c3aed" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Subjects">
          <div className="space-y-2 overflow-y-auto max-h-[200px]">
            {stats.topSubjects.map((s: any, i: number) => (
              <div key={s.subject} className="flex items-center gap-2">
                <span className="text-xs w-4 text-muted-foreground font-mono">{i + 1}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary/70 rounded-full transition-all" style={{ width: `${Math.round((s.count / stats.topSubjects[0]?.count) * 100)}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-24 truncate">{s.subject}</span>
                <span className="text-xs font-bold text-foreground w-5 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

// ─── Tab: Financial Reports ───────────────────────────────────────────────────

function FinancialReportsTab({ stats, userRole }: { stats: any; userRole: string | null }) {
  if (userRole !== 'superadmin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock size={28} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Restricted Access</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Financial reports are only accessible to Super Admins.
        </p>
      </div>
    );
  }

  const modeData = Object.entries(stats.paymentsByMode).map(([name, value]) => ({ name: name.toUpperCase(), value }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard label="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={IndianRupee} color="bg-green-500" />
        <SummaryCard label="Pending" value={formatCurrency(stats.pendingPayments)} icon={Clock} color="bg-amber-500" />
        <SummaryCard label="Overdue" value={formatCurrency(stats.overduePayments)} icon={ArrowUpRight} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Monthly Revenue Trend">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={stats.revenueByMonth} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Payment Mode Distribution">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={modeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {modeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ─── Tab: Performance KPIs ────────────────────────────────────────────────────

function KpiTab({ stats }: { stats: any }) {
  const convRate = stats.totalLeads ? Math.round((stats.convertedLeads / stats.totalLeads) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <KpiCard label="Lead Response Time" value="< 10 min" target="< 10 min" icon={Clock} status="good" />
        <KpiCard label="Tutor Shortlisting" value="< 3 hrs" target="< 3 hrs" icon={BookUser} status="good" />
        <KpiCard label="Issue Resolution" value="24-48 hrs" target="24-48 hrs" icon={CheckCircle2} status="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <KpiCard
          label="Demo Success Rate"
          value={`${stats.demoSuccessRate}%`}
          target="> 60%"
          icon={Target}
          status={stats.demoSuccessRate >= 60 ? 'good' : 'warn'}
        />
        <KpiCard
          label="Conversion Rate"
          value={`${convRate}%`}
          target="> 30%"
          icon={TrendingUp}
          status={convRate >= 30 ? 'good' : 'warn'}
        />
        <KpiCard
          label="Active Tutors"
          value={stats.activeTutors.toLocaleString()}
          target="50+"
          icon={Activity}
          status={stats.activeTutors >= 50 ? 'good' : 'warn'}
        />
      </div>

      {/* Funnel */}
      <ChartCard title="Lead Conversion Funnel">
        <div className="space-y-3 pt-2">
          {[
            { stage: 'Total Leads', count: stats.totalLeads, color: 'bg-blue-500' },
            { stage: 'Demo Scheduled', count: stats.demoScheduled, color: 'bg-violet-500' },
            { stage: 'Demo Completed', count: stats.demoCompleted, color: 'bg-purple-500' },
            { stage: 'Converted', count: stats.convertedLeads, color: 'bg-green-500' },
          ].map((item, i, arr) => {
            const pct = arr[0].count > 0 ? Math.round((item.count / arr[0].count) * 100) : 0;
            return (
              <div key={item.stage}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">{item.stage}</span>
                  <span className="text-muted-foreground">{item.count.toLocaleString()} ({pct}%)</span>
                </div>
                <div className="h-6 bg-muted rounded-md overflow-hidden">
                  <div
                    className={cn('h-full rounded-md flex items-center justify-end pr-2 transition-all', item.color)}
                    style={{ width: `${pct}%` }}
                  >
                    {pct > 15 && <span className="text-white text-xs font-semibold">{pct}%</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ReportTab = 'overview' | 'leads' | 'tutors' | 'financial' | 'kpi';

const TABS: { id: ReportTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'leads', label: 'Lead Reports' },
  { id: 'tutors', label: 'Tutor Reports' },
  { id: 'financial', label: 'Financial Reports' },
  { id: 'kpi', label: 'Performance KPIs' },
];

export default function ReportsPage() {
  const stats = useReportsStats();
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');

  if (stats.loading) {
    return (
      <AppLayout title="Reports & Analytics">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading reports data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Reports & Analytics">
      <div className="p-6 space-y-5">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Data-driven insights for TutorMatch CRM — Excellence Consultants
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {stats.totalLeads.toLocaleString()} leads, {stats.totalTutors.toLocaleString()} tutors
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { window.print(); }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors"
            >
              <Printer size={14} /> Print
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                {tab.label}
                {tab.id === 'financial' && userRole !== 'superadmin' && (
                  <Lock size={11} className="inline ml-1 text-muted-foreground/60" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && <OverviewTab stats={stats} />}
          {activeTab === 'leads' && <LeadReportsTab stats={stats} />}
          {activeTab === 'tutors' && <TutorReportsTab stats={stats} />}
          {activeTab === 'financial' && <FinancialReportsTab stats={stats} userRole={userRole} />}
          {activeTab === 'kpi' && <KpiTab stats={stats} />}
        </div>
      </div>
    </AppLayout>
  );
}