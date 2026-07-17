import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  where,
  getDocs,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import type { University } from '../types';

export function useUniversities() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('📚 Setting up universities listener');
    const colRef = collection(db, 'universities');
    const q = query(colRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📦 Universities snapshot received, docs count:', snapshot.docs.length);
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as University[];
        setUniversities(docs);
        setLoading(false);
      },
      (err) => {
        console.error('❌ Universities listener error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { universities, loading, error };
}

export async function addUniversity(
  university: Omit<University, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    console.log('➕ Adding university:', university);
    const colRef = collection(db, 'universities');
    const docRef = await addDoc(colRef, {
      ...university,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('✅ University added with ID:', docRef.id);
    toast.success('University added successfully');
    return docRef.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add university';
    console.error('❌ Error adding university:', err);
    toast.error(message);
    throw err;
  }
}

export async function updateUniversity(
  id: string,
  data: Partial<Omit<University, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    console.log('✏️ Updating university:', id, data);
    const docRef = doc(db, 'universities', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    console.log('✅ University updated successfully');
    toast.success('University updated successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update university';
    console.error('❌ Error updating university:', err);
    toast.error(message);
    throw err;
  }
}

export async function deleteUniversity(id: string): Promise<void> {
  try {
    console.log('🗑️ Deleting university:', id);
    const docRef = doc(db, 'universities', id);
    await deleteDoc(docRef);
    console.log('✅ University deleted successfully');
    toast.success('University deleted successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete university';
    console.error('❌ Error deleting university:', err);
    toast.error(message);
    throw err;
  }
}