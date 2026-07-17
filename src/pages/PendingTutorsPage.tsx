import { useState } from 'react';
import { CheckCircle, XCircle, Eye, Clock, RefreshCw, User, Phone, Mail, MapPin, GraduationCap, BookOpen, DollarSign, Edit } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { Button } from '../components/ui/button';
import { usePendingTutors, approveTutor, rejectTutor, updatePendingTutor } from '../hooks/useTutors';
import { useAuth } from '../contexts/AuthContext';
import TutorFormModal from '../components/tutors/TutorFormModal';
import { usePendingTutorsCount } from '../hooks/useTutors';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

// Helper to safely format date from Firestore Timestamp
const formatDateSafe = (dateValue: any): string => {
  if (!dateValue) return '—';
  
  try {
    // Handle Firestore Timestamp
    if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
      const d = dateValue.toDate();
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      return '—';
    }
    // Handle string date
    if (typeof dateValue === 'string') {
      const d = new Date(dateValue);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      return dateValue;
    }
    // Handle Date object
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    // Handle object with seconds (Firestore Timestamp alternative)
    if (typeof dateValue === 'object' && 'seconds' in dateValue) {
      const d = new Date(dateValue.seconds * 1000);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
    }
    return '—';
  } catch (error) {
    console.error('Date formatting error:', error);
    return '—';
  }
};

export default function PendingTutorsPage() {
  const { pendingTutors, loading, refreshPendingTutors } = usePendingTutors();
  const { totalCount, approvedCount, loading: countsLoading } = usePendingTutorsCount();
  const { user } = useAuth();
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [editingTutor, setEditingTutor] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleApprove = async (tutor: any) => {
    if (window.confirm(`Approve ${tutor.name}?`)) {
      setProcessing(true);
      try {
        await approveTutor(tutor.id, tutor, user?.uid || 'admin');
        toast.success('Tutor approved');
        await refreshPendingTutors();
      } catch (error) {
        console.error('Error approving:', error);
        toast.error('Failed to approve');
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleReject = async () => {
    if (!selectedTutor) return;
    
    setProcessing(true);
    try {
      await rejectTutor(selectedTutor.id, user?.uid || 'admin', rejectionReason);
      toast.success('Tutor rejected');
      setShowRejectDialog(false);
      setSelectedTutor(null);
      setRejectionReason('');
      await refreshPendingTutors();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('Failed to reject');
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = async (formData: any) => {
  if (!editingTutor) return;
  
  setProcessing(true);
  try {
    // Remove undefined values and convert empty strings to null
    const cleanData: any = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] !== undefined && formData[key] !== '') {
        cleanData[key] = formData[key];
      }
    });
    
    // Remove id, createdAt, updatedAt if present
    delete cleanData.id;
    delete cleanData.createdAt;
    delete cleanData.updatedAt;
    delete cleanData.tutorId; // Don't update tutorId for pending tutors
    
    console.log('Cleaned data for update:', cleanData);
    
    // Update the pending tutor with cleaned data
    await updatePendingTutor(editingTutor.id, cleanData);
    toast.success('Tutor application updated successfully');
    setShowEditModal(false);
    setEditingTutor(null);
    await refreshPendingTutors();
  } catch (error) {
    console.error('Error updating tutor:', error);
    toast.error('Failed to update tutor application');
  } finally {
    setProcessing(false);
  }
};

  const openEditModal = (tutor: any) => {
    setEditingTutor(tutor);
    setShowEditModal(true);
  };

  const pendingCount = pendingTutors.filter(t => t.status === 'pending').length;

  return (
    <AppLayout title="Pending Approvals">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Pending Tutor Approvals</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review and approve tutor applications from external website
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
              {pendingCount} Pending
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-primary">
              {countsLoading ? '...' : totalCount}
            </p>
            <p className="text-sm text-muted-foreground">Total Submissions</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-amber-600">
              {countsLoading ? '...' : pendingCount}
            </p>
            <p className="text-sm text-muted-foreground">Awaiting Review</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-green-600">
              {countsLoading ? '...' : approvedCount}
            </p>
            <p className="text-sm text-muted-foreground">Approved</p>
          </div>
        </div>

        {/* Pending Tutors List */}
        {loading ? (
          <div className="py-12 text-center">
            <RefreshCw size={32} className="animate-spin mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Loading pending applications...</p>
          </div>
        ) : pendingTutors.filter(t => t.status === 'pending').length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No Pending Applications</h3>
            <p className="text-sm text-muted-foreground">
              All tutor applications have been reviewed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTutors
              .filter(t => t.status === 'pending')
              .map(tutor => (
                <div
                  key={tutor.id}
                  className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {/* Profile Photo if available */}
                        {tutor.photoBase64 ? (
                          <img 
                            src={tutor.photoBase64} 
                            alt={tutor.name} 
                            className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User size={24} className="text-primary" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{tutor.name}</h3>
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            {tutor.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p className="font-medium">{tutor.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="font-medium truncate">{tutor.email || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <GraduationCap size={14} className="text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Qualification</p>
                            <p className="font-medium">{tutor.presentQualification || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Experience</p>
                            <p className="font-medium">{tutor.teachingExperience || '—'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Location</p>
                            <p className="text-sm">
                              {[tutor.zone, tutor.area, tutor.subArea].filter(Boolean).join(' > ') || '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen size={14} className="text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Subjects</p>
                            <div className="flex flex-wrap gap-1">
                              {tutor.subjectsHandled?.slice(0, 3).map(s => (
                                <span key={s} className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                                  {s}
                                </span>
                              ))}
                              {tutor.subjectsHandled?.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{tutor.subjectsHandled.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign size={14} className="text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Fee Range</p>
                            <p className="font-medium">{tutor.feeRange || '—'}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Preferred Areas if available */}
                      {tutor.preferredAreas && tutor.preferredAreas.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin size={14} className="text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Preferred Areas</p>
                            <div className="flex flex-wrap gap-1">
                              {tutor.preferredAreas.slice(0, 3).map(area => (
                                <span key={area} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                  {area}
                                </span>
                              ))}
                              {tutor.preferredAreas.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{tutor.preferredAreas.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* About Me if available */}
                      {tutor.aboutMe && (
                        <div className="text-xs text-muted-foreground mb-2">
                          <p className="font-medium">About Me:</p>
                          <p className="line-clamp-2">{tutor.aboutMe}</p>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={12} />
                        Submitted: {formatDateSafe(tutor.submittedAt)}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTutor(tutor)}
                        className="flex items-center gap-1"
                      >
                        <Eye size={14} /> View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(tutor)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                      >
                        <Edit size={14} /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(tutor)}
                        disabled={processing}
                        className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
                      >
                        <CheckCircle size={14} /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedTutor(tutor);
                          setShowRejectDialog(true);
                        }}
                        disabled={processing}
                        className="flex items-center gap-1"
                      >
                        <XCircle size={14} /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* View Details Modal */}
      <Dialog open={!!selectedTutor && !showRejectDialog && !showEditModal} onOpenChange={() => setSelectedTutor(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tutor Application Details</DialogTitle>
          </DialogHeader>
          {selectedTutor && (
            <div className="space-y-5 py-2">
              {/* Profile Photo */}
              {selectedTutor.photoBase64 && (
                <div className="flex justify-center">
                  <img 
                    src={selectedTutor.photoBase64} 
                    alt={selectedTutor.name} 
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedTutor.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedTutor.phone}</p>
                </div>
                {selectedTutor.alternatePhone && (
                  <div>
                    <p className="text-xs text-muted-foreground">Alternate Phone</p>
                    <p className="font-medium">{selectedTutor.alternatePhone}</p>
                  </div>
                )}
                {selectedTutor.whatsapp && (
                  <div>
                    <p className="text-xs text-muted-foreground">WhatsApp</p>
                    <p className="font-medium">{selectedTutor.whatsapp}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedTutor.email || '—'}</p>
                </div>
                {selectedTutor.dob && (
                  <div>
                    <p className="text-xs text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{formatDateSafe(selectedTutor.dob)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Submitted Date</p>
                  <p className="font-medium">{formatDateSafe(selectedTutor.submittedAt)}</p>
                </div>
              </div>
              
              {/* Preferred Areas */}
              {selectedTutor.preferredAreas && selectedTutor.preferredAreas.length > 0 && (
                <div className="border-t border-border pt-3">
                  <h4 className="text-sm font-semibold mb-2">Preferred Areas of Tuition</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedTutor.preferredAreas.map((area: string) => (
                      <span key={area} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Addresses */}
              {(selectedTutor.presentAddress || selectedTutor.permanentAddress) && (
                <div className="border-t border-border pt-3">
                  <h4 className="text-sm font-semibold mb-2">Address Information</h4>
                  {selectedTutor.presentAddress && (
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground">Present Address</p>
                      <p className="text-sm">{selectedTutor.presentAddress}</p>
                    </div>
                  )}
                  {selectedTutor.permanentAddress && (
                    <div>
                      <p className="text-xs text-muted-foreground">Permanent Address</p>
                      <p className="text-sm">{selectedTutor.permanentAddress}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Qualifications */}
              <div className="border-t border-border pt-3">
                <h4 className="text-sm font-semibold mb-2">Qualifications</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Present Qualification</p>
                    <p className="text-sm">{selectedTutor.presentQualification || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Qualification</p>
                    <p className="text-sm">{selectedTutor.lastQualification || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Schooling</p>
                    <p className="text-sm">{selectedTutor.schooling || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Extra Qualification</p>
                    <p className="text-sm">{selectedTutor.extraQualification || '—'}</p>
                  </div>
                </div>
              </div>
              
              {/* Teaching Details */}
              <div className="border-t border-border pt-3">
                <h4 className="text-sm font-semibold mb-2">Teaching Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm">
                      {[selectedTutor.zone, selectedTutor.area, selectedTutor.subArea].filter(Boolean).join(' > ') || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Medium/Board</p>
                    <p className="text-sm">{selectedTutor.mediumBoard || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Experience</p>
                    <p className="text-sm">{selectedTutor.teachingExperience || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fee Range</p>
                    <p className="text-sm">{selectedTutor.feeRange || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Preferred Mode</p>
                    <p className="text-sm capitalize">{selectedTutor.preferredMode || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Availability</p>
                    <p className="text-sm">{selectedTutor.availability || '—'}</p>
                  </div>
                </div>
              </div>
              
              {/* Classes */}
              {selectedTutor.classesHandled?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Classes Handled</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTutor.classesHandled.map(c => (
                      <span key={c} className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                        Class {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Subjects */}
              {selectedTutor.subjectsHandled?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Subjects Handled</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTutor.subjectsHandled.map(s => (
                      <span key={s} className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* About Me */}
              {selectedTutor.aboutMe && (
                <div className="border-t border-border pt-3">
                  <h4 className="text-sm font-semibold mb-2">About Me</h4>
                  <p className="text-sm bg-muted/30 p-3 rounded whitespace-pre-wrap">{selectedTutor.aboutMe}</p>
                </div>
              )}
              
              {/* Reference */}
              {selectedTutor.reference && (
                <div>
                  <p className="text-xs text-muted-foreground">Reference Source</p>
                  <p className="text-sm">{selectedTutor.reference}</p>
                </div>
              )}
              
              {/* Notes */}
              {selectedTutor.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Additional Notes</p>
                  <p className="text-sm bg-muted/30 p-3 rounded">{selectedTutor.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Tutor Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to reject <span className="font-semibold">{selectedTutor?.name}</span>'s application?
            </p>
            <div>
              <label className="text-sm font-medium mb-1 block">Reason (Optional)</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing ? 'Processing...' : 'Reject Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tutor Modal */}
      {/* Edit Tutor Modal */}
<TutorFormModal
  open={showEditModal}
  onClose={() => {
    setShowEditModal(false);
    setEditingTutor(null);
  }}
  onSubmit={handleEdit}
  initial={editingTutor}
  loading={processing}
/>
    </AppLayout>
  );
}