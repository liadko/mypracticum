import type { Student } from '../../types'
import './StudentListPanel.css'

interface Props {
  students: Student[]
  selectedStudentId: string | null
  onSelect: (id: string) => void
  pendingCounts: Record<string, number>
}

export default function StudentListPanel({
  students,
  selectedStudentId,
  onSelect,
  pendingCounts,
}: Props) {
  return (
    <div className="selected-list">
      <div className="side-header">
        <span className="selected-list-header-text">שם התלמיד</span>
      </div>
      <div className="selected-list-entries">
        {students.map(s => (
          <div
            key={s.id}
            className={`selected-item ${selectedStudentId === s.id ? 'highlighted-item' : ''}`}
            onClick={() => onSelect(s.id)}
          >
            <span className="student-name">{s.name}</span>
            {pendingCounts[s.id] > 0 && (
              <span className="pending-badge">{pendingCounts[s.id]}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
