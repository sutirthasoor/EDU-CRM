// src/hooks/useDashboardStats.ts
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useDashboardStats() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeStudents: 0,
    activeTutors: 0,
    demosThisWeek: 0,
    pendingPayments: 0,
    openTickets: 0,
    totalRevenue: 0,
    totalPayouts: 0,
    netProfit: 0,
    conversionRate: 0,
    loading: true,
  });

  useEffect(() => {
    // Fetch static data once
    const fetchStaticData = async () => {
      try {
        const leadsSnap = await getDocs(collection(db, 'leads'));
        const tutorsSnap = await getDocs(collection(db, 'tutors'));
        const ticketsSnap = await getDocs(query(collection(db, 'tickets'), where('status', '==', 'open')));

        const totalLeads = leadsSnap.size;
        const activeStudents = leadsSnap.docs.filter(d => d.data().status === 'converted').length;
        const activeTutors = tutorsSnap.docs.filter(d => d.data().isActive === true).length;
        const openTickets = ticketsSnap.size;
        const conversionRate = totalLeads > 0 ? (activeStudents / totalLeads) * 100 : 0;

        // Demos this week
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        let demosThisWeek = 0;
        leadsSnap.docs.forEach(doc => {
          const lead = doc.data();
          if (lead.tutorAssignments) {
            for (const assignment of lead.tutorAssignments) {
              if (assignment.demoDate) {
                const demoDate = new Date(assignment.demoDate);
                if (demoDate >= startOfWeek && demoDate < endOfWeek) {
                  demosThisWeek++;
                  break;
                }
              }
            }
          }
        });

        setStats(prev => ({
          ...prev,
          totalLeads,
          activeStudents,
          activeTutors,
          demosThisWeek,
          openTickets,
          conversionRate,
        }));
      } catch (err) {
        console.error(err);
      }
    };

    fetchStaticData();

    // REAL-TIME LISTENER for payments - THIS IS THE KEY FIX
    const unsubscribe = onSnapshot(collection(db, 'payments'), (snapshot) => {
      let revenue = 0;
      let payouts = 0;
      let pending = 0;

      snapshot.docs.forEach(doc => {
        const payment = doc.data();
        const amount = Number(payment.amount) || 0;

        if (payment.status === 'paid') {
          if (payment.type === 'payout') {
            payouts += amount;
          } else {
            revenue += amount;
          }
        } else if (payment.status === 'pending' || payment.status === 'overdue') {
          pending += amount;
        }
      });

      setStats(prev => ({
        ...prev,
        totalRevenue: revenue,
        totalPayouts: payouts,
        netProfit: revenue - payouts,
        pendingPayments: pending,
        loading: false,
      }));
    });

    return () => unsubscribe();
  }, []);

  return stats;
}