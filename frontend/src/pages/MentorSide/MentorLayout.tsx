import { useMemo, useState, useCallback } from 'react'
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
  const { entries } = useEntries()
  const { contacts } = useContacts();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => contacts[0]?.id ?? '')

  const filtered = useMemo(
    () => entries.filter(e => e.userId === selectedStudentId),
    [entries, selectedStudentId]
  )

  const selectedStudentName = useMemo(
    () => contacts.find(s => s.id === selectedStudentId)?.name ?? '',
    [contacts, selectedStudentId]
  )

  // toggle handler (wire to your context/api when ready)
  const onToggleApprove = useCallback((entryId: string, isApproved: boolean) => {
    // if (!isApproved) approveEntry(entryId); else revokeApproval(entryId);
    console.log('toggle approve', { entryId, nextApproved: !isApproved })
  }, [])

  function handleContactChange(id: string) {
    if (id === '__edit__') {
      // you can open a students edit modal here if you want
      return
    }
    setSelectedStudentId(id)
  }

  return (
    <div className="calendar-with-list">
      {/* LEFT SIDE (info) */}
      <div className="calender-side">
        <div className="mentor-left">
          <button className="nav-button settings" aria-label="הגדרות"> הגדרות ⚙️</button>
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
      <div className="list-side">
        <div className="selected-list">
          <div className="side-header">
            <span className="selected-list-header-text">
              {selectedStudentName
                ? `שעות הדרכה עם ${selectedStudentName}`
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
              const isApproved = entry.approvalStatus === 'approved'

              return (
                <div key={entry.id} className="selected-item">
                  {/* left side: approve pill */}
                  <button
                    className={
                      'approve-pill' + (isApproved ? ' approve-pill--active' : '')
                    }
                    onClick={() => onToggleApprove(entry.id, isApproved)}
                    aria-pressed={isApproved}
                  >
                    מאושר
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
  )
}
