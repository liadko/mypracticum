import type { Entry, NewEntry } from '../types'

const BASE_API_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Fetch all entries for the given student.
 */
export async function fetchAllEntries(
    studentId: string
): Promise<Entry[]> {
    const res = await fetch(`${BASE_API_URL}/${studentId}/entries`)
    if (!res.ok) {
        throw new Error(`Failed to load entries: ${res.status} ${res.statusText}`)
    }
    const data: Entry[] = await res.json()
    return data
}


/**
 * Create a new entry on the server.
 * Returns the server‐generated Entry (with its real UUID).
 */
export async function createEntry(
    studentId: string, payload: NewEntry
): Promise<Entry> {
    const res = await fetch(`${BASE_API_URL}/${studentId}/entries`, {
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
    studentId: string, entryId: string
): Promise<void> {
    const res = await fetch(`${BASE_API_URL}/${studentId}/entries/${encodeURIComponent(entryId)}`, {
        method: 'DELETE',
    })
    if (!res.ok) {
        throw new Error(`Failed to delete entry: ${res.status} ${res.statusText}`)
    }
}