import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Entry, NewEntry } from '../types'
import * as D from '../domain/entries'         // pure helpers: addEntry, removeEntry (sorted)
import * as S from '../services/entriesService' // I/O: fetchAllEntries, createEntry, deleteEntry

interface EntriesProviderProps {
    studentId: string
    children: React.ReactNode
}

interface EntriesContextType {
    entries: Entry[]
    loading: boolean
    error: Error | null
    pending: Set<string>       // set of entry‐ids currently being toggled
    toggleEntry: (contactId: string, date: string) => Promise<void>
}

const EntriesContext = createContext<EntriesContextType | null>(null)

export function EntriesProvider({ studentId, children }: EntriesProviderProps) {
    const [entries, setEntries] = useState<Entry[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<Error | null>(null)
    const [pending, setPending] = useState<Set<string>>(new Set())

    // 1️⃣ Initial load of all entries
    useEffect(() => {
        let isMounted = true
        setLoading(true)
        S.fetchAllEntries(studentId)
            .then(fetched => {
                if (!isMounted) return
                setEntries(fetched)
            })
            .catch(err => {
                if (!isMounted) return
                console.error(err)
                setError(err)
            })
            .finally(() => {
                if (isMounted) setLoading(false)
            })
        return () => {
            isMounted = false
        }
    }, [studentId])


    // 2️⃣ Helper: delete an existing entry
    const remove = useCallback(
        async (entryId: string) => {

            const prev = entries
            setEntries(curr => D.removeEntry(curr, entryId))

            try {
                await S.deleteEntry(studentId, entryId)
            } catch (err: any) {
                console.error(err)
                setEntries(prev)
                setError(err)
            }

        },
        [entries]
    )

    // 3️⃣ Helper: add a new entry (optimistic, swap temp → real)
    const create = useCallback(
        async (contactId: string, date: string) => {

            const newEntry: NewEntry = { contactId, date }

            const tempId = crypto.randomUUID()

            const tempEntry: Entry = {
                id: tempId,
                ...newEntry,
                approved: false,        // or whatever default
            }
            // optimistic
            const prev = entries
            setEntries(curr => D.addEntry(curr, tempEntry))

            try {
                const real = await S.createEntry(studentId, newEntry)
                setEntries(curr => {
                    const withoutTemp = D.removeEntry(curr, tempId)
                    return D.addEntry(withoutTemp, real)
                })
            } catch (err: any) {
                console.error(err)
                setEntries(prev)
                setError(err)
            }
        },
        [entries]
    )



    // 4️⃣ Public: toggle an entry on/off
    const toggleEntry = useCallback(
        async (contactId: string, date: string) => {

            // If a toggle is already in flight for this date, skip it:
            if (pending.has(date)) return
            setPending(prev => new Set(prev).add(date))


            const existing = entries.find(
                e => e.contactId === contactId && e.date === date
            )
            if (existing) {
                await remove(existing.id)
            } else {
                await create(contactId, date)
            }

            // clear the lock
            setPending(prev => {
                const next = new Set(prev)
                next.delete(date)
                return next
            })
        },
        [entries, remove, create]
    )

    return (
        <EntriesContext.Provider value={{ entries, loading, error, pending, toggleEntry }}>
            {children}
        </EntriesContext.Provider>
    )
}

export function useEntries(): EntriesContextType {
    const ctx = useContext(EntriesContext)
    if (!ctx) throw new Error('useEntries must be used within EntriesProvider')
    return ctx
}