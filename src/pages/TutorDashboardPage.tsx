import React, { useState } from 'react';
import { useTutors } from '@/hooks/useTutors';
import Sidebar from '@/components/layout/Sidebar';
import TutorTableRow from '@/components/tutors/TutorTableRow';
import TutorFormModal from '@/components/tutors/TutorFormModal';
import CsvImportModal from '@/components/tutors/CsvImportModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Upload, Search } from 'lucide-react';

const TutorDatabasePage = () => {
  const { tutors, loading, error, refreshTutors } = useTutors();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);

  const filteredTutors = tutors?.filter(tutor => 
    tutor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutor.subjectsHandled?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
    tutor.zone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutor.tutorId?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
        // Add your delete API call here
        // await deleteTutor(tutor.id);
        console.log('Deleting tutor:', tutor);
        refreshTutors();
      } catch (error) {
        console.error('Error deleting tutor:', error);
      }
    }
  };

  const handleToggleStatus = async (tutor) => {
    try {
      // Add your toggle status API call here
      // await toggleTutorStatus(tutor.id, !tutor.isActive);
      console.log('Toggling status for:', tutor);
      refreshTutors();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleImportClick = () => {
    setIsImportModalOpen(true);
  };

  const handleModalSuccess = () => {
    refreshTutors();
    setIsAddModalOpen(false);
    setIsImportModalOpen(false);
    setSelectedTutor(null);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-foreground">Tutor Database</h1>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleImportClick}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
              <Button 
                onClick={handleAddClick}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add Tutor
              </Button>
            </div>
          </div>

          {/* Search Bar - Integrated into header */}
          <div className="relative max-w-md mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tutors by name, ID, subject, or zone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table Section with Scroll */}
        {/* Table Section with Scroll */}
<div className="flex-1 overflow-y-auto p-6 pt-4">
  <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full">
        {/* Sticky Table Header - EXACT MATCH with TutorTableRow */}
        <thead className="bg-muted/50 border-b border-border sticky top-0 z-5">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tutor ID</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name/Contact</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zone</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subjects</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mode</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Experience</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fee Range</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rating</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <tr>
              <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                  <p>Loading tutors...</p>
                </div>
              </td>
            </tr>
          ) : filteredTutors.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Search className="h-8 w-8 opacity-20" />
                  <p>{searchTerm ? 'No tutors match your search' : 'No tutors found. Add your first tutor!'}</p>
                </div>
              </td>
            </tr>
          ) : (
            filteredTutors.map(tutor => (
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
</div>
      {/* Modals - Fixed prop names */}
      <TutorFormModal
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedTutor(null);
        }}
        onSubmit={async (formData) => {
          console.log('Submitting tutor:', formData);
          handleModalSuccess();
        }}
        initial={selectedTutor}
        loading={false}
      />

      <CsvImportModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={async (rows) => {
          console.log('Importing rows:', rows);
          handleModalSuccess();
        }}
        loading={false}
      />
    </div>
  );
};

export default TutorDatabasePage;