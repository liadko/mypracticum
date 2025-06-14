import { createContext, useState, useEffect, useCallback, useContext } from "react"
import type { BaseEntry, ClientEntry, MentorEntry, PersonalEntry, SomeEntry } from "../types"
import type { Category, EntryMap } from "../types"
import { fetchPersonalEntries, fetchMentorEntries, fetchClientEntries, addEntry, deleteEntry, updateClientName, updateMentor, updateExternalTherapist } from "../services/entries"

interface EntriesContextValue {
    personalEntries: PersonalEntry[]
    mentorEntries: MentorEntry[]
    clientEntries: ClientEntry[]
    totalHours: { personal: number; mentor: number; client: number }
    loading: boolean
    error: Error | null
    /**
     * Toggle a date on or off for the given category.
     * Performs optimistic update, then POST or DELETE under the hood.
     */
    toggleDay: (category: Category, date: string) => Promise<void>

    // entry updates
    handleUpdateClient: (entryId: string, newName: string) => Promise<void>
    handleUpdateMentor: (entryId: string, newMentorId: string | null) => Promise<void>
    handleUpdatePersonal: (entryId: string, newExternalTherapistId: string | null) => Promise<void>

    handleUpdate: (category: Category, entryId: string, newValue: string) => Promise<SomeEntry>
}

export const EntriesContext = createContext<EntriesContextValue | null>(null)

export function EntriesProvider({
    studentId,
    children,
}: {
    studentId: string
    children: React.ReactNode
}) {
    const [entries, setEntries] = useState<EntryMap>({
        personal: [],
        mentor: [],
        client: [],
    })
    const [loading, setLoading] = useState(true)
    const [updatingServer, setUpdatingServer] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null)

    const totalHours = {
        personal: entries.personal.length,
        mentor: entries.mentor.length,
        client: entries.client.length,
    }


    // Set of entry dates that are pending (being added/deleted) 
    const [pending, setPending] = useState<Set<string>>(new Set())

    // Entry updating
    const [statusTimerId, setStatusTimerId] = useState<number | null>(null);




    // Initial load of all three categories
    useEffect(() => {
        let isMounted = true
        setLoading(true)
        Promise.all([
            fetchPersonalEntries(studentId),
            fetchMentorEntries(studentId),
            fetchClientEntries(studentId),
        ])
            .then(([personal, mentor, client]) => {
                if (!isMounted) return
                setEntries({ personal, mentor, client })
            })
            .catch((err) => {
                if (!isMounted) return
                console.error("Failed to load entries:", err)
                setError(err)
            })
            .finally(() => {
                if (isMounted) setLoading(false)
            })
        return () => {
            isMounted = false
        }
    }, [studentId])

    // helper func
    function insertEntrySorted<T extends BaseEntry>(list: T[], entry: T): T[] {
        const idx = list.findIndex((e) => e.date < entry.date)
        if (idx === -1) return [...list, entry]
        return [...list.slice(0, idx), entry, ...list.slice(idx)]
    }


    const handleUpdateClient = useCallback(async (entryId: string, newName: string) => {
        console.log("handleUpdateClient Called")
        try {
            const result = await handleUpdate("client", entryId, newName) as ClientEntry


            setEntries(current => ({
                ...current,
                client: current.client.map(e =>
                    e.id === entryId ? result : e
                ),
            }));

        } catch (error) {
            setError(new Error("Handle Update Failed, Changes could not be saved"))
        }

    }, [entries, studentId]); // Dependency for useCallback



    const handleUpdate = useCallback(async (category: Category, entryId: string, newValue: string) => {
        
        console.log("Handle Update Called")
        // 1. Clear any pending "All changes saved" message timer.
        if (statusTimerId) {
            clearTimeout(statusTimerId);
        }
        // 2. Immediately set the global status to "Saving...".
        setUpdatingServer(true);

        // 3. Await the API call promise that was passed in.
        let savedEntry: SomeEntry;

        switch (category) {
            case 'client':
                // The 'newValue' here is the client's name (a string)
                savedEntry = await updateClientName(studentId, entryId, newValue as string);
                break;
            case 'mentor':
                // The 'newValue' here is the mentor's ID (a string or null)
                savedEntry = await updateMentor(studentId, entryId, newValue as string | null);
                break;
            case 'personal':
                // The 'newValue' here is the therapist's ID (a string or null)
                savedEntry = await updateExternalTherapist(studentId, entryId, newValue as string | null);
                break;
        }

        // 4. On SUCCESS, set a timer to show the "saved" message after a delay.
        const newTimer = setTimeout(() => {
            setUpdatingServer(false);
        }, 1500); // 1.5 second delay
        setStatusTimerId(newTimer);

        return savedEntry; // Return the result for the specific function to use


    }, [statusTimerId]); // Dependency for useCallback




    const handleRemoveEntry = useCallback(
        async (category: Category, date: string) => {
            // 1) Find the entry object (so we can re-insert it if needed)
            const entry = entries[category].find((e) => e.date === date)
            if (!entry) return

            // 2) Optimistically remove it
            setEntries((prev) => ({
                ...prev,
                [category]: prev[category].filter((e) => e.id !== entry.id),
            }))


            // 3) Attempt server DELETE
            try {
                await deleteEntry(studentId, category, entry.id)
            } catch (err) {
                console.error("handleRemove error:", err)

                // 4) Roll back *only* that one entry, in date order
                setEntries((prev) => ({
                    ...prev,
                    [category]: insertEntrySorted(prev[category], entry),
                }))
                setError(err as Error)
            }
        },
        [entries, studentId]
    )

    const handleAddEntry = useCallback(
        async (category: Category, date: string) => {
            // 1) Create a temporary entry ID
            const tempId = "temp-" + Math.random().toString(36).slice(2)

            // 2) Optimistically insert it in sorted order
            setEntries((prev) => ({
                ...prev,
                [category]: insertEntrySorted(prev[category], { id: tempId, date } as BaseEntry),
            }))


            // // 3) Send to server
            try {

                // 4) Replace temp entry with the real one returned
                const realEntry = (await addEntry(studentId, category, date)) as BaseEntry
                setEntries((prev) => ({
                    ...prev,
                    [category]: prev[category].map((e) =>
                        e.id === tempId ? realEntry : e
                    ),
                }))
            } catch (err) {
                console.error("handleAdd error:", err)

                // 5) Roll back: remove only the temp entry
                setEntries((prev) => ({
                    ...prev,
                    [category]: prev[category].filter((e) => e.id !== tempId),
                }))
                setError(err as Error)
            }
        },
        [studentId]
    )

    const toggleDay = useCallback(
        async (category: Category, date: string) => {
            // If a toggle is already in flight for this date, skip it:
            if (pending.has(date)) return
            setPending(prev => new Set(prev).add(date))

            const existing = entries[category].find(e => e.date === date)
            if (existing) {
                await handleRemoveEntry(category, date)
            } else {
                await handleAddEntry(category, date)
            }

            // clear the lock
            setPending(prev => {
                const next = new Set(prev)
                next.delete(date)
                return next
            })
        },
        [entries, handleRemoveEntry, handleAddEntry, pending]
    )


    return (
        <EntriesContext.Provider
            value={{
                personalEntries: entries.personal,
                mentorEntries: entries.mentor,
                clientEntries: entries.client,
                totalHours,
                loading,
                error,
                toggleDay,
                handleUpdateClient,
            } as EntriesContextValue}
        >
            {children}
        </EntriesContext.Provider>
    )
}

export function useEntries(): EntriesContextValue {
    const ctx = useContext(EntriesContext)
    if (!ctx) {
        throw new Error("useEntries must be used within an EntriesProvider")
    }
    return ctx
}