// src/pages/PersonalPage.tsx
import { useState } from "react";
import Calendar from "../components/Calendar/Calendar";
import type { PersonalEntry, ExternalTherapist } from "../types";
import { format } from "date-fns"


const allTherapists: ExternalTherapist[] = [
    { name: "Dr. Adler" },
    { name: "Dr. Rosen" },
];

export default function PersonalPage() {
    const [entries, setEntries] = useState<PersonalEntry[]>([]);

    function handleDayToggle(day: Date) {
        const iso = format(day, 'yyyy-MM-dd');
        const exists = entries.find((e) => e.date === iso);

        if (exists) {
            // Remove that existing PersonalEntry
            setEntries((prev) => prev.filter((e) => e.date !== iso));
        } else {
            // Add a new PersonalEntry, defaulting externalTherapist to null
            const newEntry: PersonalEntry = {
                id: `${iso}-${Date.now()}`,
                date: iso,
                externalTherapist: null,
            };
            setEntries((prev) => [...prev, newEntry]);
        }
    }
    return (
        <>
            {/* LEFT: Calendar */}
            < div className="date-picker" >
                <Calendar
                    selectedDates={entries}
                    handleDayToggle={handleDayToggle}
                />
            </div >

            {/* RIGHT: Selected‐list */}
            < div className="selected-list" >
                <div className="selected-list-header">
                    <p className="selected-list-counter">{entries.length} / 100</p>
                    <p className="selected-list-title">שעות טיפול אישי</p>
                </div>
                <div className="selected-list-items">
                    {entries.length === 0 && <p>No dates selected.</p>}
                    {entries.map((e) => (
                        <div key={e.id} className="selected-item">
                            <span className="date">{e.date}</span>
                            <span className="hours">1h</span>
                            <span className="extra">
                                {e.externalTherapist?.name ?? "(no therapist)"}
                            </span>
                        </div>
                    ))}
                </div>
            </div >
        </>
    );
}
