import { apiFetch } from './client';
// You'll need to add these types to 'src/types.ts'
import type {
    StudentResponse,
    StudentImportResponse,
    BulkApproveResult,
    BulkAddManualEntriesResult,
    DeleteEntriesResult,
    ManualEntryPayload,
    AdminClass,
    CreateAdminClassRequest,
    StudentStatusRequest,
    StudentStatusResult,
} from '../types';

/** Freezes or unfreezes students identified by user ID, email or TAZ. */
export async function setStudentStatus(request: StudentStatusRequest): Promise<StudentStatusResult> {
    const res = await apiFetch('/api/v1/admin/students/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    }, 60 * 1000);
    if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to update student status');
    }
    return res.json();
}

export async function getClasses(): Promise<AdminClass[]> {
    const res = await apiFetch('/api/v1/admin/classes');
    if (!res.ok) {
        throw new Error('Failed to fetch classes');
    }
    return res.json();
}

export async function createClass(request: CreateAdminClassRequest): Promise<AdminClass> {
    const res = await apiFetch('/api/v1/admin/classes', {
        method: 'POST',
        body: JSON.stringify(request),
    });
    if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create class');
    }
    return res.json();
}

/** Changes how many private-clinic hours students in a class may log. */
export async function updateClassCap(classId: string, privateClinicCap: number): Promise<AdminClass> {
    const res = await apiFetch(`/api/v1/admin/classes/${encodeURIComponent(classId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ privateClinicCap }),
    });
    if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to update the cap');
    }
    return res.json();
}

/**
 * Fetches all students for the admin portal.
 */
export async function getStudents(): Promise<StudentResponse[]> {
    const res = await apiFetch('/api/v1/admin/students');
    if (!res.ok) {
        throw new Error('Failed to fetch students');
    }
    return res.json();
}

/**
 * Imports students from a CSV file.
 */
export async function importStudents(
    classId: string,
    file: File,
    dryRun: boolean,
): Promise<StudentImportResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiFetch(`/api/v1/admin/classes/${classId}/students/import?dryRun=${dryRun}`, {
        method: 'POST',
        body: formData,
        // Do not set Content-Type; the browser handles it for FormData
    }, 5 * 60 * 1000); // 5min timeout for file uploads

    if (!res.ok) {
        const errData = await res.json();
        throw new Error(JSON.stringify(errData, null, '\t'));
    }
    return res.json();
}

/**
 * Approves a list of entry IDs.
 */
export async function approveEntries(
    ids: string[],
    approved: boolean = true,
): Promise<BulkApproveResult> {
    const res = await apiFetch('/api/v1/admin/entries/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, approved }),
    }, 20 * 1000); // 20s

    if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to approve entries');
    }
    return res.json();
}

/**
 * Bulk-adds manual entries for multiple students.
 */
export async function bulkAddManualEntries(
    entries: ManualEntryPayload[],
): Promise<BulkAddManualEntriesResult> {
    const res = await apiFetch('/api/v1/admin/entries/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
    }, 100 * 1000); // 100s

    if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add manual entries');
    }
    return res.json();
}

/**
 * Deletes a list of manual entries or batches by their UUIDs.
 */
export async function deleteManualEntries(
    ids: string[],
): Promise<DeleteEntriesResult> {
    const res = await apiFetch('/api/v1/admin/entries/manual/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    }, 20 * 1000); // 20s

    if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete entries');
    }
    return res.json();
}

/**
 * Deletes a list of regular entries by their UUIDs.
 */
export async function deleteEntries(
    ids: string[],
): Promise<DeleteEntriesResult> {
    const res = await apiFetch('/api/v1/admin/entries/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    }, 20 * 1000); // 20s

    if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete entries');
    }
    return res.json();
}
