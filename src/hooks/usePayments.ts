import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  where,
  limit,
  getDocs,
  startAfter,
  onSnapshot,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import type { Payment } from '../types';

export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}-${random}`;
}

export function usePaymentsPaginated(initialLimit: number = 30) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPayouts, setTotalPayouts] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [totalOverdue, setTotalOverdue] = useState(0);
  
  const lastDocRef = useRef<any>(null);
  const currentFiltersRef = useRef<{ status?: string }>({});
  const isMountedRef = useRef(true);

  // Stats listener
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'payments'), (snapshot) => {
      let revenue = 0, payouts = 0, pending = 0, overdue = 0;
      snapshot.docs.forEach(doc => {
        const payment = doc.data();
        const amount = Number(payment.amount) || 0;
        if (payment.status === 'paid') {
          if (payment.type === 'payout') payouts += amount;
          else revenue += amount;
        } else if (payment.status === 'pending') pending += amount;
        else if (payment.status === 'overdue') overdue += amount;
      });
      if (isMountedRef.current) {
        setTotalRevenue(revenue);
        setTotalPayouts(payouts);
        setTotalPending(pending);
        setTotalOverdue(overdue);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadPayments = useCallback(async (filters?: { status?: string }) => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    currentFiltersRef.current = filters || {};
    
    try {
      let constraints: any[] = [orderBy('dueDate', 'desc'), limit(initialLimit)];
      if (filters?.status && filters.status !== 'all') {
        constraints.unshift(where('status', '==', filters.status));
      }
      
      const q = query(collection(db, 'payments'), ...constraints);
      const snapshot = await getDocs(q);
      
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Payment[];
      
      if (isMountedRef.current) {
        setPayments(docs);
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
        setHasMore(snapshot.docs.length === initialLimit);
      }
    } catch (err) {
      console.error('Error loading payments:', err);
      if (isMountedRef.current) setError(err as Error);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [initialLimit]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDocRef.current) return;
    
    setLoadingMore(true);
    try {
      let constraints: any[] = [orderBy('dueDate', 'desc'), startAfter(lastDocRef.current), limit(initialLimit)];
      const status = currentFiltersRef.current?.status;
      if (status && status !== 'all') {
        constraints.unshift(where('status', '==', status));
      }
      
      const q = query(collection(db, 'payments'), ...constraints);
      const snapshot = await getDocs(q);
      const newDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Payment[];
      
      if (isMountedRef.current) {
        setPayments(prev => [...prev, ...newDocs]);
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
        setHasMore(snapshot.docs.length === initialLimit);
      }
    } catch (err) {
      console.error('Error loading more:', err);
      toast.error('Failed to load more payments');
    } finally {
      if (isMountedRef.current) setLoadingMore(false);
    }
  }, [initialLimit, hasMore, loadingMore]);

  const searchPayments = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      loadPayments(currentFiltersRef.current);
      return;
    }
    
    setLoading(true);
    
    try {
      const searchLower = searchTerm.toLowerCase().trim();
      
      const q = query(collection(db, 'payments'));
      const snapshot = await getDocs(q);
      
      const results: Payment[] = [];
      snapshot.docs.forEach(doc => {
        const payment = { id: doc.id, ...doc.data() } as Payment;
        if (
          payment.studentName?.toLowerCase().includes(searchLower) ||
          payment.invoiceNumber?.toLowerCase().includes(searchLower) ||
          payment.transactionId?.toLowerCase().includes(searchLower) ||
          payment.mode?.toLowerCase().includes(searchLower) ||
          payment.amount?.toString().includes(searchLower)
        ) {
          results.push(payment);
        }
      });
      
      if (isMountedRef.current) {
        setPayments(results);
        setHasMore(false);
      }
      
      if (results.length === 0) {
        toast.error(`No payments found matching "${searchTerm}"`);
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Search failed');
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [loadPayments]);

  const refreshPayments = useCallback(() => {
    loadPayments(currentFiltersRef.current);
  }, [loadPayments]);

  const refreshStats = useCallback(() => {
    console.log('Stats refreshed');
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadPayments();
    return () => { isMountedRef.current = false; };
  }, []);

  return { 
    payments, 
    loading,
    loadingMore,
    hasMore,
    error,
    totalRevenue,
    totalPayouts,
    totalPending, 
    totalOverdue,
    loadPayments,
    loadMore,
    refreshPayments,
    searchPayments,
    refreshStats,
  };
}

// Add back the missing usePayments export
export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const q = query(collection(db, 'payments'), orderBy('dueDate', 'desc'), limit(100));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Payment[];
        setPayments(docs);
        setLoading(false);
      } catch (err) {
        console.error('Payments error:', err);
        setError(err as Error);
        setLoading(false);
      }
    };
    
    fetchPayments();
  }, []);

  return { payments, loading, error };
}

export async function addPayment(payment: any): Promise<string> {
  try {
    const colRef = collection(db, 'payments');
    const docRef = await addDoc(colRef, {
      ...payment,
      invoiceNumber: payment.invoiceNumber || generateInvoiceNumber(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    toast.success('Payment added successfully');
    return docRef.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add payment';
    toast.error(message);
    throw err;
  }
}

export async function updatePayment(id: string, data: any): Promise<void> {
  try {
    const docRef = doc(db, 'payments', id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    toast.success('Payment updated successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update payment';
    toast.error(message);
    throw err;
  }
}

export async function deletePayment(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'payments', id);
    await deleteDoc(docRef);
    toast.success('Payment deleted successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete payment';
    toast.error(message);
    throw err;
  }
}

export async function markPaymentAsPaid(id: string, data: { paidDate: string; mode: string; transactionId?: string }): Promise<void> {
  try {
    const docRef = doc(db, 'payments', id);
    await updateDoc(docRef, {
      status: 'paid',
      paidDate: data.paidDate,
      mode: data.mode,
      transactionId: data.transactionId || null,
      updatedAt: serverTimestamp(),
    });
    toast.success('Payment marked as paid');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to mark payment as paid';
    toast.error(message);
    throw err;
  }
}

export async function getTutorPaymentSummary(tutorId: string): Promise<{ total: number; paid: number; pending: number }> {
  try {
    const q = query(collection(db, 'payments'), where('tutorId', '==', tutorId));
    const snapshot = await getDocs(q);
    
    let total = 0, paid = 0, pending = 0;
    snapshot.docs.forEach(doc => {
      const payment = doc.data() as Payment;
      total += payment.amount || 0;
      if (payment.status === 'paid') paid += payment.amount || 0;
      else if (payment.status === 'pending' || payment.status === 'overdue') pending += payment.amount || 0;
    });
    return { total, paid, pending };
  } catch (err) {
    console.error('Error:', err);
    return { total: 0, paid: 0, pending: 0 };
  }
}