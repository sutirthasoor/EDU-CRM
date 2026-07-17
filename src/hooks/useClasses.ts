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
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import type { Class } from '../types';

export function useClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('📚 Setting up classes listener');
    
    // Make sure we're using the correct collection name
    const colRef = collection(db, 'classes');
    const q = query(colRef, orderBy('order', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📦 Classes snapshot received, docs count:', snapshot.docs.length);
        
        if (snapshot.docs.length === 0) {
          console.log('⚠️ No classes found in Firebase');
          setClasses([]);
          setLoading(false);
          return;
        }

        const docs = snapshot.docs.map((d) => {
          const data = d.data();
          console.log('📄 Class document:', { id: d.id, ...data });
          return {
            id: d.id,
            ...data,
          } as Class;
        });
        
        console.log('✅ Processed classes:', docs.length);
        setClasses(docs);
        setLoading(false);
      },
      (err) => {
        console.error('❌ Classes listener error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { classes, loading, error };
}

export async function addClass(
  classData: Omit<Class, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    console.log('➕ Adding class:', classData);
    const colRef = collection(db, 'classes');
    const docRef = await addDoc(colRef, {
      ...classData,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('✅ Class added with ID:', docRef.id);
    toast.success('Class added successfully');
    return docRef.id;
  } catch (err) {
    console.error('❌ Error adding class:', err);
    const message = err instanceof Error ? err.message : 'Failed to add class';
    toast.error(message);
    throw err;
  }
}

export async function updateClass(
  id: string,
  data: Partial<Omit<Class, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    console.log('✏️ Updating class:', id, data);
    const docRef = doc(db, 'classes', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    console.log('✅ Class updated successfully');
    toast.success('Class updated successfully');
  } catch (err) {
    console.error('❌ Error updating class:', err);
    const message = err instanceof Error ? err.message : 'Failed to update class';
    toast.error(message);
    throw err;
  }
}

export async function deleteClass(id: string): Promise<void> {
  try {
    console.log('🗑️ Deleting class:', id);
    const docRef = doc(db, 'classes', id);
    await deleteDoc(docRef);
    console.log('✅ Class deleted successfully');
    toast.success('Class deleted successfully');
  } catch (err) {
    console.error('❌ Error deleting class:', err);
    const message = err instanceof Error ? err.message : 'Failed to delete class';
    toast.error(message);
    throw err;
  }
}

export async function toggleClassStatus(id: string, isActive: boolean): Promise<void> {
  try {
    console.log('🔄 Toggling class status:', id, isActive);
    const docRef = doc(db, 'classes', id);
    await updateDoc(docRef, {
      isActive,
      updatedAt: serverTimestamp(),
    });
    console.log('✅ Class status updated successfully');
    toast.success(`Class ${isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (err) {
    console.error('❌ Error toggling class status:', err);
    const message = err instanceof Error ? err.message : 'Failed to update class status';
    toast.error(message);
    throw err;
  }
}