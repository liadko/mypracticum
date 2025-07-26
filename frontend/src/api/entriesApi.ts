import type { Entry, NewEntry } from '../types'
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