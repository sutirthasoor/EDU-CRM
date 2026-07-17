import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ReportsStats {
  // Lead stats
  totalLeads: number;
  convertedLeads: number;
  leadsByStatus: Record<string, number>;
  leadsBySource: Record<string, number>;
  leadsByMonth: Array<{ month: string; count: number; conversions: number }>;
  
  // Tutor stats
  totalTutors: number;
  activeTutors: number;
  tutorsByZone: Record<string, number>;
  topSubjects: Array<{ subject: string; count: number }>;
  
  // Payment stats
  totalRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  paymentsByMode: Record<string, number>;
  
  // Demo stats
  demoScheduled: number;
  demoCompleted: number;
  demoSuccessRate: number;
  
  loading: boolean;
  error: Error | null;
}

export function useReportsStats() {
  const [stats, setStats] = useState<ReportsStats>({
    totalLeads: 0,
    convertedLeads: 0,
    leadsByStatus: {},
    leadsBySource: {},
    leadsByMonth: [],
    totalTutors: 0,
    activeTutors: 0,
    tutorsByZone: {},
    topSubjects: [],
    totalRevenue: 0,
    pendingPayments: 0,
    overduePayments: 0,
    revenueByMonth: [],
    paymentsByMode: {},
    demoScheduled: 0,
    demoCompleted: 0,
    demoSuccessRate: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Run all queries in parallel for speed
        const [
          totalLeadsSnap,
          convertedLeadsSnap,
          totalTutorsSnap,
          activeTutorsSnap,
          paidPaymentsSnap,
          pendingPaymentsSnap,
          overduePaymentsSnap,
          demoScheduledSnap,
          demoCompletedSnap,
        ] = await Promise.all([
          getDocs(collection(db, 'leads')),
          getDocs(query(collection(db, 'leads'), where('status', '==', 'converted'))),
          getDocs(collection(db, 'tutors')),
          getDocs(query(collection(db, 'tutors'), where('isActive', '==', true))),
          getDocs(query(collection(db, 'payments'), where('status', '==', 'paid'))),
          getDocs(query(collection(db, 'payments'), where('status', '==', 'pending'))),
          getDocs(query(collection(db, 'payments'), where('status', '==', 'overdue'))),
          getDocs(query(collection(db, 'leads'), where('status', '==', 'demo_scheduled'))),
          getDocs(query(collection(db, 'leads'), where('status', '==', 'demo_completed'))),
        ]);

        // Process leads by status
        const leadsByStatus: Record<string, number> = {};
        const leadsBySource: Record<string, number> = {};
        const leadsByMonthMap: Record<string, { count: number; conversions: number }> = {};
        
        const leadsSnap = await getDocs(collection(db, 'leads'));
        leadsSnap.docs.forEach(doc => {
          const lead = doc.data();
          const status = lead.status || 'unknown';
          const source = lead.source || 'unknown';
          leadsByStatus[status] = (leadsByStatus[status] || 0) + 1;
          leadsBySource[source] = (leadsBySource[source] || 0) + 1;
          
          // Month grouping
          if (lead.createdAt) {
            const date = lead.createdAt.toDate?.() || new Date(lead.createdAt);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            if (!leadsByMonthMap[monthKey]) {
              leadsByMonthMap[monthKey] = { count: 0, conversions: 0 };
            }
            leadsByMonthMap[monthKey].count++;
            if (lead.status === 'converted') {
              leadsByMonthMap[monthKey].conversions++;
            }
          }
        });

        // Process tutors by zone
        const tutorsByZone: Record<string, number> = {};
        const subjectsMap: Record<string, number> = {};
        
        const tutorsSnap = await getDocs(collection(db, 'tutors'));
        tutorsSnap.docs.forEach(doc => {
          const tutor = doc.data();
          const zone = tutor.zone || 'Unknown';
          tutorsByZone[zone] = (tutorsByZone[zone] || 0) + 1;
          
          (tutor.subjectsHandled || []).forEach((subject: string) => {
            subjectsMap[subject] = (subjectsMap[subject] || 0) + 1;
          });
        });

        // Process payments
        let totalRevenue = 0;
        const paymentsByMode: Record<string, number> = {};
        const revenueByMonthMap: Record<string, number> = {};
        
        paidPaymentsSnap.docs.forEach(doc => {
          const payment = doc.data();
          const amount = payment.amount || 0;
          totalRevenue += amount;
          
          const mode = payment.mode || 'unknown';
          paymentsByMode[mode] = (paymentsByMode[mode] || 0) + amount;
          
          if (payment.createdAt) {
            const date = payment.createdAt.toDate?.() || new Date(payment.createdAt);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            revenueByMonthMap[monthKey] = (revenueByMonthMap[monthKey] || 0) + amount;
          }
        });

        const totalPending = pendingPaymentsSnap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);
        const totalOverdue = overduePaymentsSnap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);

        // Convert maps to arrays
        const leadsByMonth = Object.entries(leadsByMonthMap)
          .map(([month, data]) => ({ month, count: data.count, conversions: data.conversions }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-8);

        const revenueByMonth = Object.entries(revenueByMonthMap)
          .map(([month, revenue]) => ({ month, revenue }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-8);

        const topSubjects = Object.entries(subjectsMap)
          .map(([subject, count]) => ({ subject, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        const demoScheduled = demoScheduledSnap.size;
        const demoCompleted = demoCompletedSnap.size;
        const demoSuccessRate = demoScheduled > 0 ? Math.round((demoCompleted / demoScheduled) * 100) : 0;

        setStats({
          totalLeads: totalLeadsSnap.size,
          convertedLeads: convertedLeadsSnap.size,
          leadsByStatus,
          leadsBySource,
          leadsByMonth,
          totalTutors: totalTutorsSnap.size,
          activeTutors: activeTutorsSnap.size,
          tutorsByZone,
          topSubjects,
          totalRevenue,
          pendingPayments: totalPending,
          overduePayments: totalOverdue,
          revenueByMonth,
          paymentsByMode,
          demoScheduled,
          demoCompleted,
          demoSuccessRate,
          loading: false,
          error: null,
        });

      } catch (error) {
        console.error('Error fetching reports stats:', error);
        setStats(prev => ({ ...prev, loading: false, error: error as Error }));
      }
    };

    fetchStats();
  }, []);

  return stats;
}