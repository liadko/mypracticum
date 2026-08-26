export type CategoryKey = 'client' | 'mentor' | 'therapist';

export interface CategoryConfig {
  key: CategoryKey;
  label: string;
  shortLabel: string;
  bgClass: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  dotColor: string;
  textColor: string;
}

export const CATEGORY_CONFIGS: Record<CategoryKey, CategoryConfig> = {
  client: {
    key: 'client',
    label: 'טיפול במטופלים (טיפולים ישירים)',
    shortLabel: 'מטופל',
    bgClass: 'bg-teal-50 hover:bg-teal-100',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800',
    borderColor: 'border-teal-600',
    dotColor: 'bg-teal-600',
    textColor: 'text-teal-900',
  },
  mentor: {
    key: 'mentor',
    label: 'הדרכה',
    shortLabel: 'הדרכה',
    bgClass: 'bg-sky-50 hover:bg-sky-100',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    borderColor: 'border-sky-600',
    dotColor: 'bg-sky-600',
    textColor: 'text-sky-900',
  },
  therapist: {
    key: 'therapist',
    label: 'טיפול אישי',
    shortLabel: 'טיפול אישי',
    bgClass: 'bg-amber-50 hover:bg-amber-100',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-600',
    dotColor: 'bg-amber-600',
    textColor: 'text-amber-900',
  },
};

export interface SubmittedHours {
  client: number;
  mentorApproved: number;
  mentorPending: number;
  therapist: number;
}

export interface ManualHoursByCategory {
  client: number;
  mentor: number;
  therapist: number;
}

export interface StudentSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  taz: string; // תעודת זהות / מזהה סטודנט
  className: string; // מחזור לימודים

  totalHours: number;
  clientHours: number;
  mentorApprovedHours: number;
  mentorPendingHours: number;
  therapistHours: number;
  manualHours: number;

  submittedHours?: SubmittedHours;
  manualHoursByCategory?: ManualHoursByCategory;
  signatureSubmitted?: boolean;

  avatarUrl?: string;
  patternFlag?: 'normal' | 'suspicious_concentration' | 'sparse_activity' | 'pending_approval_backlog';
  patternFlagText?: string;
}

export interface ReportEvent {
  id: string;
  date: string; // ISO YYYY-MM-DD
  category: CategoryKey;
  contactId: string;
  contactName: string;
  hours: number;
  approved?: boolean;
  source: 'regular' | 'manual';
  notes?: string;
  startTime?: string;
}

export interface ManualEntry {
  id: string;
  title: string; // עילה / כותרת
  category: 'client' | 'mentor' | 'therapist';
  hours: number;
  createdAt: string; // YYYY-MM-DD
  batchId?: string;
  approvedBy?: string;
  notes?: string;
}

export interface MentorContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  specialty?: string;
  approvedHours: number;
  pendingHours: number;
  licenseNumber?: string;
}

export interface ClientContact {
  id: string;
  name: string; // או מזהה מטופל אנונימי
  institution?: string; // מוסד / מרפאה
  trainingCenterInfo?: string;
  hours: number;
  ageGroup?: string;
}

export interface TherapistContact {
  id: string;
  name: string;
  phone?: string;
  specialty?: string;
  hours: number;
  clinicAddress?: string;
}

export interface StudentReport {
  student: StudentSummary;
  summary: {
    totalHours: number;
    clientHours: number;
    mentorApprovedHours: number;
    mentorPendingHours: number;
    therapistHours: number;
    manualHours: number;
    requiredQuota: number; // quota target e.g. 350
    submittedHours?: SubmittedHours;
    manualHoursByCategory?: ManualHoursByCategory;
    signatureSubmitted?: boolean;
  };
  events: ReportEvent[];
  manualEntries: ManualEntry[];
  contacts: {
    mentors: MentorContact[];
    clients: ClientContact[];
    therapists: TherapistContact[];
  };
}

// Mentor API DTOs & Domain Types
export interface MentorStudentRef {
  id: string;
  firstName: string;
  lastName: string;
}

export interface MentorSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  signatureSubmitted?: boolean;
  studentCount: number;
  students?: MentorStudentRef[];
  submittedHours: {
    mentorApproved: number;
    mentorPending: number;
  };
}

export interface MentorStudentConnected {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  class: string;
  taz: string;
  submittedHours: {
    mentorApproved: number;
    mentorPending: number;
  };
}

export interface MentorEvent {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentName: string;
  studentClass: string;
  mentorContactId: string;
  approved: boolean;
  hours: number;
  source: 'regular' | 'manual';
  notes?: string;
}

export interface MentorDetailReport {
  mentor: MentorSummary;
  students: MentorStudentConnected[];
  events: MentorEvent[];
}

export interface SearchMentorsOptions {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'email' | 'studentCount' | 'mentorApprovedHours' | 'mentorPendingHours' | 'signatureSubmitted' | string;
  sortDirection?: 'asc' | 'desc';
}

export interface SearchMentorsResult {
  mentors: MentorSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Unified Calendar Event View Model for Reusable Calendar Component
export interface UnifiedCalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  subtitle?: string;
  hours: number;
  approved: boolean;
  category: CategoryKey;
  source: 'regular' | 'manual';
  notes?: string;
  studentId?: string;
  studentName?: string;
  studentClass?: string;
}

