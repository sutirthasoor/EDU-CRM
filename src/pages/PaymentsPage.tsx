import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { PlusCircle, Bell, CheckCircle, AlertTriangle, Edit, Calendar, Search, Download, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import { usePaymentsPaginated, updatePayment, deletePayment } from '../hooks/usePayments';
import { useLeads } from '../hooks/useLeads';
import { useAllTutorsForDropdown } from '../hooks/useTutors';
import { useAuth } from '../contexts/AuthContext';
import type { Payment } from '../types';
import { cn, formatDate, formatCurrency, getStatusColor } from '../lib/utils';
import PaymentStats from './payments/PaymentStats';
import NewPaymentModal from './payments/NewPaymentModal';
import MarkPaidModal from './payments/MarkPaidModal';
import TutorPayoutsTab from './payments/TutorPayoutsTab';
import InvoiceGeneratorTab from './payments/InvoiceGeneratorTab';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { generateInvoicePDF } from '../utils/pdfGenerator';

type Tab = 'all' | 'pending' | 'payouts' | 'invoices';

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All Payments' },
  { id: 'pending', label: 'Pending & Overdue' },
  { id: 'payouts', label: 'Tutor Payouts' },
  { id: 'invoices', label: 'Invoice Generator' },
];

function StatusBadge({ status }: { status: string }) {
  return <span className={cn('status-badge', getStatusColor(status))}>{status}</span>;
}

// Helper function to download invoice
const downloadInvoice = (payment: Payment) => {
  try {
    generateInvoicePDF({
      invoiceNumber: payment.invoiceNumber || `INV-${Date.now()}`,
      studentName: payment.studentName || payment.tutorName || 'N/A',
      amount: payment.amount,
      date: payment.paidDate ? formatDate(payment.paidDate) : formatDate(new Date()),
      dueDate: payment.dueDate ? formatDate(payment.dueDate) : '',
      status: payment.status,
      paymentMode: payment.mode,
      transactionId: payment.transactionId,
      notes: payment.notes
    });
    toast.success('Invoice downloaded successfully');
  } catch (error) {
    console.error('Error downloading invoice:', error);
    toast.error('Failed to download invoice');
  }
};

function PaymentsTable({ payments, onMarkPaid, onEdit, onDelete, searchTerm, userRole, loadingMore, hasMore, loadMore }: { 
  payments: Payment[]; 
  onMarkPaid: (p: Payment) => void;
  onEdit: (p: Payment) => void;
  onDelete: (p: Payment) => void;
  searchTerm: string;
  userRole: string | null;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
}) {
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  
  const filteredPayments = useMemo(() => {
    if (!searchTerm.trim()) return payments;
    
    const term = searchTerm.toLowerCase().trim();
    return payments.filter(p => 
      p.studentName?.toLowerCase().includes(term) ||
      p.tutorName?.toLowerCase().includes(term) ||
      p.invoiceNumber?.toLowerCase().includes(term) ||
      p.transactionId?.toLowerCase().includes(term) ||
      p.mode?.toLowerCase().includes(term) ||
      formatCurrency(p.amount).toLowerCase().includes(term)
    );
  }, [payments, searchTerm]);

  if (filteredPayments.length === 0) {
    return (
      <div className="py-14 text-center text-sm text-muted-foreground">
        <Search size={28} className="mx-auto mb-2 text-muted-foreground/30" />
        {searchTerm ? (
          <p>No payments match your search "{searchTerm}"</p>
        ) : (
          <p>No payment records found</p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {['Invoice #', 'Name', 'Type', 'Amount', 'Due Date', 'Paid Date', 'Mode', 'Txn ID', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredPayments.map((p) => (
              <tr key={p.id} className={cn('hover:bg-muted/20 transition-colors', p.status === 'overdue' && 'bg-red-50/40')}>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-medium text-primary">{p.invoiceNumber || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{p.studentName || p.tutorName || '—'}</p>
                  {p.leadId && p.studentName && (
                    <p className="text-xs text-muted-foreground">Lead: {p.leadId}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full',
                    p.type === 'payout' ? 'bg-purple-100 text-purple-700' : 
                    p.type === 'revenue' ? 'bg-green-100 text-green-700' : 
                    'bg-blue-100 text-blue-700'
                  )}>
                    {p.type === 'payout' ? 'Payout' : 
                     p.type === 'revenue' ? 'Revenue' : 
                     p.type || 'Payment'}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(p.amount)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{p.dueDate ? formatDate(p.dueDate) : '—'}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{p.paidDate ? formatDate(p.paidDate) : '—'}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground uppercase">{p.mode || '—'}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono text-muted-foreground truncate block max-w-[100px]">{p.transactionId || '—'}</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => downloadInvoice(p)}
                      className="text-xs px-2 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium transition-colors flex items-center gap-1"
                      title="Download Invoice"
                    >
                      <Download size={11} /> Invoice
                    </button>
                    
                    {isAdmin && p.status !== 'paid' && (
                      <button
                        onClick={() => onEdit(p)}
                        className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors flex items-center gap-1"
                        title="Reschedule Payment"
                      >
                        <Edit size={11} /> Reschedule
                      </button>
                    )}
                    
                    {isAdmin && (
                      <button
                        onClick={() => onDelete(p)}
                        className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 font-medium transition-colors flex items-center gap-1"
                        title="Delete Payment"
                      >
                        Delete
                      </button>
                    )}
                    
                    {p.status !== 'paid' && (
                      <button onClick={() => onMarkPaid(p)}
                        className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-medium transition-colors whitespace-nowrap">
                        Mark Paid
                      </button>
                    )}
                  </div>
                </td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Load More Button */}
      {hasMore && (
        <div className="p-4 text-center border-t border-border">
          <Button 
            variant="outline" 
            onClick={loadMore} 
            disabled={loadingMore}
            className="w-full"
          >
            {loadingMore ? 'Loading...' : 'Load More Payments'}
          </Button>
        </div>
      )}
    </>
  );
}

function PendingTab({ payments, onMarkPaid, onEdit, onDelete, searchTerm, userRole, loadingMore, hasMore, loadMore }: { 
  payments: Payment[]; 
  onMarkPaid: (p: Payment) => void;
  onEdit: (p: Payment) => void;
  onDelete: (p: Payment) => void;
  searchTerm: string;
  userRole: string | null;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
}) {
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const canEdit = userRole === 'admin' || userRole === 'superadmin' || userRole === 'counsellor';
  
  const filtered = useMemo(() => {
    const pending = payments.filter((p) => p.status === 'pending' || p.status === 'overdue');
    
    if (!searchTerm.trim()) return pending;
    
    const term = searchTerm.toLowerCase().trim();
    return pending.filter(p => 
      p.studentName?.toLowerCase().includes(term) ||
      p.tutorName?.toLowerCase().includes(term) ||
      p.invoiceNumber?.toLowerCase().includes(term) ||
      p.transactionId?.toLowerCase().includes(term) ||
      formatCurrency(p.amount).toLowerCase().includes(term)
    );
  }, [payments, searchTerm]);

  if (filtered.length === 0) {
    return (
      <div className="py-14 text-center text-sm text-muted-foreground">
        {searchTerm ? (
          <>
            <Search size={28} className="mx-auto mb-2 text-muted-foreground/30" />
            <p>No pending payments match your search "{searchTerm}"</p>
          </>
        ) : (
          <>
            <CheckCircle size={28} className="mx-auto mb-2 text-emerald-400" />
            <p>All payments are up to date!</p>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {['Invoice #', 'Name', 'Type', 'Amount', 'Due Date', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
             </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => (
              <tr key={p.id} className={cn('hover:bg-muted/20 transition-colors', p.status === 'overdue' && 'bg-red-50/50')}>
                <td className="px-4 py-3"><span className="font-mono text-xs font-medium text-primary">{p.invoiceNumber || '—'}</span></td>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{p.studentName || p.tutorName || '—'}</p>
                  {p.type === 'payout' && p.tutorName && (
                    <p className="text-xs text-muted-foreground">Tutor Payout</p>
                  )}
                </td>
<td className="px-4 py-3">
  <span className={cn('text-xs px-2 py-0.5 rounded-full',
    p.type === 'payout' ? 'bg-purple-100 text-purple-700' : 
    p.type === 'revenue' ? 'bg-green-100 text-green-700' : 
    'bg-blue-100 text-blue-700'
  )}>
    {p.type === 'payout' ? 'Payout' : 
     p.type === 'revenue' ? 'Revenue' : 
     p.type || 'Payment'}
  </span>
</td>
                <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(p.amount)}</td>
                <td className="px-4 py-3 text-xs whitespace-nowrap">
                  <span className={cn(p.status === 'overdue' && 'text-red-600 font-medium flex items-center gap-1')}>
                    {p.status === 'overdue' && <AlertTriangle size={12} />}
                    {p.dueDate ? formatDate(p.dueDate) : '—'}
                  </span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => downloadInvoice(p)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium transition-colors"
                      title="Download Invoice"
                    >
                      <Download size={11} /> Invoice
                    </button>
                    
                    {canEdit && p.status !== 'paid' && (
                      <button
                        onClick={() => onEdit(p)}
                        className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors flex items-center gap-1"
                        title="Reschedule Payment"
                      >
                        <Edit size={11} /> Reschedule
                      </button>
                    )}
                    
                    {isAdmin && (
                      <button
                        onClick={() => onDelete(p)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 font-medium transition-colors"
                        title="Delete Payment"
                      >
                        Delete
                      </button>
                    )}
                    
                    <button 
                      onClick={() => { toast.success(`Reminder sent to ${p.studentName || p.tutorName}!`); }}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors"
                    >
                      <Bell size={11} /> Remind
                    </button>
                    
                    <button 
                      onClick={() => onMarkPaid(p)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-medium transition-colors"
                    >
                      <CheckCircle size={11} /> Mark Paid
                    </button>
                  </div>
                </td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Load More Button */}
      {hasMore && (
        <div className="p-4 text-center border-t border-border">
          <Button 
            variant="outline" 
            onClick={loadMore} 
            disabled={loadingMore}
            className="w-full"
          >
            {loadingMore ? 'Loading...' : 'Load More Payments'}
          </Button>
        </div>
      )}
    </>
  );
}

export default function PaymentsPage() {
  const { 
    payments, 
    loading: pLoading, 
    loadingMore, 
    hasMore, 
    totalRevenue,
    totalPayouts,
    totalPending, 
    totalOverdue,
    loadPayments, 
    loadMore, 
    searchPayments,
    refreshPayments,
    refreshStats
  } = usePaymentsPaginated(30);
  
  const { leads, loading: leadsLoading } = useLeads();
  const { tutors, loading: tutorsLoading } = useAllTutorsForDropdown();
  const { userRole } = useAuth();
  
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [newPaymentOpen, setNewPaymentOpen] = useState(false);
  const [markPaidPayment, setMarkPaidPayment] = useState<Payment | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Payment | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const canEdit = userRole === 'admin' || userRole === 'superadmin' || userRole === 'counsellor';
  const isSuperAdmin = userRole === 'superadmin';

  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  
  const handleSearch = useCallback((term: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (term.trim()) {
        setIsSearching(true);
        searchPayments(term);
      } else {
        setIsSearching(false);
        if (!isSearching) {
          if (activeTab === 'pending') {
            loadPayments({ status: 'pending' });
          } else {
            loadPayments({ status: undefined });
          }
        }
      }
    }, 500);
  }, [searchPayments, loadPayments, activeTab, isSearching]);

  useEffect(() => {
    if (isSearching) {
      return;
    }
    
    setSearchInput('');
    
    if (activeTab === 'pending') {
      loadPayments({ status: 'pending' });
    } else if (activeTab === 'all') {
      loadPayments({ status: undefined });
    }
  }, [activeTab, loadPayments, isSearching]);

  useEffect(() => {
    if (activeTab === 'all' || activeTab === 'pending') {
      handleSearch(searchInput);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput, handleSearch, activeTab]);

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setNewDueDate(payment.dueDate || '');
    setEditModalOpen(true);
  };

  const handleReschedulePayment = async () => {
    if (!editingPayment || !newDueDate) {
      toast.error('Please select a new due date');
      return;
    }
    
    try {
      await updatePayment(editingPayment.id, {
        dueDate: newDueDate
      });
      toast.success('Payment due date updated');
      refreshStats();
      refreshPayments();
      setEditModalOpen(false);
      setEditingPayment(null);
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment');
    }
  };

  const handleDeletePayment = async (payment: Payment) => {
    try {
      await deletePayment(payment.id);
      toast.success('Payment deleted successfully');
      refreshStats();
      refreshPayments();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
    }
  };

  const handleCreatePayment = async (paymentData: any) => {
    try {
      const { addPayment } = await import('../hooks/usePayments');
      await addPayment(paymentData);
      toast.success('Payment record created');
      refreshStats();
      refreshPayments();
      setNewPaymentOpen(false);
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Failed to create payment record');
      throw error;
    }
  };

  if (pLoading && payments.length === 0 && !isSearching) {
    return (
      <AppLayout title="Payments & Finance">
        <div className="p-6 flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading payments...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Payments & Finance">
      <div className="p-5 space-y-5 animate-fade-in">
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={async () => {
              console.log('Manual refresh triggered');
              const snapshot = await getDocs(collection(db, 'payments'));
              let revenue = 0, payouts = 0;
              snapshot.docs.forEach(doc => {
                const p = doc.data();
                const amount = Number(p.amount) || 0;
                if (p.status === 'paid') {
                  if (p.type === 'payout') payouts += amount;
                  else revenue += amount;
                }
              });
              console.log('Manual calculation:', { revenue, payouts });
              alert(`Revenue: ₹${revenue}\nPayouts: ₹${payouts}\nPending: ₹${totalPending}\nOverdue: ₹${totalOverdue}`);
            }}
          >
            Debug: Calculate Stats
          </Button>
        </div>
        
        {!isSuperAdmin && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
            <Shield size={16} className="text-amber-600" />
            <p className="text-xs text-amber-700">
              You are viewing payments. Only Super Admin can edit or delete payment records.
            </p>
          </div>
        )}

        <PaymentStats 
          totalRevenue={totalRevenue || 0}
          totalPayouts={totalPayouts || 0}
          netProfit={(totalRevenue || 0) - (totalPayouts || 0)}
          pendingPayments={totalPending || 0}
          overduePayments={totalOverdue || 0}
          invoiceCount={payments?.filter(p => p.invoiceNumber).length || 0}
        />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex bg-muted rounded-lg p-0.5 gap-0.5 overflow-x-auto">
            {TABS.map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchInput('');
                  setIsSearching(false);
                }}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
                  activeTab === tab.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {(activeTab === 'all' || activeTab === 'pending') && canEdit && (
            <button 
              onClick={() => setNewPaymentOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors"
            >
              <PlusCircle size={14} /> New Payment
            </button>
          )}
        </div>

        {(activeTab === 'all' || activeTab === 'pending') && (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, invoice number, transaction ID, amount..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
            {isSearching && searchInput && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <div className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            )}
          </div>
        )}

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          {activeTab === 'all' && (
            <PaymentsTable 
              payments={payments || []} 
              onMarkPaid={setMarkPaidPayment}
              onEdit={handleEditPayment}
              onDelete={setDeleteConfirm}
              searchTerm={searchInput}
              userRole={userRole}
              loadingMore={loadingMore}
              hasMore={hasMore && !isSearching}
              loadMore={loadMore}
            />
          )}
          
          {activeTab === 'pending' && (
            <PendingTab 
              payments={payments || []} 
              onMarkPaid={setMarkPaidPayment}
              onEdit={handleEditPayment}
              onDelete={setDeleteConfirm}
              searchTerm={searchInput}
              userRole={userRole}
              loadingMore={loadingMore}
              hasMore={hasMore && !isSearching}
              loadMore={loadMore}
            />
          )}
          
          {activeTab === 'payouts' && (
            <div className="p-5">
              {tutorsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <TutorPayoutsTab tutors={tutors} />
              )}
            </div>
          )}
          
          {activeTab === 'invoices' && (
            <div className="p-5">
              {leadsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <InvoiceGeneratorTab 
                  leads={leads} 
                  onCreatePayment={handleCreatePayment}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <NewPaymentModal 
        open={newPaymentOpen} 
        onClose={() => setNewPaymentOpen(false)} 
      />
      
      <MarkPaidModal 
        open={!!markPaidPayment} 
        onClose={() => setMarkPaidPayment(null)} 
        payment={markPaidPayment}
        onSuccess={() => {
          refreshStats();
          refreshPayments();
          setMarkPaidPayment(null);
        }}
      />
      
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              Reschedule Payment
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-3">
            {editingPayment && (
              <>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-sm font-medium text-foreground">{editingPayment.studentName || editingPayment.tutorName}</p>
                  <p className="text-xs text-muted-foreground">Invoice: {editingPayment.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current Due Date: {editingPayment.dueDate ? formatDate(editingPayment.dueDate) : 'Not set'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">New Due Date *</label>
                  <Input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleReschedulePayment} disabled={!newDueDate}>
              Update Due Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={18} />
              Delete Payment
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-3">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this payment record?
            </p>
            {deleteConfirm && (
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-foreground">{deleteConfirm.studentName || deleteConfirm.tutorName}</p>
                <p className="text-xs text-muted-foreground">Invoice: {deleteConfirm.invoiceNumber}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Amount: {formatCurrency(deleteConfirm.amount)}
                </p>
              </div>
            )}
            <p className="text-xs text-red-600">
              This action cannot be undone.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDeletePayment(deleteConfirm)}>
              Delete Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}