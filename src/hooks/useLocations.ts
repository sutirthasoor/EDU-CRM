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
  where,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import type { Zone, Area, SubArea } from '../types';

// Generate location code
export const generateLocationCode = (name: string): string => {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .substring(0, 10);
};

// ========== ZONES ==========
export function useZones() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const colRef = collection(db, 'zones');
    const q = query(colRef, orderBy('name'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Zone[];
        setZones(docs);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { zones, loading, error };
}
// ========== AREAS ==========
export async function updateArea(
  id: string,
  data: Partial<Omit<Area, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, 'areas', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    toast.success('Area updated successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update area';
    toast.error(message);
    throw err;
  }
}

// ========== SUB-AREAS ==========
export async function updateSubArea(
  id: string,
  data: Partial<Omit<SubArea, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, 'subAreas', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    toast.success('Sub-area updated successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update sub-area';
    toast.error(message);
    throw err;
  }
}
export async function addZone(zone: Omit<Zone, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const colRef = collection(db, 'zones');
    const docRef = await addDoc(colRef, {
      ...zone,
      code: generateLocationCode(zone.name),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    toast.success('Zone added successfully');
    return docRef.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add zone';
    toast.error(message);
    throw err;
  }
}

export async function updateZone(id: string, data: Partial<Zone>): Promise<void> {
  try {
    const docRef = doc(db, 'zones', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    toast.success('Zone updated successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update zone';
    toast.error(message);
    throw err;
  }
}

export async function deleteZone(id: string): Promise<void> {
  try {
    // Check if zone has areas
    const areasRef = collection(db, 'areas');
    const q = query(areasRef, where('zoneId', '==', id));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      toast.error('Cannot delete zone with existing areas');
      return;
    }
    
    const docRef = doc(db, 'zones', id);
    await deleteDoc(docRef);
    toast.success('Zone deleted successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete zone';
    toast.error(message);
    throw err;
  }
}

// ========== AREAS ==========
export function useAreas(zoneId?: string) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let q;
    const colRef = collection(db, 'areas');
    
    if (zoneId) {
      q = query(colRef, where('zoneId', '==', zoneId), orderBy('name'));
    } else {
      q = query(colRef, orderBy('name'));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Area[];
        setAreas(docs);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [zoneId]);

  return { areas, loading, error };
}

export async function addArea(area: Omit<Area, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const colRef = collection(db, 'areas');
    const docRef = await addDoc(colRef, {
      ...area,
      code: generateLocationCode(area.name),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    toast.success('Area added successfully');
    return docRef.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add area';
    toast.error(message);
    throw err;
  }
}

// ========== SUB-AREAS ==========
export function useSubAreas(areaId?: string) {
  const [subAreas, setSubAreas] = useState<SubArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let q;
    const colRef = collection(db, 'subAreas');
    
    if (areaId) {
      q = query(colRef, where('areaId', '==', areaId), orderBy('name'));
    } else {
      q = query(colRef, orderBy('name'));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as SubArea[];
        setSubAreas(docs);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [areaId]);

  return { subAreas, loading, error };
}

export async function addSubArea(subArea: Omit<SubArea, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const colRef = collection(db, 'subAreas');
    const docRef = await addDoc(colRef, {
      ...subArea,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    toast.success('Sub-area added successfully');
    return docRef.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add sub-area';
    toast.error(message);
    throw err;
  }
}
export async function deleteSubArea(id: string): Promise<void> {
  try {
    // Optional: Check if sub-area is used in any leads or tutors
    // This prevents deleting sub-areas that are in use
    
    // Check if any leads use this sub-area
    const leadsRef = collection(db, 'leads');
    const leadsQuery = query(leadsRef, where('subAreaId', '==', id));
    const leadsSnapshot = await getDocs(leadsQuery);
    
    if (!leadsSnapshot.empty) {
      const errorMsg = `Cannot delete sub-area: ${leadsSnapshot.size} lead(s) are using this location.`;
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Check if any tutors use this sub-area
    const tutorsRef = collection(db, 'tutors');
    const tutorsQuery = query(tutorsRef, where('subAreaId', '==', id));
    const tutorsSnapshot = await getDocs(tutorsQuery);
    
    if (!tutorsSnapshot.empty) {
      const errorMsg = `Cannot delete sub-area: ${tutorsSnapshot.size} tutor(s) are using this location.`;
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    // If no dependencies, proceed with deletion
    const docRef = doc(db, 'subAreas', id);
    await deleteDoc(docRef);
    toast.success('Sub-area deleted successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete sub-area';
    console.error('Error deleting sub-area:', err);
    toast.error(message);
    throw err;
  }
}

// Also add deleteArea function for completeness
export async function deleteArea(id: string): Promise<void> {
  try {
    // Check if area has sub-areas
    const subAreasRef = collection(db, 'subAreas');
    const q = query(subAreasRef, where('areaId', '==', id));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      toast.error(`Cannot delete area: ${snapshot.size} sub-area(s) exist. Delete them first.`);
      return;
    }
    
    const docRef = doc(db, 'areas', id);
    await deleteDoc(docRef);
    toast.success('Area deleted successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete area';
    toast.error(message);
    throw err;
  }
}