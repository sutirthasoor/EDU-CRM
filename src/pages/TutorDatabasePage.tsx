import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTutorsPaginated, addTutor, updateTutor, deleteTutor } from '@/hooks/useTutors';
import { useZones, useAreas, useSubAreas } from '@/hooks/useLocations';
import Sidebar from '@/components/layout/Sidebar';
import TutorTableRow from '@/components/tutors/TutorTableRow';
import TutorFormModal from '@/components/tutors/TutorFormModal';
import CsvImportModal from '@/components/tutors/CsvImportModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Upload, Search, Filter, X, MapPin, BookOpen, Star, Clock, GraduationCap, Heart, User, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const TutorDatabasePage = () => {
  const { 
  tutors, 
  loading, 
  loadingMore, 
  hasMore, 
  loadMore, 
  refreshTutors,
  zoneFilter,
  setZoneFilter,
  areaFilter,
  setAreaFilter,
  subAreaFilter,
  setSubAreaFilter,
  modeFilter, 
  setModeFilter,
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
  isSearching,
  ratingFilter,
  setRatingFilter,
  experienceFilter,
  setExperienceFilter,
  presentQualificationFilter,
  setPresentQualificationFilter,
  lastQualificationFilter,
  setLastQualificationFilter
} = useTutorsPaginated(20);
  
  const { zones, loading: zonesLoading } = useZones();
// Replace the useAreas line with this:
useEffect(() => {
  if (zones.length > 0) {
    console.log('📋 ALL ZONES FROM DATABASE:');
    zones.forEach(zone => {
      console.log(`  - Name: "${zone.name}" (ID: ${zone.id})`);
    });
    
    // Specifically look for Hooghly
    const hooghlyByName = zones.find(z => z.name === 'Hooghly');
    const hooghlyByCaseInsensitive = zones.find(z => z.name?.toLowerCase() === 'hooghly');
    const hooghlyByIncludes = zones.find(z => z.name?.toLowerCase().includes('hooghly'));
    
    console.log('🔍 Searching for Hooghly:');
    console.log('  Exact match "Hooghly":', hooghlyByName);
    console.log('  Case insensitive:', hooghlyByCaseInsensitive);
    console.log('  Includes "hooghly":', hooghlyByIncludes);
  }
}, [zones]);
// Add this to any component (e.g., TutorDatabasePage.tsx)
useEffect(() => {
  // Make firebase available globally
  (window as any).runBackfill = async () => {
    const { getDocs, collection, updateDoc, doc } = await import('firebase/firestore');
    const { db } = await import('../lib/firebase');
    
    const tutorsSnapshot = await getDocs(collection(db, 'tutors'));
    console.log(`Found ${tutorsSnapshot.docs.length} tutors`);
    
    let count = 0;
    for (const tutorDoc of tutorsSnapshot.docs) {
      const data = tutorDoc.data();
      const searchIndex = [
        data.name,
        data.tutorId,
        data.phone,
        data.email,
        data.zone,
        data.area,
        data.presentQualification,
        data.lastQualification,
        ...(data.subjectsHandled || [])
      ].filter(Boolean).join(' ').toLowerCase();
      
      await updateDoc(doc(db, 'tutors', tutorDoc.id), { searchIndex });
      count++;
      console.log(`Updated ${count}/${tutorsSnapshot.docs.length}: ${data.name}`);
    }
    
    console.log('✅ Backfill complete!');
  };
  
  console.log('Run window.runBackfill() in console');
}, []);
const selectedZone = useMemo(() => {
  if (zoneFilter === 'all') return undefined;
  
  // Trim both the filter value and zone names for comparison
  const trimmedFilter = zoneFilter?.trim();
  
  // Try exact match first
  let zone = zones.find(z => z.name?.trim() === trimmedFilter);
  
  // Try case-insensitive match
  if (!zone) {
    zone = zones.find(z => z.name?.trim().toLowerCase() === trimmedFilter?.toLowerCase());
  }
  
  // Try includes match
  if (!zone) {
    zone = zones.find(z => z.name?.trim().toLowerCase().includes(trimmedFilter?.toLowerCase()));
  }
  
  console.log('📍 Looking for zone:', zoneFilter, '(trimmed:', trimmedFilter + ')');
  console.log('📍 Found zone:', zone);
  
  return zone;
}, [zones, zoneFilter]);

const { areas, loading: areasLoading } = useAreas(selectedZone?.id);

// Also update uniqueAreas to use the same logic:
const uniqueAreas = useMemo(() => {
  if (zoneFilter === 'all') {
    return areas.map(area => area.name).sort();
  }
  
  const trimmedFilter = zoneFilter?.trim();
  const selectedZoneObj = zones.find(z => z.name?.trim() === trimmedFilter) ||
                          zones.find(z => z.name?.trim().toLowerCase() === trimmedFilter?.toLowerCase());
  
  if (!selectedZoneObj) {
    console.log('⚠️ Zone not found:', zoneFilter);
    return [];
  }
  
  return areas
    .filter(area => area.zoneId === selectedZoneObj.id)
    .map(area => area.name)
    .sort();
}, [areas, zones, zoneFilter]);
  const { subAreas, loading: subAreasLoading } = useSubAreas(areaFilter !== 'all' ? areas.find(a => a.name === areaFilter)?.id : undefined);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const uniqueZones = useMemo(() => {
  return zones.map(zone => zone.name?.trim()).filter(Boolean).sort();
}, [zones]);

  

  // Replace the uniqueSubAreas useMemo with this:

const uniqueSubAreas = useMemo(() => {
  // If an area is selected, show sub-areas only in that area
  if (areaFilter !== 'all') {
    const selectedArea = areas.find(a => a.name === areaFilter);
    if (!selectedArea) return [];
    return subAreas
      .filter(sub => sub.areaId === selectedArea.id)
      .map(sub => sub.name)
      .sort();
  }
  
  // 🔥 FIX 2: If zone is selected (but no specific area), show ALL sub-areas of ALL areas in that zone
  if (zoneFilter !== 'all') {
    const selectedZone = zones.find(z => z.name === zoneFilter);
    if (!selectedZone) return [];
    
    // Get all area IDs in this zone
    const areaIdsInZone = areas
      .filter(area => area.zoneId === selectedZone.id)
      .map(area => area.id);
    
    // Return all sub-areas that belong to any area in this zone
    return subAreas
      .filter(sub => areaIdsInZone.includes(sub.areaId))
      .map(sub => sub.name)
      .sort();
  }
  
  // No zone or area selected - show all sub-areas
  return subAreas.map(sub => sub.name).sort();
}, [subAreas, areaFilter, zoneFilter, areas, zones]);

  const uniquePresentQualifications = useMemo(() => {
    if (!tutors) return [];
    const qualsSet = new Set(tutors.map(t => t.presentQualification).filter(Boolean));
    return Array.from(qualsSet).sort();
  }, [tutors]);

  const uniqueLastQualifications = useMemo(() => {
    if (!tutors) return [];
    const qualsSet = new Set(tutors.map(t => t.lastQualification).filter(Boolean));
    return Array.from(qualsSet).sort();
  }, [tutors]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (zoneFilter !== 'all') count++;
    if (areaFilter !== 'all') count++;
    if (subAreaFilter !== 'all') count++;
    if (modeFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (ratingFilter !== 'all') count++;
    if (experienceFilter !== 'all') count++;
    if (presentQualificationFilter !== 'all') count++;
    if (lastQualificationFilter !== 'all') count++;
    return count;
  }, [zoneFilter, areaFilter, subAreaFilter, modeFilter, statusFilter, ratingFilter, 
      experienceFilter, presentQualificationFilter, lastQualificationFilter]);

  // ===== FIXED: Reset filters function =====
  const resetFilters = () => {
    console.log('🔄 Clearing all filters...');
    
    // Reset location filters
    setZoneFilter('all');
    setAreaFilter('all');
    setSubAreaFilter('all');
    
    // Reset other filters
    setModeFilter('all');
    setStatusFilter('all');
    setRatingFilter('all');
    setExperienceFilter('all');
    setPresentQualificationFilter('all');
    setLastQualificationFilter('all');
    
    // Clear search
    setSearchTerm('');
    
    // Force refresh after a short delay
    setTimeout(() => {
      refreshTutors();
    }, 100);
  };

  const handleAddClick = () => {
    setSelectedTutor(null);
    setIsAddModalOpen(true);
  };

  const handleEditClick = (tutor) => {
    setSelectedTutor(tutor);
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = async (tutor) => {
    if (window.confirm(`Are you sure you want to delete ${tutor.name}?`)) {
      try {
        await deleteTutor(tutor.id);
        toast.success('Tutor deleted successfully');
        refreshTutors();
      } catch (error) {
        console.error('Error deleting tutor:', error);
        toast.error('Failed to delete tutor');
      }
    }
  };

  const handleToggleStatus = async (tutor) => {
    try {
      await updateTutor(tutor.id, { isActive: !tutor.isActive });
      toast.success(`Tutor ${tutor.isActive ? 'deactivated' : 'activated'} successfully`);
      refreshTutors();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleImportClick = () => {
    setIsImportModalOpen(true);
  };

  const handleModalSuccess = () => {
    setIsAddModalOpen(false);
    setIsImportModalOpen(false);
    setSelectedTutor(null);
    refreshTutors();
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-background border-b border-border px-6 py-4 z-10 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-foreground">Tutor Database</h1>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleImportClick} className="flex items-center gap-2 cursor-pointer">
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
              <Button onClick={handleAddClick} className="flex items-center gap-2 cursor-pointer">
                <Plus className="h-4 w-4" />
                Add Tutor
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, phone, email, subject, zone, qualification..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </div>
              
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              
              {/* Refresh Button */}
              <Button variant="outline" onClick={refreshTutors} className="flex items-center gap-2" title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              {activeFilterCount > 0 && (
                <Button variant="ghost" onClick={resetFilters} className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Clear All ({activeFilterCount})
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-lg border border-border">
                {/* Zone Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                    <MapPin size={12} /> Zone
                  </label>
                  <Select 
  value={zoneFilter} 
  onValueChange={(value) => {
    setZoneFilter(value);
    setAreaFilter('all');
    setSubAreaFilter('all');
  }}
>
  <SelectTrigger className="h-9">
    <SelectValue placeholder="All Zones" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Zones</SelectItem>
    {uniqueZones.map(zone => (
      <SelectItem key={zone} value={zone}>{zone}</SelectItem>
    ))}
  </SelectContent>
</Select>
                </div>

                {/* Area Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                    <MapPin size={12} /> Area
                  </label>
                  <Select 
                    value={areaFilter} 
                    onValueChange={(value) => {
                      setAreaFilter(value);
                      setSubAreaFilter('all');
                    }}
                    disabled={zoneFilter === 'all' && uniqueAreas.length === 0}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={zoneFilter === 'all' ? "Select Zone First" : "All Areas"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Areas</SelectItem>
                      {uniqueAreas.map(area => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sub-area Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                    <MapPin size={12} /> Sub-area
                  </label>
                  <Select 
                    value={subAreaFilter} 
                    onValueChange={setSubAreaFilter}
                    disabled={areaFilter === 'all' && uniqueSubAreas.length === 0}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={areaFilter === 'all' ? "Select Area First" : "All Sub-areas"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sub-areas</SelectItem>
                      {uniqueSubAreas.map(subArea => (
                        <SelectItem key={subArea} value={subArea}>{subArea}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mode Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                    <BookOpen size={12} /> Mode
                  </label>
                  <Select value={modeFilter} onValueChange={setModeFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Modes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modes</SelectItem>
                      <SelectItem value="home">Home Tuition</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block flex-items-center gap-1">
                    <Clock size={12} /> Status
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                    <Star size={12} /> Rating
                  </label>
                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Ratings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="5">5 Stars ⭐⭐⭐⭐⭐</SelectItem>
                      <SelectItem value="4">4 Stars ⭐⭐⭐⭐</SelectItem>
                      <SelectItem value="3">3 Stars ⭐⭐⭐</SelectItem>
                      <SelectItem value="below3">Below 3 Stars</SelectItem>
                      <SelectItem value="unrated">Unrated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Experience Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                    <Clock size={12} /> Experience
                  </label>
                  <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Experience</SelectItem>
                      <SelectItem value="0-2">0-2 Years</SelectItem>
                      <SelectItem value="3-5">3-5 Years</SelectItem>
                      <SelectItem value="6-10">6-10 Years</SelectItem>
                      <SelectItem value="10+">10+ Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Present Qualification Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                    <GraduationCap size={12} /> Present Qualification
                  </label>
                  <Select value={presentQualificationFilter} onValueChange={setPresentQualificationFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Qualifications</SelectItem>
                      {uniquePresentQualifications.slice(0, 15).map(qual => (
                        <SelectItem key={qual} value={qual}>{qual}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Last Qualification Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                    <GraduationCap size={12} /> Last Qualification
                  </label>
                  <Select value={lastQualificationFilter} onValueChange={setLastQualificationFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Qualifications</SelectItem>
                      {uniqueLastQualifications.slice(0, 15).map(qual => (
                        <SelectItem key={qual} value={qual}>{qual}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm">
              <span className="text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{tutors?.length || 0}</span> tutors
              </span>
              {activeFilterCount > 0 && (
                <span className="text-muted-foreground">
                  Active filters: <span className="font-semibold text-primary">{activeFilterCount}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto relative">
          <div className="min-w-[2000px]">
            <table className="w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-10">
                <tr className="bg-muted/95 backdrop-blur border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide sticky left-0 bg-muted/95 backdrop-blur z-20 w-[60px]">Photo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide sticky left-[60px] bg-muted/95 backdrop-blur z-20 w-[100px]">Tutor ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide sticky left-[160px] bg-muted/95 backdrop-blur z-20 w-[200px]">Name/Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[150px]">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[180px]">Preferred Areas</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[180px]">Present Qualification</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[180px]">Last Qualification</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[180px]">12th Details</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[200px]">About Me</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[150px]">Classes Handled</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[180px]">Subjects Handled</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[80px]">Mode</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[100px]">Experience</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[100px]">Fee Range</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[70px]">Rating</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[80px]">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide sticky right-0 bg-muted/95 backdrop-blur z-20 w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading || isSearching ? (
                  <tr>
                    <td colSpan={18} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                        <p>{isSearching ? 'Searching tutors...' : 'Loading tutors...'}</p>
                      </div>
                    </td>
                  </tr>
                ) : tutors.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 opacity-20" />
                        <p>{searchTerm || activeFilterCount > 0 ? 'No tutors match your filters' : 'No tutors found. Add your first tutor!'}</p>
                        {(searchTerm || activeFilterCount > 0) && (
                          <Button variant="link" onClick={resetFilters} className="text-sm">
                            Clear all filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  tutors.map(tutor => (
                    <TutorTableRow 
                      key={tutor.id} 
                      tutor={tutor}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteClick}
                      onToggleStatus={handleToggleStatus}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && !isSearching && hasMore && tutors.length > 0 && (
          <div className="flex-shrink-0 border-t border-border bg-background p-4">
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={loadMore} 
                disabled={loadingMore}
                className="min-w-[200px]"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load More Tutors'
                )}
              </Button>
            </div>
          </div>
        )}
        
        {!loading && !isSearching && !hasMore && tutors.length > 0 && (
          <div className="flex-shrink-0 border-t border-border bg-background p-4">
            <div className="text-center text-sm text-muted-foreground">
              ✓ All {tutors.length} tutors loaded
            </div>
          </div>
        )}
      </div>

      <TutorFormModal
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedTutor(null);
        }}
        onSubmit={async (formData) => {
          try {
            if (selectedTutor) {
              await updateTutor(selectedTutor.id, formData);
              toast.success('Tutor updated successfully');
            } else {
              await addTutor(formData);
              toast.success('Tutor added successfully');
            }
            handleModalSuccess();
          } catch (error) {
            console.error('Error saving tutor:', error);
            toast.error('Failed to save tutor');
          }
        }}
        initial={selectedTutor}
        loading={false}
      />

      <CsvImportModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={async (rows) => {
          try {
            console.log('📥 Importing rows:', rows);
            toast.loading(`Importing ${rows.length} tutors...`, { id: 'import' });
            for (let i = 0; i < rows.length; i++) {
              const row = rows[i];
              console.log(`Importing tutor ${i + 1}/${rows.length}:`, row.name);
              await addTutor(row);
            }
            toast.success(`Successfully imported ${rows.length} tutors`, { id: 'import' });
            await refreshTutors();
            handleModalSuccess();
          } catch (error) {
            console.error('❌ Error importing:', error);
            toast.error('Failed to import tutors', { id: 'import' });
          }
        }}
        loading={false}
      />
    </div>
  );
};

export default TutorDatabasePage;