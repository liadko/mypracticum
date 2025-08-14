import { useContacts } from '../../context/ContactsContext'
import { useEntries } from '../../context/EntriesContext'
import { CalendarWithList } from '../../components/CalendarWithList'
import { useMemo } from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles'

const theme = createTheme({
  palette: { primary: { main: '#3A75C4' } } // blue
})

export default function MentorPage() {
  // pull all mentor‐type contacts & entries from context
  const { getContactsByType } = useContacts()
  const { entries } = useEntries()

  const contacts = useMemo(
    () => getContactsByType('mentor'),
    [getContactsByType]
  )

  const mentorEntries = useMemo(
    () =>
      entries.filter(e =>
        contacts.some(c => c.id === e.contactId)
      ),
    [entries, contacts]
  )


  return (
    <ThemeProvider theme={theme}>
      <div className='mentor-page-theme'>
        <CalendarWithList
          contacts={contacts}
          entries={mentorEntries}
          //hoursNeeded={150}
          contactType='mentor'
          onEntryToggle={useEntries().toggleEntry}
          //renderExtra={e =>/* your old MentorNameInput */null}
        />
      </div>
    </ThemeProvider>
  )
}