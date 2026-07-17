import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Star, Camera, X, Upload, GraduationCap, Calendar, BookOpen, School, Building2, Loader2, Search, MapPin, User } from 'lucide-react';
import { cn, BOARDS } from '@/lib/utils';
import type { Tutor, TutorMode } from '@/types';
import toast from 'react-hot-toast';
import LocationSelector from '@/components/location/LocationSelector';
import { useSubjects } from '@/hooks/useSubjects';
import { useClasses } from '@/hooks/useClasses';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Tutor, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initial?: Tutor | null;
  loading?: boolean;
  viewOnly?: boolean;  // NEW
}

// Extended Tutor type for form with additional fields
interface ExtendedTutorForm extends Omit<Tutor, 'id' | 'createdAt' | 'updatedAt'> {
  // Present Qualification
  presentCollegeName?: string;
  presentYear?: string;
  presentStatus?: 'pursuing' | 'completed';
  
  // Last Qualification
  lastCollegeName?: string;
  lastYear?: string;
  
  // Class 12 Details
  class12SchoolName?: string;
  class12Year?: string;
  class12Stream?: 'science' | 'commerce' | 'arts' | 'other';
  
  // Extra Qualification
  extraCourseName?: string;
  extraInstituteName?: string;
  extraYear?: string;
  
  // New Fields
  aboutMe?: string;
  preferredAreas?: string[];
}

const EMPTY: ExtendedTutorForm = {
  tutorId: '',
  name: '',
  phone: '',
  alternatePhone: '',
  whatsapp: '',
  dob: '',
  email: '',
  presentAddress: '',
  permanentAddress: '',
  zone: '',
  area: '',
  subArea: '',
  zoneId: '',
  areaId: '',
  subAreaId: '',
  
  // Present Qualification
  presentQualification: '',
  presentCollegeName: '',
  presentYear: '',
  presentStatus: 'completed',
  
  // Last Qualification
  lastQualification: '',
  lastCollegeName: '',
  lastYear: '',
  
  // Class 12 Details
  class12Board: 'CBSE',
  class12SchoolName: '',
  class12Year: '',
  class12Stream: 'science',
  
  // Extra Qualification
  extraQualification: '',
  extraCourseName: '',
  extraInstituteName: '',
  extraYear: '',
  
  // Teaching
  classesHandled: [],
  subjectsHandled: [],
  teachingExperience: '',
  availability: '',
  preferredSlots: '',
  feeRange: '',
  location: '',
  preferredMode: 'both',
  isSchoolOrCollegeTeacher: false,
  schoolOrCollegeName: '',
  
  // Rating
  rating: 0,
  ratingComment: '',
  isActive: true,
  photoBase64: '',
  
  // New Fields
  aboutMe: '',
  preferredAreas: [],
};

// Function to calculate age from DOB
const calculateAge = (dob: string): number | null => {
  if (!dob) return null;
  
  const birthDate = new Date(dob);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="col-span-2 mt-4 first:mt-0">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon size={16} className="text-primary" />}
        <h3 className="text-xs font-semibold text-primary uppercase tracking-widest">{children}</h3>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

function Field({ label, required, children, icon: Icon }: { label: string; required?: boolean; children: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        {Icon && <Icon size={12} />}
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function TutorFormModal({ open, onClose, onSubmit, initial, loading, viewOnly = false }: Props) {
  const { subjects: availableSubjects } = useSubjects();
  const { classes: availableClasses, loading: classesLoading } = useClasses();
  const [form, setForm] = useState<ExtendedTutorForm>(EMPTY);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [location, setLocation] = useState({
    zoneId: initial?.zoneId || '',
    areaId: initial?.areaId || '',
    subAreaId: initial?.subAreaId || '',
    zone: initial?.zone || '',
    area: initial?.area || '',
    subArea: initial?.subArea || '',
  });
  
  // Search states for classes and subjects
  const [classSearch, setClassSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  
  // Preferred Areas input
  const [areaInput, setAreaInput] = useState('');

  // Filter active subjects
  const activeSubjects = availableSubjects
    .filter(s => s.isActive)
    .map(s => s.name)
    .sort();

  // Filter active classes and sort by order
  const activeClasses = availableClasses
    .filter(c => c.isActive)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(c => c.displayName || c.name);

  // Filter classes based on search
  const filteredClasses = activeClasses.filter(cls =>
    cls.toLowerCase().includes(classSearch.toLowerCase())
  );

  // Filter subjects based on search
  const filteredSubjects = activeSubjects.filter(subject =>
    subject.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  useEffect(() => {
    if (initial) {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = initial;
      setForm({ ...EMPTY, ...rest });
      setLocation({
        zoneId: initial.zoneId || '',
        areaId: initial.areaId || '',
        subAreaId: initial.subAreaId || '',
        zone: initial.zone || '',
        area: initial.area || '',
        subArea: initial.subArea || '',
      });
      if (initial.dob) {
        setAge(calculateAge(initial.dob));
      }
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
      setAge(null);
    }
    // Reset searches when modal opens/closes
    setClassSearch('');
    setSubjectSearch('');
    setAreaInput('');
  }, [initial, open]);

  const set = (key: keyof ExtendedTutorForm, val: unknown) => {
    setForm((p) => ({ ...p, [key]: val }));
    
    if (key === 'dob' && typeof val === 'string') {
      setAge(calculateAge(val));
    }
  };

  // Toggle class selection (multiple)
  const toggleClass = (className: string) => {
    set('classesHandled', form.classesHandled.includes(className)
      ? form.classesHandled.filter((c) => c !== className)
      : [...form.classesHandled, className]);
  };

  // Toggle subject selection (multiple)
  const toggleSubject = (subject: string) => {
    set('subjectsHandled', form.subjectsHandled.includes(subject)
      ? form.subjectsHandled.filter((s) => s !== subject)
      : [...form.subjectsHandled, subject]);
  };

  // Add preferred area
  const addPreferredArea = () => {
    if (areaInput.trim() && !form.preferredAreas?.includes(areaInput.trim())) {
      set('preferredAreas', [...(form.preferredAreas || []), areaInput.trim()]);
      setAreaInput('');
    }
  };

  // Remove preferred area
  const removePreferredArea = (area: string) => {
    set('preferredAreas', form.preferredAreas?.filter(a => a !== area) || []);
  };

  // Photo handling functions
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    try {
      setPhotoFile(file);
      const base64 = await fileToBase64(file);
      set('photoBase64', base64);
      toast.success('Photo added successfully');
    } catch (error) {
      console.error('Error converting image:', error);
      toast.error('Failed to process image');
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    set('photoBase64', '');
    const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleLocationChange = (newLocation: any) => {
    setLocation(newLocation);
    setForm((prev) => ({
      ...prev,
      zoneId: newLocation.zoneId,
      areaId: newLocation.areaId,
      subAreaId: newLocation.subAreaId,
      zone: newLocation.zone,
      area: newLocation.area,
      subArea: newLocation.subArea,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim() || !form.phone.trim()) {
      alert('Please fill in Name and Phone (required fields)');
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
          <DialogTitle>{initial ? 'Edit Tutor' : 'Add New Tutor'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-4">
            
            {/* ===== PERSONAL INFO ===== */}
            <SectionTitle icon={GraduationCap}>Personal Information</SectionTitle>
            
            {/* Photo Upload Field */}
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Profile Photo
              </label>
              <div className="flex items-start gap-6">
                {form.photoBase64 ? (
                  <div className="relative group">
                    <img 
                      src={form.photoBase64} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-lg object-cover border-2 border-border shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove photo"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-muted border-2 border-dashed border-border flex items-center justify-center">
                    <Camera size={24} className="text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1">
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload size={16} />
                    Upload Photo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Max size: 2MB. Supported: JPG, PNG, GIF
                  </p>
                </div>
              </div>
            </div>

            <Field label="Full Name" required>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" required />
            </Field>
            
            <Field label="Phone" required>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Phone number" required />
            </Field>

            <Field label="Alternate Phone">
              <Input value={form.alternatePhone} onChange={(e) => set('alternatePhone', e.target.value)} placeholder="Alternate phone" />
            </Field>

            <Field label="WhatsApp">
              <Input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="WhatsApp number" />
            </Field>

            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="Email address" />
            </Field>

            {/* DOB and Age */}
            <div className="grid grid-cols-2 gap-3 col-span-2">
              <Field label="Date of Birth" icon={Calendar}>
                <div className="relative">
                  <Input 
                    type="date" 
                    value={form.dob} 
                    onChange={(e) => set('dob', e.target.value)} 
                    className="pr-10"
                  />
                  <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </Field>
              
              <Field label="Age">
                <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted/30 text-sm">
                  {age !== null ? (
                    <span className="font-medium">{age} years</span>
                  ) : (
                    <span className="text-muted-foreground italic">Auto-calculated</span>
                  )}
                </div>
              </Field>
            </div>

            {/* ===== ADDRESS ===== */}
            <SectionTitle icon={Building2}>Address</SectionTitle>

            <Field label="Present Address">
              <Input value={form.presentAddress} onChange={(e) => set('presentAddress', e.target.value)} placeholder="Present address" />
            </Field>

            <Field label="Permanent Address">
              <Input value={form.permanentAddress} onChange={(e) => set('permanentAddress', e.target.value)} placeholder="Permanent address" />
            </Field>

            <div className="col-span-2">
              <Field label="Location (Zone/Area/Sub Area)">
                <LocationSelector
                  value={location}
                  onChange={handleLocationChange}
                />
              </Field>
            </div>

            {/* ===== PREFERRED AREAS OF TUITION ===== */}
            <div className="col-span-2">
              <SectionTitle icon={MapPin}>Preferred Areas of Tuition</SectionTitle>
              <div className="flex gap-2">
                <Input
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value)}
                  placeholder="Enter area name (e.g., Dumdum, Salt Lake, Howrah)"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPreferredArea())}
                />
                <Button type="button" variant="outline" onClick={addPreferredArea} size="sm">
                  Add
                </Button>
              </div>
              {form.preferredAreas && form.preferredAreas.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.preferredAreas.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs"
                    >
                      {area}
                      <button
                        type="button"
                        onClick={() => removePreferredArea(area)}
                        className="hover:text-destructive"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Add areas where you are willing to travel for home tuition
              </p>
            </div>

            {/* ===== ABOUT ME ===== */}
            <div className="col-span-2">
              <SectionTitle icon={User}>About Me</SectionTitle>
              <Field label="Tell us about yourself">
                <Textarea
                  value={form.aboutMe}
                  onChange={(e) => set('aboutMe', e.target.value)}
                  placeholder="Describe your teaching philosophy, strengths, approach, experience highlights, etc."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This helps parents understand your teaching style and approach
                </p>
              </Field>
            </div>

            {/* ===== PRESENT QUALIFICATION ===== */}
            <SectionTitle icon={School}>Present Qualification</SectionTitle>

            <Field label="Qualification/Degree">
              <Input value={form.presentQualification} onChange={(e) => set('presentQualification', e.target.value)} placeholder="e.g. B.Tech, M.Sc" />
            </Field>

            <Field label="University/College Name">
              <Input value={form.presentCollegeName} onChange={(e) => set('presentCollegeName', e.target.value)} placeholder="Institution name" />
            </Field>

            <Field label="Year of Passing/Appearing">
              <Input value={form.presentYear} onChange={(e) => set('presentYear', e.target.value)} placeholder="e.g. 2024" />
            </Field>

            <Field label="Status">
              <Select value={form.presentStatus} onValueChange={(v) => set('presentStatus', v as 'pursuing' | 'completed')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pursuing">Pursuing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* ===== LAST QUALIFICATION ===== */}
            <SectionTitle icon={School}>Last Qualification</SectionTitle>

            <Field label="Qualification/Degree">
              <Input value={form.lastQualification} onChange={(e) => set('lastQualification', e.target.value)} placeholder="e.g. M.Sc, B.Ed" />
            </Field>

            <Field label="University/College Name">
              <Input value={form.lastCollegeName} onChange={(e) => set('lastCollegeName', e.target.value)} placeholder="Institution name" />
            </Field>

            <Field label="Year of Passing">
              <Input value={form.lastYear} onChange={(e) => set('lastYear', e.target.value)} placeholder="e.g. 2020" />
            </Field>

            {/* ===== CLASS 12 DETAILS ===== */}
            <SectionTitle icon={BookOpen}>Class 12 Details</SectionTitle>

            <Field label="School Name">
              <Input value={form.class12SchoolName} onChange={(e) => set('class12SchoolName', e.target.value)} placeholder="School name" />
            </Field>

            <Field label="Year of Passing">
              <Input value={form.class12Year} onChange={(e) => set('class12Year', e.target.value)} placeholder="e.g. 2018" />
            </Field>

            <Field label="Board">
              <Select value={form.class12Board} onValueChange={(v) => set('class12Board', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BOARDS.map((board) => (
                    <SelectItem key={board} value={board}>{board}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Stream">
              <Select value={form.class12Stream} onValueChange={(v) => set('class12Stream', v as 'science' | 'commerce' | 'arts' | 'other')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="commerce">Commerce</SelectItem>
                  <SelectItem value="arts">Arts</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* ===== EXTRA QUALIFICATION ===== */}
            <SectionTitle icon={GraduationCap}>Extra Qualification</SectionTitle>

            <Field label="Course Name">
              <Input value={form.extraCourseName} onChange={(e) => set('extraCourseName', e.target.value)} placeholder="e.g. Spoken English, Computer Course" />
            </Field>

            <Field label="Institute/University Name">
              <Input value={form.extraInstituteName} onChange={(e) => set('extraInstituteName', e.target.value)} placeholder="Institute name" />
            </Field>

            <Field label="Year (Optional)">
              <Input value={form.extraYear} onChange={(e) => set('extraYear', e.target.value)} placeholder="e.g. 2022" />
            </Field>

            <Field label="Description">
              <Input value={form.extraQualification} onChange={(e) => set('extraQualification', e.target.value)} placeholder="Additional details" />
            </Field>

            {/* ===== CLASSES HANDLED WITH SEARCH ===== */}
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1">
                <GraduationCap size={14} /> Classes Handled (select multiple)
                {classesLoading && <Loader2 size={12} className="ml-2 inline animate-spin" />}
              </label>
              
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search classes..."
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              
              {classesLoading ? (
                <div className="flex items-center justify-center p-8 border border-border rounded-lg">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : activeClasses.length === 0 ? (
                <div className="p-8 text-center border border-border rounded-lg bg-muted/20">
                  <p className="text-sm text-muted-foreground">No classes found. Please add classes in Settings first.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 p-4 border border-border rounded-lg bg-muted/20 max-h-48 overflow-y-auto">
                  {filteredClasses.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center w-full">No classes match your search</p>
                  ) : (
                    filteredClasses.map((cls) => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => toggleClass(cls)}
                        className={cn(
                          'text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer',
                          form.classesHandled.includes(cls)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border text-foreground hover:border-primary/50'
                        )}
                      >
                        {cls}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* ===== SUBJECTS HANDLED WITH SEARCH ===== */}
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1">
                <BookOpen size={14} /> Subjects Handled (select multiple)
              </label>
              
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search subjects..."
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              
              <div className="flex flex-wrap gap-2 p-4 border border-border rounded-lg bg-muted/20 max-h-48 overflow-y-auto">
                {filteredSubjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center w-full">
                    {subjectSearch ? `No subjects match "${subjectSearch}"` : 'No subjects available'}
                  </p>
                ) : (
                  filteredSubjects.map((subject) => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer',
                        form.subjectsHandled.includes(subject)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border text-foreground hover:border-primary/50'
                      )}
                    >
                      {subject}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* ===== TEACHING DETAILS ===== */}
            <SectionTitle icon={BookOpen}>Teaching Details</SectionTitle>

            <Field label="Teaching Experience">
              <Input value={form.teachingExperience} onChange={(e) => set('teachingExperience', e.target.value)} placeholder="e.g. 5 years" />
            </Field>

            <Field label="Availability">
              <Input value={form.availability} onChange={(e) => set('availability', e.target.value)} placeholder="e.g. Weekdays, Weekends" />
            </Field>

            <Field label="Preferred Slots">
              <Input value={form.preferredSlots} onChange={(e) => set('preferredSlots', e.target.value)} placeholder="e.g. 5–8 PM" />
            </Field>

            <Field label="Fee Range">
              <Input value={form.feeRange} onChange={(e) => set('feeRange', e.target.value)} placeholder="e.g. ₹500–₹800/hr" />
            </Field>

            <Field label="Preferred Mode">
              <Select value={form.preferredMode} onValueChange={(v) => set('preferredMode', v as TutorMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home Tuition</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="School/College Teacher?">
              <Select value={form.isSchoolOrCollegeTeacher ? 'yes' : 'no'} onValueChange={(v) => set('isSchoolOrCollegeTeacher', v === 'yes')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {form.isSchoolOrCollegeTeacher && (
              <Field label="School/College Name">
                <Input value={form.schoolOrCollegeName} onChange={(e) => set('schoolOrCollegeName', e.target.value)} placeholder="Institution name" />
              </Field>
            )}

            {/* ===== RATING ===== */}
            <SectionTitle>Rating</SectionTitle>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => set('rating', n)} className="cursor-pointer">
                    <Star size={20} className={cn(n <= (form.rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />
                  </button>
                ))}
              </div>
            </div>

            <Field label="Comment">
              <Input value={form.ratingComment} onChange={(e) => set('ratingComment', e.target.value)} placeholder="Optional note" />
            </Field>
          </div>

          <DialogFooter className="mt-6 gap-2">
  <Button type="button" variant="outline" onClick={onClose}>
    {viewOnly ? 'Close' : 'Cancel'}
  </Button>
  {!viewOnly && (
    <Button type="submit" disabled={loading}>
      {loading ? 'Saving…' : initial ? 'Save Changes' : 'Add Tutor'}
    </Button>
  )}
</DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}