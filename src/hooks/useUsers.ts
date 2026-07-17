import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AppUser } from '../types';

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('👥 Setting up users listener');
    const colRef = collection(db, 'users');
    const q = query(colRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📦 Users snapshot received, docs count:', snapshot.docs.length);
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AppUser[];
        setUsers(docs);
        setLoading(false);
      },
      (err) => {
        console.error('❌ Users listener error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { users, loading, error };
}