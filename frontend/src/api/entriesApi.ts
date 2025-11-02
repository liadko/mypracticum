import type { Entry, ManualEntry, NewEntry } from '../types'
import { apiFetch } from './client'

/**
 * Fetch all entries for the given student.
 */
export async function fetchAllEntries(
): Promise<Entry[]> {
    const res = await apiFetch(`/api/v1/entries`)

    if (!res.ok) {
        throw new Error(`Failed to load entries: ${res.status} ${res.statusText}`)
    }
    const data: Entry[] = await res.json()
    return data
}

/**
 * Fetch all manual entries for the current user.
 */
export async function fetchManualEntries(): Promise<ManualEntry[]> {
    // I'm assuming the Go endpoint is /api/v1/manual-entries
    // and that it's protected by the same auth as /entries
    const res = await apiFetch(`/api/v1/manual-entries`);

    if (!res.ok) {
        throw new Error(`Failed to load manual entries: ${res.status} ${res.statusText}`);
    }
    const data: ManualEntry[] = await res.json();
    return data;
}


/**
 * Create a new entry on the server.
 * Returns the server‐generated Entry (with its real UUID).
 */
export async function createEntry(
    payload: NewEntry
): Promise<Entry> {
    const res = await apiFetch(`/api/v1/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    if (!res.ok) {
        throw new Error(`Failed to create entry: ${res.status} ${res.statusText}`)
    }
    const entry: Entry = await res.json()
    return entry
}

/**
 * Delete an existing entry by its UUID.
 */
export async function deleteEntry(
    entryId: string
): Promise<void> {
    const res = await apiFetch(`/api/v1/entries/${encodeURIComponent(entryId)}`, {
        method: 'DELETE',
    })
    if (!res.ok) {
        throw new Error(`Failed to delete entry: ${res.status} ${res.statusText}`)
    }
}


export async function setEntryApproval(
    entryId: string,
    approved: boolean
): Promise<Entry> {
    const res = await apiFetch(`/api/v1/entries/${encodeURIComponent(entryId)}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
    })
    if (!res.ok) {
        throw new Error(`Failed to set approval: ${res.status} ${res.statusText}`)
    }
    const entry: Entry = await res.json()
    return entry
}
