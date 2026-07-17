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
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import type { Subject } from '../types';

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const colRef = collection(db, 'subjects');
    const q = query(colRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Subject[];
        setSubjects(docs);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { subjects, loading, error };
}

export async function addSubject(
  subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const colRef = collection(db, 'subjects');
    const docRef = await addDoc(colRef, {
      ...subject,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    toast.success('Subject added successfully');
    return docRef.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add subject';
    toast.error(message);
    throw err;
  }
}

export async function updateSubject(
  id: string,
  data: Partial<Omit<Subject, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, 'subjects', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    toast.success('Subject updated successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update subject';
    toast.error(message);
    throw err;
  }
}

export async function deleteSubject(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'subjects', id);
    await deleteDoc(docRef);
    toast.success('Subject deleted successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete subject';
    toast.error(message);
    throw err;
  }
}

export async function toggleSubjectStatus(id: string, isActive: boolean): Promise<void> {
  try {
    const docRef = doc(db, 'subjects', id);
    await updateDoc(docRef, {
      isActive,
      updatedAt: serverTimestamp(),
    });
    toast.success(`Subject ${isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update subject status';
    toast.error(message);
    throw err;
  }
}