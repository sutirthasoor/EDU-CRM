import { useEffect, useState } from 'react';
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  where,
  getDocs,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useCollection<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const colRef = collection(db, collectionName);
    const q = constraints.length > 0 ? query(colRef, ...constraints) : query(colRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as unknown as T[];
        setData(docs);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName]);

  return { data, loading, error };
}

export function useDocument<T extends DocumentData>(
  collectionName: string,
  id: string | null
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    const docRef = doc(db, collectionName, id);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as unknown as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, id]);

  return { data, loading, error };
}
// Add this new hook after useDocument
export function usePaginatedCollection<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  limitCount: number = 30
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, collectionName), ...constraints, limit(limitCount));
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      const snapshot = await getDocs(q);
      const newDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as T[];
      
      setData(prev => [...prev, ...newDocs]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === limitCount);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setData([]);
    setLastDoc(null);
    setHasMore(true);
    await loadMore();
  };

  return { data, loading, hasMore, loadMore, refresh, error };
}
// Add at the bottom
export function selectFields<T>(fields: (keyof T)[]): string[] {
  return fields as string[];
}
export { 
  collection, query, doc, getDoc, addDoc, updateDoc, deleteDoc, 
  serverTimestamp, orderBy, where, getDocs, limit, startAfter 
};
