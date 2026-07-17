import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, X } from 'lucide-react';
import LocationSelector from '@/components/location/LocationSelector';
import { useUniversities } from '@/hooks/useUniversities';
import { useSubjects } from '@/hooks/useSubjects';
import { useClasses } from '@/hooks/useClasses';
import type { Lead, LeadStatus } from '@/types';
import { cn } from '@/lib/utils';

interface LeadFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initial?: Lead | null;
  loading?: boolean;
}

const SOURCES = ['website', 'whatsapp', 'phone', 'referral', 'walk_in', 'ads'] as const;
const STATUS_LIST: LeadStatus[] = [
  'new', 'contacted', 'requirement_collected', 'profiles_sent', 'awaiting_approval',
  'demo_scheduled', 'demo_completed', 'feedback_received', 'tutor_approved',
  'tutor_confirmed', 'converted', 'lost',
];

interface ExtendedLeadForm {
  studentName: string;
  parentName: string;
  guardianName: string;
  guardianAddress: string;
universityId: string;
  universityName: string;
  schoolCollegeName: string; // NEW FIELD
  landmark: string;
  busStop: string;
  metroStation: string;
  phone: string;
  alternatePhone: string;
  email: string;
  source: typeof SOURCES[number];
  status: LeadStatus;
  urgency: 'low' | 'medium' | 'high';
  class: string;
  board: string;
  subjects: string[];
  mode: 'home' | 'online' | 'both';
  location: string;
  zone: string;
  zoneId: string;
  area: string;
  areaId: string;
  subArea: string;
  subAreaId: string;
  preferredTimings: string;
  budget: string;
  startDate: string;
  genderPreference: 'no_preference' | 'male' | 'female';
  assignedCounsellor: string;
  selectedTutor: string;
  notes: string;
  followUpDate: string;
  universityId: string;
  universityName: string;
}

const EMPTY: ExtendedLeadForm = {
  studentName: '',
  parentName: '',
  guardianName: '',
  guardianAddress: '',
  landmark: '',
universityId: '',
  universityName: '',
  schoolCollegeName: '', // NEW FIELD
  busStop: '',
  metroStation: '',
  phone: '',
  alternatePhone: '',
  email: '',
  source: 'website',
  status: 'new',
  urgency: 'medium',
  class: '',
  board: '',
  subjects: [],
  mode: 'both',
  location: '',
  zone: '',
  zoneId: '',
  area: '',
  areaId: '',
  subArea: '',
  subAreaId: '',
  preferredTimings: '',
  budget: '',
  startDate: '',
  genderPreference: 'no_preference',
  assignedCounsellor: '',
  selectedTutor: '',
  notes: '',
  followUpDate: '',
  universityId: '',
  universityName: '',
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default function LeadFormModal({ open, onClose, onSubmit, initial, loading }: LeadFormModalProps) {
  const { universities } = useUniversities();
  const { subjects: availableSubjects } = useSubjects();
  const { classes: availableClasses } = useClasses();
  
  const [form, setForm] = useState<ExtendedLeadForm>(EMPTY);
  const [location, setLocation] = useState({
    zoneId: initial?.zoneId || '',
    areaId: initial?.areaId || '',
    subAreaId: initial?.subAreaId || '',
    zone: initial?.zone || '',
    area: initial?.area || '',
    subArea: initial?.subArea || '',
  });
  
  // ===== SUBJECT SEARCH STATE =====
  const [subjectSearch, setSubjectSearch] = useState('');

  const activeSubjects = availableSubjects?.filter(s => s.isActive).map(s => s.name).sort() || [];
  const activeClasses = availableClasses?.filter(c => c.isActive).sort((a, b) => (a.order || 0) - (b.order || 0)).map(c => c.displayName || c.name) || [];
  const activeUniversities = universities?.filter(u => u.isActive).sort((a, b) => a.name.localeCompare(b.name)) || [];

  // ===== FILTER SUBJECTS BASED ON SEARCH =====
  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return activeSubjects;
    const term = subjectSearch.toLowerCase().trim();
    return activeSubjects.filter(subject => 
      subject.toLowerCase().includes(term)
    );
  }, [activeSubjects, subjectSearch]);

  const getUniversityName = (universityId: string): string => {
    if (!universityId) return '';
    const university = activeUniversities.find(u => u.id === universityId);
    return university?.name || universityId;
  };

  useEffect(() => {
    if (initial) {
      setForm({
        studentName: initial.studentName || '',
        parentName: initial.parentName || '',
        guardianName: initial.guardianName || '',
        guardianAddress: initial.guardianAddress || '',
        landmark: initial.landmark || '',
        busStop: initial.busStop || '',
schoolCollegeName: initial.schoolCollegeName || '',
        metroStation: initial.metroStation || '',
        phone: initial.phone || '',
        alternatePhone: initial.alternatePhone || '',
        email: initial.email || '',
        source: initial.source || 'website',
        status: initial.status || 'new',
        urgency: initial.urgency || 'medium',
        class: initial.class || '',
        board: initial.board || '',
        subjects: initial.subjects || [],
        mode: initial.mode || 'both',
        location: initial.location || '',
        zone: initial.zone || '',
        zoneId: initial.zoneId || '',
        area: initial.area || '',
        areaId: initial.areaId || '',
        subArea: initial.subArea || '',
        subAreaId: initial.subAreaId || '',
        preferredTimings: initial.preferredTimings || '',
        budget: initial.budget || '',
        startDate: initial.startDate || '',
        genderPreference: initial.genderPreference || 'no_preference',
        assignedCounsellor: initial.assignedCounsellor || '',
        selectedTutor: initial.selectedTutor || '',
        notes: initial.notes || '',
        followUpDate: initial.followUpDate || '',
        universityId: initial.universityId || '',
        universityName: initial.universityName || '',
      });
      setLocation({
        zoneId: initial.zoneId || '',
        areaId: initial.areaId || '',
        subAreaId: initial.subAreaId || '',
        zone: initial.zone || '',
        area: initial.area || '',
        subArea: initial.subArea || '',
      });
    } else {
      setForm(EMPTY);
      setLocation({
        zoneId: '',
        areaId: '',
        subAreaId: '',
        zone: '',
        area: '',
        subArea: '',
      });
    }
    // Reset subject search when modal opens
    setSubjectSearch('');
  }, [initial, open]);

  const set = (key: keyof ExtendedLeadForm, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLocationChange = (newLocation: any) => {
    setLocation(newLocation);
    set('zoneId', newLocation.zoneId);
    set('areaId', newLocation.areaId);
    set('subAreaId', newLocation.subAreaId);
    set('zone', newLocation.zone);
    set('area', newLocation.area);
    set('subArea', newLocation.subArea);
  };

  const toggleSubject = (subject: string) => {
    set('subjects', form.subjects.includes(subject)
      ? form.subjects.filter(s => s !== subject)
      : [...form.subjects, subject]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentName.trim() || !form.phone.trim()) {
      alert('Please fill in Student Name and Phone (required fields)');
      return;
    }
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent 
        className="w-full max-h-[90vh] overflow-y-auto" 
        style={{ maxWidth: '1400px' }}
      >
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 py-4">
            {/* Student Info */}
            <Field label="Student Name" required>
              <Input
                value={form.studentName}
                onChange={(e) => set('studentName', e.target.value)}
                placeholder="Full name"
                required
              />
            </Field>

            <Field label="Parent/Guardian Name">
              <Input
                value={form.parentName}
                onChange={(e) => set('parentName', e.target.value)}
                placeholder="Parent/Guardian name"
              />
            </Field>

            <Field label="Guardian Name">
              <Input
                value={form.guardianName}
                onChange={(e) => set('guardianName', e.target.value)}
                placeholder="Guardian name (if different)"
              />
            </Field>

            <Field label="Phone" required>
              <Input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="Phone number"
                required
              />
            </Field>

            <Field label="Alternate Phone">
              <Input
                value={form.alternatePhone}
                onChange={(e) => set('alternatePhone', e.target.value)}
                placeholder="Alternate phone"
              />
            </Field>

            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="Email address"
              />
            </Field>

            {/* Address Section */}
            <div className="col-span-2">
              <div className="border-t border-border my-2 pt-2">
                <h3 className="text-sm font-semibold text-foreground mb-3">Address Details</h3>
              </div>
            </div>

            <div className="col-span-2">
              <Field label="Guardian Address">
                <Input
                  value={form.guardianAddress}
                  onChange={(e) => set('guardianAddress', e.target.value)}
                  placeholder="Full address with house number, street, city"
                />
              </Field>
            </div>

            <Field label="Landmark">
              <Input
                value={form.landmark}
                onChange={(e) => set('landmark', e.target.value)}
                placeholder="Nearby landmark"
              />
            </Field>

            <Field label="Bus Stop">
              <Input
                value={form.busStop}
                onChange={(e) => set('busStop', e.target.value)}
                placeholder="Nearest bus stop"
              />
            </Field>

            <Field label="Metro Station">
              <Input
                value={form.metroStation}
                onChange={(e) => set('metroStation', e.target.value)}
                placeholder="Nearest metro station"
              />
            </Field>

            <div className="col-span-2">
              <Field label="Location (Zone/Area/Sub Area)">
                <LocationSelector
                  value={location}
                  onChange={handleLocationChange}
                />
              </Field>
            </div>

            {/* Rest of the fields */}
            <Field label="Source">
              <Select value={form.source} onValueChange={(v) => set('source', v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => set('status', v as LeadStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_LIST.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Urgency">
              <Select value={form.urgency} onValueChange={(v) => set('urgency', v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔴 High</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="low">🟢 Low</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Class">
              <Select value={form.class} onValueChange={(v) => set('class', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {activeClasses.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Board">
              <Input
                value={form.board}
                onChange={(e) => set('board', e.target.value)}
                placeholder="e.g., CBSE, ICSE, WB Board"
              />
            </Field>

            {/* University Field */}
            <div className="col-span-2">
              <Field label="University (if applicable)">
                <Select 
                  value={form.universityId} 
                  onValueChange={(v) => {
                    set('universityId', v);
                    if (v) {
                      const uniName = getUniversityName(v);
                      set('universityName', uniName);
                    } else {
                      set('universityName', '');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select university (optional)">
                      {form.universityId && (
                        <span className="truncate">
                          {getUniversityName(form.universityId)}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    <SelectItem value="">None</SelectItem>
                    {activeUniversities.map((uni) => (
                      <SelectItem key={uni.id} value={uni.id}>
                        {uni.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
<div className="col-span-2">
  <Field label="School / College Name">
    <Input
      value={form.schoolCollegeName}
      onChange={(e) => set('schoolCollegeName', e.target.value)}
      placeholder="Enter school or college name"
    />
  </Field>
</div>
            {/* Subjects with Search Bar */}
            <div className="col-span-2">
              <Field label="Subjects">
                {/* Search Input for Subjects */}
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search subjects..."
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    className="pl-9 pr-8 h-9 text-sm"
                  />
                  {subjectSearch && (
                    <button
                      type="button"
                      onClick={() => setSubjectSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                
                {/* Subjects Grid */}
                <div className="flex flex-wrap gap-2 p-3 border border-border rounded-lg bg-muted/20 max-h-48 overflow-y-auto">
                  {activeSubjects.length === 0 ? (
                    <p className="text-xs text-muted-foreground w-full text-center">No subjects available</p>
                  ) : filteredSubjects.length === 0 ? (
                    <p className="text-xs text-muted-foreground w-full text-center">
                      No subjects match "{subjectSearch}"
                    </p>
                  ) : (
                    filteredSubjects.map((subject) => (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => toggleSubject(subject)}
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer',
                          form.subjects.includes(subject)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border text-foreground hover:border-primary/50'
                        )}
                      >
                        {subject}
                      </button>
                    ))
                  )}
                </div>
                
                {/* Selected Subjects Count */}
                {form.subjects.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Selected: <span className="font-medium text-primary">{form.subjects.length}</span> subject{form.subjects.length !== 1 ? 's' : ''}
                  </p>
                )}
              </Field>
            </div>

            <Field label="Teaching Mode">
              <Select value={form.mode} onValueChange={(v) => set('mode', v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home Tuition</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Preferred Timings">
              <Input
                value={form.preferredTimings}
                onChange={(e) => set('preferredTimings', e.target.value)}
                placeholder="e.g., Evening, Weekend"
              />
            </Field>

            <Field label="Budget">
              <Input
                value={form.budget}
                onChange={(e) => set('budget', e.target.value)}
                placeholder="e.g., ₹2000-3000/month"
              />
            </Field>

            <Field label="Start Date">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
              />
            </Field>

            <Field label="Gender Preference">
              <Select value={form.genderPreference} onValueChange={(v) => set('genderPreference', v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_preference">No Preference</SelectItem>
                  <SelectItem value="male">Male Only</SelectItem>
                  <SelectItem value="female">Female Only</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Assigned Counsellor">
              <Input
                value={form.assignedCounsellor}
                onChange={(e) => set('assignedCounsellor', e.target.value)}
                placeholder="Counsellor name"
              />
            </Field>

            <Field label="Follow-up Date">
              <Input
                type="date"
                value={form.followUpDate}
                onChange={(e) => set('followUpDate', e.target.value)}
              />
            </Field>

            <div className="col-span-2">
              <Field label="Notes">
                <Textarea
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Additional notes, requirements, etc."
                  rows={3}
                />
              </Field>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Add Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}