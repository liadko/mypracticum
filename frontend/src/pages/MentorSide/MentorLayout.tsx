import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'
import '../../components/CalendarWithList.css'
import './MentorLayout.css'

import { ContactDropdown } from '../../components/Contacts/ContactDropdown'
import { useEntries } from '../../context/EntriesContext'
import { useContacts } from '../../context/ContactsContext'

const hebrewWeekdays = [
  'ראשון', 'שני', 'שלישי',
  'רביעי', 'חמישי', 'שישי', 'שבת',
];

export default function MentorLayout() {
  const { entries, toggleApproved } = useEntries()
  const { contacts } = useContacts();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => contacts[0]?.id ?? '')

  const filtered = useMemo(
    () => entries.filter(e => e.userId === selectedStudentId),
    [entries, selectedStudentId]
  )


  function handleContactChange(id: string) {
    setSelectedStudentId(id)
  }

  return (
    <div className='mentor-layout-theme'>
      <div className='fake-nav-bar'/>
      <div className="calendar-with-list">
        {/* LEFT SIDE (info) */}
        <div className="calender-side">
          <div className="mentor-left">
            <div className="side-header mentor-left__header">
              <span className="mentor-left__title">סטטוס אישור מפגשי התלמידים</span>
            </div>

            <div className="mentor-left__body" dir="rtl">
              <p>
                כאן מופיעים המפגשים שהתלמידים רשמו ביומן שלהם.
                עליכם לעבור על הרשימה, ולאשר את המפגשים שהתקיימו בפועל.
              </p>
              <p>
                האישור שאתם נותנים מתעדכנים אוטומטית אצל התלמיד וגם אצל צוות תמורות,
                ולכן חשוב לעבור על כל המפגשים ולוודא שהסטטוס תואם למציאות.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE (list) */}
        <div className="list-side bigger">
          <div className="selected-list bigger">
            <div className="side-header">
              <span className="selected-list-header-text">
                {selectedStudentId
                  ? `שעות הדרכה עם`
                  : 'בחר תלמיד'}
              </span>

              <ContactDropdown
                contacts={contacts}
                value={selectedStudentId}
                onChange={handleContactChange}
                contactType="student"
              />
            </div>

            <div className="selected-list-entries">
              {selectedStudentId === '' && (
                <div style={{ padding: '0.75rem', textAlign: 'right' }}>
                  בחר תלמיד להצגת המפגשים
                </div>
              )}

              {filtered.map(entry => {
                const dateObj = parseISO(entry.date) // entry.date: "YYYY-MM-DD"
                const weekdayName = hebrewWeekdays[dateObj.getDay()]
                const text =  entry.approved ? "מאושר" : "לאשר"

                return (
                  <div key={entry.id} className="selected-item">
                    {/* left side: approve pill */}
                    <button
                      className={
                        'approve-pill' + (entry.approved ? ' approve-pill--active' : '')
                      }
                      onClick={() => toggleApproved(entry.id)}
                      aria-pressed={entry.approved}
                    >
                      {text}
                    </button>

                    {/* middle: date */}
                    <span className="date">{format(dateObj, 'dd/MM/yyyy', { locale: he })}</span>

                    {/* right: weekday */}
                    <span className="weekday">{weekdayName}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
