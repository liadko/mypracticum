
import { useState, useMemo, useEffect, type ReactNode } from 'react'
import Calendar from './Calendar/Calendar'
import { format, parseISO } from 'date-fns'
import type { Contact, ContactType, Entry } from '../types'
import './CalendarWithList.css'
import { EditContactsModal } from './Contacts/EditContactsModal'
import { pageHeaderText } from '../i18n/he'
import { ContactDropdown } from './Contacts/ContactDropdown'
import { useContacts } from '../context/ContactsContext'

const hebrewWeekdays = [
"יום א'",
"יום ב'",
"יום ג'",
"יום ד'",
"יום ה'",
"יום ו'",
"שבת",
];

export interface CalendarWithListProps {
    contacts: Contact[]             // all contacts of this category
    entries: Entry[]                    // all entries of this category

    contactType: ContactType

    onEntryToggle: (contactId: string, date: string) => void
    renderEntryExtra?: (entry: Entry) => React.ReactNode
    renderMessage?: (contactId: string) => React.ReactNode
}

export function CalendarWithList({
    contacts,
    entries,
    contactType,
    onEntryToggle,
    renderEntryExtra,
    renderMessage
}: CalendarWithListProps) {
    // selected contact UUID
    const { setSelected, getSelected } = useContacts()
    const [isEditOpen, setEditOpen] = useState(false)

    const selectedContactId = getSelected(contactType)

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


    function entryDOMKey(entry: Entry) {
        return `entry-${entry.contactId}-${entry.date}`
    }

    // scroll into view after any change
    useEffect(() => {
        if (!highlightedDate) return
        const entry = filtered.find(e => e.date === highlightedDate)
        if (!entry) return
        const el = document.getElementById(entryDOMKey(entry))
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, [filtered, highlightedDate])


    // intercept the “edit” item
    function handleContactChange(id: string) {
        if (id === '__edit__') {
            setEditOpen(true)
        } else {
            setSelected(contactType, id)
        }
    }

    function extraMessage(): ReactNode {
        let message = "סמנו תאריכים בלוח השנה"
        if (selectedContactId == '') message = "הוסיפו אנשי קשר"


        return (
            <div dir='rtl'>
                <div className='extra-message'>
                    {
                        filtered.length == 0 ? message
                            : (renderMessage && renderMessage(selectedContactId))
                    }
                </div>
            </div>
        )

    }

    return (
        <div className="calendar-with-list">
            <div className="calender-side">
                <div className='calendar' dir='rtl'>
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
                <div className="selected-list" >
                    <div className="side-header">
                        <span className='selected-list-header-text'>{pageHeaderText[contactType]}</span>
                        <ContactDropdown
                            contacts={contacts}
                            value={selectedContactId}
                            onChange={handleContactChange}

                            contactType={contactType}
                        />

                    </div>
                    <div className="selected-list-entries">
                        {/* {selectedContactId == '' &&
                            <div>נא לסמן תאריכים בלוח השנה</div>}
                        {selectedContactId != '' && filtered.length === 0 &&
                            <div className="extra-message" dir='rtl'>נא לסמן תאריכים בלוח השנה</div>} */}
                        {filtered.map(entry => {
                            const dateObj = parseISO(entry.date)
                            const weekdayName = hebrewWeekdays[dateObj.getDay()]

                            return (
                                <div
                                    key={entryDOMKey(entry)}
                                    id={entryDOMKey(entry)}
                                    className={`selected-item ${entry.date == highlightedDate ? 'highlighted-item' : ''}`}
                                    onClick={() => setHighlightedDate(entry.date)}
                                >
                                    {renderEntryExtra && renderEntryExtra(entry)}

                                    <span className="date" >{format(dateObj, "dd/MM/yyyy")}</span>
                                    <span className="weekday" dir='rtl'>{weekdayName}</span>
                                </div>
                            )
                        })}

                    </div>
                    {extraMessage()}
                </div>
            </div>
            {/* render the modal when “edit” clicked */}
            {isEditOpen && (
                <EditContactsModal
                    initialType={contactType}
                    onClose={() => setEditOpen(false)}
                />
            )}

        </div>);

}
