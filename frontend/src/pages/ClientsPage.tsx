// src/pages/ClientsPage.tsx
import { useState } from "react";
import Calendar from "../components/Calendar/Calendar";
import type { BaseEntry, ClientEntry } from "../types";

export default function ClientsPage() {
    const [entries, setEntries] = useState<ClientEntry[]>([]);

    const handleDatesChange = (newBases: BaseEntry[]) => {
        const merged: ClientEntry[] = newBases.map((b) => {
            const existing = entries.find((e) => e.date === b.date);
            return existing
                ? existing
                : { id: b.id, date: b.date, hoursSpent: 1, clientName: "" };
        });
        setEntries(merged);
    };

    return (
        <>
            {/* LEFT: Calendar */}
            <div className="date-picker">
                <Calendar
                    selectedDates={entries}
                    onSelectedDatesChange={handleDatesChange}
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
