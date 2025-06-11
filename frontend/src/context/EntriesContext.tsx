import { createContext, useState, useEffect, useCallback, useContext } from "react"
import type { BaseEntry, ClientEntry, MentorEntry, PersonalEntry } from "../types"
import type { Category, EntryMap } from "../types"
import { fetchPersonalEntries, fetchMentorEntries, fetchClientEntries, addEntry, deleteEntry } from "../services/entries"

interface EntriesContextValue {
    personalEntries: PersonalEntry[]
    mentorEntries: MentorEntry[]
    clientEntries: ClientEntry[]
    totalHours: { personal: number; mentor: number; clients: number }
    loading: boolean
    error: Error | null
    /**
     * Toggle a date on or off for the given category.
     * Performs optimistic update, then POST or DELETE under the hood.
     */
    toggleDay: (category: Category, date: string) => Promise<void>

    // entry updates
    updateClientName: (clientId: string, clientName: string) => void
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
        clients: entries.client.length,
    }

    // Set of entry dates that are pending 
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



    /*
    * A generic handler that manages the global "Saving..." / "Saved" status UI.
    * It takes the actual API call as a promise.
    */
    const handleUpdate = useCallback(async (apiCallPromise: Promise<any>) => {
        // 1. Clear any pending "All changes saved" message timer.
        if (statusTimerId) {
            clearTimeout(statusTimerId);
        }
        // 2. Immediately set the global status to "Saving...".
        setUpdatingServer(true);

        try {
            // 3. Await the API call promise that was passed in.
            const result = await apiCallPromise;

            // 4. On SUCCESS, set a timer to show the "saved" message after a delay.
            const newTimer = setTimeout(() => {
                setUpdatingServer(false);
            }, 1500); // 1.5 second delay
            setStatusTimerId(newTimer);

            return result; // Return the result for the specific function to use

        } catch (error) {
            // 5. On FAILURE, show an error message immediately.
            console.error("Handle Update Failed, Changes could not be saved")
            setError(new Error("Handle Update Failed, Changes could not be saved"))
            //setUpdatingServer("Error: Changes could not be saved.");
            // Re-throw the error so the calling function knows to perform a rollback.
            throw error;
        }
    }, [statusTimerId]); // Dependency for useCallback


    /**
     * Updates a client's name. Handles optimistic UI, server reconciliation, and rollback.
     */
    const updateClientName = useCallback(async (entryId: string, newName: string) => {
        const originalEntries = entries; // Snapshot for rollback

        // Optimistically update the UI for a snappy user experience
        setEntries(currentEntries => ({
            ...currentEntries,
            client: currentEntries.client.map(e =>
                e.id === entryId ? { ...e, clientName: newName } : e
            ),
        }));

        try {
            // Define the specific API call. This returns a promise.
            const apiCallPromise = fetch(`/api/students/studentId/entries/clients/${entryId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientName: newName }),
            }).then(res => {
                if (!res.ok) throw new Error("Server error");
                return res.json();
            });

            // Pass the promise to the generic handler and wait for the server's response.
            const savedEntry = await handleUpdate(apiCallPromise);

            // Reconcile state with the authoritative response from the server.
            setEntries(currentEntries => ({
                ...currentEntries,
                client: currentEntries.client.map(e =>
                    e.id === entryId ? savedEntry : e
                ),
            }));

        } catch (error) {
            // If handleUpdate (or the fetch) threw an error, roll back the UI.
            console.error("Failed to update client name:", error);
            setEntries(originalEntries);
        }
    }, [entries, handleUpdate]);


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
                updateClientName
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