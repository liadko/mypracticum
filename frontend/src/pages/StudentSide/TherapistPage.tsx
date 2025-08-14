import { useContacts } from '../../context/ContactsContext'
import { useEntries } from '../../context/EntriesContext'
import { CalendarWithList } from '../../components/CalendarWithList'
import { useMemo } from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles'

const theme = createTheme({
  palette: { primary: { main: '#fc3d54' } } // pink
})

export default function TherapistPage() {
  // pull all therapist‐type contacts & entries from context
  const { getContactsByType } = useContacts()
  const { entries } = useEntries()

  const contacts = useMemo(
    () => getContactsByType('therapist'),
    [getContactsByType]
  )

  const therapistEntries = useMemo(
    () =>
      entries.filter(e =>
        contacts.some(c => c.id === e.contactId)
      ),
    [entries, contacts]
  )


  return (
    <ThemeProvider theme={theme}>
      <div className='therapist-page-theme'>
        <CalendarWithList
          contacts={contacts}
          entries={therapistEntries}
          //hoursNeeded={300}
          contactType='therapist'
          onEntryToggle={useEntries().toggleEntry}
          //renderExtra={e =>/* your old TherapistNameInput */null}
        />
      </div>
    </ThemeProvider>
  )
}