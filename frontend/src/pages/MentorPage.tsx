// src/pages/MentorPage.tsx
import { useState } from "react";
import Calendar from "../components/Calendar/Calendar";
import type {  MentorEntry, Mentor } from "../types";
import { format } from "date-fns"


const allMentors: Mentor[] = [
    { name: "Dr. Levin", email: "levin@example.com", specialty: "clinical" },
    { name: "Dr. Katz", email: "katz@example.com", specialty: "dynamic" },
];

export default function MentorPage() {
    const [entries, setEntries] = useState<MentorEntry[]>([]);


    function handleDayToggle(day: Date) {
        const iso = format(day, 'yyyy-MM-dd');
        const exists = entries.find((e) => e.date === iso);

        if (exists) {
            // Remove that existing MentorEntry
            setEntries((prev) => prev.filter((e) => e.date !== iso));
        } else {
            // Add a new MentorEntry, defaulting mentor to null
            const newEntry: MentorEntry = {
                id: `${iso}-${Date.now()}`,
                date: iso,
                mentor: null,
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
                    <p className="selected-list-title">שעות הדרכה</p>
                </div>
                <div className="selected-list-items">
                    {entries.length === 0 && <p>No dates selected.</p>}
                    {entries.map((e) => (
                        <div key={e.id} className="selected-item">
                            <span className="date">{e.date}</span>
                            <span className="hours">1h</span>
                            <span className="extra">{e.mentor?.name ?? "(no mentor)"}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
