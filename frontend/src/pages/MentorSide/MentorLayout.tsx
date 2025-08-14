import { useState, useMemo } from 'react'
import StudentListPanel from '../../components/MentorComponents/StudentListPanel'
import EntryListPanel from '../../components/MentorComponents/EntryListPanel'
import { useMentorData } from '../../context/MentorDataContext'

export default function MentorLayout() {
  
  
  const { students, entries } = useMentorData()
  //const students : Student[] = []
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    students[0]?.id ?? null
  )

  const filteredEntries = useMemo(
    () => entries.filter(e => e.studentId === selectedStudentId),
    [entries, selectedStudentId]
  )

  const pendingCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    entries.forEach(e => {
      if (e.status === 'pending') {
        counts[e.studentId] = (counts[e.studentId] || 0) + 1
      }
    })
    return counts
  }, [entries])

  return (
    <div className="calendar-with-list">
      <div className="calender-side">
        <StudentListPanel
          students={students}
          selectedStudentId={selectedStudentId}
          onSelect={setSelectedStudentId}
          pendingCounts={pendingCounts}
        />
      </div>

      <div className="list-side">
        {selectedStudentId ? (
          <EntryListPanel
            entries={filteredEntries}
            onApprove={id => console.log('approve', id)}
            onDecline={id => console.log('decline', id)}
          />
        ) : (
          <div style={{ padding: '1rem' }}>בחר תלמיד להצגת המפגשים</div>
        )}
      </div>
    </div>
  )
}