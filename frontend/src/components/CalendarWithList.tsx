
import { useState, useMemo, useEffect, type ReactNode } from 'react'
import Calendar from './Calendar/Calendar'
import { format, parseISO } from 'date-fns'
import type { Contact, Entry } from '../types'
import './CalendarWithList.css'
import { EditContactsModal } from './Contacts/EditContactsModal'
import { contactLabelSingularGenderless, pageHeaderText, pageTitleDefinite } from '../i18n/he'
import { ContactDropdown } from './Contacts/ContactDropdown'
import { useContacts } from '../context/ContactsContext'

const hebrewWeekdays = [
    "ראשון",
    "שני",
    "שלישי",
    "רביעי",
    "חמישי",
    "שישי",
    "שבת",
];

export interface CalendarWithListProps {
    contacts: Contact[]             // all contacts of this category
    entries: Entry[]                    // all entries of this category


    onEntryToggle: (contactId: string, date: string) => void
    renderEntryExtra?: (entry: Entry) => React.ReactNode
    renderMessage?: (contactId: string) => React.ReactNode
}

export function CalendarWithList({
    contacts,
    entries,
    onEntryToggle,
    renderEntryExtra,
    renderMessage
}: CalendarWithListProps) {
    // selected contact UUID
    const { setSelected, getSelected } = useContacts()
    const [isEditOpen, setEditOpen] = useState(false)

    const { activePage: contactType } = useContacts()

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
        const container = document.getElementById('selected-list-entries')

        if (el && container) {
            const elTop = el.offsetTop
            const elHeight = el.clientHeight
            const containerHeight = container.clientHeight

            container.scrollTo({
                top: elTop - containerHeight - elHeight,
                behavior: 'smooth',
            })
        }

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
        let message: ReactNode;

        // 1. מצא את איש הקשר הנבחר (בהנחה ש-'contacts' ו-'selectedContactId' זמינים בסקופ)
        const selectedContact = contacts.find(c => c.id === selectedContactId);
        const contactName = selectedContact?.name;

        // 2. הגדר את ההודעות
        const baseMessage = "סמנו תאריכים בלוח השנה משמאל עבור ";
        const endMessage = "סימון כל יום מוסיף שעה אחת. הימים שתבחרו יופיעו כאן כרשימה.";

        switch (contactType) {
            case 'client':
                message = (
                    <>
                        {baseMessage}שעות טיפול שעשיתם עם{' '}
                        <strong>{contactName ?? 'מטופל.ת'}</strong>. {endMessage}
                    </>
                );
                break;

            case 'mentor':
                message = (
                    <>
                        {baseMessage}שעות הדרכה שקיבלתם מ
                        <strong>{contactName ?? 'המדריך.ה'}</strong>. {endMessage}
                    </>
                );
                break;

            case 'therapist':
                message = (
                    <>
                        {baseMessage}שעות טיפול אישי שהיו לכם עם{' '}
                        <strong>{contactName ?? 'המטפל.ת'}</strong>. {endMessage}
                    </>
                );
                break;

            default:
                // מטפל במקרה ששום איש קשר לא נבחר, או סוג לא ידוע
                if (!selectedContactId) {
                    // (בהנחה ש-'contacts' זמין בסקופ)
                    if (contacts.length === 0) {
                        message = "הוסיפו אנשי קשר ברשימה מימין כדי להתחיל.";
                    } else {
                        message = "בחרו איש קשר מהרשימה מימין.";
                    }
                } else {
                    // נבחר איש קשר אבל אין לו סוג
                    message = "סמנו תאריכים בלוח השנה.";
                }
                break;
        }

        // 3. החזר את הרנדור (כמו בקוד המקורי שלך)
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

    function createFirstContactMessage(): ReactNode {
        let bodyText: ReactNode;

        switch (contactType) {
            case 'client':
                bodyText = (
                    <>
                        כאן תוכלו לסמן את השעות שצברתם עם המטופלים שלכם
                        ולעקוב אחרי ההתקדמות שלכם במהלך השנה.
                        <br />
                        כדי להתחיל, יש ליצור מטופל/ת פרטי/ת חדש/ה
                        כדי שנוכל לשייך אליו את השעות.
                    </>
                );
                break;

            case 'mentor':
                bodyText = (
                    <>
                        כאן תוכלו לסמן את השעות שצברתם עם המדריכים
                        המלווים אתכם במהלך השנה.
                        <br />
                        כדי להתחיל, יש ליצור מדריך/ה חדש/ה
                        כדי שנוכל לשייך אליו את השעות.
                    </>
                );
                break;

            case 'therapist':
                bodyText = (
                    <>
                        כאן תוכלו לסמן את השעות שצברתם במסגרת הטיפול האישי שלכם,
                        עם המטפל/ת שמלווה אתכם לאורך השנה.
                        <br />
                        כדי להתחיל, יש ליצור מטפל/ת אישי/ת חדש/ה
                        כדי שנוכל לשייך אליו את השעות.
                    </>
                );
                break;

        }

        return (
            <div className="first-contact-message" dir="rtl">
                <h2 className="first-contact-message__title">
                    ברוכים הבאים לאזור  {pageTitleDefinite[contactType]}
                </h2>
                <p className="first-contact-message__text">
                    {bodyText}
                </p>
                <button className="first-contact-message__button" onClick={() => setEditOpen(true)}>
                    צרו {contactLabelSingularGenderless[contactType]} חדש/ה
                </button>
            </div>
        );
    }

    function selectedList(): ReactNode {
        return <div className="selected-list" >
            <div className="side-header">
                <span className='selected-list-header-text'>{pageHeaderText[contactType]}</span>
                <ContactDropdown
                    contacts={contacts}
                    value={selectedContactId}
                    onChange={handleContactChange}

                    contactType={contactType}
                />

            </div>
            <div className="selected-list-entries" id="selected-list-entries">
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
    }

    function renderCalendar() {
        return <div className='calendar' dir='rtl'>

            <h2 className="side-header">
                בחר תאריכים
            </h2>

            <Calendar
                entries={filtered}
                highlightedDate={highlightedDate ?? undefined}
                handleDayToggle={handleDayClick}
                onHighlightedDateChange={(date) => setHighlightedDate(date || '')} />
        </div>
    }



    return (
        <div className="calendar-with-list">
            <div className="calender-side">
                {selectedContactId && renderCalendar()}
            </div>
            <div className="list-side">
                {
                    selectedContactId ?
                        selectedList() :
                        createFirstContactMessage()
                }
            </div>
            {/* render the modal when “edit” clicked */}
            {isEditOpen && (
                <EditContactsModal
                    initialType={contactType}
                    isInitialCreation={!selectedContactId}
                    onCloseModal={() => setEditOpen(false)}
                />
            )}

        </div>
    );
}
