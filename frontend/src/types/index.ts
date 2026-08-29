export const contactTypes = ['therapist', 'mentor', 'client'] as const
export type ContactType = typeof contactTypes[number]


export interface BaseContact {
    id: string
    name: string
    type: ContactType
}

export interface ClientContact extends BaseContact {
    type: 'client'
    clientInstitution: string // 'privateClinic' | 'trainingCenter'
    clientTrainingCenterInfo: string
}

export interface MentorContact extends BaseContact {
    type: 'mentor'
    email: string
    specialty: string
    phone: string
}

export interface TherapistContact extends BaseContact {
    type: 'therapist'
    specialty: string
    phone: string
}


export interface Student {
    type: 'student'
    id: string
    name: string
}


export type Contact =
    | ClientContact
    | MentorContact
    | TherapistContact
    | Student

// You don’t want callers to pass `id` or `created_at` (the server assigns those),
export interface NewContact {
    type: ContactType
    name: string
    email?: string
    phone?: string
    specialty?: string
    clientInstitution?: string // 'privateClinic' | 'trainingCenter'
    clientTrainingCenterInfo?: string

}


export interface Entry {
    id: string          // uuid
    date: string        // "YYYY-MM-DD"
    userId: string      // FK → User.id
    contactId: string   // FK → Contact.id
    approved: boolean
}

export interface NewEntry {
    contactId: string
    date: string       // "YYYY-MM-DD"
}

export interface ManualEntry {
    id: string;        // uuid
    userId: string;    // FK -> User.id
    hours: number;
    cause: string;
    type: ContactType;      // 'client', 'mentor', or 'therapist'
    createdAt: string; // ISO date string "YYYY-MM-DDTHH:mm:ssZ"
}



// For Editing Contacts
export type AddMode = { mode: 'add'; type: ContactType }
export type EditMode = { mode: 'edit'; id: string }
export type FormMode = AddMode | EditMode



export type UserRole = 'student' | 'mentor' | 'admin' | 'analyst'

export interface User {
    /** UUIDv4 */
    id: string

    firstName: string

    lastName: string

    email: string

    signature?: string  // Base64 jpeg

    roles: UserRole[]

}

export interface FullName {
    firstName: string
    lastName: string
}



/**
 * Basic student information returned by the admin endpoint.
 */
export interface StudentResponse {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    taz: string;
    roles: string[];
}

/**
 * The response object after importing students from a CSV.
 */
export interface StudentImportResponse {
    created: number;
    failed: number;
    skipped: number;
    errors: StudentImportRowError[];
    parseWarnings?: StudentImportRowError[];
}

export interface StudentImportRowError {
    row: number;
    email?: string;
    err: string;
}

export interface AdminClass {
    id: string;
    name: string;
    reportingStartDates: {
        client: string | null;
        mentor: string | null;
        therapist: string | null;
    };
}

export interface CreateAdminClassRequest {
    name: string;
    reportingStartDates: {
        client: string;
        mentor: string;
        therapist: string;
    };
}

/**
 * The payload object for a single manual entry in a bulk request.
 */
export interface ManualEntryPayload {
    userId: string;
    hours: number;
    cause: string;
    type: string; // 'mentor', 'client', or 'therapist'
}

/**
 * The result of a bulk approval request.
 */
export interface BulkApproveResult {
    approved: number;
    notFound: number;
    errors: Array<{ id: string; error: string }>;
}

/**
 * The result of a bulk add manual entries request.
 */
export interface BulkAddManualEntriesResult {
    created: number;
    failures: Array<{ userId: string; error: string }>;
    batchId: string; // The batch ID for all created entries
}

/**
 * The result of a delete entries request (manual or regular entries).
 */
export interface DeleteEntriesResult {
    deleted: number;
    notFound: number;
    errors: Array<{ id: string; error: string }>;
}
