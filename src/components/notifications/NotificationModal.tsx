import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Bell, Calendar, CreditCard, AlertTriangle, Clock, CheckCircle, 
  Users, Ticket, Award, TrendingUp, UserCheck,
  CalendarClock, DollarSign, AlertCircle, Loader2
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { formatDate, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NotificationModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // All data states
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [duePayouts, setDuePayouts] = useState<any[]>([]);
  const [pendingDemoScheduling, setPendingDemoScheduling] = useState<any[]>([]);
  const [upcomingDemos, setUpcomingDemos] = useState<any[]>([]);
  const [pendingTickets, setPendingTickets] = useState<any[]>([]);
  const [followUpToday, setFollowUpToday] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [leadsWithoutTutor, setLeadsWithoutTutor] = useState<any[]>([]);

  // Fetch all data directly from Firestore WITHOUT limits
  const fetchAllData = async () => {
  setLoading(true);
  try {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    // Fetch ALL documents from each collection (no limits)
    const [paymentsSnap, leadsSnap, pendingTutorsSnap, ticketsSnap] = await Promise.all([
      getDocs(collection(db, 'payments')),
      getDocs(collection(db, 'leads')),
      getDocs(collection(db, 'pendingTutors')),
      getDocs(collection(db, 'tickets')),
    ]);

    const allPayments = paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const allLeads = leadsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const allPendingTutors = pendingTutorsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const allTickets = ticketsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // ===== DEBUG: Log what we fetched =====
    console.log('📊 Total leads fetched:', allLeads.length);
    console.log('📊 Total payments fetched:', allPayments.length);
    console.log('📊 Total pending tutors fetched:', allPendingTutors.length);
    console.log('📊 Total tickets fetched:', allTickets.length);

    // ===== DEBUG: Check leads with assignments =====
    let leadsWithAssignments = 0;
    let totalPendingAssignments = 0;
    allLeads.forEach(lead => {
      if (lead.tutorAssignments && lead.tutorAssignments.length > 0) {
        leadsWithAssignments++;
        const pendingAssignments = lead.tutorAssignments.filter((a: any) => {
          const status = (a.status || '').toLowerCase().trim();
          const isPending = status === 'pending' || status === 'pend';
          const hasNoDate = !a.demoDate || a.demoDate === null || a.demoDate === '';
          return isPending && hasNoDate;
        });
        if (pendingAssignments.length > 0) {
          totalPendingAssignments += pendingAssignments.length;
          console.log(`🔍 Lead ${lead.leadId}: ${pendingAssignments.length} pending assignments`);
        }
      }
    });
    console.log('📊 Leads with assignments:', leadsWithAssignments);
    console.log('📊 Total pending assignments found:', totalPendingAssignments);

    // 1. PENDING PAYMENTS (Student payments - NOT payouts)
    const pending = allPayments.filter(p => 
      (p.status === 'pending' || p.status === 'overdue') && p.type !== 'payout'
    );
    setPendingPayments(pending);

    // 2. DUE PAYOUTS (Tutor payouts)
    const payouts = allPayments.filter(p => 
      (p.status === 'pending' || p.status === 'overdue') && p.type === 'payout'
    );
    setDuePayouts(payouts);

    // 3. PENDING DEMO SCHEDULING - Get ALL leads with pending assignments
    const pendingDemos: any[] = [];
    allLeads.forEach(lead => {
      if (lead.tutorAssignments && lead.tutorAssignments.length > 0) {
        const pendingTutorsForLead = lead.tutorAssignments.filter((a: any) => {
          const status = (a.status || '').toLowerCase().trim();
          const isPending = status === 'pending' || status === 'pend';
          const hasNoDate = !a.demoDate || a.demoDate === null || a.demoDate === '';
          return isPending && hasNoDate;
        });
        
        if (pendingTutorsForLead.length > 0) {
          pendingDemos.push({
            ...lead,
            pendingTutors: pendingTutorsForLead
          });
        }
      }
    });
    console.log('📊 Pending demos to show:', pendingDemos.length);
    setPendingDemoScheduling(pendingDemos);

    // 4. UPCOMING DEMOS (next 7 days)
    const upcoming: any[] = [];
    allLeads.forEach(lead => {
      if (lead.tutorAssignments && lead.tutorAssignments.length > 0) {
        const hasUpcoming = lead.tutorAssignments.some((a: any) => {
          if (!a.demoDate) return false;
          const demoDate = a.demoDate.toDate ? a.demoDate.toDate() : new Date(a.demoDate);
          return demoDate >= today && demoDate <= nextWeek;
        });
        if (hasUpcoming) {
          upcoming.push(lead);
        }
      }
    });
    setUpcomingDemos(upcoming);

    // 5. PENDING SUPPORT TICKETS
    const pendingTickets = allTickets.filter(t => 
      t.status === 'open' || t.status === 'in_progress'
    );
    setPendingTickets(pendingTickets);

    // 6. FOLLOW-UP TODAY
    const followUps = allLeads.filter(l => {
      if (!l.followUpDate) return false;
      const followUp = l.followUpDate.toDate ? l.followUpDate.toDate() : new Date(l.followUpDate);
      return followUp.toDateString() === today.toDateString();
    });
    setFollowUpToday(followUps);

    // 7. PENDING APPROVALS
    const pendingTutors = allPendingTutors.filter(t => 
      t.status === 'pending' || t.status === 'inactive'
    );
    setPendingApprovals(pendingTutors);

    // 8. LEADS WITHOUT TUTOR
    const noTutor = allLeads.filter(l => 
      (l.status === 'converted' || l.status === 'demo_completed' || l.status === 'selected') && 
      (!l.tutorAssignments || l.tutorAssignments.length === 0)
    );
    setLeadsWithoutTutor(noTutor);

    console.log('✅ Final notification counts:', {
      pendingPayments: pending.length,
      duePayouts: payouts.length,
      pendingDemoScheduling: pendingDemos.length,
      upcomingDemos: upcoming.length,
      pendingTickets: pendingTickets.length,
      followUpToday: followUps.length,
      pendingApprovals: pendingTutors.length,
      leadsWithoutTutor: noTutor.length,
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    toast.error('Failed to load notifications');
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    if (open) {
      fetchAllData();
    }
  }, [open]);

  const totalNotifications = 
    pendingPayments.length + 
    duePayouts.length +
    pendingDemoScheduling.length + 
    upcomingDemos.length + 
    pendingTickets.length + 
    followUpToday.length + 
    pendingApprovals.length +
    leadsWithoutTutor.length;

  const handleNavigate = (path: string) => {
    navigate({ to: path });
    onClose();
  };

  const getDaysOverdue = (date: any) => {
    if (!date) return 0;
    const d = date.toDate ? date.toDate() : new Date(date);
    const today = new Date();
    return Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getPendingTutors = (lead: any) => {
    if (!lead.tutorAssignments) return [];
    return lead.tutorAssignments.filter((a: any) => a.status === 'pending' && !a.demoDate);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="p-6" style={{ maxWidth: '98vw', width: '98vw', maxHeight: '98vh' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell size={18} className="text-primary" />
              Notifications
            </DialogTitle>
          </DialogHeader>
          <div className="py-12 text-center">
            <Loader2 size={40} className="animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground mt-4">Loading notifications...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="p-6" 
        style={{ 
          maxWidth: '98vw', 
          width: '98vw', 
          maxHeight: '98vh',
          margin: '1vh auto'
        }}
      >
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bell size={22} className="text-primary" />
            Notifications
            {totalNotifications > 0 && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                {totalNotifications} new
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto pr-2" style={{ maxHeight: 'calc(98vh - 180px)' }}>
          {totalNotifications === 0 && (
            <div className="py-12 text-center">
              <CheckCircle size={40} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No new notifications</p>
              <p className="text-xs text-muted-foreground/60 mt-1">You're all caught up!</p>
            </div>
          )}

          {/* ===== 1. PENDING APPROVALS ===== */}
          {pendingApprovals.length > 0 && (
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <UserCheck size={16} className="text-purple-500" />
                Pending Approvals ({pendingApprovals.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {pendingApprovals.map((tutor: any) => (
                  <div
                    key={tutor.id}
                    onClick={() => handleNavigate('/pending-approvals')}
                    className="p-3 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0">
                        <UserCheck size={16} className="text-purple-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{tutor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tutor.status === 'pending' ? 'Pending Approval' : 'Inactive'}
                        </p>
                        {tutor.phone && (
                          <p className="text-xs text-muted-foreground">📞 {tutor.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== 2. PENDING DEMO SCHEDULING ===== */}
          {/* ===== 2. PENDING DEMO SCHEDULING ===== */}
{pendingDemoScheduling.length > 0 && (
  <div className="space-y-2 mb-6">
    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
      <CalendarClock size={16} className="text-indigo-500" />
      Pending Demo Scheduling ({pendingDemoScheduling.length})
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {pendingDemoScheduling.map((lead: any) => {
        const pendingTutors = lead.pendingTutors || [];
        return (
          <div
            key={lead.id}
            onClick={() => handleNavigate('/demos')}
            className="p-3 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 cursor-pointer transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center flex-shrink-0">
                <CalendarClock size={16} className="text-indigo-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{lead.studentName}</p>
                <p className="text-xs text-muted-foreground">
                  {pendingTutors.length} tutor(s) pending
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Tutors: {pendingTutors.map((t: any) => t.tutorName).join(', ')}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Lead: {lead.leadId} • {lead.class ? `Class ${lead.class}` : ''}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
          {/* ===== 3. UPCOMING DEMOS ===== */}
          {upcomingDemos.length > 0 && (
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Calendar size={16} className="text-blue-500" />
                Upcoming Demos ({upcomingDemos.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {upcomingDemos.map((lead: any) => {
                  const scheduledAssignment = lead.tutorAssignments?.find((a: any) => a.demoDate);
                  return (
                    <div
                      key={lead.id}
                      onClick={() => handleNavigate('/demos')}
                      className="p-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                          <Calendar size={16} className="text-blue-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{lead.studentName}</p>
                          <p className="text-xs text-muted-foreground">
                            {scheduledAssignment?.demoDate ? formatDate(scheduledAssignment.demoDate) : 'Date TBD'}
                            {scheduledAssignment?.demoTime && ` at ${scheduledAssignment.demoTime}`}
                          </p>
                          {scheduledAssignment?.tutorName && (
                            <p className="text-xs text-muted-foreground truncate">Tutor: {scheduledAssignment.tutorName}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== 4. PENDING SUPPORT TICKETS ===== */}
          {pendingTickets.length > 0 && (
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Ticket size={16} className="text-red-500" />
                Pending Support Tickets ({pendingTickets.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {pendingTickets.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    onClick={() => handleNavigate('/support-tickets')}
                    className="p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
                        <Ticket size={16} className="text-red-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{ticket.studentName || 'Ticket'}</p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.issue?.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs font-medium mt-1">
                          <span className={cn(
                            'px-1.5 py-0.5 rounded text-[10px]',
                            ticket.status === 'open' ? 'bg-yellow-200 text-yellow-700' : 'bg-blue-200 text-blue-700'
                          )}>
                            {ticket.status === 'open' ? 'OPEN' : 'IN PROGRESS'}
                          </span>
                          {ticket.priority && (
                            <span className={cn(
                              'ml-1 px-1.5 py-0.5 rounded text-[10px]',
                              ticket.priority === 'high' ? 'bg-red-200 text-red-700' :
                              ticket.priority === 'medium' ? 'bg-yellow-200 text-yellow-700' :
                              'bg-green-200 text-green-700'
                            )}>
                              {ticket.priority.toUpperCase()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== 5. DUE PAYOUTS ===== */}
          {duePayouts.length > 0 && (
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <DollarSign size={16} className="text-red-500" />
                Due Payouts ({duePayouts.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {duePayouts.map((payment: any) => (
                  <div
                    key={payment.id}
                    onClick={() => handleNavigate('/payments')}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-colors',
                      payment.status === 'overdue'
                        ? 'bg-red-50 border-red-200 hover:bg-red-100'
                        : 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        payment.status === 'overdue' ? 'bg-red-200' : 'bg-orange-200'
                      )}>
                        {payment.status === 'overdue' ? (
                          <AlertCircle size={16} className="text-red-700" />
                        ) : (
                          <Clock size={16} className="text-orange-700" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{payment.tutorName || payment.studentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(payment.amount)} • Due {formatDate(payment.dueDate)}
                        </p>
                        <p className="text-xs font-medium">
                          {payment.status === 'overdue' ? (
                            <span className="text-red-600">⚠ Overdue by {getDaysOverdue(payment.dueDate)} days</span>
                          ) : (
                            <span className="text-orange-600">⏳ Due Soon</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== 6. PENDING PAYMENTS ===== */}
          {pendingPayments.length > 0 && (
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={16} className="text-amber-500" />
                Pending Payments ({pendingPayments.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {pendingPayments.map((payment: any) => (
                  <div
                    key={payment.id}
                    onClick={() => handleNavigate('/payments')}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-colors',
                      payment.status === 'overdue'
                        ? 'bg-red-50 border-red-200 hover:bg-red-100'
                        : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        payment.status === 'overdue' ? 'bg-red-200' : 'bg-amber-200'
                      )}>
                        {payment.status === 'overdue' ? (
                          <AlertTriangle size={16} className="text-red-700" />
                        ) : (
                          <Clock size={16} className="text-amber-700" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{payment.studentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(payment.amount)} • Due {formatDate(payment.dueDate)}
                        </p>
                        <p className="text-xs font-medium">
                          {payment.status === 'overdue' ? (
                            <span className="text-red-600">⚠ Overdue by {getDaysOverdue(payment.dueDate)} days</span>
                          ) : (
                            <span className="text-amber-600">⏳ Pending</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== 7. FOLLOW-UP TODAY ===== */}
          {followUpToday.length > 0 && (
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-orange-500" />
                Follow-up Today ({followUpToday.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {followUpToday.map((lead: any) => (
                  <div
                    key={lead.id}
                    onClick={() => handleNavigate('/leads')}
                    className="p-3 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center flex-shrink-0">
                        <Clock size={16} className="text-orange-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{lead.studentName}</p>
                        <p className="text-xs text-muted-foreground">Follow-up scheduled for today</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-0 py-4 mt-4 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {totalNotifications} notification{totalNotifications !== 1 ? 's' : ''}
          </span>
          {totalNotifications > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (pendingDemoScheduling.length > 0 || upcomingDemos.length > 0) {
                  handleNavigate('/demos');
                } else if (pendingApprovals.length > 0) {
                  handleNavigate('/pending-approvals');
                } else if (duePayouts.length > 0 || pendingPayments.length > 0) {
                  handleNavigate('/payments');
                } else if (pendingTickets.length > 0) {
                  handleNavigate('/support-tickets');
                } else if (followUpToday.length > 0) {
                  handleNavigate('/leads');
                } else {
                  handleNavigate('/');
                }
              }}
              className="text-sm"
            >
              View All
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}