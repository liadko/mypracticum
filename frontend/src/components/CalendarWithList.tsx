import { useState, useEffect } from "react";
import Calendar from "./Calendar/Calendar"; // your MUI wrapper
import type { BaseEntry } from "../types";
import { format, parseISO } from 'date-fns'

export interface CalendarWithListProps<T extends BaseEntry> {
    title: string;
    entries: T[];
    hoursNeeded: number;
    onDayToggle: (date: string) => void;
    renderExtra: (item: T) => React.ReactNode;
    renderItemActions?: (item: T) => React.ReactNode;
}

export function CalendarWithList<T extends BaseEntry>({
    title,
    entries,
    hoursNeeded,
    onDayToggle,
    renderExtra,
    renderItemActions,
}: CalendarWithListProps<T>) {
    // track the most‐recent calendar click
    const [lastToggledDate, setLastToggledDate] = useState<string | null>(null);

    // wrapper that both notifies parent and records the date
    function handleDayToggle(date: string) {
        onDayToggle(date);
        setLastToggledDate(date);
    }

    // after entries change, if the last toggled date still exists,
    // scroll that entry into view
    useEffect(() => {
        if (!lastToggledDate) return;
        const entry = entries.find((e) => e.date === lastToggledDate);
        if (entry) {
            document
                .getElementById(`entry-${entry.id}`)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [entries, lastToggledDate]);

    return (
        <div className="calendar-with-list">
            <div className="date-picker">
                <Calendar
                    selectedDates={entries}
                    // Calendar gives you a Date object; convert to "YYYY-MM-DD"
                    handleDayToggle={(day) =>
                        handleDayToggle(format(day, "yyyy-MM-dd"))
                    }
                />
            </div>
            <div className="selected-list">
                <div className="selected-list-header">
                    <span className="selected-list-counter">{entries.length}/{hoursNeeded}</span>
                    <span className="selected-list-title">{title}</span>
                </div>
                <div className="selected-list-entries">
                    {entries.length === 0 && <div style={{ textAlign: "right" }}>נא לסמן תאריכים בלוח השנה</div>}
                    {entries.map((item) => (
                        <div
                            key={item.id}
                            id={`entry-${item.id}`}
                            className="selected-item"
                        >
                            <span className="extra">{renderExtra(item)}</span>
                            {renderItemActions && (
                                <span className="actions">{renderItemActions(item)}</span>
                            )}
                            <span className="date">{format(parseISO(item.date), "dd/MM/yyyy")}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>);

}
