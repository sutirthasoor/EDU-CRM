import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Shuffle, Send, UserCheck, SlidersHorizontal, Users, Check, Search, Eye, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import { useTutors } from '../hooks/useTutors';
import { useLeads, updateLead } from '../hooks/useLeads';
import { collection, query, where, getDocs, limit, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Lead, Tutor } from '../types';
import { cn } from '../lib/utils';
import LeadPickerPanel from './matching/LeadPickerPanel';
import LeadRequirementsCard from './matching/LeadRequirementsCard';
import TutorMatchCard from './matching/TutorMatchCard';
import TutorFormModal from '../components/tutors/TutorFormModal';
import { calculateMatchScore } from './matching/MatchScoreUtils';

type SortKey = 'score' | 'rating' | 'experience' | 'fee_asc' | 'fee_desc';

function EmptyState({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
        <Icon size={22} className="text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

export default function TutorMatchingPage() {
  const { tutors, loading: tLoading, refreshTutors } = useTutors();
  const { leads, loading: lLoading } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedTutorIds, setSelectedTutorIds] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [filterMode, setFilterMode] = useState(false);
  const [filterZone, setFilterZone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Tutor[]>([]);
  const [searching, setSearching] = useState(false);
  const [viewingTutor, setViewingTutor] = useState<Tutor | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Search tutors directly in database
  const searchTutorsInDatabase = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    const searchLower = term.toLowerCase().trim();
    
    try {
      // Create multiple search queries for different fields
      const queries = [
        query(collection(db, 'tutors'), where('name', '>=', searchLower), where('name', '<=', searchLower + '\uf8ff'), limit(30)),
        query(collection(db, 'tutors'), where('tutorId', '>=', searchLower), where('tutorId', '<=', searchLower + '\uf8ff'), limit(30)),
        query(collection(db, 'tutors'), where('phone', '>=', searchLower), where('phone', '<=', searchLower + '\uf8ff'), limit(30)),
        query(collection(db, 'tutors'), where('email', '>=', searchLower), where('email', '<=', searchLower + '\uf8ff'), limit(30)),
      ];
      
      const results = await Promise.all(queries.map(q => getDocs(q)));
      
      // Combine and deduplicate results
      const allResults: Tutor[] = [];
      const seenIds = new Set();
      
      results.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
          if (!seenIds.has(doc.id)) {
            seenIds.add(doc.id);
            allResults.push({ id: doc.id, ...doc.data() } as Tutor);
          }
        });
      });
      
      // Also search in subjectsHandled (requires client-side filter since it's an array)
      if (allResults.length < 30) {
        const subjectQuery = query(collection(db, 'tutors'), limit(100));
        const subjectSnapshot = await getDocs(subjectQuery);
        subjectSnapshot.docs.forEach(doc => {
          const tutor = doc.data() as Tutor;
          if (!seenIds.has(doc.id) && tutor.subjectsHandled?.some(s => s.toLowerCase().includes(searchLower))) {
            seenIds.add(doc.id);
            allResults.push({ id: doc.id, ...tutor } as Tutor);
          }
        });
      }
      
      setSearchResults(allResults.slice(0, 50));
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      searchTutorsInDatabase(term);
    }, 500);
  }, [searchTutorsInDatabase]);

  // Filter and sort tutors (use searchResults when searching, otherwise use all tutors)
  const displayedTutors = useMemo(() => {
    let list = searchTerm ? searchResults : tutors;
    
    if (list.length === 0) return [];
    
    if (selectedLead) {
      // Apply mode filter if checked
      if (filterMode) {
        list = list.filter((t) => t.preferredMode === selectedLead.mode || t.preferredMode === 'both');
      }
      
      // Apply zone filter if checked
      if (filterZone) {
        list = list.filter((t) => t.zone === selectedLead.zone);
      }
      
      // Apply sorting
      list = list.sort((a, b) => {
        if (sortKey === 'score') return calculateMatchScore(b, selectedLead) - calculateMatchScore(a, selectedLead);
        if (sortKey === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
        if (sortKey === 'fee_asc') return (a.feeRange ?? '').localeCompare(b.feeRange ?? '');
        if (sortKey === 'fee_desc') return (b.feeRange ?? '').localeCompare(a.feeRange ?? '');
        return 0;
      });
    } else {
      // Sort by name when no lead selected
      list = list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    
    return list;
  }, [searchTerm, searchResults, tutors, selectedLead, sortKey, filterMode, filterZone]);

  const selectedTutors = tutors.filter((t) => selectedTutorIds.includes(t.id));

  const toggleTutor = (id: string) => {
    setSelectedTutorIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) { 
        toast.error('Max 4 tutors can be selected'); 
        return prev; 
      }
      return [...prev, id];
    });
  };

  const handleViewProfile = useCallback((tutor: Tutor) => {
    setViewingTutor(tutor);
    setProfileModalOpen(true);
  }, []);

  const handleCloseProfile = useCallback(() => {
    setProfileModalOpen(false);
    setViewingTutor(null);
  }, []);

  const handleAssign = async (newStatus: Lead['status']) => {
  if (!selectedLead || selectedTutorIds.length === 0) {
    toast.error('Select at least one tutor');
    return;
  }
  
  setSaving(true);
  try {
    const currentAssignments = selectedLead.tutorAssignments || [];
    
    // FIX: Get tutor details from BOTH tutors and searchResults
    const allAvailableTutors = [...tutors, ...searchResults];
    const selectedTutorDetails = allAvailableTutors.filter(t => selectedTutorIds.includes(t.id));
    
    // Optional: If still not found, fetch directly from database
    let finalSelectedTutors = selectedTutorDetails;
    if (selectedTutorDetails.length !== selectedTutorIds.length) {
      const missingIds = selectedTutorIds.filter(id => !selectedTutorDetails.some(t => t.id === id));
      for (const missingId of missingIds) {
        const tutorDoc = await getDoc(doc(db, 'tutors', missingId));
        if (tutorDoc.exists()) {
          finalSelectedTutors.push({ id: tutorDoc.id, ...tutorDoc.data() } as Tutor);
        }
      }
    }
    
    const newAssignments = finalSelectedTutors.map(tutor => ({
      id: `assign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tutorId: tutor.id,
      tutorName: tutor.name,
      tutorCode: tutor.tutorId,
      assignedDate: new Date().toISOString(),
      status: 'pending' as const,
    }));

    const existingTutorIds = new Set(currentAssignments.map(a => a.tutorId));
    const uniqueNewAssignments = newAssignments.filter(a => !existingTutorIds.has(a.tutorId));
    
    const updatedAssignments = [...currentAssignments, ...uniqueNewAssignments];

    await updateLead(selectedLead.id, { 
      tutorAssignments: updatedAssignments,
      status: newStatus,
      totalTutorsAssigned: updatedAssignments.length,
      tutorsPending: updatedAssignments.filter(a => a.status === 'pending').length,
    });

    toast.success(`${uniqueNewAssignments.length} tutor(s) assigned successfully`);
    setSelectedTutorIds([]);
  } catch (error) {
    console.error('Error assigning tutors:', error);
    toast.error('Failed to assign tutors');
  } finally {
    setSaving(false);
  }
};

  const handleLeadSelect = (lead: Lead | null) => {
    setSelectedLead(lead);
    setSelectedTutorIds([]);
    setSearchTerm('');
    setSearchResults([]);
    refreshTutors();
  };

  const isLoading = tLoading && tutors.length === 0;

  return (
    <AppLayout title="Tutor Matching">
      <div className="flex h-full overflow-hidden">
        {/* LEFT: Lead picker */}
        <div className="w-72 flex-shrink-0 border-r border-border bg-card overflow-hidden flex flex-col">
          {lLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <LeadPickerPanel 
                leads={leads} 
                selectedId={selectedLead?.id ?? null} 
                onSelect={handleLeadSelect}
              />
              <div className="p-3 border-t border-border mt-auto">
                <div className="text-xs text-muted-foreground">
                  📚 Total Tutors: {tutors.length}
                  {searchTerm && ` (Searching: "${searchTerm}")`}
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Matching panel */}
        <div className="flex-1 overflow-y-auto bg-background">
          <div className="p-5 space-y-4">
            {/* Search Bar - Direct Database Search */}
            <div className="relative sticky top-0 bg-background z-10 pt-0">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="🔍 Search tutors by name, ID, phone, email, or subject..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-12 py-2.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 size={16} className="animate-spin text-primary" />
                </div>
              )}
              {searchTerm && !searching && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSearchResults([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Results count */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {searching ? 'Searching...' : (
                  <>
                    Showing {displayedTutors.length} tutor{displayedTutors.length !== 1 ? 's' : ''}
                    {searchTerm && ` matching "${searchTerm}"`}
                  </>
                )}
              </span>
            </div>

            {/* Show lead requirements only if a lead is selected */}
            {selectedLead && (
              <>
                <LeadRequirementsCard lead={selectedLead} />

                {selectedLead.tutorAssignments && selectedLead.tutorAssignments.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">
                        {selectedLead.tutorAssignments.length} tutor(s) already assigned
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedLead.tutorAssignments.slice(0, 3).map((a) => (
                        <span key={a.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {a.tutorName} ({a.status})
                        </span>
                      ))}
                      {selectedLead.tutorAssignments.length > 3 && (
                        <span className="text-xs text-blue-600">
                          +{selectedLead.tutorAssignments.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Filters bar */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal size={13} className="text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Sort:</span>
                  </div>
                  {(['score', 'rating', 'fee_asc', 'fee_desc'] as SortKey[]).map((k) => (
                    <button
                      key={k}
                      onClick={() => setSortKey(k)}
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full border transition-colors',
                        sortKey === k
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                      )}
                    >
                      {k === 'score' ? 'Best Match' : k === 'rating' ? 'Rating' : k === 'fee_asc' ? 'Fee ↑' : 'Fee ↓'}
                    </button>
                  ))}
                  <div className="h-4 border-l border-border mx-1" />
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={filterMode} onChange={(e) => setFilterMode(e.target.checked)} className="w-3.5 h-3.5 rounded accent-primary" />
                    Mode match only
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={filterZone} onChange={(e) => setFilterZone(e.target.checked)} className="w-3.5 h-3.5 rounded accent-primary" />
                    Zone match only
                  </label>
                </div>
              </>
            )}

            {!selectedLead && !isLoading && (
              <div className="bg-blue-50/50 rounded-lg p-4 text-center border border-blue-100">
                <p className="text-sm text-blue-700">
                  💡 Select a lead from the left panel to enable tutor assignment
                </p>
              </div>
            )}

            {isLoading && tutors.length === 0 && (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            )}

            {!isLoading && !searching && tutors.length === 0 && !searchTerm && (
              <EmptyState 
                icon={Users} 
                title="No tutors found" 
                subtitle="Add tutors to the database first" 
              />
            )}

            {!isLoading && !searching && displayedTutors.length === 0 && searchTerm && (
              <EmptyState 
                icon={Users} 
                title={`No tutors found for "${searchTerm}"`} 
                subtitle="Try a different name, ID, phone, email, or subject" 
              />
            )}

            {!isLoading && !searching && displayedTutors.length === 0 && selectedLead && !searchTerm && (
              <EmptyState 
                icon={Users} 
                title="No matching tutors" 
                subtitle="Try adjusting your filters" 
              />
            )}

            {!isLoading && !searching && displayedTutors.length > 0 && (
              <div className="space-y-2.5 pb-36">
                {displayedTutors.map((tutor: Tutor) => {
                  const isAlreadyAssigned = selectedLead?.tutorAssignments?.some(a => a.tutorId === tutor.id) || false;
                  
                  return (
                    <div key={tutor.id}>
                      <TutorMatchCard
                        tutor={tutor}
                        lead={selectedLead}
                        selected={selectedTutorIds.includes(tutor.id)}
                        onToggle={selectedLead && !isAlreadyAssigned ? toggleTutor : undefined}
                        onViewProfile={handleViewProfile}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      {selectedLead && (
        <div className="fixed bottom-0 right-0 left-72 bg-card border-t border-border px-5 py-3 flex items-center gap-4 z-10 shadow-md">
          <div className="flex-1 flex items-center gap-2 overflow-x-auto">
            {selectedTutors.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tutors selected (max 4)</p>
            ) : (
              selectedTutors.map((t) => (
                <span key={t.id} className="flex-shrink-0 text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
                  {t.name}
                  <button onClick={() => toggleTutor(t.id)} className="text-muted-foreground hover:text-destructive">×</button>
                </span>
              ))
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              disabled={saving || selectedTutorIds.length === 0}
              onClick={() => handleAssign('profiles_sent')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium"
            >
              <Send size={13} />
              Send Profiles
            </button>
            <button
              disabled={saving || selectedTutorIds.length === 0}
              onClick={() => handleAssign('awaiting_approval')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border bg-background text-foreground rounded-lg hover:bg-muted disabled:opacity-50 transition-colors font-medium"
            >
              <UserCheck size={13} />
              Assign Tutors
            </button>
          </div>
        </div>
      )}

      <TutorFormModal
        open={profileModalOpen}
        onClose={handleCloseProfile}
        onSubmit={() => {}}
        initial={viewingTutor}
        loading={false}
        viewOnly={true}
      />
    </AppLayout>
  );
}