// src/pages/PersonalPage.tsx
import { useState } from "react";
import Calendar from "../components/Calendar/Calendar";
import type { BaseEntry, PersonalEntry, ExternalTherapist } from "../types";

const allTherapists: ExternalTherapist[] = [
    { name: "Dr. Adler" },
    { name: "Dr. Rosen" },
];

export default function PersonalPage() {
    // Only holds PersonalEntry[]; no need for a pageSetterMap here.
    const [entries, setEntries] = useState<PersonalEntry[]>([]);

    // When Calendar gives us a BaseEntry[], we merge it into PersonalEntry[].
    const handleDatesChange = (newBases: BaseEntry[]) => {
        const merged: PersonalEntry[] = newBases.map((b) => {
            const existing = entries.find((e) => e.date === b.date);
            return existing
                ? existing
                : { id: b.id, date: b.date, hoursSpent: 1, externalTherapist: null };
        });
        setEntries(merged);
    };

    return (
        <>
            {/* LEFT: Calendar */}
            < div className="date-picker" >
                <Calendar
                    selectedDates={entries}
                    onSelectedDatesChange={handleDatesChange}
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
