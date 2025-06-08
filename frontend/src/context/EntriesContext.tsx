import { createContext, useState, useEffect, useCallback, useContext } from "react";
import type { BaseEntry, ClientEntry, MentorEntry, PersonalEntry } from "../types";
import type { Category, EntryMap } from "../types";
import { fetchPersonalEntries, fetchMentorEntries, fetchClientEntries } from "../services/entries";

interface EntriesContextValue {
    personalEntries: PersonalEntry[];
    mentorEntries: MentorEntry[];
    clientEntries: ClientEntry[];
    totalHours: { personal: number; mentor: number; clients: number };
    loading: boolean;
    error: Error | null;
    /**
     * Toggle a date on or off for the given category.
     * Performs optimistic update, then POST or DELETE under the hood.
     */
    toggleDay: (category: Category, date: string) => Promise<void>;
}

export const EntriesContext = createContext<EntriesContextValue | null>(null);

export function EntriesProvider({
    studentId,
    children,
}: {
    studentId: string;
    children: React.ReactNode;
}) {
    const [entries, setEntries] = useState<EntryMap>({
        personal: [],
        mentor: [],
        client: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const totalHours = {
        personal: entries.personal.length,
        mentor: entries.mentor.length,
        clients: entries.client.length,
    };

    // Set of dates that are pending 
    const [pending, setPending] = useState<Set<string>>(new Set());


    // Initial load of all three categories
    useEffect(() => {
        setLoading(false);
        return;
        let isMounted = true;
        setLoading(true);
        Promise.all([
            fetchPersonalEntries(studentId),
            fetchMentorEntries(studentId),
            fetchClientEntries(studentId),
        ])
            .then(([personal, mentor, client]) => {
                if (!isMounted) return;
                setEntries({ personal, mentor, client });
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error("Failed to load entries:", err);
                setError(err);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });
        return () => {
            isMounted = false;
        };
    }, [studentId]);

    // helper func
    function insertEntrySorted<T extends BaseEntry>(list: T[], entry: T): T[] {
        const idx = list.findIndex((e) => e.date < entry.date);
        if (idx === -1) return [...list, entry];
        return [...list.slice(0, idx), entry, ...list.slice(idx)];
    }



    const handleRemove = useCallback(
        async (category: Category, date: string) => {
            // 1) Find the entry object (so we can re-insert it if needed)
            const entry = entries[category].find((e) => e.date === date);
            if (!entry) return;

            // 2) Optimistically remove it
            setEntries((prev) => ({
                ...prev,
                [category]: prev[category].filter((e) => e.id !== entry.id),
            }));

            
            // // 3) Attempt server DELETE
            // try {
            //     const resp = await fetch(
            //         `/api/students/${studentId}/entries/${category}/${entry.id}`,
            //         { method: "DELETE" }
            //     );
            //     if (!resp.ok) {
            //         throw new Error(`Delete failed (${resp.status})`);
            //     }
            // } catch (err) {
            //     console.error("handleRemove error:", err);

            //     // 4) Roll back *only* that one entry, in date order
            //     setEntries((prev) => ({
            //         ...prev,
            //         [category]: insertEntrySorted(prev[category], entry),
            //     }));
            //     setError(err as Error);
            // }
        },
        [entries, studentId]
    );

    const handleAdd = useCallback(
        async (category: Category, date: string) => {
            // 1) Create a temporary entry ID
            const tempId = "temp-" + Math.random().toString(36).slice(2);

            // 2) Optimistically insert it in sorted order
            setEntries((prev) => ({
                ...prev,
                [category]: insertEntrySorted(prev[category], { id: tempId, date } as BaseEntry),
            }));


            // // 3) Send to server
            // try {
            //     const resp = await fetch(
            //         `/api/students/${studentId}/entries/${category}`,
            //         {
            //             method: "POST",
            //             headers: { "Content-Type": "application/json" },
            //             body: JSON.stringify({ date }),
            //         }
            //     );
            //     if (!resp.ok) {
            //         throw new Error(`Add failed (${resp.status})`);
            //     }

            //     // 4) Replace temp entry with the real one returned
            //     const realEntry = (await resp.json()) as BaseEntry;
            //     setEntries((prev) => ({
            //         ...prev,
            //         [category]: prev[category].map((e) =>
            //             e.id === tempId ? realEntry : e
            //         ),
            //     }));
            // } catch (err) {
            //     console.error("handleAdd error:", err);

            //     // 5) Roll back: remove only the temp entry
            //     setEntries((prev) => ({
            //         ...prev,
            //         [category]: prev[category].filter((e) => e.id !== tempId),
            //     }));
            //     setError(err as Error);
            // }
        },
        [studentId]
    );

    const toggleDay = useCallback(
        async function toggleDay(category: Category, date: string) {
            // If a toggle is already in flight for this date, skip it:
            if (pending.has(date)) return;
            setPending(prev => new Set(prev).add(date));

            const existing = entries[category].find(e => e.date === date);
            if (existing) {
                await handleRemove(category, date);
            } else {
                await handleAdd(category, date);
            }

            // clear the lock
            setPending(prev => {
                const next = new Set(prev);
                next.delete(date);
                return next;
            });
        },
        [entries, handleRemove, handleAdd, pending]
    );

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
            } as EntriesContextValue}
        >
            {children}
        </EntriesContext.Provider>
    );
}

export function useEntries(): EntriesContextValue {
    const ctx = useContext(EntriesContext);
    if (!ctx) {
        throw new Error("useEntries must be used within an EntriesProvider");
    }
    return ctx;
}
