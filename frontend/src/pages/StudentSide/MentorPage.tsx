import { useContacts } from '../../context/ContactsContext'
import { useEntries } from '../../context/EntriesContext'
import { CalendarWithList } from '../../components/CalendarWithList'
import { useMemo, useState } from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import type { Entry, MentorContact } from '../../types'
import MentorShareModal from '../../components/MentorShareModal/MentorShareModal'

const theme = createTheme({
  palette: { primary: { main: '#3A75C4' } } // blue
})

export default function MentorPage() {
  // pull all mentor‐type contacts & entries from context
  const { getContactsByType } = useContacts()
  const { entries } = useEntries()

  const [isShareOpen, setShareOpen] = useState(false)
  const [sharedContactId, setSharedContactId] = useState<string | null>(null)



  const contacts = useMemo(
    () => getContactsByType('mentor') as MentorContact[],
    [getContactsByType]
  )

  const mentorEntries = useMemo(
    () =>
      entries.filter(e =>
        contacts.some(c => c.id === e.contactId)
      ),
    [entries, contacts]
  )

  function renderEntryApproved(entry: Entry): React.ReactNode {
    let status = 'ממתין לאישור'
    if (entry.approved) status = 'מאושר'

    return <span className="extra" dir='rtl'>
      <span className={'status-dot' + (entry.approved ? ' approved' : '')} />
      {status}
    </span>
  }



  function openShare(contactId: string) {
    setSharedContactId(contactId)
    setShareOpen(true)
  }

  
  function renderShareMessage(contactId: string): React.ReactNode {
    const name = contacts.find(c => c.id === contactId)?.name ?? 'המדריך'
    return (
      <span>
        כדי לעדכן את {name} לגבי פגישות חדשות שממתינות לאישור{' '}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); openShare(contactId) }}
          className="link"
        >
          לחצו כאן
        </a>
      </span>
    )
  }

  const sharedContact = sharedContactId
    ? contacts.find(c => c.id === sharedContactId) ?? null
    : null


  return (
    <ThemeProvider theme={theme}>
      <div className='mentor-page-theme'>
        <CalendarWithList
          contacts={contacts}
          entries={mentorEntries}
          onEntryToggle={useEntries().toggleEntry}
          renderEntryExtra={renderEntryApproved}
          renderMessage={renderShareMessage}
        />

        {isShareOpen && sharedContact && (
          <MentorShareModal
            mentorId={sharedContact.id}
            mentorName={sharedContact.name}
            mentorEmail={sharedContact.email}
            onClose={() => setShareOpen(false)}
          />
        )}
      </div>

    </ThemeProvider>
  )
}