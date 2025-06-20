
import { useState, useMemo, useEffect } from 'react'
import Calendar from './Calendar/Calendar'
import { format, parseISO } from 'date-fns'
import type { BaseEntry, Contact } from '../types'
import { ContactDropdown } from './ContactDropdown'

export interface CalendarWithListProps<T extends BaseEntry> {
    contacts: Contact[]             // all contacts of this category
    entries: T[]                    // all entries of this category

    hoursNeeded: number
    titleText: string // text displayed before the nameDropdown

    onEntryToggle: (contactId: string, date: string) => void
    renderExtra: (entry: T) => React.ReactNode
}

export function CalendarWithList<T extends BaseEntry>({
    contacts,
    entries,
    hoursNeeded,
    titleText,
    onEntryToggle,
    renderExtra,
}: CalendarWithListProps<T>) {
    // selected contact UUID
    const [selectedContactId, setSelectedContactId] = useState<string>(
        () => contacts[0]?.id ?? ''
    )
    // highlighted date for scrolling/focus
    const [highlightedDate, setHighlightedDate] = useState<string>('')

    // filter entries for the current contact
    const filtered = useMemo(
        () => entries.filter(e => e.contactId === selectedContactId),
        [entries, selectedContactId]
    )
    // hours tally
    const hoursCount = useMemo(
        () => filtered.length,
        [filtered]
    )
    // when you click the calendar:
    function handleDay(date: string) {
        onEntryToggle(selectedContactId, date)
        setHighlightedDate(date)
    }

    // scroll into view after any change
    useEffect(() => {
        if (!highlightedDate) return
        const el = document.getElementById(
            `entry-${filtered.find(e => e.date === highlightedDate)?.id}`
        )
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, [filtered, highlightedDate])


    return (
        <div className="calendar-with-list">
            <div className="calender-side">
                <h2 style={{ textAlign: 'center' }}>
                    בחר תאריכים
                </h2>
                <Calendar
                    entries={entries}
                    highlightedDate={highlightedDate ?? undefined}
                    // Calendar gives you a Date object; convert to "YYYY-MM-DD"
                    handleDayToggle={(day) =>
                        handleDay(format(day, "yyyy-MM-dd"))
                    }
                />
            </div>
            <div className="list-side">
                <div className="selected-list">
                    <div className="selected-list-header">
                        <span className="selected-list-counter">{entries.length}/{hoursNeeded}</span>
                        <div className="selected-list-title">
                            <ContactDropdown
                                contacts={contacts}
                                value={selectedContactId}
                                onChange={setSelectedContactId}
                            />
                            <span className='selected-list-title-text'>{titleText}</span>

                        </div>
                    </div>
                    <div className="selected-list-entries">
                        {entries.length === 0 && <div style={{ textAlign: "right" }}>נא לסמן תאריכים בלוח השנה</div>}
                        {entries.map((entry) => (
                            <div
                                key={entry.id}
                                id={`entry-${entry.id}`}
                                className={`selected-item ${entry.date == highlightedDate ? 'highlighted-item' : ''}`}
                                onClick={() => setHighlightedDate(entry.date)}
                            >
                                ({renderExtra && <span className="extra">{renderExtra(entry)}</span>})

                                <span className="date">{format(parseISO(entry.date), "dd/MM/yyyy")}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>);

}
