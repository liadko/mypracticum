// // context/MentorDataContext.tsx
// import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
// import { showError } from '../utils/toast'
// import * as api from '../api/mentorApi'
// import type { MentorEntry, MentorStudent } from '../api/mentorApi'

// type Ctx = {
//   students: MentorStudent[]
//   entries: MentorEntry[]
//   loadingM: boolean
//   errorM: Error | null
//   pending: Set<string> // entryIds in-flight
//   approve: (entryId: string) => Promise<void>
//   decline: (entryId: string) => Promise<void>
//   refreshStudent?: (studentId: string) => Promise<void> // optional hook point
// }

// const MentorDataContext = createContext<Ctx | null>(null)

// export function MentorDataProvider({ children }: { children: React.ReactNode }) {
//   const [students, setStudents] = useState<MentorStudent[]>([])
//   const [entries, setEntries] = useState<MentorEntry[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<Error | null>(null)
//   const [pending, setPending] = useState<Set<string>>(new Set())

//   // initial load (students + all entries)
//   useEffect(() => {
//     let alive = true
//     setLoading(true)
//     Promise.all([api.fetchStudents(), api.fetchAllEntries()])
//       .then(([s, e]) => {
//         if (!alive) return
//         setStudents(s)
//         setEntries(e.sort((a, b) => (a.date < b.date ? 1 : -1))) // newest first
//       })
//       .catch((err) => {
//         if (!alive) return
//         console.error(err)
//         setError(err instanceof Error ? err : new Error(String(err)))
//         showError('שגיאה בטעינת נתונים למנטור')
//       })
//       .finally(() => alive && setLoading(false))
//     return () => {
//       alive = false
//     }
//   }, [])

//   // optimistic helpers
//   const patchStatus = useCallback((id: string, status: MentorEntry['status']) => {
//     setEntries((curr) => curr.map((e) => (e.id === id ? { ...e, status } : e)))
//   }, [])

//   const approve = useCallback(async (id: string) => {
//     if (pending.has(id)) return
//     setPending((s) => new Set(s).add(id))
//     const before = entries.find((e) => e.id === id)
//     patchStatus(id, 'approved')
//     try {
//       const updated = await api.approveEntry(id)
//       patchStatus(id, updated.status) // trust server
//     } catch (err) {
//       console.error(err)
//       if (before) patchStatus(id, before.status)
//       showError('לא ניתן לאשר את הרשומה')
//     } finally {
//       setPending((s) => {
//         const n = new Set(s)
//         n.delete(id)
//         return n
//       })
//     }
//   }, [entries, pending, patchStatus])

//   const decline = useCallback(async (id: string) => {
//     if (pending.has(id)) return
//     setPending((s) => new Set(s).add(id))
//     const before = entries.find((e) => e.id === id)
//     patchStatus(id, 'declined')
//     try {
//       const updated = await api.declineEntry(id)
//       patchStatus(id, updated.status)
//     } catch (err) {
//       console.error(err)
//       if (before) patchStatus(id, before.status)
//       showError('לא ניתן לדחות את הרשומה')
//     } finally {
//       setPending((s) => {
//         const n = new Set(s)
//         n.delete(id)
//         return n
//       })
//     }
//   }, [entries, pending, patchStatus])

//   const value: Ctx = {
//     students,
//     entries,
//     loadingM: loading,
//     errorM: error,
//     pending,
//     approve,
//     decline,
//   }

//   return <MentorDataContext.Provider value={value}>{children}</MentorDataContext.Provider>
// }

// export function useMentorData(): Ctx {
//   const ctx = useContext(MentorDataContext)
//   if (!ctx) throw new Error('useMentorData must be used within MentorDataProvider')
//   return ctx
// }
