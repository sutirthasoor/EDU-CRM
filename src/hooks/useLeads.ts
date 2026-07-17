import { useState, useEffect, useCallback, useRef } from 'react';
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
  where,
  limit,
  startAfter,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import type { Lead } from '../types';

export function generateLeadId(count: number): string {
  const year = new Date().getFullYear();
  const paddedCount = String(count).padStart(3, '0');
  return `LEAD-${year}-${paddedCount}`;
}

// NEW: Paginated leads hook with caching and query optimization
export function useLeadsPaginated(pageSize: number = 30) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // Cache for different filter combinations
  const cacheRef = useRef<Map<string, { leads: Lead[], lastVisible: any, hasMore: boolean }>>(new Map());
  const currentFiltersRef = useRef<string>('');

  // Load first page with optional filters
  const loadLeads = useCallback(async (filters?: { status?: string; source?: string }) => {
    setLoading(true);
    try {
      const cacheKey = JSON.stringify(filters || {});
      currentFiltersRef.current = cacheKey;
      
      // Check cache first
      const cached = cacheRef.current.get(cacheKey);
      if (cached && cached.leads.length > 0) {
        setLeads(cached.leads);
        setLastVisible(cached.lastVisible);
        setHasMore(cached.hasMore);
        setLoading(false);
        return;
      }
      
      let constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(pageSize)];
      
      // Apply filters at query level (optimization)
      if (filters?.status && filters.status !== 'all') {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters?.source && filters.source !== 'all') {
        constraints.push(where('source', '==', filters.source));
      }
      
      const q = query(collection(db, 'leads'), ...constraints);
      const snapshot = await getDocs(q);
      
      const docs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Lead[];
      
      setLeads(docs);
      const newLastVisible = snapshot.docs[snapshot.docs.length - 1];
      setLastVisible(newLastVisible);
      const newHasMore = snapshot.docs.length === pageSize;
      setHasMore(newHasMore);
      
      // Update cache
      cacheRef.current.set(cacheKey, {
        leads: docs,
        lastVisible: newLastVisible,
        hasMore: newHasMore
      });
      
    } catch (err) {
      console.error('Error loading leads:', err);
      setError(err as Error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // Load more (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    try {
      // Get current filters from the last load
      const filters = JSON.parse(currentFiltersRef.current || '{}');
      let constraints: QueryConstraint[] = [
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(pageSize)
      ];
      
      if (filters?.status && filters.status !== 'all') {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters?.source && filters.source !== 'all') {
        constraints.push(where('source', '==', filters.source));
      }
      
      const q = query(collection(db, 'leads'), ...constraints);
      const snapshot = await getDocs(q);
      
      const newDocs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Lead[];
      
      setLeads(prev => [...prev, ...newDocs]);
      const newLastVisible = snapshot.docs[snapshot.docs.length - 1];
      setLastVisible(newLastVisible);
      const newHasMore = snapshot.docs.length === pageSize;
      setHasMore(newHasMore);
      
      // Update cache with merged data
      const cacheKey = currentFiltersRef.current;
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        cacheRef.current.set(cacheKey, {
          leads: [...cached.leads, ...newDocs],
          lastVisible: newLastVisible,
          hasMore: newHasMore
        });
      }
      
    } catch (err) {
      console.error('Error loading more leads:', err);
      setError(err as Error);
      toast.error('Failed to load more leads');
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, lastVisible, pageSize]);

  // Get total count (optimized)
  const getTotalCount = useCallback(async () => {
    try {
      const snapshot = await getDocs(query(collection(db, 'leads')));
      setTotalCount(snapshot.size);
    } catch (err) {
      console.error('Error getting count:', err);
    }
  }, []);

  // Refresh leads (clear cache and reload)
  const refreshLeads = useCallback(() => {
    // Clear cache for current filters
    const cacheKey = currentFiltersRef.current;
    cacheRef.current.delete(cacheKey);
    setLeads([]);
    setLastVisible(null);
    setHasMore(true);
    loadLeads(JSON.parse(cacheKey || '{}'));
  }, [loadLeads]);

  // Search leads with debounce (client-side for now, can be extended to server-side)
  const searchLeads = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return loadLeads(JSON.parse(currentFiltersRef.current || '{}'));
    }
    
    setLoading(true);
    try {
      // Client-side search on loaded data (optimized for small to medium datasets)
      // For large datasets, implement server-side search with Firebase
      const allLeads: Lead[] = [];
      let lastDoc: any = null;
      let hasMorePages = true;
      
      while (hasMorePages) {
        let constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(100)];
        if (lastDoc) {
          constraints.push(startAfter(lastDoc));
        }
        
        const q = query(collection(db, 'leads'), ...constraints);
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Lead[];
        allLeads.push(...docs);
        
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        hasMorePages = snapshot.docs.length === 100;
      }
      
      const searchLower = searchTerm.toLowerCase();
      const filtered = allLeads.filter(lead => 
        lead.studentName?.toLowerCase().includes(searchLower) ||
        lead.phone?.includes(searchTerm) ||
        lead.leadId?.toLowerCase().includes(searchLower) ||
        lead.parentName?.toLowerCase().includes(searchLower)
      );
      
      setLeads(filtered);
      setHasMore(false);
    } catch (err) {
      console.error('Error searching leads:', err);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return { 
    leads, 
    loading, 
    loadingMore, 
    hasMore, 
    error, 
    totalCount,
    loadLeads, 
    loadMore, 
    refreshLeads,
    getTotalCount,
    searchLeads
  };
}

// Original hook kept for backward compatibility (optimized with limit)
export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const colRef = collection(db, 'leads');
    // OPTIMIZED: Added limit to prevent loading all leads at once
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Lead[];
        setLeads(docs);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching leads:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const refreshLeads = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, 'leads');
      const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Lead[];
      setLeads(docs);
    } catch (err) {
      console.error('Error refreshing leads:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { leads, loading, error, refreshLeads };
}

// CRUD operations
export async function addLead(
  lead: Omit<Lead, 'id' | 'leadId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const colRef = collection(db, 'leads');
    const snapshot = await getDocs(query(colRef));
    const count = snapshot.size + 1;
    const leadId = generateLeadId(count);

    // Make sure schoolCollegeName is included
    const leadData = {
      ...lead,
      leadId,
      schoolCollegeName: lead.schoolCollegeName || '', // Ensure it's included
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log('Saving lead with data:', leadData); // Debug log

    const docRef = await addDoc(colRef, leadData);
    toast.success('Lead added successfully');
    return docRef.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add lead';
    console.error('Error adding lead:', err);
    toast.error(message);
    throw err;
  }
}
export async function updateLead(
  id: string,
  data: Partial<Omit<Lead, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, 'leads', id);
    
    // Make sure schoolCollegeName is included in updates
    const updateData = {
      ...data,
      schoolCollegeName: data.schoolCollegeName || '',
      updatedAt: serverTimestamp(),
    };
    
    console.log('Updating lead with data:', updateData); // Debug log
    
    await updateDoc(docRef, updateData);
    toast.success('Lead updated successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update lead';
    console.error('Error updating lead:', err);
    toast.error(message);
    throw err;
  }
}
export async function deleteLead(id: string): Promise<void> {
  try {
    console.log('🗑️ Deleting lead:', id);
    const docRef = doc(db, 'leads', id);
    await deleteDoc(docRef);
    console.log('✅ Lead deleted successfully');
    toast.success('Lead deleted successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete lead';
    console.error('❌ Error deleting lead:', err);
    toast.error(message);
    throw err;
  }
}

// Utility function to get leads by status (optimized)
export async function getLeadsByStatus(status: string): Promise<Lead[]> {
  try {
    const q = query(
      collection(db, 'leads'),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Lead[];
  } catch (err) {
    console.error('Error fetching leads by status:', err);
    return [];
  }
}

// Utility function to get leads by tutor (optimized)
export async function getLeadsByTutor(tutorId: string): Promise<Lead[]> {
  try {
    const q = query(
      collection(db, 'leads'),
      where('assignedTutorId', '==', tutorId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Lead[];
  } catch (err) {
    console.error('Error fetching leads by tutor:', err);
    return [];
  }
}