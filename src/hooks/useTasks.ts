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
  getDocs,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import type { Task } from '../types';

// Generate Task ID
export function generateTaskId(count: number): string {
  const year = new Date().getFullYear();
  const paddedCount = String(count).padStart(4, '0');
  return `TASK-${year}-${paddedCount}`;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('📋 Setting up tasks listener');
    const colRef = collection(db, 'tasks');
    const q = query(colRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📦 Tasks snapshot received, docs count:', snapshot.docs.length);
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Task[];
        setTasks(docs);
        setLoading(false);
      },
      (err) => {
        console.error('❌ Tasks listener error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { tasks, loading, error };
}

export async function addTask(
  task: Omit<Task, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    console.log('➕ Adding task:', task);
    
    const colRef = collection(db, 'tasks');
    const snapshot = await getDocs(query(colRef));
    const count = snapshot.size + 1;
    const taskId = generateTaskId(count);
    
    const docRef = await addDoc(colRef, {
      ...task,
      taskId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('✅ Task added with ID:', docRef.id, 'Task Code:', taskId);
    toast.success(`Task added successfully with ID: ${taskId}`);
    return docRef.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add task';
    console.error('❌ Error adding task:', err);
    toast.error(message);
    throw err;
  }
}

export async function updateTask(
  id: string,
  data: Partial<Omit<Task, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    console.log('✏️ Updating task:', id, data);
    const docRef = doc(db, 'tasks', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    console.log('✅ Task updated successfully');
    toast.success('Task updated successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update task';
    console.error('❌ Error updating task:', err);
    toast.error(message);
    throw err;
  }
}

export async function deleteTask(id: string): Promise<void> {
  try {
    console.log('🗑️ Deleting task:', id);
    const docRef = doc(db, 'tasks', id);
    await deleteDoc(docRef);
    console.log('✅ Task deleted successfully');
    toast.success('Task deleted successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete task';
    console.error('❌ Error deleting task:', err);
    toast.error(message);
    throw err;
  }
}