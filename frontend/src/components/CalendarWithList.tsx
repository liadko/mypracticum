
import { useState, useMemo, useEffect } from 'react'
import Calendar from './Calendar/Calendar'
import { format, parseISO } from 'date-fns'
import type { Contact, Entry } from '../types'
import { ContactDropdown } from './ContactDropdown'
import './CalendarWithList.css'
import { he } from 'date-fns/locale'

const hebrewWeekdays = [
    'ראשון', 'שני', 'שלישי',
    'רביעי', 'חמישי', 'שישי', 'שבת',
];

export interface CalendarWithListProps {
    contacts: Contact[]             // all contacts of this category
    entries: Entry[]                    // all entries of this category

    hoursNeeded: number
    titleText: string // text displayed before the nameDropdown

    onEntryToggle: (contactId: string, date: string) => void
    renderExtra: (entry: Entry) => React.ReactNode
}

export function CalendarWithList({
    contacts,
    entries,
    hoursNeeded,
    titleText,
    onEntryToggle,
    renderExtra,
}: CalendarWithListProps) {
    // selected contact UUID
    const [selectedContactId, setSelectedContactId] = useState<string>(
        () => contacts[0]?.id ?? ''
        //() => ''
    )
    // highlighted date for scrolling/focus
    const [highlightedDate, setHighlightedDate] = useState<string>('')

    // filter entries for the current contact
    const filtered = useMemo(
        () => entries.filter(e => e.contactId === selectedContactId),
        [entries, selectedContactId]
    )

    // when you click the calendar:
    function handleDayClick(date: string) {
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
                <div className='calendar'>
                    <h2 className="side-header">
                        בחר תאריכים
                    </h2>
                    <Calendar
                        entries={filtered}
                        highlightedDate={highlightedDate ?? undefined}
                        handleDayToggle={handleDayClick}
                    />
                </div>
            </div>
            <div className="list-side">
                <div className="selected-list">
                    <div className="side-header">
                        {/* <span className="selected-list-counter">{filtered.length}/{hoursNeeded}</span> */}
                        <span className='selected-list-header-text'>{titleText}</span>
                        <ContactDropdown
                            contacts={contacts}
                            value={selectedContactId}
                            onChange={setSelectedContactId}
                        />

                    </div>
                    <div className="selected-list-entries">
                        {/*selectedContactId != '' && entries.length === 0 && <div style={{ textAlign: "right" }}>נא לסמן תאריכים בלוח השנה</div>*/}
                        {filtered.map(entry => {
                            const dateObj = parseISO(entry.date)
                            const weekdayName = hebrewWeekdays[dateObj.getDay()]

                            return (
                                <div
                                    key={entry.id}
                                    id={`entry-${entry.id}`}
                                    className={`selected-item ${entry.date == highlightedDate ? 'highlighted-item' : ''}`}
                                    onClick={() => setHighlightedDate(entry.date)}
                                >
                                    {/*renderExtra && <span className="extra">{renderExtra(entry)}</span>*/}

                                    <span className="date">{format(dateObj, "dd/MM/yyyy")}</span>
                                    <span className="weekday">{weekdayName}</span>
                                </div>
                            )
                        })}

                    </div>
                </div>
            </div>
        </div>);

}
