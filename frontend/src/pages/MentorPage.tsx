// src/pages/MentorPage.tsx
import { useState } from "react";
import Calendar from "../components/Calendar/Calendar";
import type { BaseEntry, MentorEntry, Mentor } from "../types";

const allMentors: Mentor[] = [
    { name: "Dr. Levin", email: "levin@example.com", specialty: "clinical" },
    { name: "Dr. Katz", email: "katz@example.com", specialty: "dynamic" },
];

export default function MentorPage() {
    const [entries, setEntries] = useState<MentorEntry[]>([]);

    const handleDatesChange = (newBases: BaseEntry[]) => {
        const merged: MentorEntry[] = newBases.map((b) => {
            const existing = entries.find((e) => e.date === b.date);
            return existing
                ? existing
                : { id: b.id, date: b.date, hoursSpent: 1, mentor: null };
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
