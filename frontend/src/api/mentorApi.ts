// api/mentorApi.ts
import { apiFetch } from './client'

export type MentorStudent = { id: string; name: string } // adjust to your shape

export type MentorEntryStatus = 'pending' | 'approved' | 'declined'
export type MentorEntry = {
  id: string
  studentId: string
  date: string // ISO
  status: MentorEntryStatus
}

// If your backend still returns { approved: boolean }, normalize it here.
type ServerEntry =
  | MentorEntry
  | (Omit<MentorEntry, 'status'> & { approved: boolean })

function normalize(e: ServerEntry): MentorEntry {
  if ('status' in e) return e as MentorEntry
  const se = e as any
  return {
    id: se.id,
    studentId: se.studentId,
    date: se.date,
    status: se.approved ? 'approved' : 'pending',
  }
}

export async function fetchStudents(): Promise<MentorStudent[]> {
  const res = await apiFetch(`/api/v1/mentor/students`)
  if (!res.ok) throw new Error(`Failed to load students: ${res.status}`)
  return (await res.json()) as MentorStudent[]
}

export async function fetchAllEntries(): Promise<MentorEntry[]> {
  const res = await apiFetch(`/api/v1/mentor/entries`)
  if (!res.ok) throw new Error(`Failed to load entries: ${res.status}`)
  const data: ServerEntry[] = await res.json()
  return data.map(normalize)
}

export async function approveEntry(entryId: string): Promise<MentorEntry> {
  const res = await apiFetch(`/api/v1/mentor/entries/${encodeURIComponent(entryId)}/approve`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`Approve failed: ${res.status}`)
  return normalize(await res.json())
}

export async function declineEntry(entryId: string): Promise<MentorEntry> {
  const res = await apiFetch(`/api/v1/mentor/entries/${encodeURIComponent(entryId)}/decline`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`Decline failed: ${res.status}`)
  return normalize(await res.json())
}
