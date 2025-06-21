// src/domain/entries.ts

import type { Entry } from '../types'

/**
 * Remove the entry with the given ID.
 * Returns a new array without mutating the original.
 */
export function removeEntry(entries: Entry[], id: string): Entry[] {
    return entries.filter(e => e.id !== id)
}

/**
 * Insert a new entry into the array, keeping it sorted by date ascending.
 * Uses Array.prototype.findIndex for clarity.
 */
export function addEntry(entries: Entry[], entry: Entry): Entry[] {
    const idx = entries.findIndex(e => e.date >= entry.date)
    
    // new entry goes at the end
    if (idx === -1) { return [...entries, entry] }

    // insert before entries[idx]
    return [...entries.slice(0, idx), entry, ...entries.slice(idx),]
}

/**
 * Compute total hours assuming each entry represents one hour.
 */
export function countHours(entries: Entry[]): number {
    return entries.length
}