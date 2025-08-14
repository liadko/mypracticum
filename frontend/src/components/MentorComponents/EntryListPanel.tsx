import { format, parseISO } from 'date-fns'
import './EntryListPanel.css'

const hebrewWeekdays = [
  'ראשון', 'שני', 'שלישי',
  'רביעי', 'חמישי', 'שישי', 'שבת',
]

interface Entry {
  id: string
  date: string // ISO string
  status: 'pending' | 'approved' | 'declined'
}

interface Props {
  entries: Entry[]
  onApprove: (id: string) => void
  onDecline: (id: string) => void
}

export default function EntryListPanel({ entries, onApprove, onDecline }: Props) {
  return (
    <div className="selected-list">
      <div className="side-header">
        <span className="selected-list-header-text">מפגשים</span>
      </div>
      <div className="selected-list-entries">
        {entries.map(entry => {
          const dateObj = parseISO(entry.date)
          const weekdayName = hebrewWeekdays[dateObj.getDay()]
          return (
            <div key={entry.id} className="selected-item entry-item">
              <span className="date">{format(dateObj, 'dd/MM/yyyy')}</span>
              <span className="weekday">{weekdayName}</span>

              <div className="approval-toggle">
                <button
                  className={`toggle-btn approve ${entry.status === 'approved' ? 'active' : ''}`}
                  onClick={() => onApprove(entry.id)}
                >
                  מאושר
                </button>
                <button
                  className={`toggle-btn decline ${entry.status === 'declined' ? 'active' : ''}`}
                  onClick={() => onDecline(entry.id)}
                >
                  נדחה
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
