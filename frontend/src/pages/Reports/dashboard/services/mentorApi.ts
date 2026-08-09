import { fetchWithAuth } from './apiClient';
import type {
  MentorSummary,
  MentorDetailReport,
  SearchMentorsOptions,
  SearchMentorsResult,
  MentorStudentConnected,
  MentorEvent,
} from '../types';

/**
 * Normalizes raw API mentor summary DTO
 */
export function normalizeMentorSummary(raw: any): MentorSummary {
  const sub = raw?.submittedHours || {};
  const students = Array.isArray(raw?.students)
    ? raw.students.map((s: any) => ({
        id: s.id || '',
        firstName: s.firstName || '',
        lastName: s.lastName || '',
      }))
    : undefined;

  return {
    id: raw?.id || '',
    firstName: raw?.firstName || '',
    lastName: raw?.lastName || '',
    email: raw?.email || '',
    signatureSubmitted: raw?.signatureSubmitted ?? false,
    studentCount: typeof raw?.studentCount === 'number' ? raw.studentCount : (students ? students.length : 0),
    students,
    submittedHours: {
      mentorApproved: typeof sub.mentorApproved === 'number' ? sub.mentorApproved : 0,
      mentorPending: typeof sub.mentorPending === 'number' ? sub.mentorPending : 0,
    },
  };
}

/**
 * Normalizes raw API connected student DTO
 */
export function normalizeMentorStudent(raw: any): MentorStudentConnected {
  const sub = raw?.submittedHours || {};
  return {
    id: raw?.id || '',
    firstName: raw?.firstName || '',
    lastName: raw?.lastName || '',
    email: raw?.email || '',
    class: raw?.class || raw?.className || '',
    taz: raw?.taz || '',
    submittedHours: {
      mentorApproved: typeof sub.mentorApproved === 'number' ? sub.mentorApproved : 0,
      mentorPending: typeof sub.mentorPending === 'number' ? sub.mentorPending : 0,
    },
  };
}

/**
 * Normalizes raw API mentor event DTO
 */
export function normalizeMentorEvent(raw: any): MentorEvent {
  return {
    id: raw?.id || '',
    date: raw?.date || '',
    studentId: raw?.studentId || '',
    studentName: raw?.studentName || '',
    studentClass: raw?.studentClass || raw?.class || '',
    mentorContactId: raw?.mentorContactId || '',
    approved: raw?.approved ?? true,
    hours: typeof raw?.hours === 'number' ? raw.hours : 0,
    source: raw?.source || 'regular',
    notes: raw?.notes || '',
  };
}

/**
 * Fetches mentor directory via `GET /api/v1/reports/mentors?query=&page=1&limit=50&sortBy=name&sortDirection=asc`
 */
export async function searchMentors(
  options: SearchMentorsOptions = {}
): Promise<SearchMentorsResult> {
  const queryParams = {
    query: options.query?.trim() || '',
    page: options.page || 1,
    limit: options.limit || 50,
    sortBy: options.sortBy || 'name',
    sortDirection: options.sortDirection || 'desc',
  };

  const data = await fetchWithAuth<any>('/v1/reports/mentors', queryParams);

  if (data && typeof data === 'object' && Array.isArray(data.mentors)) {
    const rawMentors = data.mentors;
    const total = typeof data.total === 'number' ? data.total : rawMentors.length;
    const page = typeof data.page === 'number' ? data.page : (options.page || 1);
    const limit = typeof data.limit === 'number' ? data.limit : (options.limit || 50);
    const totalPages = typeof data.totalPages === 'number' ? data.totalPages : Math.ceil(total / limit) || 1;

    return {
      mentors: rawMentors.map(normalizeMentorSummary),
      total,
      page,
      limit,
      totalPages,
    };
  } else if (Array.isArray(data)) {
    const normalized = data.map(normalizeMentorSummary);
    const total = normalized.length;
    const page = options.page || 1;
    const limit = options.limit || 50;
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      mentors: normalized,
      total,
      page,
      limit,
      totalPages,
    };
  }

  throw new Error('מבנה נתונים לא תקין שהתקבל מ-API מדריכים');
}

/**
 * Fetches mentor details via `GET /api/v1/reports/mentors/:mentorId`
 */
export async function getMentorReport(mentorId: string): Promise<MentorDetailReport> {
  const data = await fetchWithAuth<any>(`/v1/reports/mentors/${encodeURIComponent(mentorId)}`);

  const mentor = normalizeMentorSummary(data?.mentor || data);
  const rawStudents = Array.isArray(data?.students) ? data.students : [];
  const rawEvents = Array.isArray(data?.events) ? data.events : [];

  return {
    mentor,
    students: rawStudents.map(normalizeMentorStudent),
    events: rawEvents.map(normalizeMentorEvent),
  };
}
