import { apiFetch } from './client';
// You'll need to add these types to 'src/types.ts'
import type {
    StudentResponse,
    StudentImportResponse,
    BulkApproveResult,
    BulkAddManualEntriesResult,
    DeleteManualEntriesResult,
    ManualEntryPayload,
} from '../types';

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
    file: File,
    dryRun: boolean,
): Promise<StudentImportResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiFetch(`/api/v1/admin/students/import?dryRun=${dryRun}`, {
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
    });

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
    });

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
): Promise<DeleteManualEntriesResult> {
    const res = await apiFetch('/api/v1/admin/entries/manual/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });

    if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete entries');
    }
    return res.json();
}