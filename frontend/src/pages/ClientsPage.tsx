// src/pages/ClientsPage.tsx
import { useState } from "react";
import Calendar from "../components/Calendar/Calendar";
import type { ClientEntry } from "../types";
import { format } from "date-fns"

export default function ClientsPage() {
    const [entries, setEntries] = useState<ClientEntry[]>([]);

    function handleDayToggle(day: Date) {
        
        const iso = format(day, 'yyyy-MM-dd');
        const exists = entries.find((e) => e.date === iso);
        

        if (exists) {
            // Remove that existing ClientEntry
            setEntries((prev) => prev.filter((e) => e.date !== iso));
        } else {
            // Add a new ClientEntry, defaulting clientName to empty string
            const newEntry: ClientEntry = {
                id: `${iso}-${Date.now()}`,
                date: iso,
                clientName: "",
            };
            setEntries((prev) => [...prev, newEntry]);
        }
    }

    return (
        <>
            {/* LEFT: Calendar */}
            <div className="date-picker">
                <Calendar
                    selectedDates={entries}
                    handleDayToggle={handleDayToggle}
                />
            </div>

            {/* RIGHT: Selected‐list */}
            <div className="selected-list">
                <div className="selected-list-header">
                    <p className="selected-list-counter">{entries.length} / 100</p>
                    <p className="selected-list-title">שעות טיפול דינמי</p>
                </div>
                <div className="selected-list-items">
                    {entries.length === 0 && <p>No dates selected.</p>}
                    {entries.map((e) => (
                        <div key={e.id} className="selected-item">
                            <span className="extra">{e.clientName || "(no client)"}</span>
                            <span className="date">{e.date}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
