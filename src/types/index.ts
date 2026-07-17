export type UserRole = 'superadmin' | 'admin' | 'counsellor';
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'requirement_collected'
  | 'profiles_sent'
  | 'awaiting_approval'
  | 'demo_scheduled'
  | 'demo_completed'
  | 'feedback_received'
  | 'tutor_approved'
  | 'tutor_confirmed'
  | 'converted'
  | 'lost';
export type TutorMode = 'home' | 'online' | 'both';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'partial';
export type TicketStatus = 'open' | 'in_progress' | 'resolved';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}
// Add this after the Subject interface
export interface University {
  id: string;
  name: string;
  category?: 'state' | 'central' | 'private' | 'deemed' | 'foreign';
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}
export interface Subject {
  id: string;
  name: string;
  category?: 'academic' | 'language' | 'arts' | 'commerce' | 'science' | 'other';
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}
export interface Class {
  id: string;
  name: string;
  displayName: string;
  order?: number;
  category?: 'pre-primary' | 'primary' | 'secondary' | 'higher-secondary' | 'college' | 'competitive';
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}
export interface Task {
  id: string;
  taskId: string;
  taskName: string;
  assignedTo: string; // Counselor ID
  assignedToName?: string; // Counselor name
  aboutTask: string;
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
  remarks?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt?: any;
  updatedAt?: any;
  completedAt?: string;
}
export interface TutorAssignment {
  id: string;
  tutorId: string;
  tutorName: string;
  tutorCode: string;
  assignedDate: string;
  demoDate?: string;
  demoTime?: string;
  feedback?: string;        // Feedback for this specific demo
  rating?: number;          // Rating for this specific demo (1-5)
  status: 'pending' | 'demo_scheduled' | 'demo_completed' | 'selected' | 'rejected' | 'confirmed';
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
  feedbackDate?: string;     // When feedback was given
  completedAt?: string;      // When demo was completed
}


// Add these types
export interface Zone {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Area {
  id: string;
  zoneId: string;
  zoneName: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface SubArea {
  id: string;
  areaId: string;
  areaName: string;
  zoneId: string;
  zoneName: string;
  name: string;
  pincode?: string;
  description?: string;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}


export interface Tutor {
  id: string;
  tutorId: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  whatsapp?: string;
  dob?: string;
  email?: string;
  presentAddress?: string;
  permanentAddress?: string;
  zone: string;
  zoneId?: string;
  area?: string;
  areaId?: string;
  subArea?: string;
  subAreaId?: string;
  presentQualification?: string;
  lastQualification?: string;
  extraQualification?: string;
  class12Board?: string; // Single board selection
  classesHandled: string[]; // Array of classes (multiple selection)
  subjectsHandled: string[];
  teachingExperience?: string;
  availability?: string;
  preferredSlots?: string;
  feeRange?: string;
  location?: string;
  preferredMode: 'home' | 'online' | 'both';
  isSchoolOrCollegeTeacher: boolean;
  schoolOrCollegeName?: string;
  rating: number;
  ratingComment?: string;
  isActive: boolean;
  photoBase64?: string;
  createdAt?: any;
  updatedAt?: any;
subjectsHandled: string[];
}
export interface Lead {
  id: string;
  leadId: string;
  studentName: string;
  parentName?: string;
  universityId?: string;
  universityName?: string;
  guardianName?: string;
  guardianAddress?: string;
  landmark?: string;
  busStop?: string;
  metroStation?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  source: 'website' | 'whatsapp' | 'phone' | 'referral' | 'walk_in' | 'ads';
  status: LeadStatus;
  urgency: 'low' | 'medium' | 'high';
  class: string;
  board?: string;
  subjects: string[];
  mode: 'home' | 'online' | 'both';
  location: string;
  zone?: string;
  zoneId?: string;
  area?: string;
  areaId?: string;
  subArea?: string;
  subAreaId?: string;
  preferredTimings?: string;
  budget?: string;
  startDate?: string;
  genderPreference?: 'no_preference' | 'male' | 'female';
  assignedCounsellor?: string;
  selectedTutor?: string;
  notes?: string;
  followUpDate?: string;
  createdAt?: any;
  updatedAt?: any;
  
  // Rating fields
  rating?: number; // 1-5 stars
  ratingComment?: string;
  ratingDate?: any;
  ratedBy?: string;
  
  // Demo related fields
  demoDate?: string | any;
  demoStatus?: string;
  demoTime?: string;
  meetingType?: 'in-person' | 'online';
  meetingLink?: string;
  demoNotes?: string;
  
  // Tutor assignment fields
  tutorAssignments: TutorAssignment[];
  assignedTutors?: string[];
  totalTutorsAssigned?: number;
  demoScheduled?: number;
  demoCompleted?: number;
  tutorsSelected?: number;
  tutorsRejected?: number;
  tutorsPending?: number;
  confirmedTutorId?: string;
}

export interface Payment {
  id: string;
  leadId: string;
  studentName: string;
  tutorId?: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
  type: 'advance' | 'monthly';
  mode?: 'upi' | 'card' | 'netbanking' | 'wallet' | 'cash';
  transactionId?: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface SupportTicket {
  id: string;
  ticketId: string;
  leadId?: string;
  tutorId?: string;
  studentName?: string;
  issue:
    | 'tutor_absent'
    | 'student_absent'
    | 'timing_conflict'
    | 'performance'
    | 'replacement_request'
    | 'other';
  description: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'reminder' | 'payment' | 'demo' | 'renewal' | 'ticket';
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
}
