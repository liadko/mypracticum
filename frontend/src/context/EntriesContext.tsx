import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Entry, NewEntry } from '../types'
import * as domain from '../domain/entries'         // pure helpers: addEntry, removeEntry (sorted)
import * as api from '../api/entriesApi' // I/O: fetchAllEntries, createEntry, deleteEntry
import { showAsyncToast, showError } from '../utils/toast'
import { v4 as uuidv4 } from 'uuid';


interface EntriesProviderProps {
    children: React.ReactNode
}

interface EntriesContextType {
    entries: Entry[]
    loadingE: boolean
    errorE: Error | null
    pending: Set<string>       // set of entry‐ids currently being toggled
    toggleEntry: (contactId: string, date: string) => Promise<void>

    toggleApproved: (entryId: string) => Promise<void>
}

const EntriesContext = createContext<EntriesContextType | null>(null)

export function EntriesProvider({ children }: EntriesProviderProps) {
    const [entries, setEntries] = useState<Entry[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<Error | null>(null) // fatal error
    const [pending, setPending] = useState<Set<string>>(new Set())

    // 1️⃣ Initial load of all entries
    useEffect(() => {
        let isMounted = true
        setLoading(true)
        api.fetchAllEntries()
            .then(fetched => {
                if (!isMounted) return
                setEntries(fetched)
            })
            .catch(err => {
                if (!isMounted) return
                console.error(err)
                setError(Error(`Oops! Something happened: ${err}`))
            })
            .finally(() => {
                if (isMounted) setLoading(false)
            })
        return () => {
            isMounted = false
        }
    }, [])


    // 2️⃣ Helper: delete an existing entry
    const remove = useCallback(
        async (entryId: string) => {

            const deletedEntry = domain.getEntry(entries, entryId);
            if (!deletedEntry) return // nothing to remove 

            setEntries(curr => domain.removeEntry(curr, entryId))

            try {
                await api.deleteEntry(entryId)
            } catch (err: any) {
                console.error(err)
                setEntries(curr => domain.addEntry(curr, deletedEntry))
                showError(`אי אפשר למחוק את השעה הזאת`)
            }

        },
        [entries]
    )

    // 3️⃣ Helper: add a new entry (optimistic, swap temp → real)
    const create = useCallback(
        async (contactId: string, date: string) => {

            const newEntry: NewEntry = { contactId, date }

            const tempId = uuidv4()

            const tempEntry: Entry = {
                id: tempId,
                ...newEntry,
                userId: 'temp_user_id',
                approved: false,        // default
            }

            // optimistic
            setEntries(curr => domain.addEntry(curr, tempEntry))

            try {
                const real = await api.createEntry(newEntry)
                setEntries(curr => {
                    const withoutTemp = domain.removeEntry(curr, tempId)
                    return domain.addEntry(withoutTemp, real)
                })
            } catch (err: any) {
                console.error(err)
                setEntries(curr => domain.removeEntry(curr, tempId))
                showError(`אי אפשר להוסיף את השעה הזאת`)
            }
        },
        [entries]
    )



    // 4️⃣ Public: toggle an entry on/off
    const toggleEntry = useCallback(
        async (contactId: string, date: string) => {

            // If a toggle is already in flight for this date, skip it:
            if (pending.has(date)) {
                //console.log("toggle blocked.")
                //console.log(pending)
                return
            }
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
        [entries, remove, create, pending]
    )

    const setApproval = useCallback(async (entryId: string, approved: boolean) => {
        const updated = await showAsyncToast(
            api.setEntryApproval(entryId, approved),
            {
                loading: "מעדכן אישור…",
                success: approved ? "אושר בהצלחה" : "ביטול האישור נשמר",
                error: "עדכון האישור נכשל",
            }
        )
        // keep list sorted via domain helpers
        setEntries(curr => {
            const without = domain.removeEntry(curr, updated.id)
            return domain.addEntry(without, updated)
        })
    }, [])

    const toggleApproved = useCallback(async (entryId: string) => {
        const e = entries.find(x => x.id === entryId)
        if (!e) return
        setApproval(entryId, !e.approved)

    }, [entries, setApproval])

    return (
        <EntriesContext.Provider value={{ entries, loadingE: loading, errorE: error, pending, toggleEntry, toggleApproved }}>
            {children}
        </EntriesContext.Provider>
    )
}

export function useEntries(): EntriesContextType {
    const ctx = useContext(EntriesContext)
    if (!ctx) throw new Error('useEntries must be used within EntriesProvider')
    return ctx
}