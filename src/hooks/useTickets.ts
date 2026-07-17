import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import type { SupportTicket } from '../types';

export function generateTicketId(count: number): string {
  const year = new Date().getFullYear();
  const paddedCount = String(count).padStart(4, '0');
  return `TKT-${year}-${paddedCount}`;
}

export function useTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const colRef = collection(db, 'tickets');
    const q = query(colRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as SupportTicket[];
        setTickets(docs);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { tickets, loading, error };
}

// In useTickets.ts, when creating a ticket, ensure timestamps are used:
export async function addTicket(ticket: Omit<SupportTicket, 'id' | 'ticketId' | 'createdAt' | 'updatedAt'>) {
  const ticketsRef = collection(db, 'tickets');
  const snapshot = await getDocs(ticketsRef);
  const ticketId = `TKT-${new Date().getFullYear()}-${String(snapshot.size + 1).padStart(4, '0')}`;
  
  await addDoc(ticketsRef, {
    ...ticket,
    ticketId,
    createdAt: serverTimestamp(), // Use serverTimestamp
    updatedAt: serverTimestamp(),
  });
}
export async function updateTicket(
  id: string,
  data: Partial<Omit<SupportTicket, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, 'tickets', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    toast.success('Ticket updated successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update ticket';
    toast.error(message);
    throw err;
  }
}
