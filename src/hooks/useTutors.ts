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
  where,
  getDocs,
  limit,
  startAfter,
  QueryConstraint,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import type { Tutor, PendingTutor } from '../types';

export async function generateTutorId(zone: string): Promise<string> {
  try {
    const colRef = collection(db, 'tutors');
    const snapshot = await getDocs(query(colRef, where('zone', '==', zone)));
    const count = snapshot.size + 1;
    const zoneCode = zone.toUpperCase().replace(/\s+/g, '_');
    const paddedCount = String(count).padStart(3, '0');
    return `EC-${zoneCode}-${paddedCount}`;
  } catch (error) {
    const timestamp = Date.now().toString().slice(-6);
    return `EC-${timestamp}`;
  }
}

// In your useTutors.ts file - REPLACE the useTutorsPaginated function with this:

export function useTutorsPaginated(pageSize: number = 20) {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // Filter states
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [subAreaFilter, setSubAreaFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [experienceFilter, setExperienceFilter] = useState<string>('all');
  const [presentQualificationFilter, setPresentQualificationFilter] = useState<string>('all');
  const [lastQualificationFilter, setLastQualificationFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [isSearching, setIsSearching] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);
  const isQueryingRef = useRef(false);
  
  // Track if we should execute query on next render
  const [shouldExecute, setShouldExecute] = useState(false);

  // Helper functions
  const filterByRating = (tutor: Tutor, rating: string): boolean => {
    if (rating === 'all') return true;
    const tutorRating = tutor.rating || 0;
    if (rating === 'unrated') return tutorRating === 0;
    if (rating === 'below3') return tutorRating > 0 && tutorRating < 3;
    return tutorRating === parseInt(rating);
  };

  const filterByExperience = (tutor: Tutor, exp: string): boolean => {
    if (exp === 'all') return true;
    const years = parseInt(tutor.teachingExperience || '0') || 0;
    switch (exp) {
      case '0-2': return years >= 0 && years <= 2;
      case '3-5': return years >= 3 && years <= 5;
      case '6-10': return years >= 6 && years <= 10;
      case '10+': return years > 10;
      default: return true;
    }
  };

  // Execute search across all tutors
  const executeServerSearch = useCallback(async () => {
    const currentSearch = searchTerm.trim();
    if (!currentSearch) return [];
    
    const searchTermLower = currentSearch.toLowerCase();
    
    try {
      let allTutors: Tutor[] = [];
      let lastDoc: QueryDocumentSnapshot | null = null;
      let hasMoreData = true;
      
      while (hasMoreData) {
        let constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
        if (lastDoc) {
          constraints.push(startAfter(lastDoc));
        }
        constraints.push(limit(500));
        
        const q = query(collection(db, 'tutors'), ...constraints);
        const snapshot = await getDocs(q);
        
        const batchResults = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
        })) as Tutor[];
        
        allTutors = [...allTutors, ...batchResults];
        lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
        hasMoreData = snapshot.docs.length === 500;
      }
      
      let results = allTutors.filter(tutor => {
        return (
          tutor.name?.toLowerCase().includes(searchTermLower) ||
          tutor.tutorId?.toLowerCase().includes(searchTermLower) ||
          tutor.phone?.includes(searchTermLower) ||
          tutor.email?.toLowerCase().includes(searchTermLower) ||
          tutor.zone?.toLowerCase().includes(searchTermLower) ||
          tutor.area?.toLowerCase().includes(searchTermLower) ||
          tutor.subArea?.toLowerCase().includes(searchTermLower) ||
          tutor.presentQualification?.toLowerCase().includes(searchTermLower) ||
          tutor.lastQualification?.toLowerCase().includes(searchTermLower) ||
          tutor.teachingExperience?.toLowerCase().includes(searchTermLower) ||
          tutor.feeRange?.toLowerCase().includes(searchTermLower) ||
          tutor.preferredMode?.toLowerCase().includes(searchTermLower) ||
          tutor.subjectsHandled?.some(s => s.toLowerCase().includes(searchTermLower))
        );
      });
      
      // Apply filters
      if (zoneFilter && zoneFilter !== 'all') {
        results = results.filter(t => t.zone === zoneFilter);
      }
      if (areaFilter && areaFilter !== 'all') {
        results = results.filter(t => t.area === areaFilter);
      }
      if (subAreaFilter && subAreaFilter !== 'all') {
        results = results.filter(t => t.subArea === subAreaFilter);
      }
      if (modeFilter && modeFilter !== 'all') {
        results = results.filter(t => t.preferredMode === modeFilter);
      }
      if (statusFilter && statusFilter !== 'all') {
        results = results.filter(t => t.isActive === (statusFilter === 'active'));
      }
      if (presentQualificationFilter && presentQualificationFilter !== 'all') {
        results = results.filter(t => t.presentQualification === presentQualificationFilter);
      }
      if (lastQualificationFilter && lastQualificationFilter !== 'all') {
        results = results.filter(t => t.lastQualification === lastQualificationFilter);
      }
      
      results = results.filter(t => filterByRating(t, ratingFilter));
      results = results.filter(t => filterByExperience(t, experienceFilter));
      
      return results;
      
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Search failed. Please try again.');
      return [];
    }
  }, [searchTerm, zoneFilter, areaFilter, subAreaFilter, modeFilter, statusFilter, 
      presentQualificationFilter, lastQualificationFilter, ratingFilter, experienceFilter]);

  // The actual query execution function
  const executeQuery = useCallback(async (isLoadMore: boolean = false) => {
    if (!isMountedRef.current) return;
    if (isQueryingRef.current) return;
    
    isQueryingRef.current = true;
    
    if (!isLoadMore) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const currentSearch = searchTerm.trim();
      
      if (currentSearch) {
        setIsSearching(true);
        const results = await executeServerSearch();
        
        if (isMountedRef.current) {
          setTutors(results);
          setHasMore(false);
          setLastVisible(null);
        }
        setIsSearching(false);
      } else {
        let constraints: QueryConstraint[] = [];
        
        // Use the CURRENT filter values
        if (zoneFilter && zoneFilter !== 'all') {
          constraints.push(where('zone', '==', zoneFilter));
        }
        if (areaFilter && areaFilter !== 'all') {
          constraints.push(where('area', '==', areaFilter));
        }
        if (subAreaFilter && subAreaFilter !== 'all') {
          constraints.push(where('subArea', '==', subAreaFilter));
        }
        if (modeFilter && modeFilter !== 'all') {
          constraints.push(where('preferredMode', '==', modeFilter));
        }
        if (statusFilter && statusFilter !== 'all') {
          constraints.push(where('isActive', '==', statusFilter === 'active'));
        }
        if (presentQualificationFilter && presentQualificationFilter !== 'all') {
          constraints.push(where('presentQualification', '==', presentQualificationFilter));
        }
        if (lastQualificationFilter && lastQualificationFilter !== 'all') {
          constraints.push(where('lastQualification', '==', lastQualificationFilter));
        }
        
        constraints.push(orderBy('createdAt', 'desc'));
        
        if (isLoadMore && lastVisible) {
          constraints.push(startAfter(lastVisible));
          constraints.push(limit(pageSize));
        } else if (!isLoadMore) {
          constraints.push(limit(pageSize));
        }
        
        const q = query(collection(db, 'tutors'), ...constraints);
        const snapshot = await getDocs(q);
        
        let newResults = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
        })) as Tutor[];
        
        newResults = newResults.filter(t => filterByRating(t, ratingFilter));
        newResults = newResults.filter(t => filterByExperience(t, experienceFilter));
        
        if (isMountedRef.current) {
          if (isLoadMore) {
            setTutors(prev => {
              const existingIds = new Set(prev.map(t => t.id));
              const uniqueNewResults = newResults.filter(t => !existingIds.has(t.id));
              return [...prev, ...uniqueNewResults];
            });
          } else {
            setTutors(newResults);
          }
          
          const newHasMore = snapshot.docs.length === pageSize;
          setHasMore(newHasMore);
          
          if (snapshot.docs.length > 0) {
            const newLastVisible = snapshot.docs[snapshot.docs.length - 1];
            setLastVisible(newLastVisible);
          }
        }
      }
      
    } catch (err) {
      console.error('Error executing query:', err);
      if (isMountedRef.current) {
        toast.error('Failed to load tutors');
        setError(err as Error);
      }
    } finally {
      if (isMountedRef.current) {
        if (!isLoadMore) {
          setLoading(false);
        }
        setLoadingMore(false);
      }
      isQueryingRef.current = false;
    }
  }, [searchTerm, zoneFilter, areaFilter, subAreaFilter, modeFilter, statusFilter, 
      ratingFilter, experienceFilter, presentQualificationFilter, lastQualificationFilter, 
      pageSize, lastVisible, executeServerSearch]);

  // CRITICAL FIX: Use useEffect to watch filter changes
  // This ensures the query runs AFTER the state has updated
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    // Reset pagination for filter changes
    setLastVisible(null);
    setHasMore(true);
    setTutors([]);
    
    // Execute query with the new filter values
    executeQuery(false);
  }, [zoneFilter, areaFilter, subAreaFilter, modeFilter, statusFilter, 
      ratingFilter, experienceFilter, presentQualificationFilter, lastQualificationFilter]);

  // Handle search separately with debounce
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setLastVisible(null);
      setHasMore(true);
      setTutors([]);
      executeQuery(false);
    }, 500);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Simple setters - they just update state, useEffect handles the query
  const handleZoneFilterChange = useCallback((value: string) => {
    setZoneFilter(value);
    if (value !== 'all') {
      setAreaFilter('all');
      setSubAreaFilter('all');
    }
  }, []);

  const handleAreaFilterChange = useCallback((value: string) => {
    setAreaFilter(value);
    if (value !== 'all') {
      setSubAreaFilter('all');
    }
  }, []);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || !isMountedRef.current) return;
    if (searchTerm && searchTerm.trim()) return;
    executeQuery(true);
  }, [loadingMore, hasMore, executeQuery, searchTerm]);

  const refreshTutors = useCallback(() => {
    setLastVisible(null);
    setHasMore(true);
    setTutors([]);
    executeQuery(false);
  }, [executeQuery]);

  const resetAllFilters = useCallback(() => {
    // Just reset all states - useEffect will trigger the query
    setZoneFilter('all');
    setAreaFilter('all');
    setSubAreaFilter('all');
    setModeFilter('all');
    setStatusFilter('all');
    setRatingFilter('all');
    setExperienceFilter('all');
    setPresentQualificationFilter('all');
    setLastQualificationFilter('all');
    setSearchTerm('');
    setLastVisible(null);
    setHasMore(true);
    setTutors([]);
  }, []);

  // Initial load
  useEffect(() => {
    isMountedRef.current = true;
    executeQuery(false);
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { 
    tutors,
    loading,
    loadingMore, 
    hasMore, 
    error,
    setZoneFilter: handleZoneFilterChange,
    setAreaFilter: handleAreaFilterChange,
    setSubAreaFilter,
    setModeFilter,
    setStatusFilter,
    setRatingFilter,
    setExperienceFilter,
    setPresentQualificationFilter,
    setLastQualificationFilter,
    setSearchTerm,
    resetAllFilters,
    zoneFilter,
    areaFilter,
    subAreaFilter,
    modeFilter,
    statusFilter,
    ratingFilter,
    experienceFilter,
    presentQualificationFilter,
    lastQualificationFilter,
    searchTerm,
    isSearching,
    loadMore, 
    refreshTutors
  };
}
// ========== ORIGINAL HOOK (Backward compatibility) ==========
export function useTutors() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const colRef = collection(db, 'tutors');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(200));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Tutor[];
        setTutors(docs);
        setLoading(false);
      },
      (err) => {
        console.error('❌ Tutors listener error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const refreshTutors = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, 'tutors');
      const q = query(colRef, orderBy('createdAt', 'desc'), limit(200));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Tutor[];
      setTutors(docs);
    } catch (err) {
      console.error('Error refreshing tutors:', err);
    } finally {
      setLoading(false);
    }
  };

  return { tutors, loading, error, refreshTutors };
}

// ========== PENDING TUTORS HOOK ==========
// ========== PENDING TUTORS HOOK WITH PAGINATION ==========
export function usePendingTutors() {
  const [pendingTutors, setPendingTutors] = useState<PendingTutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch total count (this gets ALL records count)
  const fetchTotalCount = async () => {
    try {
      const colRef = collection(db, 'pendingTutors');
      const snapshot = await getDocs(colRef);
      setTotalCount(snapshot.size);
      console.log('Total pending tutors count:', snapshot.size);
    } catch (err) {
      console.error('Error fetching total count:', err);
    }
  };

  // Initial fetch - get first batch
  const fetchPendingTutors = async (loadMore: boolean = false) => {
    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const colRef = collection(db, 'pendingTutors');
      let constraints: any[] = [orderBy('submittedAt', 'desc')];
      
      // Add limit
      constraints.push(limit(100));
      
      // Add startAfter for pagination
      if (loadMore && lastDoc) {
        constraints.push(startAfter(lastDoc));
      }
      
      const q = query(colRef, ...constraints);
      const snapshot = await getDocs(q);
      
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as PendingTutor[];
      
      if (loadMore) {
        setPendingTutors(prev => [...prev, ...docs]);
      } else {
        setPendingTutors(docs);
      }
      
      setHasMore(snapshot.docs.length === 100);
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      
    } catch (err) {
      console.error('❌ Pending tutors error:', err);
      setError(err as Error);
    } finally {
      if (loadMore) {
        setIsLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Load more tutors (for pagination)
  const loadMoreTutors = () => {
    if (!hasMore || isLoadingMore) return;
    fetchPendingTutors(true);
  };

  // Refresh all data
  const refreshPendingTutors = async () => {
    setLastDoc(null);
    setHasMore(true);
    await fetchTotalCount();
    await fetchPendingTutors(false);
  };

  // Initial load
  useEffect(() => {
    fetchTotalCount();
    fetchPendingTutors(false);
  }, []);

  return { 
    pendingTutors, 
    totalCount,  // ← This will show the REAL total count
    loading, 
    isLoadingMore,
    hasMore,
    error, 
    refreshPendingTutors,
    loadMoreTutors
  };
}

// ========== CRUD OPERATIONS ==========
export async function addTutor(tutor: Omit<Tutor, 'id' | 'tutorId' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const tutorId = await generateTutorId(tutor.zone || 'GENERAL');
    const colRef = collection(db, 'tutors');
    const docRef = await addDoc(colRef, {
      ...tutor,
      tutorId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    toast.success(`Tutor added successfully with ID: ${tutorId}`);
    return docRef.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add tutor';
    toast.error(message);
    throw err;
  }
}

export async function updateTutor(id: string, data: Partial<Omit<Tutor, 'id' | 'createdAt'>>): Promise<void> {
  try {
    const docRef = doc(db, 'tutors', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    toast.success('Tutor updated successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update tutor';
    toast.error(message);
    throw err;
  }
}

export async function deleteTutor(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'tutors', id);
    await deleteDoc(docRef);
    toast.success('Tutor deleted successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete tutor';
    toast.error(message);
    throw err;
  }
}

export async function addPendingTutor(tutor: Omit<PendingTutor, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const colRef = collection(db, 'pendingTutors');
    const docRef = await addDoc(colRef, {
      ...tutor,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    toast.success('Application submitted! Awaiting admin approval.');
    return docRef.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to submit application';
    toast.error(message);
    throw err;
  }
}

export async function updatePendingTutor(id: string, data: Partial<Omit<PendingTutor, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  try {
    const cleanData: any = {};
    Object.keys(data).forEach(key => {
      if (data[key as keyof typeof data] !== undefined) {
        cleanData[key] = data[key as keyof typeof data];
      }
    });
    const docRef = doc(db, 'pendingTutors', id);
    await updateDoc(docRef, {
      ...cleanData,
      updatedAt: serverTimestamp(),
    });
    toast.success('Tutor application updated successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update tutor application';
    toast.error(message);
    throw err;
  }
}
// 🔥 NEW: Hook for dropdowns - fetches ALL tutors without pagination
export function useAllTutorsForDropdown() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAllTutors = async () => {
      try {
        let allTutors: Tutor[] = [];
        let lastDoc: QueryDocumentSnapshot | null = null;
        let hasMore = true;
        
        while (hasMore) {
          let constraints: QueryConstraint[] = [orderBy('name')];
          if (lastDoc) {
            constraints.push(startAfter(lastDoc));
          }
          constraints.push(limit(500));
          
          const snapshot = await getDocs(query(collection(db, 'tutors'), ...constraints));
          const batchResults = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
          })) as Tutor[];
          
          allTutors = [...allTutors, ...batchResults];
          lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
          hasMore = snapshot.docs.length === 500;
        }
        
        setTutors(allTutors);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching all tutors:', err);
        setError(err as Error);
        setLoading(false);
      }
    };
    
    fetchAllTutors();
  }, []);

  return { tutors, loading, error };
}
// ========== PENDING TUTORS COUNT ONLY (For Stats Card) ==========
export function usePendingTutorsCount() {
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [approvedCount, setApprovedCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, 'pendingTutors');
      const snapshot = await getDocs(colRef);
      
      let total = 0;
      let pending = 0;
      let approved = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        total++;
        if (data.status === 'pending') pending++;
        if (data.status === 'approved') approved++;
      });
      
      setTotalCount(total);
      setPendingCount(pending);
      setApprovedCount(approved);
      
      console.log('Counts fetched:', { total, pending, approved });
      
    } catch (err) {
      console.error('Error fetching counts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  return { totalCount, pendingCount, approvedCount, loading, refreshCounts: fetchCounts };
}
export async function approveTutor(pendingId: string, pendingTutor: PendingTutor, reviewedBy: string): Promise<void> {
  try {
    const tutorId = await generateTutorId(pendingTutor.zone || 'GENERAL');
    const tutorData: Omit<Tutor, 'id' | 'createdAt' | 'updatedAt'> = {
      tutorId,
      name: pendingTutor.name,
      phone: pendingTutor.phone,
      email: pendingTutor.email,
      zone: pendingTutor.zone,
      area: pendingTutor.area,
      subArea: pendingTutor.subArea,
      presentQualification: pendingTutor.presentQualification,
      classesHandled: pendingTutor.classesHandled,
      subjectsHandled: pendingTutor.subjectsHandled,
      teachingExperience: pendingTutor.teachingExperience,
      feeRange: pendingTutor.feeRange,
      preferredMode: pendingTutor.preferredMode,
      availability: pendingTutor.availability,
      preferredSlots: pendingTutor.preferredSlots,
      notes: pendingTutor.notes,
      isActive: true,
      rating: 0,
      ratingComment: '',
      alternatePhone: pendingTutor.alternatePhone || '',
      whatsapp: pendingTutor.whatsapp || '',
      dob: pendingTutor.dob || '',
      presentAddress: pendingTutor.presentAddress || '',
      permanentAddress: pendingTutor.permanentAddress || '',
      lastQualification: pendingTutor.lastQualification || '',
      class12Board: pendingTutor.class12Board || 'CBSE',
      class12SchoolName: pendingTutor.class12SchoolName || '',
      class12Year: pendingTutor.class12Year || '',
      class12Stream: pendingTutor.class12Stream || 'science',
      extraQualification: pendingTutor.extraQualification || '',
      extraCourseName: pendingTutor.extraCourseName || '',
      extraInstituteName: pendingTutor.extraInstituteName || '',
      extraYear: pendingTutor.extraYear || '',
      aboutMe: pendingTutor.aboutMe || '',
      preferredAreas: pendingTutor.preferredAreas || [],
      isSchoolOrCollegeTeacher: false,
      schoolOrCollegeName: '',
      photoBase64: pendingTutor.photoBase64 || '',
      location: '',
    };
    await addDoc(collection(db, 'tutors'), {
      ...tutorData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const pendingRef = doc(db, 'pendingTutors', pendingId);
    await updateDoc(pendingRef, {
      status: 'approved',
      reviewedAt: serverTimestamp(),
      reviewedBy,
      updatedAt: serverTimestamp(),
    });
    toast.success(`Tutor ${pendingTutor.name} approved and added to database`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to approve tutor';
    toast.error(message);
    throw err;
  }
}

export async function rejectTutor(pendingId: string, reviewedBy: string, reason?: string): Promise<void> {
  try {
    const pendingRef = doc(db, 'pendingTutors', pendingId);
    await updateDoc(pendingRef, {
      status: 'rejected',
      reviewedAt: serverTimestamp(),
      reviewedBy,
      rejectionReason: reason || '',
      updatedAt: serverTimestamp(),
    });
    toast.success('Tutor application rejected');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to reject tutor';
    toast.error(message);
    throw err;
  }
}