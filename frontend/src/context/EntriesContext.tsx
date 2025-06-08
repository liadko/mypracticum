import React, { createContext, useContext, useEffect, useState } from "react";
import type {
    Category,
    PersonalEntry,
    MentorEntry,
    ClientEntry,
    EntryMap,
} from "../types";
import {
    fetchAllEntries,
    addPersonalEntry,
    deletePersonalEntry,
    // …mentor / client variants
} from "../services/entries";

interface EntriesContextValue {
    personalEntries: PersonalEntry[];
    mentorEntries: MentorEntry[];
    clientEntries: ClientEntry[];
    totalHours: { personal: number; mentor: number; clients: number };
    loading: boolean;
    error: Error | null;
    togglePersonalDay: (date: string) => Promise<void>;
    toggleMentorDay: (date: string) => Promise<void>;
    toggleClientDay: (date: string) => Promise<void>;
}

const EntriesContext = createContext<EntriesContextValue | null>(null);

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
        clients: [],
    })

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Compute totalHours on the fly (e.g. entries.length * 1h each)
    const totalHours = {
        personal: entries["personal"].length,
        mentor: entries["mentor"].length,
        clients: entries["clients"].length,
    };

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        fetchAllEntries(studentId)
            .then(({ personal, mentor, clients }) => {
                if (!isMounted) return;
                setPersonalEntries(personal);
                setMentorEntries(mentor);
                setClientEntries(clients);
            })
            .catch((err) => {
                console.error("Failed to load entries:", err);
                //if (isMounted) setError(err);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });
        return () => {
            isMounted = false;
        };
    }, [studentId]);

    /** 
     * Toggle logic: if an entry with that date exists, delete it; otherwise add it. 
     * We assume the backend resolves conflicts (e.g. “double-click” spamming).
     */

    async function toggleDay(
        studentId: string,
        category: Category,
        date: string
    ) {
        const list = entries[category]
        const existing = list.find(e => e.date === date)

        if (existing) {
            // remove
            setEntries(prev => ({
                ...prev,
                [category]: prev[category].filter(e => e.id !== existing.id)
            }))
            try { await deleteEntry(studentId, category, existing.id) }
            catch { /* rollback if you want */ }
        } else {
            // add
            const tempId = "temp-" + Math.random().toString(36).slice(2)
            const tempEntry: BaseEntry = { id: tempId, date }
            setEntries(prev => ({
                ...prev,
                [category]: [...prev[category], tempEntry]
            }))
            try {
                const saved = await addEntry(studentId, category, date)
                setEntries(prev => ({
                    ...prev,
                    [category]: prev[category].map(e => e.id === tempId ? saved : e)
                }))
            } catch {
                setEntries(prev => ({
                    ...prev,
                    [category]: prev[category].filter(e => e.id !== tempId)
                }))
            }
        }
    }

    async function togglePersonalDay(date: string) {
        // See if it already exists locally
        const existing = personalEntries.find((e) => e.date === date);
        if (existing) {
            // Optimistic removal: update state immediately, then call API
            setPersonalEntries((prev) => prev.filter((e) => e.id !== existing.id));
            try {
                await deletePersonalEntry(studentId, existing.id);
            } catch (err) {
                // If deletion fails, roll back
                console.error("Failed to delete entry:", err);
                setPersonalEntries((prev) => [...prev, existing]);
            }
        } else {
            // Create a “temporary placeholder” so calendar updates instantly.
            // You could generate a `tempId = "temp-" + Math.random().toString(36).slice(2)`
            // and then replace it after POST returns the real ID.
            const tempId = "temp-" + Math.random().toString(32).slice(2);
            const newEntry: PersonalEntry = { id: tempId, date, externalTherapist: null };
            setPersonalEntries((prev) => [...prev, newEntry]);

            try {
                const saved = await addPersonalEntry(studentId, date);
                // Replace the temp entry with the real one
                setPersonalEntries((prev) =>
                    prev.map((e) => (e.id === tempId ? saved : e))
                );
            } catch (err) {
                console.error("Failed to add personal entry:", err);
                // Roll back: remove the “temp” entry
                setPersonalEntries((prev) => prev.filter((e) => e.id !== tempId));
            }
        }
    }

    async function toggleMentorDay(date: string) {
        const existing = mentorEntries.find((e) => e.date === date);
        if (existing) {
            setMentorEntries((prev) => prev.filter((e) => e.id !== existing.id));
            try {
                await deleteMentorEntry(studentId, existing.id);
            } catch (err) {
                console.error("Failed to delete mentor entry:", err);
                setMentorEntries((prev) => [...prev, existing]);
            }
        } else {
            const tempId = "temp-" + Math.random().toString(32).slice(2);
            const newEntry: MentorEntry = { id: tempId, date, mentor: null };
            setMentorEntries((prev) => [...prev, newEntry]);

            try {
                const saved = await addMentorEntry(studentId, date);
                setMentorEntries((prev) =>
                    prev.map((e) => (e.id === tempId ? saved : e))
                );
            } catch (err) {
                console.error("Failed to add mentor entry:", err);
                setMentorEntries((prev) => prev.filter((e) => e.id !== tempId));
            }
        }
    }

    async function toggleClientDay(date: string) {
        const existing = clientEntries.find((e) => e.date === date);
        if (existing) {
            setClientEntries((prev) => prev.filter((e) => e.id !== existing.id));
            try {
                await deleteClientEntry(studentId, existing.id);
            } catch (err) {
                console.error("Failed to delete client entry:", err);
                setClientEntries((prev) => [...prev, existing]);
            }
        } else {
            const tempId = "temp-" + Math.random().toString(32).slice(2);
            const newEntry: ClientEntry = { id: tempId, date, clientName: "" };
            setClientEntries((prev) => [...prev, newEntry]);

            try {
                const saved = await addClientEntry(studentId, date);
                setClientEntries((prev) =>
                    prev.map((e) => (e.id === tempId ? saved : e))
                );
            } catch (err) {
                console.error("Failed to add client entry:", err);
                setClientEntries((prev) => prev.filter((e) => e.id !== tempId));
            }
        }
    }

    return (
        <EntriesContext.Provider
            value={{
                personalEntries: entries["personal"],
                mentorEntries: entries["mentor"],
                clientEntries: entries["client"],
                totalHours,
                loading,
                error,
                togglePersonalDay,
                toggleMentorDay,
                toggleClientDay,
            }}
        >
            {children}
        </EntriesContext.Provider>
    );
}

export function useEntries() {
    const ctx = useContext(EntriesContext);
    if (!ctx) throw new Error("useEntries must be inside EntriesProvider");
    return ctx;
}
