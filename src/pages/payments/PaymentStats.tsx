import { IndianRupee, Users, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface PaymentStatsProps {
  totalRevenue: number;
  totalPayouts: number;
  netProfit: number;
  pendingPayments: number;
  overduePayments: number;
  invoiceCount: number;
}

function StatCard({ label, value, icon: Icon, color, loading }: { 
  label: string; 
  value: string | number; 
  icon: React.ElementType; 
  color: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl p-4 border border-border animate-pulse">
        <div className="h-8 w-8 bg-muted rounded-lg mb-2" />
        <div className="h-3 bg-muted rounded w-20 mb-1" />
        <div className="h-6 bg-muted rounded w-16" />
      </div>
    );
  }
  
  return (
    <div className={cn("bg-card rounded-xl p-4 border border-border shadow-sm", color)}>
      <div className="flex items-center justify-between mb-2">
        <Icon size={20} className="text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}

export default function PaymentStats({ 
  totalRevenue, 
  totalPayouts, 
  netProfit, 
  pendingPayments, 
  overduePayments, 
  invoiceCount 
}: PaymentStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard 
        label="Total Revenue" 
        value={formatCurrency(totalRevenue)} 
        icon={IndianRupee}
        color="bg-green-50"
      />
      <StatCard 
        label="Tutor Payouts" 
        value={formatCurrency(totalPayouts)} 
        icon={Users}
        color="bg-red-50"
      />
      <StatCard 
        label="Net Profit" 
        value={formatCurrency(netProfit)} 
        icon={TrendingUp}
        color={netProfit >= 0 ? "bg-blue-50" : "bg-red-50"}
      />
      <StatCard 
        label="Pending Payments" 
        value={formatCurrency(pendingPayments)} 
        icon={Clock}
        color="bg-yellow-50"
      />
      <StatCard 
        label="Overdue" 
        value={formatCurrency(overduePayments)} 
        icon={AlertCircle}
        color="bg-orange-50"
      />
      <StatCard 
        label="Total Invoices" 
        value={invoiceCount} 
        icon={IndianRupee}
        color="bg-purple-50"
      />
    </div>
  );
}