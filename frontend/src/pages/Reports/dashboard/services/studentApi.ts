import type { StudentSummary, StudentReport, ReportEvent, ManualEntry, MentorContact, ClientContact, TherapistContact } from '../types';
import { getApiBaseUrl, getJwtToken } from './apiConfig';

/**
 * Normalizes raw API Student DTO to frontend StudentSummary type.
 */
export function normalizeStudentSummary(raw: any): StudentSummary {
  if (!raw) {
    return {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      taz: '',
      className: '',
      clientHours: 0,
      mentorApprovedHours: 0,
      mentorPendingHours: 0,
      therapistHours: 0,
      manualHours: 0,
      totalHours: 0,
    };
  }

  const sum = raw.summary || raw;
  const sub = sum.submittedHours || raw.submittedHours || {};

  // Submitted hours breakdown
  const submittedHours = {
    client: sub.client ?? sum.clientHours ?? raw.clientHours ?? 0,
    mentorApproved: sub.mentorApproved ?? sum.mentorApprovedHours ?? raw.mentorApprovedHours ?? 0,
    mentorPending: sub.mentorPending ?? sum.mentorPendingHours ?? raw.mentorPendingHours ?? 0,
    therapist: sub.therapist ?? sum.therapistHours ?? raw.therapistHours ?? 0,
  };

  // Manual hours breakdown (supports object or number format)
  let manualHoursTotal = 0;
  let manualHoursByCategory = { client: 0, mentor: 0, therapist: 0 };

  const rawManual = sum.manualHours ?? raw.manualHours;
  if (typeof rawManual === 'object' && rawManual !== null) {
    manualHoursByCategory = {
      client: rawManual.client ?? 0,
      mentor: rawManual.mentor ?? 0,
      therapist: rawManual.therapist ?? 0,
    };
    manualHoursTotal = manualHoursByCategory.client + manualHoursByCategory.mentor + manualHoursByCategory.therapist;
  } else if (typeof rawManual === 'number') {
    manualHoursTotal = rawManual;
    const cat = sum.manualHoursByCategory || raw.manualHoursByCategory || {};
    manualHoursByCategory = {
      client: cat.client ?? 0,
      mentor: cat.mentor ?? 0,
      therapist: cat.therapist ?? 0,
    };
  } else {
    const cat = sum.manualHoursByCategory || raw.manualHoursByCategory || {};
    manualHoursByCategory = {
      client: cat.client ?? 0,
      mentor: cat.mentor ?? 0,
      therapist: cat.therapist ?? 0,
    };
    manualHoursTotal = manualHoursByCategory.client + manualHoursByCategory.mentor + manualHoursByCategory.therapist;
  }

  const clientHours = sum.clientHours ?? raw.clientHours ?? (submittedHours.client + manualHoursByCategory.client);
  const mentorApprovedHours = sum.mentorApprovedHours ?? raw.mentorApprovedHours ?? (submittedHours.mentorApproved + manualHoursByCategory.mentor);
  const mentorPendingHours = submittedHours.mentorPending;
  const therapistHours = sum.therapistHours ?? raw.therapistHours ?? (submittedHours.therapist + manualHoursByCategory.therapist);
  const totalHours = sum.totalHours ?? raw.totalHours ?? (clientHours + mentorApprovedHours + therapistHours);

  return {
    id: raw.id || '',
    firstName: raw.firstName || '',
    lastName: raw.lastName || '',
    email: raw.email || '',
    taz: raw.taz || '',
    className: raw.class || raw.className || '',
    clientHours,
    mentorApprovedHours,
    mentorPendingHours,
    therapistHours,
    manualHours: manualHoursTotal,
    totalHours,
    submittedHours,
    manualHoursByCategory,
    signatureSubmitted: sum.signatureSubmitted ?? raw.signatureSubmitted,
    avatarUrl: raw.avatarUrl,
    patternFlag: raw.patternFlag || 'normal',
    patternFlagText: raw.patternFlagText,
  };
}

/**
 * Normalizes raw API Report DTO to frontend StudentReport type.
 */
export function normalizeStudentReport(raw: any): StudentReport {
  const student = normalizeStudentSummary(raw.student || raw);
  
  const rawSum = raw.student?.summary || raw.summary || {};
  const summary = {
    totalHours: rawSum.totalHours ?? student.totalHours ?? 0,
    clientHours: rawSum.clientHours ?? student.clientHours ?? 0,
    mentorApprovedHours: rawSum.mentorApprovedHours ?? student.mentorApprovedHours ?? 0,
    mentorPendingHours: rawSum.mentorPendingHours ?? student.mentorPendingHours ?? 0,
    therapistHours: rawSum.therapistHours ?? student.therapistHours ?? 0,
    manualHours: student.manualHours,
    requiredQuota: 350,
    submittedHours: student.submittedHours,
    manualHoursByCategory: student.manualHoursByCategory,
    signatureSubmitted: rawSum.signatureSubmitted ?? student.signatureSubmitted,
  };

  const events: ReportEvent[] = (raw.events || []).map((e: any) => ({
    id: e.id,
    date: e.date,
    category: e.category,
    contactId: e.contactId || '',
    contactName: e.contactName || '',
    hours: e.hours || 0,
    approved: e.approved ?? true,
    source: e.source || 'regular',
    notes: e.notes || e.description || '',
  }));

  const manualEntries: ManualEntry[] = (raw.manualEntries || []).map((m: any) => ({
    id: m.id,
    title: m.title || 'התאמה מנהלתית',
    category: m.category || 'client',
    hours: m.hours || 0,
    createdAt: m.createdAt ? (typeof m.createdAt === 'string' ? m.createdAt.substring(0, 10) : '') : '',
    batchId: m.batchId || undefined,
    approvedBy: m.approvedBy || 'מנהלת הפרקטיקום',
    notes: m.notes,
  }));

  const rawContacts = raw.contacts || {};
  const mentors: MentorContact[] = (rawContacts.mentors || []).map((m: any) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    specialty: m.specialty,
    approvedHours: m.approvedHours ?? m.hours ?? 0,
    pendingHours: m.pendingHours ?? 0,
    licenseNumber: m.licenseNumber,
  }));

  const clients: ClientContact[] = (rawContacts.clients || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    institution: c.institution || c.clientInstitution,
    trainingCenterInfo: c.trainingCenterInfo || c.clientTrainingCenterInfo,
    hours: c.hours || 0,
    ageGroup: c.ageGroup,
  }));

  const therapists: TherapistContact[] = (rawContacts.therapists || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    phone: t.phone,
    specialty: t.specialty,
    hours: t.hours || 0,
    clinicAddress: t.clinicAddress,
  }));

  return {
    student,
    summary,
    events,
    manualEntries,
    contacts: {
      mentors,
      clients,
      therapists,
    },
  };
}

export interface SearchStudentsOptions {
  query?: string;
  className?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'class' | 'email' | 'clientHours' | 'mentorApprovedHours' | 'therapistHours' | 'mentorPendingHours' | 'signatureSubmitted' | string;
  sortDirection?: 'asc' | 'desc';
}

export interface SearchStudentsResult {
  students: StudentSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Searches students via Go API `GET /api/v1/reports/students?query=<text>&class=<class>&sortBy=<field>&sortDirection=<dir>&page=<number>&limit=<number>`
 */
export async function searchStudents(
  params: string | SearchStudentsOptions = '',
  limitParam: number = 50
): Promise<SearchStudentsResult> {
  let options: SearchStudentsOptions;
  if (typeof params === 'string') {
    options = { query: params, limit: limitParam, page: 1, sortBy: 'name', sortDirection: 'asc' };
  } else {
    options = {
      query: params.query || '',
      className: params.className || '',
      page: params.page || 1,
      limit: params.limit || limitParam || 50,
      sortBy: params.sortBy || 'name',
      sortDirection: params.sortDirection || 'asc',
    };
  }

  const baseUrl = getApiBaseUrl();
  const token = getJwtToken();

  const queryParams = new URLSearchParams();
  if (options.query && options.query.trim()) {
    queryParams.append('query', options.query.trim());
  }
  if (options.className && options.className !== 'all') {
    queryParams.append('class', options.className.trim());
  }
  if (options.sortBy) {
    queryParams.append('sortBy', options.sortBy);
  }
  if (options.sortDirection) {
    queryParams.append('sortDirection', options.sortDirection);
  }
  queryParams.append('page', String(options.page || 1));
  queryParams.append('limit', String(options.limit || 50));

  const url = `${baseUrl}/v1/reports/students?${queryParams.toString()}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (err: any) {
    throw new Error(`שגיאת תקשורת: השרת אינו זמין או מנותק (${err.message || 'Network error'})`);
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(`שגיאת הרשאה (${response.status} Unauthorized). אנא עדכן את טוקן ה-JWT.`);
    }
    if (response.status === 404) {
      throw new Error('המשאב המבוקש לא נמצא בשרת (404 Not Found).');
    }
    throw new Error(`תגובת שרת לא תקינה (${response.status} ${response.statusText})`);
  }

  const data = await response.json();

  if (data && typeof data === 'object' && Array.isArray(data.students)) {
    const rawStudents = data.students;
    const total = typeof data.total === 'number' ? data.total : rawStudents.length;
    const page = typeof data.page === 'number' ? data.page : (options.page || 1);
    const limit = typeof data.limit === 'number' ? data.limit : (options.limit || 50);
    const totalPages = typeof data.totalPages === 'number' ? data.totalPages : Math.ceil(total / limit) || 1;

    return {
      students: rawStudents.map(normalizeStudentSummary),
      total,
      page,
      limit,
      totalPages,
    };
  } else if (Array.isArray(data)) {
    const normalized = data.map(normalizeStudentSummary);
    const total = normalized.length;
    const page = options.page || 1;
    const limit = options.limit || 50;
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      students: normalized,
      total,
      page,
      limit,
      totalPages,
    };
  } else {
    throw new Error('מבנה נתונים לא תקין שהתקבל מה-API');
  }
}

/**
 * Fetches comprehensive practicum report for a student via `GET /api/v1/reports/students/:studentId`
 */
export async function getStudentReport(studentId: string): Promise<StudentReport> {
  const baseUrl = getApiBaseUrl();
  const token = getJwtToken();

  const url = `${baseUrl}/v1/reports/students/${encodeURIComponent(studentId)}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (err: any) {
    throw new Error(`שגיאת תקשורת: השרת אינו זמין או מנותק (${err.message || 'Network error'})`);
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(`שגיאת הרשאה (${response.status} Unauthorized). אנא הגדר טוקן JWT בתפריט ההגדרות.`);
    }
    if (response.status === 404) {
      throw new Error(`תלמיד בעל מזהה '${studentId}' לא נמצא בשרת (404 Not Found).`);
    }
    throw new Error(`תגובת שרת לא תקינה (${response.status} ${response.statusText})`);
  }

  const data = await response.json();
  return normalizeStudentReport(data);
}

/**
 * Utility helper to export student report as CSV or JSON
 */
export async function exportStudentReport(studentId: string, format: 'json' | 'csv' = 'csv'): Promise<string> {
  const report = await getStudentReport(studentId);

  if (format === 'json') {
    return JSON.stringify(report, null, 2);
  }

  const rows = [
    ['מזהה אירוע', 'תאריך', 'קטגוריה', 'איש קשר', 'שעות', 'סטאטוס אישור', 'מקור'].join(','),
    ...report.events.map((e) =>
      [
        e.id,
        e.date,
        e.category,
        `"${e.contactName}"`,
        e.hours,
        e.approved ? 'מאושר' : 'ממתין',
        e.source === 'manual' ? 'ידני' : 'רגיל',
      ].join(',')
    ),
  ];

  return rows.join('\n');
}

/**
 * Fetches distinct non-empty student classes via Go API `GET /api/v1/reports/classes`.
 */
export async function getStudentClasses(): Promise<string[]> {
  const baseUrl = getApiBaseUrl();
  const token = getJwtToken();

  const url = `${baseUrl}/v1/reports/classes`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (err: any) {
    throw new Error(`שגיאת תקשורת: השרת אינו זמין או מנותק (${err.message || 'Network error'})`);
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(`שגיאת הרשאה (${response.status} Unauthorized).`);
    }
    if (response.status === 404) {
      throw new Error('רשימת המחזורים לא נמצאה (404 Not Found).');
    }
    throw new Error(`תגובת שרת לא תקינה (${response.status} ${response.statusText})`);
  }

  const data = await response.json();

  if (data && Array.isArray(data.classes)) {
    return data.classes.filter((c: any) => typeof c === 'string' && c.trim().length > 0);
  } else if (Array.isArray(data)) {
    return data.filter((c: any) => typeof c === 'string' && c.trim().length > 0);
  }
  throw new Error('מבנה נתונים לא תקין שהתקבל מה-API');
}
